import { Config } from 'svgo';

/**
 * SVGO configuration optimized for PowerPoint compatibility
 * Prioritizes compatibility over file size reduction
 */
export const powerpointCompatibleConfig: Config = {
  plugins: [
    // Use preset-default as the base and customize from there
    {
      name: 'preset-default',
      params: {
        overrides: {
          // Customize numeric precision
          cleanupNumericValues: {
            floatPrecision: 2,
            leadingZero: true,
            defaultPx: true,
            convertToPx: false,
          },
          // Customize color conversion
          convertColors: {
            currentColor: false, // Avoid currentColor as PowerPoint may not support it
            names2hex: true,
            rgb2hex: true,
            shortname: true,
            shortHex: true,
          },
          // Customize path data conversion
          convertPathData: {
            floatPrecision: 2,
            transformPrecision: 2,
            removeUseless: true,
            straightCurves: true,
            lineShorthands: true,
            curveSmoothShorthands: true,
            collapseRepeated: true,
          },
          // Customize transform conversion
          convertTransform: {
            floatPrecision: 2,
            transformPrecision: 2,
            matrixToTransform: true,
            shortTransform: true,
            shortRotation: true,
            removeUseless: true,
            collapseIntoOne: false, // Keep transforms separate for better compatibility
            leadingZero: true,
            negativeExtraSpace: false,
          },
          // Keep explicit none values for clarity
          removeUselessStrokeAndFill: {
            removeNone: false,
          },
        },
      },
    },
  ],
};

/**
 * Aggressive optimization config (use with caution)
 * This might break some complex SVGs but produces smaller files
 */
export const aggressiveOptimizationConfig: Config = {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
          removeDimensions: false,
          cleanupNumericValues: {
            floatPrecision: 1,
          },
        },
      },
    },
  ],
};

/**
 * Conservative config for complex graphics like charts and plots
 * Minimal optimization to preserve all visual elements
 */
export const conservativeConfig: Config = {
  plugins: [
    // Only apply very safe optimizations
    'removeDoctype',
    'removeXMLProcInst',
    'removeComments',
    'removeMetadata',
    'removeEditorsNSData',
    'cleanupAttrs',
    {
      name: 'cleanupNumericValues',
      params: {
        floatPrecision: 3, // Higher precision for accuracy
        leadingZero: true,
        defaultPx: false,
        convertToPx: false,
      },
    },
  ],
};

/**
 * Get SVGO config based on optimization level
 */
export function getSvgoConfig(level: 'conservative' | 'compatible' | 'aggressive' = 'compatible'): Config {
  switch (level) {
    case 'conservative':
      return conservativeConfig;
    case 'aggressive':
      return aggressiveOptimizationConfig;
    case 'compatible':
    default:
      return powerpointCompatibleConfig;
  }
}