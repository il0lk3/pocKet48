import React, { useMemo } from 'react';
import { useAmbiance } from '../context/AmbianceContext';

interface ParticleConfig {
  id: number;
  left: number;
  delay: number;
  duration: number;
  scale: number;
  swayDuration: number;
  initialRotation: number;
  opacity: number;
}

export const SakuraBackground: React.FC = () => {
  const { mode } = useAmbiance();

  const particles: ParticleConfig[] = useMemo(() => {
    return Array.from({ length: 26 }, (_, i) => ({
      id: i,
      left: (i * 3.8 + (i % 5) * 2.8) % 100,
      delay: -(i * 1.1) % 16,
      duration: 10 + (i % 6) * 2.4,
      scale: 0.7 + (i % 5) * 0.15,
      swayDuration: 2.6 + (i % 4) * 1.1,
      initialRotation: (i * 57) % 360,
      opacity: 0.5 + (i % 4) * 0.14,
    }));
  }, []);

  return (
    <div className={`stage-ambiance ambiance-mode-${mode}`} aria-hidden="true">
      {/* Sky Atmosphere Mesh Gradients */}
      <div className="sky-atmosphere" />

      {/* Mode: SAKURA (Lush, Blooming Japanese Cherry Blossom Canopy) */}
      {mode === 'sakura' && (
        <>
          {/* Top-Left Grand Blooming Sakura Canopy (Enlarged & Filled) */}
          <div className="sakura-tree-canopy-top-left">
            <svg
              viewBox="0 0 540 380"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="canopy-svg"
            >
              {/* Main Graceful Sakura Boughs */}
              <path
                d="M -30 -15 C 80 50, 180 35, 290 100 C 360 145, 420 135, 510 180"
                stroke="#7a5847"
                strokeWidth="11"
                strokeLinecap="round"
                opacity="0.75"
              />
              <path
                d="M 140 45 C 200 95, 240 155, 310 220 C 350 255, 390 270, 440 300"
                stroke="#7a5847"
                strokeWidth="7"
                strokeLinecap="round"
                opacity="0.7"
              />
              <path
                d="M 270 95 C 330 70, 390 85, 450 60 C 480 48, 510 55, 530 45"
                stroke="#7a5847"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.65"
              />
              <path
                d="M 210 130 C 240 170, 270 200, 310 240"
                stroke="#7a5847"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.6"
              />

              {/* Rich Multi-layered Blossom Clusters */}
              {/* Base Cluster (Top Corner) */}
              <circle cx="60" cy="40" r="38" fill="#fda4bc" opacity="0.45" filter="blur(14px)" />
              <circle cx="100" cy="65" r="28" fill="#ffd6e3" opacity="0.9" />
              <circle cx="75" cy="45" r="22" fill="#f472b6" opacity="0.8" />
              <circle cx="50" cy="70" r="24" fill="#ffffff" opacity="0.9" />
              <circle cx="115" cy="45" r="18" fill="#fca5bc" opacity="0.85" />

              {/* Mid Bough Cluster */}
              <circle cx="210" cy="90" r="44" fill="#fda4bc" opacity="0.5" filter="blur(16px)" />
              <circle cx="200" cy="80" r="30" fill="#ffd6e3" opacity="0.9" />
              <circle cx="235" cy="100" r="26" fill="#f472b6" opacity="0.8" />
              <circle cx="175" cy="95" r="22" fill="#ffffff" opacity="0.92" />
              <circle cx="245" cy="75" r="20" fill="#fca5bc" opacity="0.85" />
              <circle cx="270" cy="95" r="16" fill="#ffd6e3" opacity="0.9" />

              {/* Lower Bough Cluster */}
              <circle cx="310" cy="205" r="38" fill="#fda4bc" opacity="0.45" filter="blur(14px)" />
              <circle cx="295" cy="190" r="26" fill="#ffd6e3" opacity="0.9" />
              <circle cx="330" cy="220" r="24" fill="#f472b6" opacity="0.8" />
              <circle cx="345" cy="185" r="18" fill="#ffffff" opacity="0.9" />
              <circle cx="410" cy="280" r="22" fill="#ffd6e3" opacity="0.85" />
              <circle cx="430" cy="295" r="18" fill="#f472b6" opacity="0.8" />

              {/* Upper Outstretching Bough */}
              <circle cx="430" cy="70" r="36" fill="#fda4bc" opacity="0.45" filter="blur(14px)" />
              <circle cx="420" cy="65" r="24" fill="#ffd6e3" opacity="0.9" />
              <circle cx="455" cy="80" r="20" fill="#f472b6" opacity="0.8" />
              <circle cx="490" cy="55" r="18" fill="#ffd6e3" opacity="0.85" />
              <circle cx="515" cy="50" r="14" fill="#ffffff" opacity="0.95" />

              {/* Outer Tips Blooming */}
              <circle cx="485" cy="165" r="35" fill="#fda4bc" opacity="0.45" filter="blur(12px)" />
              <circle cx="475" cy="155" r="24" fill="#ffd6e3" opacity="0.9" />
              <circle cx="505" cy="175" r="20" fill="#f472b6" opacity="0.8" />
              <circle cx="525" cy="185" r="15" fill="#ffffff" opacity="0.95" />
            </svg>
          </div>

          {/* Top-Right Counter-Balancing Sakura Canopy Corner */}
          <div className="sakura-tree-canopy-top-right">
            <svg
              viewBox="0 0 320 240"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="canopy-svg"
            >
              <path
                d="M 340 -10 C 260 30, 200 45, 120 70 C 80 85, 40 100, 10 120"
                stroke="#7a5847"
                strokeWidth="7"
                strokeLinecap="round"
                opacity="0.65"
              />
              <path
                d="M 210 42 C 160 80, 130 110, 80 145"
                stroke="#7a5847"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.6"
              />
              {/* Blossom clusters right corner */}
              <circle cx="260" cy="30" r="30" fill="#fda4bc" opacity="0.4" filter="blur(10px)" />
              <circle cx="240" cy="35" r="22" fill="#ffd6e3" opacity="0.85" />
              <circle cx="275" cy="45" r="18" fill="#f472b6" opacity="0.8" />
              <circle cx="180" cy="55" r="26" fill="#ffd6e3" opacity="0.85" />
              <circle cx="150" cy="65" r="20" fill="#ffffff" opacity="0.9" />
              <circle cx="120" cy="80" r="18" fill="#fca5bc" opacity="0.8" />
              <circle cx="65" cy="130" r="20" fill="#ffd6e3" opacity="0.85" />
              <circle cx="45" cy="140" r="15" fill="#f472b6" opacity="0.8" />
            </svg>
          </div>
        </>
      )}

      {/* Mode: MINT (Fresh Morning Garden Foliage) */}
      {mode === 'mint' && (
        <div className="mint-tree-canopy-top-left">
          <svg
            viewBox="0 0 460 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="canopy-svg"
          >
            <path
              d="M -20 -10 C 70 40, 160 35, 250 85 C 310 120, 370 115, 430 150"
              stroke="#4a6b58"
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.65"
            />
            {/* Mint Leaf Bunches */}
            <circle cx="120" cy="55" r="30" fill="#a7f3d0" opacity="0.5" filter="blur(12px)" />
            <circle cx="105" cy="48" r="22" fill="#dcfce9" opacity="0.88" />
            <circle cx="135" cy="62" r="18" fill="#6ee7b7" opacity="0.8" />
            <circle cx="230" cy="85" r="34" fill="#a7f3d0" opacity="0.5" filter="blur(12px)" />
            <circle cx="215" cy="78" r="24" fill="#dcfce9" opacity="0.9" />
            <circle cx="245" cy="92" r="20" fill="#4ade8d" opacity="0.8" />
            <circle cx="340" cy="125" r="30" fill="#a7f3d0" opacity="0.5" filter="blur(10px)" />
            <circle cx="330" cy="118" r="20" fill="#dcfce9" opacity="0.88" />
            <circle cx="355" cy="132" r="16" fill="#34d399" opacity="0.8" />
          </svg>
        </div>
      )}

      {/* Stage Dual Spotlights Beaming Down */}
      {mode !== 'none' && (
        <>
          <div className="stage-spotlight-left" />
          <div className="stage-spotlight-right" />
        </>
      )}

      {/* Dreamy Floating Glowing Orbs */}
      <div className={`glow-orb orb-lilac ${mode === 'none' ? 'orb-subtle' : ''}`} />
      <div className={`glow-orb orb-pink ${mode === 'none' ? 'orb-subtle' : ''}`} />
      <div className={`glow-orb orb-mint ${mode === 'none' ? 'orb-subtle' : ''}`} />

      {/* Twinkling Stage Stars (Extra sparkling in 'sparkle' mode) */}
      {mode !== 'none' && (
        <div className={`stage-stars ${mode === 'sparkle' ? 'stars-sparkle-extravagant' : ''}`}>
          <span className="star-twinkle star-1" />
          <span className="star-twinkle star-2" />
          <span className="star-twinkle star-3" />
          <span className="star-twinkle star-4" />
          <span className="star-twinkle star-5" />
          {mode === 'sparkle' && (
            <>
              <span className="star-twinkle star-6" />
              <span className="star-twinkle star-7" />
              <span className="star-twinkle star-8" />
              <span className="star-twinkle star-9" />
            </>
          )}
        </div>
      )}

      {/* Falling Particles: SAKURA PETALS */}
      {mode === 'sakura' && (
        <div className="sakura-container">
          {particles.map((p) => (
            <div
              key={p.id}
              className="sakura-petal-wrapper"
              style={{
                left: `${p.left}%`,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
              }}
            >
              <div
                className="sakura-petal-leaf petal-pink"
                style={{
                  animationDuration: `${p.swayDuration}s`,
                  transform: `scale(${p.scale}) rotate(${p.initialRotation}deg)`,
                  opacity: p.opacity,
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2 C8 5, 4 10, 6 16 C8 22, 16 23, 19 18 C22 13, 20 6, 15 3 C13.5 2, 12.8 2, 12 2 Z"
                    fill="url(#petalPinkGradClean)"
                  />
                  <defs>
                    <linearGradient
                      id="petalPinkGradClean"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#ffe4eb" stopOpacity="0.95" />
                      <stop offset="60%" stopColor="#fca5bc" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#fb7198" stopOpacity="0.75" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Falling Particles: MINT LEAVES */}
      {mode === 'mint' && (
        <div className="sakura-container">
          {particles.map((p) => (
            <div
              key={p.id}
              className="sakura-petal-wrapper"
              style={{
                left: `${p.left}%`,
                animationDuration: `${p.duration * 0.9}s`,
                animationDelay: `${p.delay}s`,
              }}
            >
              <div
                className="sakura-petal-leaf petal-mint"
                style={{
                  animationDuration: `${p.swayDuration}s`,
                  transform: `scale(${p.scale}) rotate(${p.initialRotation}deg)`,
                  opacity: p.opacity,
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2 C6 5, 3 11, 5 18 C7 23, 15 24, 19 19 C23 14, 21 7, 16 3 C14 2, 13 2, 12 2 Z"
                    fill="url(#petalMintGradClean)"
                  />
                  <defs>
                    <linearGradient
                      id="petalMintGradClean"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#dcfce9" stopOpacity="0.95" />
                      <stop offset="60%" stopColor="#a7f3d0" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#4ade8d" stopOpacity="0.75" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
