import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { fetchHealth } from '../services/api';
import useDialogFocus from './useDialogFocus';

export default function HealthModal({ isOpen, onClose }) {
  const dialogRef = useDialogFocus(isOpen, onClose);
  const [health, setHealth] = useState(null);
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    fetchHealth().then(data => { if (active) setHealth(data); });
    return () => { active = false; };
  }, [isOpen]);
  if (!isOpen) return null;
  const offline = health?.status?.includes('client-fallback');
  const mode = offline ? 'Browser offline demo' : health?.storage_mode === 'aws' ? 'AWS services' : 'Local API';
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="health-title" className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
      <div className="flex items-start justify-between gap-4"><div><h2 id="health-title" className="text-lg font-bold text-white">System status</h2><p className="text-sm text-slate-300">Live response from the current runtime, not a claim of cloud deployment.</p></div><button onClick={onClose} aria-label="Close system status" className="p-2 rounded-lg hover:bg-slate-800"><X size={19} /></button></div>
      {!health ? <p role="status">Checking the API…</p> : <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="overview-card"><dt className="text-slate-400">Mode</dt><dd className="font-bold text-cyan-200">{mode}</dd></div>
        <div className="overview-card"><dt className="text-slate-400">Catalog</dt><dd className="font-bold text-white">{health.catalog_track_count} tracks</dd></div>
        <div className="overview-card"><dt className="text-slate-400">DynamoDB</dt><dd className="font-bold text-white">{health.dynamodb_connected ? 'Connected' : 'Not connected'}</dd></div>
        <div className="overview-card"><dt className="text-slate-400">S3</dt><dd className="font-bold text-white">{health.s3_connected ? 'Connected' : 'Not connected'}</dd></div>
      </dl>}
      <p className="text-xs text-slate-400">AWS infrastructure is defined in Terraform; deployment requires account configuration. Offline mode keeps metadata and history in this browser.</p>
    </div>
  </div>;
}
