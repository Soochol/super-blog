'use client';

import { useState } from 'react';
import { ManualRunTab } from './components/ManualRunTab';
import { SchedulerTab } from './components/SchedulerTab';
import { RunHistoryTab } from './components/RunHistoryTab';

const TABS = [
  { id: 'manual', label: '수동 실행' },
  { id: 'scheduler', label: '스케줄러' },
  { id: 'history', label: '실행 기록' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>('manual');

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">관리자 - 콘텐츠 파이프라인</h1>
      <div className="flex border-b mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-white text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === 'manual' && <ManualRunTab />}
      {activeTab === 'scheduler' && <SchedulerTab />}
      {activeTab === 'history' && <RunHistoryTab />}
    </div>
  );
}
