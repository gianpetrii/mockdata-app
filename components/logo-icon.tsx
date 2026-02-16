export default function LogoIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Database cylinder */}
      <ellipse cx="16" cy="10" rx="10" ry="4" fill="currentColor" opacity="0.3" />
      <rect x="6" y="10" width="20" height="12" fill="currentColor" opacity="0.3" />
      <ellipse cx="16" cy="22" rx="10" ry="4" fill="currentColor" />
      
      {/* Shield overlay */}
      <path
        d="M16 6L12 8V12C12 15 14 17 16 18C18 17 20 15 20 12V8L16 6Z"
        fill="currentColor"
      />
      <path
        d="M16 8L14 9V11.5C14 13 15 14 16 14.5C17 14 18 13 18 11.5V9L16 8Z"
        fill="white"
      />
    </svg>
  );
}
