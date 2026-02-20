"use client";

interface PinIconProps {
  pinned?: boolean;
  className?: string;
  size?: number;
}

/** Pushpin icon: outline when not pinned, filled when pinned. */
export function PinIcon({ pinned, className = "", size = 18 }: PinIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={pinned ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={pinned ? 0 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* Pushpin: circle head + stem + point */}
      <circle cx="12" cy="6" r="3.5" />
      <path d="M12 9.5v9M10 18.5l2 3 2-3" />
    </svg>
  );
}
