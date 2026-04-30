import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // For now, return mock status - will connect to actual Hermes gateway later
    const status = {
      gateway_health: 'healthy' as const,
      active_agents: 1,
      task_queue_length: 0,
      last_task_time: new Date().toISOString(),
      telegram_connected: true,
      webhook_connected: true,
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('Hermes status error:', error);
    return NextResponse.json({
      gateway_health: 'down' as const,
      active_agents: 0,
      task_queue_length: 0,
      last_task_time: null,
      telegram_connected: false,
      webhook_connected: false,
    });
  }
}
