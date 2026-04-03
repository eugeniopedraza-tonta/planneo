export default function Logo() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Planneo"
    >
      <defs>
        <linearGradient id="planneo-gradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#planneo-gradient)" />
      <text
        x="32"
        y="46"
        textAnchor="middle"
        fill="white"
        fontSize="36"
        fontWeight="700"
        fontFamily="Inter, sans-serif"
      >
        P
      </text>
    </svg>
  );
}
