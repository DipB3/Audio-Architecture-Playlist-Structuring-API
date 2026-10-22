import React from 'react';

export default function Header({ onOpenHistory, onOpenHealth, onOpenDocs }) {
  const links = [
    { label: 'History', onClick: onOpenHistory, title: 'View saved generation history' },
    { label: 'System status', onClick: onOpenHealth, title: 'View runtime and infrastructure status' },
    { label: 'Docs', onClick: onOpenDocs, title: 'View the project synopsis and architecture' },
  ];

  return (
    <header className="border-b-[1.5px] border-ink">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex items-center gap-3">
          <svg aria-hidden="true" viewBox="0 0 32 32" className="w-8 h-8 shrink-0">
            <rect width="32" height="32" rx="16" fill="#1b1a17" />
            <path d="M5 22 C10 22 11 9 16 9 S22 18 27 14" fill="none" stroke="#f3eee4" strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="16" cy="9" r="2.6" fill="#c23d17" />
          </svg>
          <div className="leading-tight">
            <h1 className="font-display text-xl font-semibold tracking-tight">Audio Architecture</h1>
            <p className="text-xs text-muted">Playlist structuring API · Team 6</p>
          </div>
        </div>

        <nav aria-label="Tools" className="flex items-center gap-5 text-sm">
          {links.map(link => (
            <button key={link.label} type="button" onClick={link.onClick} title={link.title}
              className="font-medium hover:text-accent-ink underline-offset-4 hover:underline">
              {link.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
