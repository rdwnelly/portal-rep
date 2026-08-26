import React from 'react';

export function PapuanMotifDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 opacity-80 ${className}`}>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
      <svg
        width="48"
        height="16"
        viewBox="0 0 48 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-amber-400"
      >
        <path
          d="M24 0L28 8L24 16L20 8L24 0Z"
          fill="currentColor"
          fillOpacity="0.8"
        />
        <path
          d="M12 4L15 8L12 12L9 8L12 4Z"
          fill="currentColor"
          fillOpacity="0.5"
        />
        <path
          d="M36 4L39 8L36 12L33 8L36 4Z"
          fill="currentColor"
          fillOpacity="0.5"
        />
        <path
          d="M0 8H8M40 8H48"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeOpacity="0.6"
        />
      </svg>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
    </div>
  );
}

export function PapuanBorderCorner() {
  return (
    <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none opacity-20 overflow-hidden">
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-amber-400"
      >
        <path
          d="M64 0H40L64 24V0Z"
          fill="currentColor"
        />
        <path
          d="M64 32L32 0H20L64 44V32Z"
          fill="currentColor"
          fillOpacity="0.6"
        />
        <path
          d="M64 52L12 0H0L64 64V52Z"
          fill="currentColor"
          fillOpacity="0.3"
        />
      </svg>
    </div>
  );
}
