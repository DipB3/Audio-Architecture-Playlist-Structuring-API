import React from 'react';
import { Radio, Database, Cloud, FileText, History, Activity, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Header({ onOpenHistory, onOpenHealth, onOpenDocs }) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & System Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-white tracking-tight">Audio Architecture & Playlist Structuring API</h1>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  Cloud Mini-Project
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Team 6 &bull; Batch B2 &bull; Sem 5 &bull; Supervisor: <span className="text-slate-300 font-medium">Dr. Soumya Nandan Mishra</span>
              </p>
            </div>
          </div>

          {/* Team Members & Academic Metadata */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden lg:flex items-center text-[11px] text-slate-300 bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 space-x-3">
              <span className="font-semibold text-slate-200">Contributors:</span>
              <span>Dipankar B. (240905618)</span>
              <span>&bull;</span>
              <span>Pratham S. (240905614)</span>
              <span>&bull;</span>
              <span>Vaibhav B. (240905504)</span>
            </div>

            {/* Managed Cloud Services Badge */}
            <div className="flex items-center space-x-1.5">
              <button
                onClick={onOpenHealth}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 hover:bg-emerald-900/80 text-xs font-medium transition-all"
                title="View AWS Managed Services & Infrastructure Health"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>AWS Cloud (4 Services)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </button>

              <button
                onClick={onOpenHistory}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
                title="View DynamoDB Generation History"
              >
                <History className="w-3.5 h-3.5" />
                <span>DynamoDB History</span>
              </button>

              <button
                onClick={onOpenDocs}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
                title="View Technical Design & Architecture Documentation"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Docs</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
