import React, { useState } from 'react';
import { X, Download, Copy, Check, FileCode, FileSpreadsheet, Music } from 'lucide-react';
import { exportPlaylist } from '../services/api';
import useDialogFocus from './useDialogFocus';

export default function ExportModal({ playlist, onClose }) {
  const dialogRef = useDialogFocus(true, onClose);
  const [format, setFormat] = useState('m3u');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [exportData, setExportData] = useState(null);

  const handleFetchExport = async (fmt) => {
    setFormat(fmt);
    setLoading(true);
    setCopied(false);
    try {
      const res = await exportPlaylist({
        playlist,
        playlist_id: playlist.playlist_id,
        format: fmt
      });
      setExportData(res);
    } catch (err) {
      console.error("Export error:", err);
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
    }).catch((err) => console.error("Export error:", err))
      .finally(() => active && setLoading(false));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="export-title" className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 id="export-title" className="text-base font-bold text-white flex items-center space-x-2">
              <Download className="w-5 h-5 text-cyan-400" />
              <span>Export Audio Architecture Structure</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Package finalized tracklist into standardized media containers.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close export dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Pills */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center space-x-2">
          <button
            onClick={() => handleFetchExport('m3u')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              format === 'm3u'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Extended M3U (VLC / DJ)</span>
          </button>

          <button
            onClick={() => handleFetchExport('json')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              format === 'json'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>JSON Architecture Spec</span>
          </button>

          <button
            onClick={() => handleFetchExport('csv')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              format === 'csv'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV Table (Rekordbox / Excel)</span>
          </button>
        </div>

        {/* Preview Code View */}
        <div className="p-4 flex-1 overflow-auto bg-slate-950">
          {loading ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">
              Packaging export artifact...
            </div>
          ) : (
            <pre className="text-[11px] font-mono text-cyan-300 whitespace-pre leading-relaxed select-all">
              {exportData ? exportData.content : "No export content available."}
            </pre>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-mono truncate max-w-[280px]">
            {exportData && exportData.s3_url && (
              <span>S3 Endpoint: {exportData.s3_url}</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
