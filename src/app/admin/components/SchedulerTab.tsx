'use client';

import { useState, useEffect } from 'react';

type Schedule = {
  enabled: boolean;
  frequency: string;
  hour: number;
  makers: string[];
  category: string;
};

export function SchedulerTab() {
  const [schedule, setSchedule] = useState<Schedule>({
    enabled: false, frequency: 'daily', hour: 3,
    makers: ['Apple', 'Samsung', 'LG', 'ASUS', 'Lenovo', 'HP', 'Dell'],
    category: '노트북',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/schedule').then((r) => r.json()).then(setSchedule);
  }, []);

  const handleSave = async () => {
    await fetch('/api/admin/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedule),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const nextRun = () => {
    if (!schedule.enabled) return '비활성';
    const now = new Date();
    const next = new Date();
    next.setHours(schedule.hour, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next.toLocaleString('ko-KR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="font-medium">자동 실행</span>
        <button
          onClick={() => setSchedule({ ...schedule, enabled: !schedule.enabled })}
          className={`relative w-12 h-6 rounded-full transition-colors ${schedule.enabled ? 'bg-black' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${schedule.enabled ? 'left-7' : 'left-1'}`} />
        </button>
        <span className="text-sm text-gray-500">{schedule.enabled ? 'ON' : 'OFF'}</span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">주기</label>
          <select
            value={schedule.frequency}
            onChange={(e) => setSchedule({ ...schedule, frequency: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="daily">매일</option>
            <option value="weekly">매주</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">실행 시각</label>
          <select
            value={schedule.hour}
            onChange={(e) => setSchedule({ ...schedule, hour: Number(e.target.value) })}
            className="border rounded px-3 py-2"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        다음 실행: <span className="font-medium text-gray-900">{nextRun()}</span>
      </div>

      <button
        onClick={handleSave}
        className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
      >
        {saved ? '저장됨' : '저장'}
      </button>
    </div>
  );
}
