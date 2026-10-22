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
  const rows = health ? [
    ['Mode', mode],
    ['Catalog', `${health.catalog_track_count} tracks`],
    ['DynamoDB', health.dynamodb_connected ? 'Connected' : 'Not connected'],
    ['S3', health.s3_connected ? 'Connected' : 'Not connected'],
  ] : [];
  return <div className="dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="health-title" className="dialog-sheet max-w-lg">
      <div className="dialog-head">
        <div>
          <p className="eyebrow">Runtime</p>
          <h2 id="health-title" className="mt-1 font-display text-2xl font-semibold tracking-tight">System status</h2>
          <p className="text-sm text-muted mt-1">Live response from the current runtime, not a claim of cloud deployment.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close system status" className="icon-btn"><X size={19} /></button>
      </div>
      <div className="px-6 py-4">
        {!health ? <p role="status" className="py-6 text-sm text-muted">Checking the API…</p> : <dl className="text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-2.5 border-b border-rule">
              <dt className="text-muted">{label}</dt>
              <dd className="font-semibold">{value}</dd>
            </div>
          ))}
        </dl>}
        <p className="mt-4 text-xs text-muted leading-relaxed">AWS infrastructure is defined in Terraform; deployment requires account configuration. Offline mode keeps metadata and history in this browser.</p>
      </div>
    </div>
  </div>;
}
