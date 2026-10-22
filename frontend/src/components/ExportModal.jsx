import React, { useState } from 'react';
import { X, Download, Copy, Check } from 'lucide-react';
import { exportPlaylist } from '../services/api';
import useDialogFocus from './useDialogFocus';

const FORMATS = [
  ['m3u', 'Extended M3U', 'Media players and DJ software'],
  ['json', 'JSON', 'Full structure, metrics and diagnostics'],
  ['csv', 'CSV', 'Spreadsheets and library tools'],
];

export default function ExportModal({ playlist, onClose }) {
  const dialogRef = useDialogFocus(true, onClose);
  const [format, setFormat] = useState('m3u');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [exportData, setExportData] = useState(null);
  const [error, setError] = useState('');

  const handleFetchExport = async (fmt) => {
    setFormat(fmt);
    setLoading(true);
    setCopied(false);
    setError('');
    try {
      const res = await exportPlaylist({
        playlist,
        playlist_id: playlist.playlist_id,
        format: fmt
      });
      setExportData(res);
    } catch (err) {
      console.error("Export error:", err);
      setExportData(null);
      setError(err.message || 'The export could not be created.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    let active = true;
    exportPlaylist({
      playlist,
      playlist_id: playlist.playlist_id,
      format: 'm3u'
    }).then((res) => {
      if (active) setExportData(res);
    }).catch((err) => {
      console.error("Export error:", err);
      if (active) setError(err.message || 'The export could not be created.');
    }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [playlist]);

  const handleDownload = () => {
    if (!exportData) return;
    const blob = new Blob([exportData.content], { type: exportData.content_type || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportData.filename || `playlist.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!exportData) return;
    navigator.clipboard.writeText(exportData.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="export-title" className="dialog-sheet max-w-2xl">
        <div className="dialog-head">
          <div>
            <p className="eyebrow">Export</p>
            <h2 id="export-title" className="mt-1 font-display text-2xl font-semibold tracking-tight">{playlist.name}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close export dialog" className="icon-btn"><X className="w-5 h-5" /></button>
        </div>

        <div role="group" aria-label="Export format" className="grid grid-cols-3 border-b border-rule">
          {FORMATS.map(([id, label, hint]) => (
            <button key={id} type="button" aria-pressed={format === id} onClick={() => handleFetchExport(id)}
              className={`text-left px-6 py-3 border-r last:border-r-0 border-rule transition-colors ${
                format === id ? 'bg-ink text-paper' : 'hover:bg-paper-deep'
              }`}>
              <span className="block font-semibold text-sm">{label}</span>
              <span className={`hidden sm:block text-xs mt-0.5 ${format === id ? 'opacity-70' : 'text-muted'}`}>{hint}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto bg-paper-deep px-6 py-4 min-h-48">
          {loading ? (
            <p className="py-16 text-center text-sm text-muted" role="status">Preparing the file…</p>
          ) : error ? (
            <p className="py-16 text-center text-sm text-accent-ink" role="alert">{error}</p>
          ) : (
            <pre className="text-[11px] font-mono whitespace-pre leading-relaxed">
              {exportData ? exportData.content : "No export content available."}
            </pre>
          )}
        </div>

        <div className="px-6 py-4 border-t-[1.5px] border-ink flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-muted font-mono truncate sm:max-w-[260px]" title={exportData?.s3_url || ''}>
            {exportData?.s3_url ? `Stored: ${exportData.s3_url}` : ''}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={handleCopy} disabled={!exportData} className="btn btn-line btn-small">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button type="button" onClick={handleDownload} disabled={!exportData} className="btn btn-ink btn-small">
              <Download className="w-3.5 h-3.5" />Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
