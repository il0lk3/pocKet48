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
    return Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: (i * 3.6 + (i % 5) * 2.6) % 100,
      delay: -(i * 1.05) % 16,
      duration: 10 + (i % 6) * 2.4,
      scale: 0.7 + (i % 5) * 0.16,
      swayDuration: 2.6 + (i % 4) * 1.1,
      initialRotation: (i * 57) % 360,
      opacity: 0.5 + (i % 4) * 0.15,
    }));
  }, []);

  return (
    <div className={`stage-ambiance ambiance-mode-${mode}`} aria-hidden="true">
      {/* Sky Atmosphere Mesh Gradients */}
      <div className="sky-atmosphere" />

      {/* Mode: SAKURA (Grand, Extravagant Japanese Cherry Blossom Canopies) */}
      {mode === 'sakura' && (
        <>
          {/* Top-Left Grand Extravagant Sakura Canopy */}
          <div className="sakura-tree-canopy-top-left">
            <svg
              viewBox="0 0 640 440"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="canopy-svg"
            >
              {/* Grand Ancient Sakura Boughs */}
              <path
                d="M -30 -20 C 90 40, 190 30, 310 90 C 400 135, 480 145, 590 190 C 620 202, 640 215, 650 225"
                stroke="#6e4d3b"
                strokeWidth="13"
                strokeLinecap="round"
                opacity="0.8"
              />
              <path
                d="M 130 35 C 190 85, 235 150, 315 220 C 370 270, 420 300, 490 350"
                stroke="#7a5847"
                strokeWidth="8.5"
                strokeLinecap="round"
                opacity="0.75"
              />
              <path
                d="M 280 85 C 360 65, 430 75, 510 55 C 550 45, 590 50, 620 40"
                stroke="#7a5847"
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0.7"
              />
              <path
                d="M 220 130 C 265 175, 305 210, 360 260 C 400 295, 435 320, 470 340"
                stroke="#7a5847"
                strokeWidth="4.5"
                strokeLinecap="round"
                opacity="0.65"
              />
              <path
                d="M 440 120 C 490 160, 540 185, 590 220"
                stroke="#7a5847"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.6"
              />

              {/* Rich Multi-layered Blossom Clouds & Clusters */}
              {/* 1. Base Corner Blossom Cloud */}
              <circle cx="70" cy="50" r="48" fill="#fda4bc" opacity="0.45" filter="blur(16px)" />
              <circle cx="110" cy="75" r="34" fill="#ffd6e3" opacity="0.92" />
              <circle cx="80" cy="55" r="28" fill="#f472b6" opacity="0.82" />
              <circle cx="50" cy="80" r="26" fill="#ffffff" opacity="0.95" />
              <circle cx="130" cy="50" r="22" fill="#fca5bc" opacity="0.88" />
              <circle cx="95" cy="110" r="24" fill="#ffd6e3" opacity="0.88" />

              {/* 2. Mid-Bough Extravagant Cluster */}
              <circle cx="230" cy="100" r="54" fill="#fda4bc" opacity="0.5" filter="blur(18px)" />
              <circle cx="215" cy="85" r="36" fill="#ffd6e3" opacity="0.92" />
              <circle cx="260" cy="115" r="32" fill="#f472b6" opacity="0.82" />
              <circle cx="185" cy="105" r="28" fill="#ffffff" opacity="0.95" />
              <circle cx="275" cy="85" r="24" fill="#fca5bc" opacity="0.88" />
              <circle cx="305" cy="110" r="20" fill="#ffd6e3" opacity="0.9" />
              <circle cx="240" cy="140" r="26" fill="#ffd6e3" opacity="0.85" />

              {/* 3. Lower Cascading Bough Cluster */}
              <circle cx="330" cy="225" r="46" fill="#fda4bc" opacity="0.45" filter="blur(16px)" />
              <circle cx="310" cy="205" r="32" fill="#ffd6e3" opacity="0.9" />
              <circle cx="355" cy="240" r="28" fill="#f472b6" opacity="0.82" />
              <circle cx="370" cy="200" r="22" fill="#ffffff" opacity="0.92" />
              <circle cx="435" cy="305" r="28" fill="#ffd6e3" opacity="0.88" />
              <circle cx="460" cy="325" r="22" fill="#f472b6" opacity="0.82" />
              <circle cx="485" cy="355" r="18" fill="#ffffff" opacity="0.95" />

              {/* 4. Upper Outstretching Bough Cluster */}
              <circle cx="460" cy="75" r="42" fill="#fda4bc" opacity="0.45" filter="blur(14px)" />
              <circle cx="445" cy="68" r="28" fill="#ffd6e3" opacity="0.92" />
              <circle cx="485" cy="88" r="24" fill="#f472b6" opacity="0.82" />
              <circle cx="525" cy="60" r="22" fill="#ffd6e3" opacity="0.88" />
              <circle cx="555" cy="55" r="16" fill="#ffffff" opacity="0.95" />
              <circle cx="610" cy="45" r="14" fill="#ffd6e3" opacity="0.9" />

              {/* 5. Lateral Outreaching Bough Cluster */}
              <circle cx="530" cy="180" r="44" fill="#fda4bc" opacity="0.45" filter="blur(14px)" />
              <circle cx="515" cy="170" r="28" fill="#ffd6e3" opacity="0.92" />
              <circle cx="550" cy="195" r="24" fill="#f472b6" opacity="0.82" />
              <circle cx="585" cy="205" r="20" fill="#ffd6e3" opacity="0.9" />
              <circle cx="615" cy="225" r="16" fill="#ffffff" opacity="0.95" />
            </svg>
          </div>

          {/* Top-Right Counter-Balancing Sakura Canopy */}
          <div className="sakura-tree-canopy-top-right">
            <svg
              viewBox="0 0 420 320"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="canopy-svg"
            >
              <path
                d="M 440 -15 C 340 35, 260 50, 160 85 C 105 105, 50 130, 10 160"
                stroke="#6e4d3b"
                strokeWidth="9"
                strokeLinecap="round"
                opacity="0.75"
              />
              <path
                d="M 280 45 C 210 95, 170 135, 100 185 C 65 210, 35 235, 15 255"
                stroke="#7a5847"
                strokeWidth="5.5"
                strokeLinecap="round"
                opacity="0.7"
              />
              <path
                d="M 210 75 C 170 115, 140 145, 90 180"
                stroke="#7a5847"
                strokeWidth="3.5"
                strokeLinecap="round"
                opacity="0.6"
              />

              {/* Blossom clusters right corner */}
              <circle cx="330" cy="35" r="40" fill="#fda4bc" opacity="0.42" filter="blur(14px)" />
              <circle cx="310" cy="40" r="28" fill="#ffd6e3" opacity="0.9" />
              <circle cx="350" cy="55" r="22" fill="#f472b6" opacity="0.82" />
              <circle cx="230" cy="70" r="32" fill="#ffd6e3" opacity="0.9" />
              <circle cx="190" cy="80" r="24" fill="#ffffff" opacity="0.92" />
              <circle cx="150" cy="95" r="22" fill="#fca5bc" opacity="0.85" />
              <circle cx="115" cy="155" r="28" fill="#ffd6e3" opacity="0.9" />
              <circle cx="85" cy="180" r="22" fill="#f472b6" opacity="0.82" />
              <circle cx="55" cy="205" r="18" fill="#ffffff" opacity="0.95" />
              <circle cx="25" cy="245" r="16" fill="#ffd6e3" opacity="0.88" />
            </svg>
          </div>
        </>
      )}

      {/* Mode: MINT (Grand, Extravagant CGM48 Fresh Mint Garden Canopies) */}
      {mode === 'mint' && (
        <>
          {/* Top-Left Grand Extravagant Mint Canopy */}
          <div className="mint-tree-canopy-top-left">
            <svg
              viewBox="0 0 640 440"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="canopy-svg"
            >
              {/* Graceful Forest Green Botanical Branches */}
              <path
                d="M -30 -20 C 80 40, 180 30, 290 85 C 380 130, 460 140, 570 185 C 605 198, 630 210, 645 220"
                stroke="#325340"
                strokeWidth="12"
                strokeLinecap="round"
                opacity="0.8"
              />
              <path
                d="M 125 35 C 185 85, 230 145, 305 215 C 360 265, 410 295, 480 345"
                stroke="#406952"
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.75"
              />
              <path
                d="M 270 80 C 350 60, 420 70, 500 50 C 540 40, 580 45, 610 35"
                stroke="#406952"
                strokeWidth="5.5"
                strokeLinecap="round"
                opacity="0.7"
              />
              <path
                d="M 210 125 C 255 170, 295 205, 350 255 C 390 290, 425 315, 460 335"
                stroke="#4a7a5f"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.65"
              />

              {/* Rich Multi-layered Fresh Mint Foliage Clouds */}
              {/* 1. Base Corner Mint Cloud */}
              <circle cx="70" cy="50" r="48" fill="#a7f3d0" opacity="0.5" filter="blur(16px)" />
              <circle cx="110" cy="75" r="35" fill="#dcfce9" opacity="0.92" />
              <circle cx="80" cy="55" r="28" fill="#6ee7b7" opacity="0.85" />
              <circle cx="50" cy="80" r="26" fill="#ffffff" opacity="0.95" />
              <circle cx="130" cy="50" r="24" fill="#34d399" opacity="0.85" />
              <circle cx="95" cy="110" r="24" fill="#86efac" opacity="0.9" />

              {/* 2. Mid-Bough Mint Foliage Cluster */}
              <circle cx="230" cy="95" r="54" fill="#a7f3d0" opacity="0.5" filter="blur(18px)" />
              <circle cx="215" cy="80" r="38" fill="#dcfce9" opacity="0.92" />
              <circle cx="260" cy="110" r="32" fill="#34d399" opacity="0.85" />
              <circle cx="185" cy="100" r="28" fill="#ecfdf5" opacity="0.95" />
              <circle cx="275" cy="80" r="26" fill="#6ee7b7" opacity="0.88" />
              <circle cx="305" cy="105" r="22" fill="#10b981" opacity="0.8" />
              <circle cx="240" cy="135" r="26" fill="#86efac" opacity="0.88" />

              {/* 3. Lower Cascading Foliage Cluster */}
              <circle cx="325" cy="220" r="46" fill="#a7f3d0" opacity="0.45" filter="blur(16px)" />
              <circle cx="305" cy="200" r="32" fill="#dcfce9" opacity="0.9" />
              <circle cx="350" cy="235" r="28" fill="#34d399" opacity="0.85" />
              <circle cx="365" cy="195" r="24" fill="#ffffff" opacity="0.92" />
              <circle cx="430" cy="300" r="28" fill="#6ee7b7" opacity="0.88" />
              <circle cx="455" cy="320" r="22" fill="#10b981" opacity="0.8" />
              <circle cx="480" cy="350" r="18" fill="#dcfce9" opacity="0.95" />

              {/* 4. Upper Outstretching Mint Sprigs */}
              <circle cx="450" cy="70" r="42" fill="#a7f3d0" opacity="0.45" filter="blur(14px)" />
              <circle cx="435" cy="62" r="28" fill="#dcfce9" opacity="0.92" />
              <circle cx="475" cy="82" r="24" fill="#34d399" opacity="0.85" />
              <circle cx="515" cy="55" r="22" fill="#86efac" opacity="0.88" />
              <circle cx="545" cy="50" r="16" fill="#ffffff" opacity="0.95" />
              <circle cx="600" cy="40" r="15" fill="#6ee7b7" opacity="0.9" />

              {/* 5. Lateral Outreaching Tips */}
              <circle cx="520" cy="175" r="44" fill="#a7f3d0" opacity="0.45" filter="blur(14px)" />
              <circle cx="505" cy="165" r="28" fill="#dcfce9" opacity="0.92" />
              <circle cx="540" cy="190" r="24" fill="#34d399" opacity="0.85" />
              <circle cx="575" cy="200" r="20" fill="#86efac" opacity="0.9" />
              <circle cx="605" cy="220" r="16" fill="#ffffff" opacity="0.95" />
            </svg>
          </div>

          {/* Top-Right Counter-Balancing Mint Canopy */}
          <div className="mint-tree-canopy-top-right">
            <svg
              viewBox="0 0 420 320"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="canopy-svg"
            >
              <path
                d="M 440 -15 C 340 35, 260 50, 160 85 C 105 105, 50 130, 10 160"
                stroke="#325340"
                strokeWidth="9"
                strokeLinecap="round"
                opacity="0.75"
              />
              <path
                d="M 280 45 C 210 95, 170 135, 100 185 C 65 210, 35 235, 15 255"
                stroke="#406952"
                strokeWidth="5.5"
                strokeLinecap="round"
                opacity="0.7"
              />
              <path
                d="M 210 75 C 170 115, 140 145, 90 180"
                stroke="#4a7a5f"
                strokeWidth="3.5"
                strokeLinecap="round"
                opacity="0.6"
              />

              {/* Foliage clusters right corner */}
              <circle cx="330" cy="35" r="40" fill="#a7f3d0" opacity="0.45" filter="blur(14px)" />
              <circle cx="310" cy="40" r="28" fill="#dcfce9" opacity="0.92" />
              <circle cx="350" cy="55" r="22" fill="#34d399" opacity="0.85" />
              <circle cx="230" cy="70" r="32" fill="#86efac" opacity="0.9" />
              <circle cx="190" cy="80" r="24" fill="#ffffff" opacity="0.92" />
              <circle cx="150" cy="95" r="22" fill="#6ee7b7" opacity="0.88" />
              <circle cx="115" cy="155" r="28" fill="#dcfce9" opacity="0.92" />
              <circle cx="85" cy="180" r="22" fill="#34d399" opacity="0.85" />
              <circle cx="55" cy="205" r="18" fill="#ffffff" opacity="0.95" />
              <circle cx="25" cy="245" r="16" fill="#86efac" opacity="0.9" />
            </svg>
          </div>
        </>
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
                    fill="url(#petalPinkGradGrand)"
                  />
                  <defs>
                    <linearGradient
                      id="petalPinkGradGrand"
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
                    fill="url(#petalMintGradGrand)"
                  />
                  <defs>
                    <linearGradient
                      id="petalMintGradGrand"
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
