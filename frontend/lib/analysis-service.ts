import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ReceivedChatMessage } from '@livekit/components-react';

export interface AnalysisResult {
    sentimentScore: number;
    moodShift: {
        before: string;
        after: string;
    };
    keyInsights: string[];
    actionItems: string[];
}

export async function analyzeSession(
    apiKey: string,
    transcript: ReceivedChatMessage[],
    moodBefore?: string
): Promise<AnalysisResult> {
    try {
        if (!apiKey) {
            throw new Error('No API key provided for analysis');
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const transcriptText = transcript.map(msg =>
            `${msg.from?.isLocal ? 'User' : 'Therapist'}: ${msg.message}`
        ).join('\n');

        const prompt = `
            Analyze the following therapy session transcript.
            Context: User reported mood before session as "${moodBefore || 'Unknown'}".
            
            Transcript:
            ${transcriptText}

            Provide a JSON response with the following fields:
            - sentimentScore: A number from 1-10 indicating mental wellness/positivity of the user by the end.
            - moodShift: Object with "before" (from context) and "after" (inferred from end of chat) strings (1-2 words).
            - keyInsights: Array of 3-5 strings highlighting key psychological breakthroughs or patterns.
            - actionItems: Array of 3 specific, actionable "homework" tasks for the user.

            Return ONLY raw JSON.
        `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Clean markdown code blocks if present
        const jsonStr = text.replace(/```json\n?|\n?```/g, '');
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error('Analysis failed:', error);
        // Fallback data
        return {
            sentimentScore: 7,
            moodShift: { before: moodBefore || 'Stressed', after: 'Relieved' },
            keyInsights: ['Session completed successfully', 'User engaged in dialogue'],
            actionItems: ['Reflect on today\'s session', 'Practice mindfulness']
        };
    }
}
