import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

export async function POST() {
  try {
    console.log('Starting RAG recreation process...');
    
    const scriptPath = join(process.cwd(), '..', 'src', 'recreate_rag.py');
    console.log('Script path:', scriptPath);
    
    // Ensure the script exists
    if (!existsSync(scriptPath)) {
      console.error('recreate_rag.py script not found at:', scriptPath);
      return NextResponse.json(
        { error: 'RAG recreation script not found' },
        { status: 500 }
      );
    }

    // Run the Python script with proper environment and path setup
    const result = await new Promise<{ stdout: string; stderr: string; code: number }>((resolve) => {
      const pythonProcess = spawn('python3', [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PYTHONPATH: '/Users/mayankkatulkar/Library/Python/3.9/lib/python/site-packages'
        },
        cwd: dirname(scriptPath)
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('Python stdout:', output);
        stdout += output;
      });

      pythonProcess.stderr.on('data', (data) => {
        const output = data.toString();
        console.error('RAG Recreation Error:', output);
        stderr += output;
      });

      pythonProcess.on('close', (code) => {
        console.log(`RAG recreation process exited with code ${code}`);
        resolve({ stdout, stderr, code: code || 0 });
      });

      pythonProcess.on('error', (error) => {
        console.error('Failed to start RAG recreation process:', error);
        resolve({ stdout: '', stderr: error.message, code: 1 });
      });
    });

    if (result.code === 0) {
      console.log('RAG recreation completed successfully');
      return NextResponse.json({ 
        message: 'Knowledge base updated successfully',
        output: result.stdout 
      });
    } else {
      console.error('RAG recreation failed with code:', result.code);
      console.error('Error output:', result.stderr);
      return NextResponse.json(
        { 
          error: 'Failed to update knowledge base',
          details: result.stderr,
          code: result.code 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in recreate-rag route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
