# SVG/EMF to PPTX Converter

A modern web application that converts SVG and EMF vector graphics files into PowerPoint presentations while preserving vector quality.

## Features

- **Vector Quality Preservation**: Converts SVG and EMF files without quality loss
- **Multi-file Support**: Upload multiple files to create a single PPTX presentation
- **Drag & Drop Interface**: User-friendly file upload experience
- **Multi-language Support**: Available in English, Korean, Japanese, and Chinese (Simplified & Traditional)
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Preview**: Preview uploaded files before conversion

## Supported Formats

- **Input**: SVG (.svg), EMF (.emf)
- **Output**: PowerPoint (.pptx)

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ppt-converter
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Usage

1. **Upload Files**: Drag and drop SVG or EMF files onto the upload area, or click to select files
2. **Preview**: Review your uploaded files in the preview section
3. **Convert**: Click the "Convert to PPTX" button to generate your presentation
4. **Download**: The converted PPTX file will be automatically downloaded

## Technical Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Internationalization**: next-intl
- **File Processing**: pptxgenjs, formidable
- **UI Components**: React with react-dropzone

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── [locale]/          # Internationalized routes
│   ├── api/convert/       # API endpoint for file conversion
│   └── globals.css        # Global styles
├── components/            # Reusable React components
├── i18n/                 # Internationalization configuration
└── messages/             # Translation files
    ├── en.json           # English translations
    ├── ko.json           # Korean translations
    ├── ja.json           # Japanese translations
    ├── zh-CN.json        # Chinese Simplified
    └── zh-TW.json        # Chinese Traditional
```

## API

### POST /api/convert

Converts uploaded SVG/EMF files to PPTX format.

**Request**: Multipart form data with file uploads
**Response**: PPTX file download

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Environment Variables

No environment variables are required for basic functionality.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- PowerPoint generation powered by [PptxGenJS](https://github.com/gitbrent/PptxGenJS)
- File upload handling with [react-dropzone](https://github.com/react-dropzone/react-dropzone)
- Internationalization with [next-intl](https://next-intl-docs.vercel.app/)

---

For Korean documentation, see [README.ko.md](README.ko.md)
