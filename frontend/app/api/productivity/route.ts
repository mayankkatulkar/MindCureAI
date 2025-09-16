import { NextResponse } from 'next/server';
import sharedData from '@/lib/shared-data';

export async function GET() {
  try {
    const data = sharedData.getProductivityData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch productivity data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { action, taskId, newTask } = await request.json();
    
    if (action === 'toggleTask' && taskId) {
      const success = sharedData.toggleTask(taskId);
      if (success) {
        const updatedData = sharedData.getProductivityData();
        return NextResponse.json({ success: true, data: updatedData });
      } else {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
    } else if (action === 'addTask' && newTask) {
      const productivityData = sharedData.getProductivityData();
      const newId = Math.max(...productivityData.todaysTasks.map(t => t.id)) + 1;
      // Note: This would need to be implemented in the shared data store
      return NextResponse.json({ success: true, message: 'Add task feature coming soon' });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update productivity data' }, { status: 500 });
  }
}
