import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';
import type { DOMWindow } from 'jsdom';

interface SanitizationOptions {
  removeClipPaths: boolean;
  inlineCss: boolean;
  simplifyIds: boolean;
  optimizeCoordinates: boolean;
  replaceNonWebFonts: boolean;
}

const defaultOptions: SanitizationOptions = {
  removeClipPaths: true,
  inlineCss: true,
  simplifyIds: true,
  optimizeCoordinates: true,
  replaceNonWebFonts: true,
};

// Web-safe font replacements
const fontReplacements: Record<string, string> = {
  'Nimbus Sans': 'Arial, sans-serif',
  'Nimbus Roman': 'Times New Roman, serif',
  'Nimbus Mono': 'Courier New, monospace',
  'Liberation Sans': 'Arial, sans-serif',
  'Liberation Serif': 'Times New Roman, serif',
  'DejaVu Sans': 'Arial, sans-serif',
  'DejaVu Serif': 'Times New Roman, serif',
};

export class SVGSanitizer {
  private window: DOMWindow;
  private DOMPurify: ReturnType<typeof createDOMPurify>;
  private idCounter: number = 0;

  constructor() {
    this.window = new JSDOM('').window;
    this.DOMPurify = createDOMPurify(this.window);
  }

  /**
   * Main sanitization method
   */
  public sanitize(svgContent: string, options: Partial<SanitizationOptions> = {}): string {
    const opts = { ...defaultOptions, ...options };

    try {
      // First, sanitize for security (remove scripts, etc.)
      const sanitized = this.securitySanitize(svgContent);

      // Parse SVG for structural modifications
      const doc = new this.window.DOMParser().parseFromString(sanitized, 'image/svg+xml');
      const svgElement = doc.documentElement;

      if (!svgElement || svgElement.tagName !== 'svg') {
        throw new Error('Invalid SVG document');
      }

      // Apply structural modifications
      if (opts.removeClipPaths) {
        this.removeClipPaths(svgElement);
      }

      if (opts.inlineCss) {
        this.inlineCssStyles(svgElement);
      }

      if (opts.simplifyIds) {
        this.simplifyIds(svgElement);
      }

      if (opts.optimizeCoordinates) {
        this.optimizeCoordinates(svgElement);
      }

      if (opts.replaceNonWebFonts) {
        this.replaceNonWebFonts(svgElement);
      }

      // Ensure proper SVG attributes
      this.ensureSvgAttributes(svgElement);

      // Convert back to string
      return new this.window.XMLSerializer().serializeToString(svgElement);

    } catch (error) {
      console.error('SVG sanitization failed:', error);
      // Return a fallback SVG
      return this.createFallbackSvg(`Sanitization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Security sanitization using DOMPurify
   */
  private securitySanitize(svgContent: string): string {
    return this.DOMPurify.sanitize(svgContent, {
      USE_PROFILES: { svg: true, svgFilters: true },
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link'],
      FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover'],
    });
  }

  /**
   * Remove or simplify clipPath elements
   */
  private removeClipPaths(svgElement: Element): void {
    try {
      // Find all elements with clip-path attribute
      const clippedElements = svgElement.querySelectorAll('[clip-path]');

      clippedElements.forEach((element) => {
        const clipPath = element.getAttribute('clip-path');
        if (clipPath) {
          // Extract clipPath ID
          const clipPathId = clipPath.match(/url\(#([^)]+)\)/)?.[1];
          if (clipPathId) {
            try {
              // Find clipPath element using getElementsByTagName to avoid CSS selector issues
              const clipPathElements = svgElement.getElementsByTagName('clipPath');
              let clipPathElement: Element | null = null;

              for (let i = 0; i < clipPathElements.length; i++) {
                if (clipPathElements[i].getAttribute('id') === clipPathId) {
                  clipPathElement = clipPathElements[i];
                  break;
                }
              }

              if (clipPathElement) {
                // For simple rect clipPaths, convert to viewBox or remove
                const rectChild = clipPathElement.querySelector('rect');
                if (rectChild && element.tagName.toLowerCase() === 'g') {
                  // Convert clipPath rect to group boundaries (simplified approach)
                  console.log(`Removed clipPath ${clipPathId} from group element`);
                }
              }
            } catch (selectorError) {
              console.warn(`Failed to process clipPath ${clipPathId}:`, selectorError);
            }
          }
          // Remove clip-path attribute as PowerPoint doesn't handle it well
          element.removeAttribute('clip-path');
        }
      });

      // Remove all clipPath definitions
      const clipPaths = svgElement.querySelectorAll('clipPath');
      clipPaths.forEach((clipPath) => {
        clipPath.remove();
      });
    } catch (error) {
      console.warn('Failed to remove clipPaths:', error);
      // Continue processing without failing
    }
  }

  /**
   * Convert CSS styles to inline attributes
   */
  private inlineCssStyles(svgElement: Element): void {
    // Find style elements and extract CSS rules
    const styleElements = svgElement.querySelectorAll('style');
    const cssRules: Record<string, Record<string, string>> = {};

    styleElements.forEach((styleElement) => {
      const cssText = styleElement.textContent || '';

      // Remove CDATA wrapper if present
      const cleanCss = cssText.replace(/^\s*\/\*\s*<!\[CDATA\[\s*\*\/|\*\/\s*\]\]>\s*\*\/\s*$/g, '');

      // Parse simple CSS rules (basic parser for common patterns)
      const ruleMatches = cleanCss.match(/([^{]+)\{([^}]+)\}/g);

      if (ruleMatches) {
        ruleMatches.forEach((rule) => {
          const match = rule.match(/([^{]+)\{([^}]+)\}/);
          if (match) {
            const selector = match[1].trim();
            const properties = match[2].trim();

            // Parse properties
            const propMap: Record<string, string> = {};
            properties.split(';').forEach((prop) => {
              const [key, value] = prop.split(':').map(s => s.trim());
              if (key && value) {
                propMap[key] = value;
              }
            });

            cssRules[selector] = propMap;
          }
        });
      }
    });

    // Apply CSS rules to matching elements
    Object.entries(cssRules).forEach(([selector, properties]) => {
      const elements = this.querySelectorAllCompat(svgElement, selector);
      elements.forEach((element) => {
        Object.entries(properties).forEach(([prop, value]) => {
          // Convert CSS properties to SVG attributes where possible
          const svgAttr = this.cssToSvgAttribute(prop);
          if (svgAttr && !element.hasAttribute(svgAttr)) {
            element.setAttribute(svgAttr, value);
          }
        });
      });
    });

    // Remove style elements after inlining
    styleElements.forEach((styleElement) => {
      styleElement.remove();
    });
  }

  /**
   * Simplified querySelector that handles basic CSS selectors
   */
  private querySelectorAllCompat(element: Element, selector: string): Element[] {
    try {
      return Array.from(element.querySelectorAll(selector));
    } catch {
      // Fallback for complex selectors
      if (selector.startsWith('.')) {
        const className = selector.substring(1);
        return Array.from(element.querySelectorAll(`[class*="${className}"]`));
      }
      if (selector.includes(' ')) {
        // Handle descendant selectors (simplified)
        const parts = selector.split(' ').map(s => s.trim());
        if (parts.length === 2) {
          const parent = parts[0].startsWith('.') ? `[class*="${parts[0].substring(1)}"]` : parts[0];
          const child = parts[1];
          return Array.from(element.querySelectorAll(`${parent} ${child}`));
        }
      }
      return [];
    }
  }

  /**
   * Convert CSS property names to SVG attribute names
   */
  private cssToSvgAttribute(cssProperty: string): string | null {
    const mapping: Record<string, string> = {
      'fill': 'fill',
      'stroke': 'stroke',
      'stroke-width': 'stroke-width',
      'stroke-linecap': 'stroke-linecap',
      'stroke-linejoin': 'stroke-linejoin',
      'stroke-miterlimit': 'stroke-miterlimit',
      'opacity': 'opacity',
      'fill-opacity': 'fill-opacity',
      'stroke-opacity': 'stroke-opacity',
      'font-family': 'font-family',
      'font-size': 'font-size',
      'font-weight': 'font-weight',
      'text-anchor': 'text-anchor',
    };

    return mapping[cssProperty] || null;
  }

  /**
   * Simplify complex IDs (especially base64 encoded ones)
   */
  private simplifyIds(svgElement: Element): void {
    const idMap: Record<string, string> = {};

    // Find all elements with IDs
    const elementsWithIds = svgElement.querySelectorAll('[id]');

    elementsWithIds.forEach((element) => {
      const oldId = element.getAttribute('id');
      if (oldId && this.isComplexId(oldId)) {
        const newId = this.generateSimpleId();
        idMap[oldId] = newId;
        element.setAttribute('id', newId);
      }
    });

    // Update all references to the old IDs
    Object.entries(idMap).forEach(([oldId, newId]) => {
      // Update url() references
      const urlRefs = svgElement.querySelectorAll(`[*|href="#${oldId}"], [href="#${oldId}"]`);
      urlRefs.forEach((ref) => {
        const href = ref.getAttribute('href') || ref.getAttribute('xlink:href');
        if (href === `#${oldId}`) {
          if (ref.hasAttribute('href')) {
            ref.setAttribute('href', `#${newId}`);
          }
          if (ref.hasAttribute('xlink:href')) {
            ref.setAttribute('xlink:href', `#${newId}`);
          }
        }
      });

      // Update other attribute references
      const allElements = svgElement.querySelectorAll('*');
      allElements.forEach((el) => {
        Array.from(el.attributes).forEach((attr) => {
          if (attr.value.includes(`#${oldId}`)) {
            attr.value = attr.value.replace(`#${oldId}`, `#${newId}`);
          }
        });
      });
    });
  }

  /**
   * Check if an ID is complex (base64, very long, etc.)
   */
  private isComplexId(id: string): boolean {
    return id.length > 10 || /^[A-Za-z0-9+/]+=*$/.test(id);
  }

  /**
   * Generate a simple, readable ID
   */
  private generateSimpleId(): string {
    return `id${++this.idCounter}`;
  }

  /**
   * Optimize coordinate precision
   */
  private optimizeCoordinates(svgElement: Element): void {
    const coordinateAttributes = [
      'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
      'width', 'height', 'points', 'd', 'viewBox'
    ];

    const allElements = svgElement.querySelectorAll('*');
    allElements.forEach((element) => {
      coordinateAttributes.forEach((attr) => {
        const value = element.getAttribute(attr);
        if (value) {
          const optimized = this.optimizeCoordinateValue(value);
          if (optimized !== value) {
            element.setAttribute(attr, optimized);
          }
        }
      });
    });
  }

  /**
   * Optimize coordinate values by reducing precision
   */
  private optimizeCoordinateValue(value: string): string {
    // Handle space or comma-separated coordinate pairs
    return value.replace(/(\d+\.\d{3,})/g, (match) => {
      const num = parseFloat(match);
      return num.toFixed(2);
    });
  }

  /**
   * Replace non-web fonts with web-safe alternatives
   */
  private replaceNonWebFonts(svgElement: Element): void {
    const elementsWithFonts = svgElement.querySelectorAll('[font-family]');

    elementsWithFonts.forEach((element) => {
      const fontFamily = element.getAttribute('font-family');
      if (fontFamily) {
        const cleanFont = fontFamily.replace(/['"]/g, '');
        const replacement = fontReplacements[cleanFont];
        if (replacement) {
          element.setAttribute('font-family', replacement);
        }
      }
    });
  }

  /**
   * Ensure SVG has proper attributes for PowerPoint compatibility
   */
  private ensureSvgAttributes(svgElement: Element): void {
    // Ensure namespace
    if (!svgElement.hasAttribute('xmlns')) {
      svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }

    // Ensure viewBox if dimensions are present
    const width = svgElement.getAttribute('width');
    const height = svgElement.getAttribute('height');

    if (width && height && !svgElement.hasAttribute('viewBox')) {
      const w = parseFloat(width.replace(/[^\d.]/g, ''));
      const h = parseFloat(height.replace(/[^\d.]/g, ''));
      if (!isNaN(w) && !isNaN(h)) {
        svgElement.setAttribute('viewBox', `0 0 ${w} ${h}`);
      }
    }

    // Convert percentage dimensions to absolute if possible
    if (width === '100%' && height === '100%') {
      const viewBox = svgElement.getAttribute('viewBox');
      if (viewBox) {
        const [, , w, h] = viewBox.split(' ').map(parseFloat);
        if (!isNaN(w) && !isNaN(h)) {
          svgElement.setAttribute('width', w.toString());
          svgElement.setAttribute('height', h.toString());
        }
      }
    }
  }

  /**
   * Create a fallback SVG for errors
   */
  private createFallbackSvg(errorMessage: string): string {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="#f8f9fa" stroke="#dee2e6"/>
        <text x="200" y="140" text-anchor="middle" font-size="14" fill="#6c757d">SVG Processing Error</text>
        <text x="200" y="160" text-anchor="middle" font-size="12" fill="#868e96">${errorMessage}</text>
      </svg>
    `.trim();
  }
}

// Export convenience function
export function sanitizeSvgForPowerPoint(
  svgContent: string,
  options?: Partial<SanitizationOptions>
): string {
  const sanitizer = new SVGSanitizer();
  return sanitizer.sanitize(svgContent, options);
}