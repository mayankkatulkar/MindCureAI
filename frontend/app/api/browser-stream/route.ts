import { NextResponse } from 'next/server';

// Browser state interface (mirrors Python backend)
interface BrowserState {
    is_running: boolean;
    current_task: string | null;
    screenshots: string[]; // base64 encoded
    status: string;
    step: number;
    total_steps: number;
    current_url: string | null;
    error: string | null;
    started_at: string | null;
    completed_at: string | null;
}

// In-memory state for demo (in production, use Redis or shared state)
let browserState: BrowserState = {
    is_running: false,
    current_task: null,
    screenshots: [],
    status: 'idle',
    step: 0,
    total_steps: 0,
    current_url: null,
    error: null,
    started_at: null,
    completed_at: null
};

// GET - Poll for browser state and screenshots
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sinceIndex = parseInt(searchParams.get('since') || '0');

    // Return state with only new screenshots (for efficient polling)
    const newScreenshots = browserState.screenshots.slice(sinceIndex);

    return NextResponse.json({
        ...browserState,
        screenshots: newScreenshots,
        screenshotCount: browserState.screenshots.length,
        lastScreenshotIndex: browserState.screenshots.length
    });
}

// POST - Start browser automation
export async function POST(request: Request) {
    try {
        const { task } = await request.json();

        if (!task) {
            return NextResponse.json({ error: 'Task is required' }, { status: 400 });
        }

        if (browserState.is_running) {
            return NextResponse.json({
                error: 'Browser automation already running',
                status: browserState.status
            }, { status: 409 });
        }

        // Reset state
        browserState = {
            is_running: true,
            current_task: task,
            screenshots: [],
            status: 'starting',
            step: 0,
            total_steps: 3,
            current_url: null,
            error: null,
            started_at: new Date().toISOString(),
            completed_at: null
        };

        // Call Python backend to start browser automation
        // In production, this would be a call to the Python service
        const backendUrl = process.env.BROWSER_AUTOMATION_URL || 'http://localhost:8080';

        try {
            const response = await fetch(`${backendUrl}/browser/automate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task })
            });

            if (!response.ok) {
                throw new Error('Backend automation failed');
            }

            // Backend will update state as it progresses
            return NextResponse.json({
                success: true,
                message: 'Browser automation started',
                task
            });

        } catch (backendError) {
            // If backend not available, simulate for demo
            console.warn('Backend not available, simulating browser automation');

            // Simulate progress with demo screenshots
            simulateBrowserAutomation(task);

            return NextResponse.json({
                success: true,
                message: 'Browser automation started (demo mode)',
                task
            });
        }

    } catch (error) {
        console.error('Browser stream error:', error);
        return NextResponse.json({ error: 'Failed to start automation' }, { status: 500 });
    }
}

// Simulate browser automation for demo purposes
async function simulateBrowserAutomation(task: string) {
    const taskLower = task.toLowerCase();

    // Simulate steps with delays
    const simulateSteps = async () => {
        await delay(1000);
        browserState.status = 'navigating';
        browserState.step = 1;

        // Add a placeholder "screenshot" (in production, real screenshots from Python)
        browserState.screenshots.push(generatePlaceholderScreenshot(taskLower, 1));

        await delay(2000);
        browserState.status = 'loading page';
        browserState.step = 2;
        browserState.screenshots.push(generatePlaceholderScreenshot(taskLower, 2));

        await delay(2000);
        browserState.status = 'completed';
        browserState.step = 3;
        browserState.is_running = false;
        browserState.completed_at = new Date().toISOString();
        browserState.current_url = getUrlForTask(taskLower);
        browserState.screenshots.push(generatePlaceholderScreenshot(taskLower, 3));
    };

    simulateSteps();
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getUrlForTask(task: string): string {
    if (task.includes('therapist') || task.includes('psychology')) {
        return 'https://www.psychologytoday.com/us/therapists';
    } else if (task.includes('instagram')) {
        return 'https://www.instagram.com';
    } else if (task.includes('spotify') || task.includes('music')) {
        return 'https://open.spotify.com';
    } else if (task.includes('park') || task.includes('maps')) {
        return 'https://www.google.com/maps';
    } else if (task.includes('meme') || task.includes('reddit')) {
        return 'https://www.reddit.com/r/wholesomememes/';
    }
    return 'https://www.google.com';
}

function generatePlaceholderScreenshot(task: string, step: number): string {
    // Generate a simple SVG as placeholder (in production, real screenshots)
    const siteName = task.includes('therapist') ? 'Psychology Today' :
        task.includes('instagram') ? 'Instagram' :
            task.includes('spotify') ? 'Spotify' :
                task.includes('park') ? 'Google Maps' :
                    task.includes('meme') ? 'Reddit' : 'Browser';

    const svg = `
    <svg width="640" height="360" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <rect x="0" y="0" width="640" height="40" fill="#0f0f1a"/>
      <text x="20" y="25" fill="#888" font-family="system-ui" font-size="12">${siteName}</text>
      <circle cx="610" cy="20" r="6" fill="#3b82f6"/>
      <text x="320" y="200" fill="#a78bfa" font-family="system-ui" font-size="18" text-anchor="middle">
        Step ${step}: ${step === 1 ? 'Navigating...' : step === 2 ? 'Loading...' : 'Complete!'}
      </text>
      <text x="320" y="230" fill="#666" font-family="system-ui" font-size="12" text-anchor="middle">
        Opening ${siteName}
      </text>
    </svg>
  `;

    // Convert SVG to base64
    return Buffer.from(svg.trim()).toString('base64');
}
