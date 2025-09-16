'use client';

import { useEffect, useState } from 'react';

interface FileStats {
  files: Array<{
    name: string;
    size: number;
    modified: string;
    isDirectory: boolean;
  }>;
  totalFiles: number;
  totalSize: number;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function Stats() {
  const [stats, setStats] = useState<FileStats>({
    files: [],
    totalFiles: 0,
    totalSize: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/upload');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          setError('Failed to fetch file statistics');
        }
      } catch {
        setError('Failed to fetch file statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statsData = [
    {
      name: 'Total Files',
      stat: loading ? '...' : stats.totalFiles.toString(),
      description: 'Files in data folder',
    },
    {
      name: 'Total Size',
      stat: loading ? '...' : formatFileSize(stats.totalSize),
      description: 'Combined file size',
    },
    {
      name: 'Latest Upload',
      stat: loading
        ? '...'
        : stats.files.length > 0
          ? new Date(stats.files[0].modified).toLocaleDateString()
          : 'None',
      description: 'Most recent file',
    },
  ];

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}
      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {statsData.map((item) => (
          <div
            key={item.name}
            className="overflow-hidden rounded-2xl border-t-2 border-cyan-500 bg-cyan-50 px-4 py-5 shadow-lg sm:p-6"
          >
            <dt className="truncate text-sm font-medium text-gray-500">{item.name}</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              {item.stat}
            </dd>
            <dd className="mt-1 text-xs text-gray-400">{item.description}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
