export default function LogoIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Database layers */}
      <ellipse cx="16" cy="8" rx="9" ry="3" fill="currentColor" opacity="0.2" />
      <ellipse cx="16" cy="13" rx="9" ry="3" fill="currentColor" opacity="0.3" />
      <ellipse cx="16" cy="18" rx="9" ry="3" fill="currentColor" opacity="0.4" />
      <ellipse cx="16" cy="23" rx="9" ry="3" fill="currentColor" />
      
      {/* Lock/encryption symbol */}
      <rect x="13" y="14" width="6" height="7" rx="1" fill="white" />
      <path
        d="M14 14V12C14 10.9 14.9 10 16 10C17.1 10 18 10.9 18 12V14"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="16" cy="17.5" r="1" fill="currentColor" />
    </svg>
  );
}
