import { NextResponse } from 'next/server';
import sharedData from '@/lib/shared-data';

export async function GET() {
  try {
    const data = sharedData.getDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { activity, scoreChange } = await request.json();
    
    const result = sharedData.updateScores(activity, scoreChange || 0);
    const updatedData = sharedData.getDashboardData();
    
    return NextResponse.json({ success: true, data: updatedData, update: result });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update dashboard' }, { status: 500 });
  }
}
