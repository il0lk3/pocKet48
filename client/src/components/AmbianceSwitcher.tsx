import React, { useEffect, useRef, useState } from 'react';
import { useAmbiance, type AmbianceMode } from '../context/AmbianceContext';
import { SparkleIcon, SakuraIcon, LeafIcon, MinimalIcon } from './Icons';

interface Option {
  id: AmbianceMode;
  renderIcon: (size?: number) => React.ReactNode;
  nameTh: string;
  nameEn: string;
}

const AMBIANCE_OPTIONS: Option[] = [
  {
    id: 'sakura',
    renderIcon: (size = 18) => <SakuraIcon size={size} className="ambiance-icon-sakura" />,
    nameTh: 'ซากุระพลิ้วไหว',
    nameEn: 'Sakura Breeze',
  },
  {
    id: 'sparkle',
    renderIcon: (size = 18) => <SparkleIcon size={size} className="ambiance-icon-sparkle" />,
    nameTh: 'สเตจสตาร์ประกายดาว',
    nameEn: 'Idol Sparkle',
  },
  {
    id: 'mint',
    renderIcon: (size = 18) => <LeafIcon size={size} className="ambiance-icon-mint" />,
    nameTh: 'ใบมิ้นต์สดชื่น',
    nameEn: 'Fresh Mint',
  },
  {
    id: 'none',
    renderIcon: (size = 18) => <MinimalIcon size={size} className="ambiance-icon-none" />,
    nameTh: 'มินิมอล (ปิดเอฟเฟกต์)',
    nameEn: 'Calm / Off',
  },
];

export const AmbianceSwitcher: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  const { mode, setMode } = useAmbiance();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const currentOption =
    AMBIANCE_OPTIONS.find((opt) => opt.id === mode) || AMBIANCE_OPTIONS[0];

  return (
    <div
      ref={containerRef}
      className={`ambiance-switcher-container ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="ambiance-trigger-pill"
        title="เลือกเอฟเฟกต์บรรยากาศ (Select Ambiance Effect)"
        aria-label="Select Ambiance Effect"
        aria-expanded={isOpen}
      >
        <span className="ambiance-trigger-icon">
          {currentOption.renderIcon(16)}
        </span>
        <span className="ambiance-trigger-label">{currentOption.nameEn}</span>
        <span className="ambiance-trigger-arrow" aria-hidden="true">▾</span>
      </button>

      {isOpen && (
        <div className="ambiance-popover-card" role="menu">
          <div className="ambiance-popover-header">
            <span className="popover-title-th">เลือกเอฟเฟกต์บรรยากาศ</span>
            <span className="popover-title-sub">Ambiance Atmosphere</span>
          </div>

          <div className="ambiance-options-list">
            {AMBIANCE_OPTIONS.map((opt) => {
              const isSelected = opt.id === mode;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setMode(opt.id);
                    setIsOpen(false);
                  }}
                  className={`ambiance-option-item ${
                    isSelected ? 'option-selected' : ''
                  }`}
                  role="menuitem"
                >
                  <span className="opt-icon-badge">
                    {opt.renderIcon(18)}
                  </span>
                  <div className="opt-text-block">
                    <span className="opt-name-th">{opt.nameTh}</span>
                    <span className="opt-name-en">{opt.nameEn}</span>
                  </div>
                  {isSelected && <span className="opt-check-mark">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
