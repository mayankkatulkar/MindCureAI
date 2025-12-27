import { AccessToken } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { roomName, identity } = body;

        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;

        if (!apiKey || !apiSecret) {
            return NextResponse.json(
                { error: 'LiveKit API credentials not configured' },
                { status: 500 }
            );
        }

        const at = new AccessToken(apiKey, apiSecret, {
            identity: identity || `user-${Math.random().toString(36).substr(2, 9)}`,
        });

        at.addGrant({
            room: roomName,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
        });

        const token = await at.toJwt();

        return NextResponse.json({ token });
    } catch (error) {
        console.error('Error generating LiveKit token:', error);
        return NextResponse.json(
            { error: 'Failed to generate token' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({ message: 'Use POST to generate a LiveKit token' });
}
