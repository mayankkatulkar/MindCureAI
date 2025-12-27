import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { transcript, userApiKey, moodBefore, refinementInstruction } = body;

        // 1. Determine which API key to use
        // Priority: User's BYOK key > Server .env Key
        const apiKey = userApiKey || process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'No API key available for analysis. Please add a key in Settings or configure the server.' },
                { status: 401 }
            );
        }

        // 2. Prepare Prompt with "Billion Dollar" CBT Framework
        const transcriptText = transcript.map((m: any) => `${m.from?.isLocal || m.isLocal ? 'User' : 'Therapist'}: ${m.message}`).join('\n');

        let systemPrompt = `
You are MindCure AI, an elite clinical psychologist and life coach specializing in Cognitive Behavioral Therapy (CBT) and actionable life strategy.
Your goal is to provide a "Billion Dollar" analysis of the user's therapy session.

Analyze the following transcript deeply. Look beyond surface words to identify subconscious patterns, cognitive distortions, and emotional shifts.
`;

        if (refinementInstruction) {
            systemPrompt += `
\nIMPORTANT - USER REFINEMENT MODE:
The user has reviewed the initial analysis and wants to refine it with this specific focus:
"${refinementInstruction}"

Re-analyze the session with this specific lens. Adjust the "Key Insights", "Subconscious Patterns", and "Action Items" to directly address this instruction.
`;
        }

        systemPrompt += `
OUTPUT FORMAT:
You must return ONLY valid JSON. No markdown formatting. No code blocks.
Structure:
{
  "sentimentScore": <number 1-10, where 10 is peak mental flow>,
  "moodShift": {
    "before": "<Specific emotion before (inferred)>",
    "after": "<Specific emotion after>"
  },
  "primaryFocus": ["<Tag1>", "<Tag2>", "<Tag3>"],
  "keyInsights": [
    "<Insight 1: Identify a specific cognitive distortion or strength>",
    "<Insight 2: Connect a past pattern to current behavior>",
    "<Insight 3: A profound observation about their communication style>"
  ],
  "subconsciousPatterns": [
    "<Hidden driver or limiting belief identified>"
  ],
  "actionItems": [
    "<Step 1: Immediate actionable advice (CBT technique)>",
    "<Step 2: Strategic life change>",
    "<Step 3: A journaling or reflection prompt>"
  ]
}

TRANSCRIPT:
${transcriptText}

INSTRUCTIONS:
- Be direct, empathetic, and profoundly insightful.
- Avoid generic advice like "Take a deep breath". Give specific, high-level strategy.
- Ensure 'moodShift' and 'primaryFocus' are ALWAYS populated.
`;

        // 3. Call Gemini API
        const genAI = new GoogleGenerativeAI(apiKey);
        // Use Gemini 2.5 Flash Lite - Best for high throughput/free tier quotas
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite-preview-09-2025' });

        const result = await model.generateContent(systemPrompt);
        const response = result.response;
        const text = response.text();

        // 4. Clean and parse JSON
        const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
        const analysisData = JSON.parse(jsonStr);

        return NextResponse.json(analysisData);

    } catch (error) {
        console.error('Analysis API Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate analysis', details: String(error) },
            { status: 500 }
        );
    }
}
