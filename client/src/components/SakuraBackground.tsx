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
          {/* Top-Left Grand Extravagant Sakura Canopy: Fully tapered, zero clipping, blossoms at every tip */}
          <div className="sakura-tree-canopy-top-left">
            <svg
              viewBox="-40 -30 720 480"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="canopy-svg"
            >
              {/* Grand Ancient Sakura Boughs (Tapered & Layered) */}
              {/* Main heavy trunk emerging from top-left */}
              <path
                d="M -30 -20 C 80 35, 180 28, 290 85 C 370 125, 450 140, 540 175"
                stroke="#634434"
                strokeWidth="12"
                strokeLinecap="round"
                opacity="0.82"
              />
              {/* Main lateral continuation tapering into terminal cluster at (600, 205) */}
              <path
                d="M 540 175 C 565 185, 585 195, 600 205"
                stroke="#634434"
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0.75"
              />
              {/* Secondary downward cascading bough tapering to (470, 335) */}
              <path
                d="M 130 35 C 185 85, 230 145, 305 215 C 360 265, 405 295, 470 335"
                stroke="#704e3b"
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.75"
              />
              {/* Downward terminal twig ending at (475, 340) */}
              <path
                d="M 470 335 C 472 337, 474 338, 475 340"
                stroke="#704e3b"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.7"
              />
              {/* Upper lateral bough arching to (580, 45) */}
              <path
                d="M 270 80 C 350 62, 420 72, 495 55 C 530 46, 555 48, 580 45"
                stroke="#704e3b"
                strokeWidth="5.5"
                strokeLinecap="round"
                opacity="0.7"
              />
              {/* Lower inner sprig tapering to (340, 245) */}
              <path
                d="M 215 125 C 255 165, 290 195, 340 245"
                stroke="#7a5847"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.65"
              />
              {/* Lateral outer sprig tapering to (560, 210) */}
              <path
                d="M 425 120 C 475 155, 520 180, 560 210"
                stroke="#7a5847"
                strokeWidth="3.5"
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
              <circle cx="230" cy="95" r="54" fill="#fda4bc" opacity="0.5" filter="blur(18px)" />
              <circle cx="215" cy="80" r="36" fill="#ffd6e3" opacity="0.92" />
              <circle cx="260" cy="110" r="32" fill="#f472b6" opacity="0.82" />
              <circle cx="185" cy="100" r="28" fill="#ffffff" opacity="0.95" />
              <circle cx="275" cy="80" r="24" fill="#fca5bc" opacity="0.88" />
              <circle cx="305" cy="105" r="20" fill="#ffd6e3" opacity="0.9" />
              <circle cx="240" cy="135" r="26" fill="#ffd6e3" opacity="0.85" />

              {/* 3. Lower Cascading Bough Cluster (Enveloping terminal tip at 475, 340) */}
              <circle cx="330" cy="225" r="46" fill="#fda4bc" opacity="0.45" filter="blur(16px)" />
              <circle cx="310" cy="205" r="32" fill="#ffd6e3" opacity="0.9" />
              <circle cx="355" cy="240" r="28" fill="#f472b6" opacity="0.82" />
              <circle cx="370" cy="200" r="22" fill="#ffffff" opacity="0.92" />
              <circle cx="430" cy="300" r="30" fill="#ffd6e3" opacity="0.88" />
              <circle cx="455" cy="325" r="26" fill="#f472b6" opacity="0.85" />
              {/* Terminal Blossom Cap at (475, 340) */}
              <circle cx="475" cy="340" r="26" fill="#ffd6e3" opacity="0.95" />
              <circle cx="475" cy="340" r="18" fill="#ffffff" opacity="0.95" />
              <circle cx="475" cy="340" r="8" fill="#f43f5e" opacity="0.8" />
              <circle cx="498" cy="355" r="16" fill="#fda4bc" opacity="0.85" />

              {/* 4. Upper Outstretching Bough Cluster (Enveloping terminal tip at 580, 45) */}
              <circle cx="450" cy="70" r="42" fill="#fda4bc" opacity="0.45" filter="blur(14px)" />
              <circle cx="435" cy="62" r="28" fill="#ffd6e3" opacity="0.92" />
              <circle cx="475" cy="82" r="24" fill="#f472b6" opacity="0.82" />
              <circle cx="515" cy="55" r="22" fill="#ffd6e3" opacity="0.88" />
              <circle cx="545" cy="50" r="20" fill="#ffffff" opacity="0.95" />
              {/* Terminal Blossom Cap at (580, 45) */}
              <circle cx="580" cy="45" r="24" fill="#ffd6e3" opacity="0.95" />
              <circle cx="580" cy="45" r="16" fill="#f472b6" opacity="0.85" />
              <circle cx="580" cy="45" r="7" fill="#ffffff" opacity="0.95" />
              <circle cx="600" cy="42" r="14" fill="#fda4bc" opacity="0.85" />

              {/* 5. Lateral Outreaching Bough Cluster (Enveloping terminal tip at 600, 205) */}
              <circle cx="520" cy="175" r="44" fill="#fda4bc" opacity="0.45" filter="blur(14px)" />
              <circle cx="505" cy="165" r="28" fill="#ffd6e3" opacity="0.92" />
              <circle cx="540" cy="190" r="24" fill="#f472b6" opacity="0.82" />
              <circle cx="570" cy="200" r="26" fill="#ffd6e3" opacity="0.92" />
              {/* Terminal Blossom Cap at (600, 205) — solves Image 1 cut! */}
              <circle cx="600" cy="205" r="28" fill="#fda4bc" opacity="0.5" filter="blur(8px)" />
              <circle cx="600" cy="205" r="26" fill="#ffd6e3" opacity="0.95" />
              <circle cx="600" cy="205" r="18" fill="#f472b6" opacity="0.88" />
              <circle cx="600" cy="205" r="9" fill="#ffffff" opacity="0.95" />
              <circle cx="625" cy="212" r="16" fill="#ffd6e3" opacity="0.9" />
              <circle cx="638" cy="220" r="11" fill="#ffffff" opacity="0.95" />
            </svg>
          </div>

          {/* Top-Right Counter-Balancing Sakura Canopy: Fully tapered, zero clipping, blossoms at tips */}
          <div className="sakura-tree-canopy-top-right">
            <svg
              viewBox="-30 -30 480 360"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="canopy-svg"
            >
              {/* Tapered boughs from upper-right toward center */}
              <path
                d="M 430 -10 C 330 35, 255 50, 160 85 C 110 105, 70 125, 35 150"
                stroke="#634434"
                strokeWidth="8.5"
                strokeLinecap="round"
                opacity="0.75"
              />
              <path
                d="M 35 150 C 25 156, 18 162, 15 168"
                stroke="#634434"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.65"
              />
              <path
                d="M 270 45 C 200 95, 160 135, 95 185 C 65 210, 42 230, 25 248"
                stroke="#704e3b"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.7"
              />

              {/* Blossom clusters right corner */}
              <circle cx="330" cy="35" r="40" fill="#fda4bc" opacity="0.42" filter="blur(14px)" />
              <circle cx="310" cy="40" r="28" fill="#ffd6e3" opacity="0.9" />
              <circle cx="350" cy="55" r="22" fill="#f472b6" opacity="0.82" />
              <circle cx="230" cy="70" r="32" fill="#ffd6e3" opacity="0.9" />
              <circle cx="190" cy="80" r="24" fill="#ffffff" opacity="0.92" />
              <circle cx="150" cy="95" r="22" fill="#fca5bc" opacity="0.85" />
              <circle cx="105" cy="155" r="28" fill="#ffd6e3" opacity="0.9" />
              <circle cx="75" cy="175" r="22" fill="#f472b6" opacity="0.82" />

              {/* Terminal Blossom Cap at (15, 168) */}
              <circle cx="15" cy="168" r="24" fill="#ffd6e3" opacity="0.95" />
              <circle cx="15" cy="168" r="16" fill="#f472b6" opacity="0.85" />
              <circle cx="15" cy="168" r="7" fill="#ffffff" opacity="0.95" />
              <circle cx="-2" cy="175" r="13" fill="#ffd6e3" opacity="0.88" />

              {/* Terminal Blossom Cap at (25, 248) */}
              <circle cx="25" cy="248" r="22" fill="#ffd6e3" opacity="0.95" />
              <circle cx="25" cy="248" r="14" fill="#ffffff" opacity="0.95" />
              <circle cx="25" cy="248" r="6" fill="#f43f5e" opacity="0.85" />
            </svg>
          </div>
        </>
      )}

      {/* Mode: MINT (Grand, Extravagant CGM48 Fresh Mint Garden Canopies) */}
      {mode === 'mint' && (
        <>
          {/* Top-Left Grand Extravagant Mint Canopy: Fully tapered, zero clipping, mint clusters at tips */}
          <div className="mint-tree-canopy-top-left">
            <svg
              viewBox="-40 -30 720 480"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="canopy-svg"
            >
              {/* Graceful Forest Green Botanical Branches (Tapered & Layered) */}
              <path
                d="M -30 -20 C 80 35, 180 28, 290 85 C 370 125, 450 140, 540 175"
                stroke="#2d4f3b"
                strokeWidth="12"
                strokeLinecap="round"
                opacity="0.82"
              />
              <path
                d="M 540 175 C 565 185, 585 195, 600 205"
                stroke="#375d46"
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0.75"
              />
              <path
                d="M 125 35 C 180 85, 225 145, 300 215 C 355 265, 400 295, 465 335"
                stroke="#375d46"
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.75"
              />
              <path
                d="M 465 335 C 468 337, 470 339, 472 340"
                stroke="#375d46"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.7"
              />
              <path
                d="M 270 80 C 350 62, 420 72, 495 55 C 530 46, 555 48, 580 45"
                stroke="#375d46"
                strokeWidth="5.5"
                strokeLinecap="round"
                opacity="0.7"
              />
              <path
                d="M 210 125 C 250 165, 285 195, 335 245"
                stroke="#446e53"
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

              {/* 3. Lower Cascading Foliage Cluster (Enveloping terminal tip at 472, 340) */}
              <circle cx="325" cy="220" r="46" fill="#a7f3d0" opacity="0.45" filter="blur(16px)" />
              <circle cx="305" cy="200" r="32" fill="#dcfce9" opacity="0.9" />
              <circle cx="350" cy="235" r="28" fill="#34d399" opacity="0.85" />
              <circle cx="365" cy="195" r="24" fill="#ffffff" opacity="0.92" />
              <circle cx="430" cy="300" r="28" fill="#6ee7b7" opacity="0.88" />
              <circle cx="455" cy="320" r="24" fill="#10b981" opacity="0.82" />
              {/* Terminal Mint Leaf Cap at (472, 340) */}
              <circle cx="472" cy="340" r="26" fill="#dcfce9" opacity="0.95" />
              <circle cx="472" cy="340" r="18" fill="#34d399" opacity="0.9" />
              <circle cx="472" cy="340" r="8" fill="#ffffff" opacity="0.95" />
              <circle cx="495" cy="355" r="16" fill="#86efac" opacity="0.88" />

              {/* 4. Upper Outstretching Mint Sprigs (Enveloping terminal tip at 580, 45) */}
              <circle cx="450" cy="70" r="42" fill="#a7f3d0" opacity="0.45" filter="blur(14px)" />
              <circle cx="435" cy="62" r="28" fill="#dcfce9" opacity="0.92" />
              <circle cx="475" cy="82" r="24" fill="#34d399" opacity="0.85" />
              <circle cx="515" cy="55" r="22" fill="#86efac" opacity="0.88" />
              <circle cx="545" cy="50" r="20" fill="#ffffff" opacity="0.95" />
              {/* Terminal Mint Leaf Cap at (580, 45) */}
              <circle cx="580" cy="45" r="24" fill="#dcfce9" opacity="0.95" />
              <circle cx="580" cy="45" r="16" fill="#34d399" opacity="0.88" />
              <circle cx="580" cy="45" r="7" fill="#ffffff" opacity="0.95" />
              <circle cx="600" cy="42" r="14" fill="#6ee7b7" opacity="0.85" />

              {/* 5. Lateral Outreaching Tips (Enveloping terminal tip at 600, 205) */}
              <circle cx="520" cy="175" r="44" fill="#a7f3d0" opacity="0.45" filter="blur(14px)" />
              <circle cx="505" cy="165" r="28" fill="#dcfce9" opacity="0.92" />
              <circle cx="540" cy="190" r="24" fill="#34d399" opacity="0.85" />
              <circle cx="570" cy="200" r="26" fill="#86efac" opacity="0.9" />
              {/* Terminal Mint Leaf Cap at (600, 205) */}
              <circle cx="600" cy="205" r="28" fill="#a7f3d0" opacity="0.5" filter="blur(8px)" />
              <circle cx="600" cy="205" r="26" fill="#dcfce9" opacity="0.95" />
              <circle cx="600" cy="205" r="18" fill="#34d399" opacity="0.88" />
              <circle cx="600" cy="205" r="8" fill="#ffffff" opacity="0.95" />
              <circle cx="625" cy="212" r="16" fill="#86efac" opacity="0.9" />
              <circle cx="638" cy="220" r="11" fill="#ffffff" opacity="0.95" />
            </svg>
          </div>

          {/* Top-Right Counter-Balancing Mint Canopy: Fully tapered, zero clipping */}
          <div className="mint-tree-canopy-top-right">
            <svg
              viewBox="-30 -30 480 360"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="canopy-svg"
            >
              <path
                d="M 430 -10 C 330 35, 255 50, 160 85 C 110 105, 70 125, 35 150"
                stroke="#2d4f3b"
                strokeWidth="8.5"
                strokeLinecap="round"
                opacity="0.75"
              />
              <path
                d="M 35 150 C 25 156, 18 162, 15 168"
                stroke="#375d46"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.65"
              />
              <path
                d="M 270 45 C 200 95, 160 135, 95 185 C 65 210, 42 230, 25 248"
                stroke="#375d46"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.7"
              />

              {/* Foliage clusters right corner */}
              <circle cx="330" cy="35" r="40" fill="#a7f3d0" opacity="0.45" filter="blur(14px)" />
              <circle cx="310" cy="40" r="28" fill="#dcfce9" opacity="0.92" />
              <circle cx="350" cy="55" r="22" fill="#34d399" opacity="0.85" />
              <circle cx="230" cy="70" r="32" fill="#86efac" opacity="0.9" />
              <circle cx="190" cy="80" r="24" fill="#ffffff" opacity="0.92" />
              <circle cx="150" cy="95" r="22" fill="#6ee7b7" opacity="0.88" />
              <circle cx="105" cy="155" r="28" fill="#dcfce9" opacity="0.92" />
              <circle cx="75" cy="175" r="22" fill="#34d399" opacity="0.85" />

              {/* Terminal Mint Cap at (15, 168) */}
              <circle cx="15" cy="168" r="24" fill="#dcfce9" opacity="0.95" />
              <circle cx="15" cy="168" r="16" fill="#34d399" opacity="0.88" />
              <circle cx="15" cy="168" r="7" fill="#ffffff" opacity="0.95" />
              <circle cx="-2" cy="175" r="13" fill="#86efac" opacity="0.88" />

              {/* Terminal Mint Cap at (25, 248) */}
              <circle cx="25" cy="248" r="22" fill="#dcfce9" opacity="0.95" />
              <circle cx="25" cy="248" r="14" fill="#34d399" opacity="0.9" />
              <circle cx="25" cy="248" r="6" fill="#ffffff" opacity="0.95" />
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
