'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FileIcon, UploadIcon } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';

interface FileUploadResponse {
  error: string;
  success: boolean;
  message: string;
  fileName: string;
  originalName: string;
  size: number;
  type: string;
}

interface FileInfo {
  name: string;
  size: number;
  modified: string;
  isDirectory: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function Upload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    currentFileName: string;
  }>({ current: 0, total: 0, currentFileName: '' });
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    try {
      setLoadingFiles(true);
      const response = await fetch('/api/upload');
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setUploadStatus({ type: null, message: '' });

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result: FileUploadResponse = await response.json();

        if (response.ok && result.success) {
          setUploadStatus({
            type: 'success',
            message: `File "${result.originalName}" uploaded successfully!`,
          });
          // Refresh the file list
          setTimeout(() => {
            fetchFiles();
            setUploadStatus({ type: null, message: '' });
          }, 1500);
        } else {
          setUploadStatus({
            type: 'error',
            message: result.message || result.error || 'Upload failed',
          });
        }
      } catch (error) {
        console.error('Upload error:', error);
        setUploadStatus({
          type: 'error',
          message: 'Upload failed. Please try again.',
        });
      } finally {
        setIsUploading(false);
      }
    },
    [fetchFiles]
  );

  const handleMultipleFileUpload = useCallback(
    async (selectedFiles: FileList) => {
      const filesArray = Array.from(selectedFiles);

      setIsUploading(true);
      setUploadProgress({ current: 0, total: filesArray.length, currentFileName: '' });
      setUploadStatus({ type: null, message: '' });

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        setUploadProgress({
          current: i + 1,
          total: filesArray.length,
          currentFileName: file.name,
        });

        try {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          const result: FileUploadResponse = await response.json();

          if (response.ok && result.success) {
            successCount++;
          } else {
            errorCount++;
            console.error(`Failed to upload ${file.name}:`, result.message || result.error);
          }
        } catch (error) {
          errorCount++;
          console.error(`Error uploading ${file.name}:`, error);
        }
      }

      // Show final status
      if (errorCount === 0) {
        setUploadStatus({
          type: 'success',
          message: `All ${successCount} files uploaded successfully!`,
        });
      } else if (successCount === 0) {
        setUploadStatus({
          type: 'error',
          message: `Failed to upload any files. Please try again.`,
        });
      } else {
        setUploadStatus({
          type: 'success',
          message: `${successCount} files uploaded successfully, ${errorCount} failed.`,
        });
      }

      // Refresh the file list
      setTimeout(() => {
        fetchFiles();
        setUploadStatus({ type: null, message: '' });
        setUploadProgress({ current: 0, total: 0, currentFileName: '' });
      }, 2000);

      setIsUploading(false);
    },
    [fetchFiles]
  );

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = event.target.files;

      if (selectedFiles && selectedFiles.length > 0) {
        if (selectedFiles.length === 1) {
          handleFileUpload(selectedFiles[0]);
        } else {
          handleMultipleFileUpload(selectedFiles);
        }
      }
      // Reset the input so the same files can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFileUpload, handleMultipleFileUpload]
  );

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const droppedFiles = event.dataTransfer.files;

      if (droppedFiles && droppedFiles.length > 0) {
        if (droppedFiles.length === 1) {
          handleFileUpload(droppedFiles[0]);
        } else {
          handleMultipleFileUpload(droppedFiles);
        }
      }
    },
    [handleFileUpload, handleMultipleFileUpload]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div
        className="rounded-2xl border-2 border-cyan-500 bg-cyan-50 py-10 text-center shadow-lg transition-colors hover:bg-cyan-100"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <svg
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="mx-auto size-12 text-gray-400"
        >
          <path
            d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Upload Files</h3>
        <p className="mt-1 text-sm text-gray-500">Drag and drop files here or click to browse</p>
        <p className="mt-1 text-xs text-gray-400">
          Supports PDF, DOC, DOCX, TXT, CSV, Excel (max 50MB each)
        </p>

        {uploadProgress.total > 0 && (
          <div className="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
            <div className="mb-2">
              Uploading {uploadProgress.current} of {uploadProgress.total} files...
            </div>
            <div className="mb-1 text-xs">Current: {uploadProgress.currentFileName}</div>
            <div className="h-2 w-full rounded-full bg-blue-200">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {uploadStatus.type && (
          <div
            className={`mt-4 rounded-md p-3 text-sm ${
              uploadStatus.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {uploadStatus.message}
          </div>
        )}

        <div className="mt-6">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
            onChange={handleFileSelect}
            disabled={isUploading}
            multiple
          />
          <Button
            type="button"
            disabled={isUploading}
            onClick={handleButtonClick}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <div className="mr-1.5 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Uploading...
              </>
            ) : (
              <>
                <UploadIcon aria-hidden="true" className="mr-1.5 -ml-0.5 size-5" />
                Choose Files
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="rounded-2xl border-2 border-cyan-500 bg-cyan-50 py-6 text-center text-black shadow-lg">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Uploaded Files</h3>

        {loadingFiles ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
            <span className="ml-2 text-sm text-gray-500">Loading files...</span>
          </div>
        ) : files.length === 0 ? (
          <div className="py-8 text-center">
            <FileIcon className="mx-auto mb-2 h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-500">No files uploaded yet</p>
            <p className="mt-1 text-xs text-gray-400">Files will appear here after upload</p>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="mx-4 mb-2 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
              >
                <div className="flex min-w-0 flex-1 items-center">
                  <FileIcon className="mr-2 h-4 w-4 flex-shrink-0 text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {new Date(file.modified).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 text-xs text-gray-400">Files are saved to src/data folder</div>
      </div>
    </div>
  );
}
