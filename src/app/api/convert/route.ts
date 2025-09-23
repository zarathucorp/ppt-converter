import { NextRequest, NextResponse } from 'next/server';
import PptxGenJS from 'pptxgenjs';

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

function processSvgForPptx(svgContent: string): string {
  // Clean and optimize SVG for PowerPoint compatibility
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
      processedSvg = processedSvg.replace(
        '<svg',
        `<svg viewBox="0 0 ${width} ${height}"`
      );
    }
  }

  return processedSvg;
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

    // Create new presentation
    const pptx = new PptxGenJS();

    // Process uploaded files
    for (const file of files) {
      const slide = pptx.addSlide();
      const fileBuffer = await file.arrayBuffer();
      const fileName = file.name;
      const fileExtension = fileName.split('.').pop()?.toLowerCase();

      if (fileExtension === 'svg') {
        // Handle SVG files - preserve vector format
        const svgContent = new TextDecoder().decode(fileBuffer);
        const processedSvg = processSvgForPptx(svgContent);
        const svgBase64 = Buffer.from(processedSvg, 'utf8').toString('base64');

        // Add SVG directly as vector image
        slide.addImage({
          data: `data:image/svg+xml;base64,${svgBase64}`,
          x: 0.5,
          y: 0.5,
          w: 9,
          h: 6.5,
          sizing: {
            type: 'contain',
            w: 9,
            h: 6.5
          }
        });

      } else if (fileExtension === 'emf') {
        // Handle EMF files - preserve vector format without PNG conversion
        const emfData = await processEmfForPptx(fileBuffer);

        // Add EMF as vector image with optimized settings
        slide.addImage({
          data: emfData.data,
          x: 1,
          y: 1,
          w: 8,
          h: 5.5,
          sizing: {
            type: 'contain',
            w: 8,
            h: 5.5
          }
        });
      }
    }

    // Generate PPTX
    const pptxBuffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;

    // Return the PPTX file
    return new NextResponse(new Uint8Array(pptxBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': 'attachment; filename="converted-presentation.pptx"',
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