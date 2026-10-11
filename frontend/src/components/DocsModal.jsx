import React from 'react';
import { X, FileText, CheckCircle2, Cloud, Server, Database, Layers } from 'lucide-react';

export default function DocsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Audio Architecture System - Technical Synopsis & Design</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-auto space-y-6 text-xs text-slate-300 leading-relaxed">
          
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="font-bold text-cyan-400 text-sm mb-2">Team & Project Synopsis Metadata</h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div><span className="text-slate-500">Team:</span> Team 6, Batch B2</div>
              <div><span className="text-slate-500">Semester:</span> 5th Semester (2026-27)</div>
              <div><span className="text-slate-500">Department:</span> School of Computer Engineering</div>
              <div><span className="text-slate-500">Supervisor:</span> Dr. Soumya Nandan Mishra</div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-[11px]">
              <div><span className="font-bold text-white block">Dipankar Banerjee</span> 240905618</div>
              <div><span className="font-bold text-white block">Pratham Shah</span> 240905614</div>
              <div><span className="font-bold text-white block">Vaibhav Bhatia</span> 240905504</div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-1.5">Problem Statement</h4>
            <p className="text-slate-400">
              Users often struggle to curate long, continuous audio playlists that maintain a specific energy curve, often leading to jarring transitions and broken concentration. Current curation methods rely heavily on manual track-by-track selection or algorithmic shuffles that lack real-time control over energy peaks and troughs. Additionally, blending diverse genres—such as contemporary classical piano, indie pop, and hip-hop—into a cohesive sequence is rarely handled well by automated tools.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-2">Proposed 4-Module Architecture</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="font-bold text-cyan-400 block mb-1">1. User Interface Module</span>
                Allows users to input target duration, select genres, map desired energy peaks, and fine-tune mathematical weights through an interactive React dashboard.
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="font-bold text-cyan-400 block mb-1">2. Audio Architecture Engine (API)</span>
                Serverless Python algorithm on AWS Lambda that processes track acoustic metrics, calculates continuous energy functions E(t), matches tempos, and performs harmonic beam search.
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="font-bold text-cyan-400 block mb-1">3. Data & Storage Module</span>
                Safely stores generated architectures and generation history in Amazon DynamoDB (NoSQL) with Amazon S3 asset bucket integration.
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="font-bold text-cyan-400 block mb-1">4. Export & Integration Module</span>
                Packages finalized continuous structures into standard Extended M3U8, JSON, and CSV formats and routes them back to the frontend for export.
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-2">Cloud Services & DevOps Tools Utilized</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">AWS Lambda</div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">API Gateway</div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">Amazon DynamoDB</div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">Amazon S3</div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">Terraform (IaC)</div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">GitHub Actions (CI/CD)</div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">AWS Budgets Alert</div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">CloudWatch Logs</div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-900">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all"
          >
            Close Documentation
          </button>
        </div>

      </div>
    </div>
  );
}
