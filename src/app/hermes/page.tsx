'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/shared/ui/Card';

interface HermesStatus {
  gateway_health: 'healthy' | 'degraded' | 'down';
  active_agents: number;
  task_queue_length: number;
  last_task_time: string;
  telegram_connected: boolean;
  webhook_connected: boolean;
}

export default function HermesDashboard() {
  const [status, setStatus] = useState<HermesStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Hermes gateway status
    fetch('/api/hermes/status')
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch Hermes status:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-3xl font-bold mb-8">⚡ Hermes Control</h1>
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">⚡ Hermes Control</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
        {/* Gateway Health */}
        <Card className="p-6">
          <h2 className="text-sm text-gray-400 mb-2">Gateway Health</h2>
          <div className={`text-3xl font-bold ${
            status?.gateway_health === 'healthy' ? 'text-green-500' :
            status?.gateway_health === 'degraded' ? 'text-yellow-500' : 'text-red-500'
          }`}>
            {status?.gateway_health === 'healthy' ? '● Online' :
             status?.gateway_health === 'degraded' ? '● Degraded' : '● Offline'}
          </div>
        </Card>

        {/* Telegram Connection */}
        <Card className="p-6">
          <h2 className="text-sm text-gray-400 mb-2">Telegram</h2>
          <div className={`text-3xl font-bold ${status?.telegram_connected ? 'text-green-500' : 'text-red-500'}`}>
            {status?.telegram_connected ? '● Connected' : '● Disconnected'}
          </div>
        </Card>

        {/* Webhook Connection */}
        <Card className="p-6">
          <h2 className="text-sm text-gray-400 mb-2">Webhook</h2>
          <div className={`text-3xl font-bold ${status?.webhook_connected ? 'text-green-500' : 'text-red-500'}`}>
            {status?.webhook_connected ? '● Connected' : '● Disconnected'}
          </div>
        </Card>

        {/* Active Agents */}
        <Card className="p-6">
          <h2 className="text-sm text-gray-400 mb-2">Active Agents</h2>
          <div className="text-3xl font-bold text-blue-500">{status?.active_agents || 0}</div>
        </Card>

        {/* Task Queue */}
        <Card className="p-6">
          <h2 className="text-sm text-gray-400 mb-2">Task Queue</h2>
          <div className="text-3xl font-bold text-purple-500">{status?.task_queue_length || 0}</div>
        </Card>

        {/* Last Activity */}
        <Card className="p-6">
          <h2 className="text-sm text-gray-400 mb-2">Last Activity</h2>
          <div className="text-xl font-semibold text-gray-300">
            {status?.last_task_time ? new Date(status.last_task_time).toLocaleString() : 'No recent activity'}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-12 max-w-6xl">
        <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-4 rounded-lg font-semibold transition-colors">
            📋 View Task History
          </button>
          <button className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-4 rounded-lg font-semibold transition-colors">
            ⏱️ Manage Cron Jobs
          </button>
          <button className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-4 rounded-lg font-semibold transition-colors">
            🤖 Active Sessions
          </button>
          <button className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-4 rounded-lg font-semibold transition-colors">
            ⚙️ Settings
          </button>
        </div>
      </div>
    </div>
  );
}
