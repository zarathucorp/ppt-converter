'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '../../components/LanguageSwitcher';

interface UploadedFile {
  file: File;
  preview?: string;
}

export default function Home() {
  const t = useTranslations();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: file.type === 'image/svg+xml' ? URL.createObjectURL(file) : undefined
    }));
    setFiles(prev => [...prev, ...newFiles]);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/svg+xml': ['.svg'],
      'image/x-emf': ['.emf'],
      'application/x-msmetafile': ['.emf']
    },
    multiple: true
  });

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const convertToPptx = async () => {
    if (files.length === 0) {
      setError(t('conversion.error'));
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((fileObj, index) => {
        formData.append(`file_${index}`, fileObj.file);
      });

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('conversion.failed'));
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'converted-presentation.pptx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsConverting(false);
    }
  };

  const clearFiles = () => {
    files.forEach(fileObj => {
      if (fileObj.preview) {
        URL.revokeObjectURL(fileObj.preview);
      }
    });
    setFiles([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('title')}
            </h1>
            <p className="text-gray-600">
              {t('description')}
            </p>
          </div>
          <div className="ml-4">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {/* File Upload Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
              }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-2">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="text-gray-600">
                {isDragActive ? (
                  <p>{t('upload.dropFiles')}</p>
                ) : (
                  <div>
                    <p>{t('upload.area')}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('upload.supportedFormats')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {t('upload.uploadedFiles')} ({files.length})
                </h3>
                <button
                  onClick={clearFiles}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  {t('upload.clearAll')}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((fileObj, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-3 bg-gray-50 relative"
                  >
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 text-red-500 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {fileObj.preview && (
                      <div className="mb-2">
                        <img
                          src={fileObj.preview}
                          alt={fileObj.file.name}
                          className="w-full h-24 object-contain bg-white rounded"
                        />
                      </div>
                    )}
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {fileObj.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(fileObj.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Convert Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={convertToPptx}
              disabled={files.length === 0 || isConverting}
              className={`px-6 py-3 rounded-md font-medium transition-colors
                ${files.length === 0 || isConverting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
              {isConverting ? (
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="opacity-25"
                    />
                    <path
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      className="opacity-75"
                    />
                  </svg>
                  <span>{t('conversion.converting')}</span>
                </div>
              ) : (
                t('conversion.convert')
              )}
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            {t('howItWorks.title')}
          </h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• {t('howItWorks.step1')}</li>
            <li>• {t('howItWorks.step2')}</li>
            <li>• {t('howItWorks.step3')}</li>
            <li>• {t('howItWorks.step4')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
