import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('No API key found');

        // Note: The Node SDK listing models is slightly different, 
        // usually accessing via 'genAI.getGenerativeModel' implies known model.
        // We actully need to use the lower level API to list models if the SDK supports it,
        // but looking at 0.24.0 docs, straightforward listing might not be exposed easily on the main class.

        // Instead, let's try to infer from a simple generation call on the most basic model: 'gemini-1.5-flash'
        // If that fails, we can try to fetch the raw list via REST if needed.

        // Actually, let's just make a direct REST call to list models to be 100% sure.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
