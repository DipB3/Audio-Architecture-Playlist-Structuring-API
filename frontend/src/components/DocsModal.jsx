import React from 'react';
import { X } from 'lucide-react';
import useDialogFocus from './useDialogFocus';

const MODULES = [
  ['User interface', 'Target duration, genres, energy peaks and optimizer weights, set through this React dashboard.'],
  ['Audio architecture engine', 'Python optimizer that evaluates energy curves E(t), matches tempos and runs a harmonic beam search. Lambda deployment is prepared but not yet verified.'],
  ['Data and storage', 'Stores playlists and custom track metadata locally. Terraform defines DynamoDB tables and an S3 export bucket for the cloud deployment.'],
  ['Export and integration', 'Packages tracklists as Extended M3U, JSON and CSV. Exports do not contain audio recordings.'],
];

const SERVICES = ['AWS Lambda', 'API Gateway', 'Amazon DynamoDB', 'Amazon S3', 'CloudFront', 'CloudWatch Logs', 'AWS Budgets', 'Terraform', 'GitHub Actions'];

export default function DocsModal({ isOpen, onClose }) {
  const dialogRef = useDialogFocus(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div className="dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="docs-title" className="dialog-sheet max-w-3xl">
        <div className="dialog-head">
          <div>
            <p className="eyebrow">Synopsis</p>
            <h2 id="docs-title" className="mt-1 font-display text-2xl font-semibold tracking-tight">Audio Architecture System</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close documentation dialog" className="icon-btn"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-6 space-y-8 text-sm leading-relaxed">
          <dl className="grid sm:grid-cols-2 gap-x-8 text-sm">
            {[
              ['Team', 'Team 6, Batch B2, Section B'],
              ['Semester', '5th Semester (2026-27)'],
              ['Department', 'School of Computer Engineering'],
              ['Supervisor', 'Dr. Soumya Nandan Mishra'],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-4 py-2 border-b border-rule">
                <dt className="w-24 shrink-0 text-muted">{label}</dt><dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="font-mono text-xs text-muted">Dipankar Banerjee 240905618 · Pratham Shah 240905614 · Vaibhav Bhatia 240905504</p>

          <section>
            <h3 className="font-display text-xl font-semibold">Problem</h3>
            <p className="mt-2 text-ink-soft">
              Long, continuous playlists rarely hold a deliberate energy curve. Manual curation is slow, shuffles
              ignore peaks and troughs, and blending genres such as classical piano, indie pop and hip-hop often
              produces jarring transitions.
            </p>
          </section>

          <section>
            <h3 className="font-display text-xl font-semibold">Four modules</h3>
            <ol className="mt-3 border-t border-rule">
              {MODULES.map(([title, text], index) => (
                <li key={title} className="flex gap-4 py-3 border-b border-rule">
                  <span className="font-mono text-xs text-accent-ink pt-1">0{index + 1}</span>
                  <span><strong className="font-semibold">{title}.</strong> <span className="text-ink-soft">{text}</span></span>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h3 className="font-display text-xl font-semibold">Cloud services and tooling</h3>
            <p className="mt-2 font-mono text-xs text-ink-soft">{SERVICES.join(' / ')}</p>
          </section>
        </div>

        <div className="px-6 py-4 border-t-[1.5px] border-ink flex justify-end">
          <button type="button" onClick={onClose} className="btn btn-ink btn-small">Close</button>
        </div>
      </div>
    </div>
  );
}
