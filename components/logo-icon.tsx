export default function LogoIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Database cylinder */}
      <ellipse cx="12" cy="5" rx="7" ry="3" />
      <path d="M5 5v6c0 1.66 3.13 3 7 3s7-1.34 7-3V5" />
      <path d="M5 11v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" />
      
      {/* Lock - positioned between middle and bottom */}
      <rect x="9.5" y="13" width="5" height="4.5" rx="0.5" />
      <path d="M10.5 13v-1.5a1.5 1.5 0 0 1 3 0V13" />
    </svg>
  );
}
