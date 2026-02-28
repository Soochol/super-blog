'use client';

import { useState, useEffect, useRef } from 'react';

const DEFAULT_MAKERS = ['Apple', 'Samsung', 'LG', 'ASUS', 'Lenovo', 'HP', 'Dell'];

type JobStatus = {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
  triggeredBy: string;
  startedAt: string | null;
  completedAt: string | null;
  logs: string[];
} | null;

export function ManualRunTab() {
  const [category, setCategory] = useState('노트북');
  const [makers, setMakers] = useState<string[]>(DEFAULT_MAKERS);
  const [newMaker, setNewMaker] = useState('');
  const [jobStatus, setJobStatus] = useState<JobStatus>(null);
  const [isPolling, setIsPolling] = useState(false);
  const logBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPolling) return;
    const interval = setInterval(async () => {
      const res = await fetch('/api/admin/pipeline');
      const data = await res.json();
      setJobStatus(data);
      if (data?.status === 'DONE' || data?.status === 'FAILED') {
        setIsPolling(false);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isPolling]);

  useEffect(() => {
    fetch('/api/admin/pipeline')
      .then((r) => r.json())
      .then((data) => {
        setJobStatus(data);
        if (data?.status === 'PENDING' || data?.status === 'RUNNING') {
          setIsPolling(true);
        }
      });
  }, []);

  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [jobStatus?.logs]);

  const handleRun = async () => {
    if (!confirm('파이프라인을 실행하시겠습니까?')) return;
    const res = await fetch('/api/admin/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, makers }),
    });
    if (res.status === 409) {
      alert('파이프라인이 이미 실행 중입니다.');
      return;
    }
    const data = await res.json();
    setJobStatus({ ...data, logs: [] });
    setIsPolling(true);
  };

  const removeMaker = (m: string) => setMakers(makers.filter((x) => x !== m));
  const addMaker = () => {
    if (newMaker.trim() && !makers.includes(newMaker.trim())) {
      setMakers([...makers, newMaker.trim()]);
      setNewMaker('');
    }
  };

  const isRunning = jobStatus?.status === 'PENDING' || jobStatus?.status === 'RUNNING';

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">카테고리</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option>노트북</option>
            <option>태블릿</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">제조사</label>
          <div className="flex flex-wrap gap-2">
            {makers.map((m) => (
              <span key={m} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm">
                {m}
                <button onClick={() => removeMaker(m)} className="text-gray-500 hover:text-red-500">×</button>
              </span>
            ))}
            <div className="flex gap-1">
              <input
                value={newMaker}
                onChange={(e) => setNewMaker(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addMaker()}
                placeholder="추가..."
                className="border rounded px-2 py-1 text-sm w-24"
              />
              <button onClick={addMaker} className="text-sm px-2 py-1 border rounded">+</button>
            </div>
          </div>
        </div>
      </div>

      {jobStatus && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            {isRunning && <span className="text-yellow-600 font-medium">실행 중...</span>}
            {jobStatus.status === 'DONE' && <span className="text-green-600 font-medium">완료</span>}
            {jobStatus.status === 'FAILED' && <span className="text-red-600 font-medium">실패</span>}
          </div>
          <div
            ref={logBoxRef}
            className="bg-gray-900 text-green-400 font-mono text-xs p-4 rounded h-64 overflow-y-auto"
          >
            {jobStatus.logs.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
            {isRunning && <div className="animate-pulse">|</div>}
          </div>
        </div>
      )}

      <button
        onClick={handleRun}
        disabled={isRunning}
        className="w-full py-3 bg-black text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
      >
        {isRunning ? '실행 중...' : '전체 파이프라인 실행'}
      </button>
    </div>
  );
}
