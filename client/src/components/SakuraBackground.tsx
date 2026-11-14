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

      {/* Mode: SAKURA (Lush Cherry Blossom Canopy framing the top ceiling & corners cleanly) */}
      {mode === 'sakura' && (
        <>
          {/* Top-Left Sakura Canopy: Curves horizontally along top border, never intruding on content */}
          <div className="sakura-tree-canopy-top-left">
            <svg
              viewBox="0 0 540 140"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="canopy-svg"
            >
              {/* Graceful horizontal sakura branches framing top ceiling */}
              <path
                d="M -30 -10 C 60 22, 140 18, 230 38 C 320 54, 410 46, 510 58"
                stroke="#7a5847"
                strokeWidth="9"
                strokeLinecap="round"
                opacity="0.75"
              />
              <path
                d="M 110 20 C 170 36, 230 42, 300 48 C 360 54, 420 58, 470 64"
                stroke="#7a5847"
                strokeWidth="5.5"
                strokeLinecap="round"
                opacity="0.68"
              />
              <path
                d="M 250 38 C 290 52, 340 62, 390 70"
                stroke="#7a5847"
                strokeWidth="3.5"
                strokeLinecap="round"
                opacity="0.6"
              />

              {/* Rich Multi-layered Blossom Clusters along the top arch */}
              {/* Corner Cluster (Extreme Top-Left) */}
              <circle cx="50" cy="30" r="32" fill="#fda4bc" opacity="0.45" filter="blur(10px)" />
              <circle cx="85" cy="45" r="24" fill="#ffd6e3" opacity="0.9" />
              <circle cx="60" cy="35" r="20" fill="#f472b6" opacity="0.82" />
              <circle cx="40" cy="50" r="18" fill="#ffffff" opacity="0.9" />
              <circle cx="105" cy="32" r="16" fill="#fca5bc" opacity="0.85" />

              {/* Mid-Arch Blossom Cluster (Ceiling) */}
              <circle cx="190" cy="40" r="34" fill="#fda4bc" opacity="0.45" filter="blur(12px)" />
              <circle cx="175" cy="35" r="24" fill="#ffd6e3" opacity="0.9" />
              <circle cx="210" cy="48" r="22" fill="#f472b6" opacity="0.8" />
              <circle cx="155" cy="46" r="18" fill="#ffffff" opacity="0.9" />
              <circle cx="225" cy="34" r="16" fill="#fca5bc" opacity="0.85" />
              <circle cx="245" cy="48" r="14" fill="#ffd6e3" opacity="0.9" />

              {/* Outer Bough Cluster */}
              <circle cx="330" cy="50" r="30" fill="#fda4bc" opacity="0.4" filter="blur(10px)" />
              <circle cx="315" cy="46" r="20" fill="#ffd6e3" opacity="0.88" />
              <circle cx="345" cy="56" r="18" fill="#f472b6" opacity="0.8" />
              <circle cx="360" cy="44" r="15" fill="#ffffff" opacity="0.9" />

              {/* Delicate Outreaching Tips */}
              <circle cx="430" cy="54" r="22" fill="#ffd6e3" opacity="0.88" />
              <circle cx="450" cy="60" r="18" fill="#f472b6" opacity="0.8" />
              <circle cx="485" cy="56" r="16" fill="#ffd6e3" opacity="0.85" />
              <circle cx="505" cy="60" r="12" fill="#ffffff" opacity="0.95" />
            </svg>
          </div>

          {/* Top-Right Counter-Balancing Sakura Canopy Corner */}
          <div className="sakura-tree-canopy-top-right">
            <svg
              viewBox="0 0 320 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="canopy-svg"
            >
              <path
                d="M 340 -10 C 270 20, 200 30, 120 45 C 80 52, 40 60, 10 70"
                stroke="#7a5847"
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0.65"
              />
              <path
                d="M 220 25 C 170 45, 130 55, 80 68"
                stroke="#7a5847"
                strokeWidth="3.5"
                strokeLinecap="round"
                opacity="0.6"
              />
              {/* Blossom clusters right ceiling */}
              <circle cx="250" cy="22" r="26" fill="#fda4bc" opacity="0.4" filter="blur(10px)" />
              <circle cx="230" cy="26" r="18" fill="#ffd6e3" opacity="0.85" />
              <circle cx="265" cy="32" r="15" fill="#f472b6" opacity="0.8" />
              <circle cx="180" cy="38" r="20" fill="#ffd6e3" opacity="0.85" />
              <circle cx="150" cy="42" r="16" fill="#ffffff" opacity="0.9" />
              <circle cx="120" cy="48" r="14" fill="#fca5bc" opacity="0.8" />
              <circle cx="65" cy="62" r="16" fill="#ffd6e3" opacity="0.85" />
              <circle cx="45" cy="68" r="12" fill="#f472b6" opacity="0.8" />
            </svg>
          </div>
        </>
      )}

      {/* Mode: MINT (Fresh Morning Garden Foliage along ceiling) */}
      {mode === 'mint' && (
        <div className="mint-tree-canopy-top-left">
          <svg
            viewBox="0 0 460 130"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="canopy-svg"
          >
            <path
              d="M -20 -10 C 70 25, 160 22, 250 45 C 310 60, 370 55, 430 70"
              stroke="#4a6b58"
              strokeWidth="7"
              strokeLinecap="round"
              opacity="0.65"
            />
            {/* Mint Leaf Bunches */}
            <circle cx="110" cy="35" r="26" fill="#a7f3d0" opacity="0.5" filter="blur(10px)" />
            <circle cx="95" cy="30" r="18" fill="#dcfce9" opacity="0.88" />
            <circle cx="125" cy="40" r="15" fill="#6ee7b7" opacity="0.8" />
            <circle cx="220" cy="46" r="28" fill="#a7f3d0" opacity="0.5" filter="blur(10px)" />
            <circle cx="205" cy="42" r="20" fill="#dcfce9" opacity="0.9" />
            <circle cx="235" cy="52" r="16" fill="#4ade8d" opacity="0.8" />
            <circle cx="330" cy="58" r="24" fill="#a7f3d0" opacity="0.5" filter="blur(8px)" />
            <circle cx="320" cy="54" r="16" fill="#dcfce9" opacity="0.88" />
            <circle cx="345" cy="64" r="14" fill="#34d399" opacity="0.8" />
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

      {/* Twinkling Stage Stars */}
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
