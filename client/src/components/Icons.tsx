import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * Mathematically balanced, authentic 5-petal Japanese Sakura Blossom SVG.
 * Symmetrical 72-degree radial petals with signature notched tips and center pistil.
 */
export const SakuraIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`icon-svg ${className}`}
    aria-hidden="true"
  >
    <g transform="translate(12, 12)">
      {/* 5 Symmetrical Petals at 0, 72, 144, 216, 288 degrees */}
      <g transform="rotate(0)">
        <path d="M 0 -2.2 C -2.8 -4.5, -4.6 -8.2, -2.4 -10.6 C -0.8 -11.6, 0 -10.2, 0 -10.2 C 0 -10.2, 0.8 -11.6, 2.4 -10.6 C 4.6 -8.2, 2.8 -4.5, 0 -2.2 Z" />
      </g>
      <g transform="rotate(72)">
        <path d="M 0 -2.2 C -2.8 -4.5, -4.6 -8.2, -2.4 -10.6 C -0.8 -11.6, 0 -10.2, 0 -10.2 C 0 -10.2, 0.8 -11.6, 2.4 -10.6 C 4.6 -8.2, 2.8 -4.5, 0 -2.2 Z" />
      </g>
      <g transform="rotate(144)">
        <path d="M 0 -2.2 C -2.8 -4.5, -4.6 -8.2, -2.4 -10.6 C -0.8 -11.6, 0 -10.2, 0 -10.2 C 0 -10.2, 0.8 -11.6, 2.4 -10.6 C 4.6 -8.2, 2.8 -4.5, 0 -2.2 Z" />
      </g>
      <g transform="rotate(216)">
        <path d="M 0 -2.2 C -2.8 -4.5, -4.6 -8.2, -2.4 -10.6 C -0.8 -11.6, 0 -10.2, 0 -10.2 C 0 -10.2, 0.8 -11.6, 2.4 -10.6 C 4.6 -8.2, 2.8 -4.5, 0 -2.2 Z" />
      </g>
      <g transform="rotate(288)">
        <path d="M 0 -2.2 C -2.8 -4.5, -4.6 -8.2, -2.4 -10.6 C -0.8 -11.6, 0 -10.2, 0 -10.2 C 0 -10.2, 0.8 -11.6, 2.4 -10.6 C 4.6 -8.2, 2.8 -4.5, 0 -2.2 Z" />
      </g>
      {/* Pistil & Center Stamen */}
      <circle cx="0" cy="0" r="2.4" fill="#ffffff" opacity="0.95" />
      <circle cx="0" cy="0" r="1.3" fill="currentColor" />
    </g>
  </svg>
);

export const SparkleIcon: React.FC<IconProps> = ({ className = '', size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`icon-svg ${className}`}
    aria-hidden="true"
  >
    <path d="M12 2L13.8 8.8L20.6 10.6L13.8 12.4L12 19.2L10.2 12.4L3.4 10.6L10.2 8.8L12 2Z" />
    <circle cx="19" cy="5" r="1.5" opacity="0.75" />
    <circle cx="5" cy="17" r="1" opacity="0.6" />
  </svg>
);

export const MailIcon: React.FC<IconProps> = ({ className = '', size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`icon-svg ${className}`}
    aria-hidden="true"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

export const LockIcon: React.FC<IconProps> = ({ className = '', size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`icon-svg ${className}`}
    aria-hidden="true"
  >
    <rect x="3" y="11" width="18" height="11" rx="3" ry="3" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    <circle cx="12" cy="16" r="1.5" fill="currentColor" />
  </svg>
);

export const EyeIcon: React.FC<IconProps> = ({ className = '', size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`icon-svg ${className}`}
    aria-hidden="true"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeOffIcon: React.FC<IconProps> = ({ className = '', size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`icon-svg ${className}`}
    aria-hidden="true"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ className = '', size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`icon-svg ${className}`}
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="18" rx="4" ry="4" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <circle cx="8" cy="14" r="1" fill="currentColor" />
    <circle cx="12" cy="14" r="1" fill="currentColor" />
    <circle cx="16" cy="14" r="1" fill="currentColor" />
    <circle cx="8" cy="18" r="1" fill="currentColor" />
    <circle cx="12" cy="18" r="1" fill="currentColor" />
  </svg>
);

export const WalletIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`icon-svg ${className}`}
    aria-hidden="true"
  >
    <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
    <path d="M16 12h5a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-5a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2z" />
    <circle cx="18" cy="10" r="0.8" fill="currentColor" />
  </svg>
);

export const TrendingUpIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`icon-svg ${className}`}
    aria-hidden="true"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

export const TrendingDownIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`icon-svg ${className}`}
    aria-hidden="true"
  >
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

export const BalanceIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`icon-svg ${className}`}
    aria-hidden="true"
  >
    <path d="M12 2v20" />
    <path d="M17 5H7" />
    <path d="M5 12l2-7 2 7a3 3 0 0 1-4 0z" />
    <path d="M15 12l2-7 2 7a3 3 0 0 1-4 0z" />
    <path d="M8 22h8" />
  </svg>
);

export const PlusIcon: React.FC<IconProps> = ({ className = '', size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`icon-svg ${className}`}
    aria-hidden="true"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const UserIcon: React.FC<IconProps> = ({ className = '', size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`icon-svg ${className}`}
    aria-hidden="true"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const LogoutIcon: React.FC<IconProps> = ({ className = '', size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`icon-svg ${className}`}
    aria-hidden="true"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const TagIcon: React.FC<IconProps> = ({ className = '', size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`icon-svg ${className}`}
    aria-hidden="true"
  >
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ className = '', size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`icon-svg ${className}`}
    aria-hidden="true"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ className = '', size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`icon-svg ${className}`}
    aria-hidden="true"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const MinimalIcon: React.FC<IconProps> = ({ className = '', size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`icon-svg ${className}`}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
  </svg>
);

export const LeafIcon: React.FC<IconProps> = ({ className = '', size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`icon-svg ${className}`}
    aria-hidden="true"
  >
    <path d="M11 20A7 7 0 0 1 4 13C4 7 11 2 20 2c0 9-5 16-11 16c-1.5 0-3-.5-4.2-1.4" />
    <path d="M2 22s5.5-1.5 9-6" />
  </svg>
);

/**
 * Dreamy 3D Pastel Wallet Illustration with embossed Sakura flower
 * Directly inspired by Reference Image 2 (Empty state dashboard)
 */
export const CuteWalletIllustration: React.FC<{ size?: number; className?: string }> = ({
  size = 120,
  className = '',
}) => (
  <svg
    width={size}
    height={size * 0.85}
    viewBox="0 0 120 102"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`cute-wallet-svg ${className}`}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="walletBackGrad" x1="10" y1="10" x2="110" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f3c4db" />
        <stop offset="100%" stopColor="#d8b4fe" />
      </linearGradient>
      <linearGradient id="walletBodyGrad" x1="10" y1="20" x2="110" y2="95" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="50%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#9333ea" />
      </linearGradient>
      <linearGradient id="walletFlapGrad" x1="60" y1="40" x2="115" y2="75" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f472b6" />
        <stop offset="100%" stopColor="#e879f9" />
      </linearGradient>
      <filter id="walletShadow" x="0" y="5" width="120" height="97" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#a855f7" floodOpacity="0.25" />
      </filter>
    </defs>

    {/* Back money slot */}
    <rect x="20" y="8" width="80" height="20" rx="6" fill="url(#walletBackGrad)" opacity="0.8" />

    {/* Main wallet body */}
    <g filter="url(#walletShadow)">
      <rect x="12" y="16" width="96" height="72" rx="18" fill="url(#walletBodyGrad)" />
      {/* Subtle top highlight */}
      <rect x="14" y="18" width="92" height="6" rx="3" fill="#ffffff" opacity="0.25" />
    </g>

    {/* Left embossed Sakura blossom */}
    <g transform="translate(42, 52) scale(1.1)">
      <SakuraIcon size={24} className="wallet-sakura-flower" />
    </g>

    {/* Side clasp / flap */}
    <g filter="url(#walletShadow)">
      <path
        d="M 80 38 H 104 C 111 38, 114 43, 114 52 C 114 61, 111 66, 104 66 H 80 Z"
        fill="url(#walletFlapGrad)"
      />
      {/* Clasp button with pearl glow */}
      <circle cx="102" cy="52" r="5" fill="#ffffff" />
      <circle cx="102" cy="52" r="3" fill="#f43f5e" />
    </g>
  </svg>
);
