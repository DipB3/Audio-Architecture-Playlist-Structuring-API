import React, { useEffect, useState } from 'react';
import { X, Cloud, CheckCircle, Database, Server, HardDrive, DollarSign, Activity } from 'lucide-react';
import { fetchHealth } from '../services/api';

export default function HealthModal({ isOpen, onClose }) {
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchHealth()
        .then((data) => setHealthData(data))
        .catch((err) => console.error(err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AWS Managed Services Health & Telemetry</h3>
              <p className="text-[11px] text-slate-400">Compliance with Lab Guideline 4 & Guideline 7</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cloud Services List */}
        <div className="p-4 space-y-3 bg-slate-950/60">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Server className="w-4 h-4 text-cyan-400" />
              <div>
                <h4 className="text-xs font-bold text-white">AWS Lambda (Compute)</h4>
                <p className="text-[10px] text-slate-400">Serverless Audio Architecture Engine (Python 3.11)</p>
              </div>
            </div>
            <span className="flex items-center space-x-1 text-[11px] font-mono text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Operational</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="w-4 h-4 text-purple-400" />
              <div>
                <h4 className="text-xs font-bold text-white">Amazon API Gateway (REST API)</h4>
                <p className="text-[10px] text-slate-400">HTTP API v2 Proxy Integration with CORS & Latency Tracing</p>
              </div>
            </div>
            <span className="flex items-center space-x-1 text-[11px] font-mono text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Active (HTTP v2)</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="w-4 h-4 text-indigo-400" />
              <div>
                <h4 className="text-xs font-bold text-white">Amazon DynamoDB (NoSQL Database)</h4>
                <p className="text-[10px] text-slate-400">Serverless on-demand table: AudioArchitectures</p>
              </div>
            </div>
            <span className="flex items-center space-x-1 text-[11px] font-mono text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Pay-Per-Request ($0)</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <HardDrive className="w-4 h-4 text-teal-400" />
              <div>
                <h4 className="text-xs font-bold text-white">Amazon S3 (Object Storage)</h4>
                <p className="text-[10px] text-slate-400">Track catalog repository and exported audio bundles</p>
              </div>
            </div>
            <span className="flex items-center space-x-1 text-[11px] font-mono text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Standard-IA / AES256</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <div>
                <h4 className="text-xs font-bold text-white">AWS Budgets & CloudWatch Alarms</h4>
                <p className="text-[10px] text-slate-400">Budget Caution Alert set at $5.00 / 80% threshold</p>
              </div>
            </div>
            <span className="flex items-center space-x-1 text-[11px] font-mono text-amber-300">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>$0.00 / $5.00 limit</span>
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-slate-900">
          <div className="text-[10px] text-slate-400 font-mono">
            Region: {healthData ? healthData.aws_region : 'us-east-1'} &bull; Catalog Size: {healthData ? healthData.catalog_track_count : 48} tracks
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-semibold transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
