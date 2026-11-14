import React, { useMemo } from 'react';

interface PetalConfig {
  id: number;
  left: number;
  delay: number;
  duration: number;
  scale: number;
  swayDuration: number;
  initialRotation: number;
  opacity: number;
  isSoftMint?: boolean;
}

export const SakuraBackground: React.FC = () => {
  const petals: PetalConfig[] = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      id: i,
      left: (i * 4.1 + (i % 5) * 3) % 100,
      delay: -(i * 1.2) % 16,
      duration: 11 + (i % 6) * 2.5,
      scale: 0.7 + (i % 5) * 0.14,
      swayDuration: 2.8 + (i % 4) * 1.1,
      initialRotation: (i * 53) % 360,
      opacity: 0.5 + (i % 4) * 0.15,
      isSoftMint: i % 6 === 0,
    }));
  }, []);

  return (
    <div className="stage-ambiance" aria-hidden="true">
      {/* Sky Atmosphere Mesh Gradients */}
      <div className="sky-atmosphere" />

      {/* Decorative Blooming Sakura Tree Canopy (Top-Left) directly from User References */}
      <div className="sakura-tree-canopy-top-left">
        <svg
          viewBox="0 0 420 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="canopy-svg"
        >
          {/* Main graceful branches */}
          <path
            d="M -20 -10 C 60 40, 140 30, 220 85 C 270 120, 310 110, 380 150"
            stroke="#8c6a58"
            strokeWidth="9"
            strokeLinecap="round"
            opacity="0.65"
          />
          <path
            d="M 120 40 C 170 80, 200 130, 250 180"
            stroke="#8c6a58"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.6"
          />
          <path
            d="M 210 82 C 260 60, 300 70, 340 50"
            stroke="#8c6a58"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.55"
          />

          {/* Soft Glowing Blossom Clusters */}
          {/* Cluster 1 - Base */}
          <circle cx="50" cy="35" r="28" fill="#fda4bc" opacity="0.4" filter="blur(10px)" />
          <circle cx="80" cy="55" r="22" fill="#ffd6e3" opacity="0.8" />
          <circle cx="65" cy="40" r="16" fill="#f472b6" opacity="0.75" />
          <circle cx="45" cy="60" r="18" fill="#ffffff" opacity="0.85" />

          {/* Cluster 2 - Mid branch */}
          <circle cx="170" cy="75" r="34" fill="#fda4bc" opacity="0.45" filter="blur(12px)" />
          <circle cx="160" cy="70" r="24" fill="#ffd6e3" opacity="0.85" />
          <circle cx="185" cy="85" r="20" fill="#f472b6" opacity="0.75" />
          <circle cx="145" cy="80" r="18" fill="#ffffff" opacity="0.9" />
          <circle cx="195" cy="65" r="15" fill="#fca5bc" opacity="0.8" />

          {/* Cluster 3 - Lower branch */}
          <circle cx="240" cy="165" r="30" fill="#fda4bc" opacity="0.4" filter="blur(10px)" />
          <circle cx="230" cy="155" r="20" fill="#ffd6e3" opacity="0.85" />
          <circle cx="255" cy="175" r="18" fill="#f472b6" opacity="0.75" />
          <circle cx="265" cy="150" r="14" fill="#ffffff" opacity="0.85" />

          {/* Cluster 4 - Outer tip */}
          <circle cx="340" cy="130" r="32" fill="#fda4bc" opacity="0.45" filter="blur(12px)" />
          <circle cx="330" cy="120" r="22" fill="#ffd6e3" opacity="0.85" />
          <circle cx="360" cy="140" r="18" fill="#f472b6" opacity="0.7" />
          <circle cx="375" cy="150" r="12" fill="#ffffff" opacity="0.9" />
          <circle cx="320" cy="60" r="18" fill="#ffd6e3" opacity="0.8" />
          <circle cx="345" cy="50" r="14" fill="#fca5bc" opacity="0.75" />
        </svg>
      </div>

      {/* Stage Dual Spotlights Beaming Down */}
      <div className="stage-spotlight-left" />
      <div className="stage-spotlight-right" />

      {/* Dreamy Floating Glowing Orbs */}
      <div className="glow-orb orb-lilac" />
      <div className="glow-orb orb-pink" />
      <div className="glow-orb orb-mint" />

      {/* Twinkling Stage Stars */}
      <div className="stage-stars">
        <span className="star-twinkle star-1" />
        <span className="star-twinkle star-2" />
        <span className="star-twinkle star-3" />
        <span className="star-twinkle star-4" />
        <span className="star-twinkle star-5" />
      </div>

      {/* Falling Vector Petals */}
      <div className="sakura-container">
        {petals.map((p) => (
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
              className={`sakura-petal-leaf ${
                p.isSoftMint ? 'petal-mint' : 'petal-pink'
              }`}
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
                  fill={
                    p.isSoftMint
                      ? 'url(#petalMintGradClean)'
                      : 'url(#petalPinkGradClean)'
                  }
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
                  <linearGradient
                    id="petalMintGradClean"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#dcfce9" stopOpacity="0.95" />
                    <stop offset="60%" stopColor="#a7f3d0" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0.75" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
