'use client';

import { useState, useEffect } from 'react';

type Job = {
  id: string;
  status: string;
  triggeredBy: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

export function RunHistoryTab() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetch('/api/admin/pipeline/history').then((r) => r.json()).then(setJobs);
  }, []);

  const loadLogs = async (jobId: string) => {
    if (expandedId === jobId) { setExpandedId(null); return; }
    setExpandedId(jobId);
    if (!logs[jobId]) {
      const res = await fetch(`/api/admin/pipeline/${jobId}`);
      const data = await res.json();
      setLogs((prev) => ({ ...prev, [jobId]: data.logs }));
    }
  };

  const duration = (job: Job) => {
    if (!job.startedAt || !job.completedAt) return '-';
    const ms = new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime();
    const s = Math.round(ms / 1000);
    return s < 60 ? `${s}초` : `${Math.round(s / 60)}분 ${s % 60}초`;
  };

  return (
    <div className="space-y-2">
      {jobs.length === 0 && <p className="text-gray-500 text-sm">실행 기록이 없습니다.</p>}
      {jobs.map((job) => (
        <div key={job.id} className="border rounded">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-500">{new Date(job.createdAt).toLocaleString('ko-KR')}</span>
              <span>{job.triggeredBy === 'MANUAL' ? '수동' : '자동'}</span>
              <span>
                {job.status === 'DONE' ? '성공' : job.status === 'FAILED' ? '실패' : '실행 중'}
              </span>
              <span className="text-gray-500">{duration(job)}</span>
            </div>
            <button onClick={() => loadLogs(job.id)} className="text-xs text-blue-600 hover:underline">
              {expandedId === job.id ? '닫기' : '로그'}
            </button>
          </div>
          {expandedId === job.id && (
            <div className="bg-gray-900 text-green-400 font-mono text-xs p-3 max-h-48 overflow-y-auto border-t">
              {(logs[job.id] ?? []).map((line, i) => <div key={i}>{line}</div>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
