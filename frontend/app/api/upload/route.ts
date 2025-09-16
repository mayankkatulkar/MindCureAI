import { NextRequest, NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    console.log('Upload request received');
    const formData = await request.formData();
    const file = formData.get('file') as File;

    console.log(
      'File from formData:',
      file
        ? {
            name: file.name,
            type: file.type,
            size: file.size,
          }
        : 'No file found'
    );

    if (!file) {
      console.log('No file provided in request');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type (allow common document types)
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ];

    console.log('File type:', file.type, 'Allowed types:', allowedTypes);

    if (!allowedTypes.includes(file.type)) {
      console.log('File type not supported:', file.type);
      return NextResponse.json(
        {
          error: 'File type not supported. Please upload PDF, DOC, DOCX, TXT, CSV, or Excel files.',
        },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    console.log('File size:', file.size, 'Max size:', maxSize);
    if (file.size > maxSize) {
      console.log('File too large:', file.size);
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 50MB.' },
        { status: 400 }
      );
    }

    // Create data directory if it doesn't exist
    const dataDir = join(process.cwd(), '..', 'src', 'data');
    console.log('Data directory path:', dataDir);
    if (!existsSync(dataDir)) {
      console.log('Creating data directory');
      await mkdir(dataDir, { recursive: true });
    }

    // Generate unique filename to avoid conflicts
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = originalName.split('.').pop();
    const fileName = `${originalName.split('.')[0]}_${timestamp}.${extension}`;
    const filePath = join(dataDir, fileName);

    console.log('Saving file to:', filePath);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    console.log('File saved successfully');

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      fileName: fileName,
      originalName: originalName,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { readdir, stat } = await import('fs/promises');
    const { join } = await import('path');

    const dataDir = join(process.cwd(), '..', 'src', 'data');

    try {
      const files = await readdir(dataDir);
      const fileStats = await Promise.all(
        files.map(async (fileName) => {
          const filePath = join(dataDir, fileName);
          const stats = await stat(filePath);
          return {
            name: fileName,
            size: stats.size,
            modified: stats.mtime,
            isDirectory: stats.isDirectory(),
          };
        })
      );

      // Filter out directories and calculate total size
      const dataFiles = fileStats.filter((file) => !file.isDirectory);
      const totalSize = dataFiles.reduce((sum, file) => sum + file.size, 0);

      return NextResponse.json({
        files: dataFiles,
        totalFiles: dataFiles.length,
        totalSize: totalSize,
      });
    } catch (error) {
      // Directory doesn't exist yet
      return NextResponse.json({
        files: [],
        totalFiles: 0,
        totalSize: 0,
      });
    }
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { readdir, unlink } = await import('fs/promises');
    const { join } = await import('path');

    const dataDir = join(process.cwd(), '..', 'src', 'data');

    try {
      const files = await readdir(dataDir);

      // Delete all files in the data directory
      const deletePromises = files.map(async (fileName) => {
        const filePath = join(dataDir, fileName);
        await unlink(filePath);
      });

      // Delete all files in the src/query-engine-storage
      const queryEngineStorageDir = join(process.cwd(), '..', 'src', 'query-engine-storage');
      const queryEngineStorageFiles = await readdir(queryEngineStorageDir);
      const queryEngineStorageDeletePromises = queryEngineStorageFiles.map(async (fileName) => {
        const filePath = join(queryEngineStorageDir, fileName);
        await unlink(filePath);
      });

      await Promise.all(deletePromises);
      await Promise.all(queryEngineStorageDeletePromises);

      return NextResponse.json({
        success: true,
        message: 'All files deleted successfully',
      });
    } catch (error) {
      return NextResponse.json({
        success: true,
        message: 'No files to delete !',
      });
    }
  } catch (error) {
    console.error('Error deleting files:', error);
    return NextResponse.json({ error: 'Failed to delete files' }, { status: 500 });
  }
}
