'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface UploadedFile {
  file: File;
  preview?: string;
}

const MAX_FILE_COUNT = 10;
const MAX_SINGLE_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_TOTAL_UPLOAD_SIZE = 4 * 1024 * 1024; // 4MB

function getTotalUploadSize(items: UploadedFile[]): number {
  return items.reduce((total, item) => total + item.file.size, 0);
}

export default function Home() {
  const t = useTranslations();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [settings, setSettings] = useState({
    filename: 'converted-presentation',
    // 향후 추가 옵션들을 여기에 추가 예정
    // imageQuality: 'high',
    // slideLayout: 'widescreen',
    // includeMetadata: true
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const filesToProcess = [...acceptedFiles];
    let errorMessage: string | null = null;
    const addedFiles: UploadedFile[] = [];

    setFiles((prev) => {
      const next = [...prev];
      let totalSize = getTotalUploadSize(prev);
      let availableSlots = MAX_FILE_COUNT - prev.length;

      if (availableSlots <= 0) {
        errorMessage = t('conversion.tooManyFiles');
        return prev;
      }

      if (filesToProcess.length > availableSlots) {
        errorMessage = errorMessage ?? t('conversion.tooManyFiles');
      }

      for (const file of filesToProcess.slice(0, Math.max(availableSlots, 0))) {
        if (file.size > MAX_SINGLE_FILE_SIZE) {
          errorMessage = errorMessage ?? t('conversion.fileTooLarge', { filename: file.name });
          continue;
        }

        if (totalSize + file.size > MAX_TOTAL_UPLOAD_SIZE) {
          errorMessage = errorMessage ?? t('conversion.totalSizeExceeded');
          break;
        }

        const entry: UploadedFile = {
          file,
          preview: file.type === 'image/svg+xml' ? URL.createObjectURL(file) : undefined
        };

        next.push(entry);
        addedFiles.push(entry);
        totalSize += file.size;
        availableSlots -= 1;
      }

      return next;
    });

    setProcessingStatus('');

    if (errorMessage) {
      setError(errorMessage);
    } else if (addedFiles.length > 0) {
      setError(null);
    }
  }, [t]);

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

    setProcessingStatus('');

    if (files.length > MAX_FILE_COUNT) {
      setError(t('conversion.tooManyFiles'));
      return;
    }

    const oversizedFile = files.find((fileObj) => fileObj.file.size > MAX_SINGLE_FILE_SIZE);
    if (oversizedFile) {
      setError(t('conversion.fileTooLarge', { filename: oversizedFile.file.name }));
      return;
    }

    if (getTotalUploadSize(files) > MAX_TOTAL_UPLOAD_SIZE) {
      setError(t('conversion.totalSizeExceeded'));
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      // Check for complex SVGs and show processing status
      const hasComplexSvg = files.some(fileObj =>
        fileObj.file.name.toLowerCase().endsWith('.svg') &&
        fileObj.file.size > 50000 // Files larger than 50KB might be complex
      );

      if (hasComplexSvg) {
        setProcessingStatus(t('conversion.processingComplex'));
      } else {
        setProcessingStatus(t('conversion.processingFiles'));
      }

      const formData = new FormData();
      files.forEach((fileObj, index) => {
        formData.append(`file_${index}`, fileObj.file);
      });

      // 설정 정보를 URL 파라미터로 전달
      const params = new URLSearchParams({
        filename: settings.filename
      });

      const response = await fetch(`/api/convert?${params.toString()}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('conversion.failed'));
      }

      setProcessingStatus(t('conversion.finalizing'));

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${settings.filename}.pptx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setProcessingStatus(t('conversion.completed'));
      setTimeout(() => setProcessingStatus(''), 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProcessingStatus('');
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
    setProcessingStatus('');
    // 파일명을 기본값으로 리셋 (필요시)
    setSettings(prev => ({ ...prev, filename: 'converted-presentation' }));
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
                        <Image
                          src={fileObj.preview}
                          alt={fileObj.file.name}
                          width={256}
                          height={96}
                          className="w-full h-24 object-contain bg-white rounded"
                          unoptimized
                        />
                      </div>
                    )}
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {fileObj.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(fileObj.file.size / 1024).toFixed(1)} KB
                      {fileObj.file.name.toLowerCase().endsWith('.svg') && fileObj.file.size > 50000 && (
                        <span className="ml-2 text-blue-600 font-medium">Complex</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing Status */}
          {processingStatus && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-600 flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {processingStatus}
              </p>
            </div>
          )}

          {/* Settings Section */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {t('settings.title')}
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              {/* Filename Setting */}
              <div className="flex items-center space-x-4">
                <label htmlFor="filename" className="flex-shrink-0 text-sm font-medium text-gray-700 w-20">
                  {t('settings.filename')}:
                </label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="text"
                    id="filename"
                    value={settings.filename}
                    onChange={(e) => setSettings(prev => ({ ...prev, filename: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('settings.filenamePlaceholder')}
                  />
                  <span className="text-sm text-gray-500">.pptx</span>
                </div>
              </div>

              {/* Future Options - Hidden but Ready for Implementation */}
              {/*
              <div className="flex items-center space-x-4">
                <label className="flex-shrink-0 text-sm font-medium text-gray-700 w-20">
                  {t('settings.quality')}:
                </label>
                <select className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option>{t('settings.qualityHigh')}</option>
                  <option>{t('settings.qualityMedium')}</option>
                  <option>{t('settings.qualityLow')}</option>
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex-shrink-0 text-sm font-medium text-gray-700 w-20">
                  {t('settings.layout')}:
                </label>
                <select className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option>{t('settings.layoutWidescreen')}</option>
                  <option>{t('settings.layoutStandard')}</option>
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex-shrink-0 text-sm font-medium text-gray-700 w-20">
                  {t('settings.metadata')}:
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                  <span className="text-sm text-gray-600">{t('settings.includeFileInfo')}</span>
                </label>
              </div>
              */}

            </div>
          </div>

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
              {isConverting ? t('conversion.converting') : t('conversion.convert')}
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
