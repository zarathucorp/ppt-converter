import { NextRequest, NextResponse } from 'next/server';
import PptxGenJS from 'pptxgenjs';
import { optimize } from 'svgo';
import { sanitizeSvgForPowerPoint } from '@/utils/svgSanitizer';
import { getSvgoConfig } from '@/utils/svgoConfig';

async function parseFormData(request: NextRequest) {
  const formData = await request.formData();
  const files: File[] = [];

  for (const [, value] of formData.entries()) {
    if (value instanceof File) {
      files.push(value);
    }
  }

  return files;
}

function sanitizeFilename(filename: string): string {
  // 파일명에서 위험한 문자 제거 및 정리
  return filename
    .replace(/[<>:"/\\|?*]/g, '') // Windows/Linux에서 금지된 문자 제거
    .replace(/\s+/g, '-') // 공백을 하이픈으로 변경
    .replace(/\.+/g, '.') // 연속된 점을 하나로
    .replace(/^\./, '') // 시작 점 제거
    .replace(/\.$/, '') // 끝 점 제거
    .substring(0, 100) // 최대 길이 제한
    || 'converted-presentation'; // 빈 문자열일 경우 기본값
}

interface SvgProcessingOptions {
  optimization: 'conservative' | 'compatible' | 'aggressive';
  sanitization: boolean;
}

function processSvgForPptx(svgContent: string, options: SvgProcessingOptions = { optimization: 'compatible', sanitization: true }): string {
  console.log('Processing SVG for PowerPoint compatibility...');

  try {
    let processedSvg = svgContent;

    // Step 1: Security and structural sanitization
    if (options.sanitization) {
      console.log('Sanitizing SVG for PowerPoint compatibility...');
      processedSvg = sanitizeSvgForPowerPoint(processedSvg, {
        removeClipPaths: true,
        inlineCss: true,
        simplifyIds: true,
        optimizeCoordinates: true,
        replaceNonWebFonts: true,
      });
    }

    // Step 2: SVGO optimization
    console.log(`Optimizing SVG with ${options.optimization} settings...`);
    const svgoConfig = getSvgoConfig(options.optimization);

    try {
      const result = optimize(processedSvg, svgoConfig);
      processedSvg = result.data;
    } catch (svgoError) {
      console.warn('SVGO optimization failed, using sanitized version:', svgoError);
      // Continue with the sanitized version if SVGO fails
    }

    // Step 3: Final PowerPoint-specific adjustments
    processedSvg = ensureBasicSvgCompatibility(processedSvg);

    console.log('SVG processing completed successfully');
    return processedSvg;

  } catch (error) {
    console.error('SVG processing failed:', error);

    // Fallback: basic processing
    return ensureBasicSvgCompatibility(svgContent);
  }
}

function ensureBasicSvgCompatibility(svgContent: string): string {
  let processedSvg = svgContent;

  // Ensure SVG has proper namespace
  if (!processedSvg.includes('xmlns="http://www.w3.org/2000/svg"')) {
    processedSvg = processedSvg.replace(
      '<svg',
      '<svg xmlns="http://www.w3.org/2000/svg"'
    );
  }

  // Set viewBox if not present for better scaling
  if (!processedSvg.includes('viewBox=')) {
    const widthMatch = processedSvg.match(/width="([^"]*)"/) || processedSvg.match(/width='([^']*)'/);
    const heightMatch = processedSvg.match(/height="([^"]*)"/) || processedSvg.match(/height='([^']*)'/);

    if (widthMatch && heightMatch) {
      const width = parseFloat(widthMatch[1]);
      const height = parseFloat(heightMatch[1]);
      if (!isNaN(width) && !isNaN(height)) {
        processedSvg = processedSvg.replace(
          '<svg',
          `<svg viewBox="0 0 ${width} ${height}"`
        );
      }
    }
  }

  return processedSvg;
}

interface SlideLayout {
  width: number;
  height: number;
  margin: number;
  contentWidth: number;
  contentHeight: number;
}

// PowerPoint 16:9 슬라이드 크기 (인치 단위)
const SLIDE_LAYOUTS = {
  widescreen: { // 16:9 (기본)
    width: 10,
    height: 5.625,
    margin: 0.5,
    contentWidth: 9,
    contentHeight: 4.625
  },
  standard: { // 4:3 (구버전)
    width: 10,
    height: 7.5,
    margin: 0.5,
    contentWidth: 9,
    contentHeight: 6.5
  }
} as const;

function calculateOptimalImageSize(svgContent: string, layout: SlideLayout = SLIDE_LAYOUTS.widescreen) {
  // SVG 원본 크기 추출
  const widthMatch = svgContent.match(/width="([^"]*)"/) || svgContent.match(/width='([^']*)'/);
  const heightMatch = svgContent.match(/height="([^"]*)"/) || svgContent.match(/height='([^']*)'/);
  const viewBoxMatch = svgContent.match(/viewBox="([^"]*)"/) || svgContent.match(/viewBox='([^']*)'/);

  let originalWidth = 576; // 기본값
  let originalHeight = 432; // 기본값

  // width, height 속성에서 크기 추출
  if (widthMatch && heightMatch) {
    const w = parseFloat(widthMatch[1].replace(/[^\d.]/g, ''));
    const h = parseFloat(heightMatch[1].replace(/[^\d.]/g, ''));
    if (!isNaN(w) && !isNaN(h)) {
      originalWidth = w;
      originalHeight = h;
    }
  }
  // viewBox에서 크기 추출 (우선순위 높음)
  else if (viewBoxMatch) {
    const viewBox = viewBoxMatch[1].split(/[\s,]+/).map(parseFloat);
    if (viewBox.length >= 4) {
      originalWidth = viewBox[2];
      originalHeight = viewBox[3];
    }
  }

  // 원본 비율 계산
  const aspectRatio = originalWidth / originalHeight;
  const slideAspectRatio = layout.contentWidth / layout.contentHeight;

  let finalWidth, finalHeight, x, y;

  // 슬라이드에 맞춰서 크기 조정
  if (aspectRatio > slideAspectRatio) {
    // 가로가 더 긴 경우: 가로를 기준으로 맞춤
    finalWidth = layout.contentWidth;
    finalHeight = finalWidth / aspectRatio;
    x = layout.margin;
    y = layout.margin + (layout.contentHeight - finalHeight) / 2;
  } else {
    // 세로가 더 긴 경우: 세로를 기준으로 맞춤
    finalHeight = layout.contentHeight;
    finalWidth = finalHeight * aspectRatio;
    x = layout.margin + (layout.contentWidth - finalWidth) / 2;
    y = layout.margin;
  }

  return {
    x: Math.max(0.2, x), // 최소 여백 보장
    y: Math.max(0.2, y),
    w: Math.min(finalWidth, layout.width - 0.4), // 최대 크기 제한
    h: Math.min(finalHeight, layout.height - 0.4),
    originalWidth,
    originalHeight,
    aspectRatio
  };
}

async function processEmfForPptx(emfBuffer: ArrayBuffer): Promise<{ data: string; type: 'emf' | 'svg' }> {
  try {
    // EMF를 그대로 사용하되 더 나은 설정으로 처리
    const buffer = Buffer.from(emfBuffer);
    const base64Data = buffer.toString('base64');

    // EMF 원본을 그대로 사용 (벡터 보존)
    return {
      data: `data:image/x-emf;base64,${base64Data}`,
      type: 'emf'
    };

  } catch (error) {
    console.error('EMF processing error:', error);

    // 에러시 폴백 SVG
    const fallbackSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="#f8f9fa" stroke="#dee2e6"/>
        <text x="200" y="150" text-anchor="middle" font-size="16" fill="#6c757d">EMF Processing Error</text>
      </svg>
    `.trim();

    const svgBase64 = Buffer.from(fallbackSvg, 'utf8').toString('base64');
    return {
      data: `data:image/svg+xml;base64,${svgBase64}`,
      type: 'svg'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const files = await parseFormData(request);

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    // URL에서 설정 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const rawFilename = searchParams.get('filename') || 'converted-presentation';
    const filename = sanitizeFilename(rawFilename);

    // 기본 16:9 와이드스크린 레이아웃 사용
    const selectedLayout = SLIDE_LAYOUTS.widescreen;

    // Create new presentation with 16:9 layout
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    console.log(`Using widescreen layout: ${selectedLayout.width}"x${selectedLayout.height}"`);

    // Process uploaded files
    for (const file of files) {
      const slide = pptx.addSlide();
      const fileBuffer = await file.arrayBuffer();
      const fileName = file.name;
      const fileExtension = fileName.split('.').pop()?.toLowerCase();

      if (fileExtension === 'svg') {
        // Handle SVG files - preserve vector format with enhanced preprocessing
        const svgContent = new TextDecoder().decode(fileBuffer);

        // Determine processing level based on file complexity
        let processingOptions: SvgProcessingOptions;
        if (svgContent.includes('clipPath') || svgContent.includes('<style')) {
          // Complex SVGs (like Kaplan-Meier plots) need more aggressive processing
          processingOptions = { optimization: 'compatible', sanitization: true };
        } else {
          // Simple SVGs can use conservative processing
          processingOptions = { optimization: 'conservative', sanitization: true };
        }

        const processedSvg = processSvgForPptx(svgContent, processingOptions);
        const svgBase64 = Buffer.from(processedSvg, 'utf8').toString('base64');

        // 슬라이드 크기에 맞춰서 최적화된 위치/크기 계산
        const imageSize = calculateOptimalImageSize(processedSvg, selectedLayout);

        // Add SVG directly as vector image with optimized sizing
        slide.addImage({
          data: `data:image/svg+xml;base64,${svgBase64}`,
          x: imageSize.x,
          y: imageSize.y,
          w: imageSize.w,
          h: imageSize.h,
          sizing: {
            type: 'contain',
            w: imageSize.w,
            h: imageSize.h
          }
        });

        console.log(`Processed SVG: ${fileName} (${svgContent.length} → ${processedSvg.length} chars)`);
        console.log(`Optimized size: ${imageSize.originalWidth}x${imageSize.originalHeight} → ${imageSize.w.toFixed(1)}"x${imageSize.h.toFixed(1)}" (ratio: ${imageSize.aspectRatio.toFixed(2)})`);

      } else if (fileExtension === 'emf') {
        // Handle EMF files - preserve vector format without PNG conversion
        const emfData = await processEmfForPptx(fileBuffer);

        // EMF는 크기 정보가 없으므로 선택된 레이아웃에 맞춤
        const emfAspectRatio = 16 / 9; // EMF 기본 가정 비율
        const emfImageSize = calculateOptimalImageSize(
          `<svg viewBox="0 0 1600 900" width="1600" height="900"></svg>`, // 가상 SVG로 계산
          selectedLayout
        );

        // Add EMF as vector image with optimized settings
        slide.addImage({
          data: emfData.data,
          x: emfImageSize.x,
          y: emfImageSize.y,
          w: emfImageSize.w,
          h: emfImageSize.h,
          sizing: {
            type: 'contain',
            w: emfImageSize.w,
            h: emfImageSize.h
          }
        });

        console.log(`Processed EMF: ${fileName} → ${emfImageSize.w.toFixed(1)}"x${emfImageSize.h.toFixed(1)}"`);
      }
    }

    // Generate PPTX
    const pptxBuffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;

    // Return the PPTX file with custom filename
    const finalFilename = `${filename}.pptx`;
    console.log(`Generated PPTX: ${finalFilename} (${pptxBuffer.length} bytes)`);

    return new NextResponse(new Uint8Array(pptxBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${finalFilename}"`,
        'Content-Length': pptxBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert files to PPTX' },
      { status: 500 }
    );
  }
}