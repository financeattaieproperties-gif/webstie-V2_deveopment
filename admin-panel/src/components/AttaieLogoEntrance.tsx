import React, { useEffect, useState } from 'react';

export interface AttaieLogoEntranceProps {
  mode?: 'header' | 'login-transition';
  onComplete?: () => void;
  className?: string;
  variant?: 'teal' | 'navy';
}

export function AttaieLogoEntrance({
  mode = 'header',
  onComplete,
  className = '',
  variant = 'teal',
}: AttaieLogoEntranceProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    try {
      const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
      if (mq?.matches) {
        setReducedMotion(true);
      }
    } catch {
      // Fallback safely if matchMedia is unavailable
    }
  }, []);

  useEffect(() => {
    if (!onComplete) return;
    const duration = reducedMotion ? 120 : 1620;
    const timer = window.setTimeout(() => {
      onComplete();
    }, duration);
    return () => window.clearTimeout(timer);
  }, [onComplete, reducedMotion]);

  const primaryStroke = variant === 'teal' ? '#0B3D3B' : '#1A2335';
  const accentStroke = variant === 'teal' ? '#14B8A6' : '#B8944A';
  const secondaryFill = variant === 'teal' ? '#99F6E4' : '#E5D3A7';

  if (failed) {
    return (
      <div className={`attaie-logo-fallback ${className}`} data-testid="attaie-logo-fallback">
        <img
          src="/logo.png"
          alt="Attaie Properties"
          style={{ maxHeight: 72, width: 'auto', display: 'block', margin: '0 auto' }}
        />
      </div>
    );
  }

  return (
    <div
      className={`attaie-logo-entrance ${mode === 'login-transition' ? 'attaie-logo-transition-overlay' : ''} ${className}`}
      data-testid="attaie-logo-entrance"
      data-mode={mode}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      role="img"
      aria-label="Attaie Properties Architectural Emblem"
    >
      <style>{`
        @keyframes attaieDrawPath {
          0% { stroke-dashoffset: 1800; opacity: 0.2; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes attaieRevealUp {
          0% { opacity: 0; transform: translateY(14px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .attaie-layer-draw {
          stroke-dasharray: 1800;
          stroke-dashoffset: ${reducedMotion ? 0 : 1800};
          animation: ${reducedMotion ? 'none' : 'attaieDrawPath 0.68s cubic-bezier(0.22, 1, 0.36, 1) forwards'};
        }
        .attaie-layer-reveal {
          opacity: ${reducedMotion ? 1 : 0};
          transform-origin: center;
          animation: ${reducedMotion ? 'none' : 'attaieRevealUp 0.48s cubic-bezier(0.22, 1, 0.36, 1) forwards'};
        }
      `}</style>
      <svg
        viewBox="0 0 1870 841"
        width="100%"
        height="100%"
        style={{ maxWidth: mode === 'login-transition' ? 540 : 320, height: 'auto', display: 'block', margin: '0 auto' }}
        onError={() => setFailed(true)}
      >
        <defs>
          <linearGradient id="attaieAdminGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryStroke} />
            <stop offset="100%" stopColor={accentStroke} />
          </linearGradient>
        </defs>

        {/* Layer 1: Architectural Horizon Swoosh */}
        <g data-layer="1-swoosh">
          <path
            className="attaie-layer-draw"
            style={{ animationDelay: '0ms' }}
            d="M 160 610 C 460 725, 1180 735, 1710 565"
            fill="none"
            stroke="url(#attaieAdminGrad)"
            strokeWidth="20"
            strokeLinecap="round"
          />
          <path
            className="attaie-layer-draw"
            style={{ animationDelay: '60ms' }}
            d="M 250 650 C 590 740, 1210 735, 1630 615"
            fill="none"
            stroke={accentStroke}
            strokeWidth="8"
            strokeLinecap="round"
          />
        </g>

        {/* Layer 2: Central High-Rise Tower Structural Frame */}
        <g data-layer="2-tower">
          <path
            className="attaie-layer-draw"
            style={{ animationDelay: '140ms' }}
            d="M 390 610 L 390 175 L 535 110 L 535 610 Z"
            fill="none"
            stroke={primaryStroke}
            strokeWidth="16"
            strokeLinejoin="round"
          />
        </g>

        {/* Layer 3: Flanking East & West Architectural Wings */}
        <g data-layer="3-wings">
          <path
            className="attaie-layer-draw"
            style={{ animationDelay: '260ms' }}
            d="M 275 605 L 275 290 L 390 235 M 535 235 L 650 290 L 650 605"
            fill="none"
            stroke={accentStroke}
            strokeWidth="13"
            strokeLinejoin="round"
          />
        </g>

        {/* Layer 4: Crown Spire & Pitched Architectural Roof */}
        <g
          data-layer="4-roof"
          className="attaie-layer-reveal"
          style={{ animationDelay: '400ms' }}
        >
          <polygon
            points="462,48 552,115 372,115"
            fill={accentStroke}
          />
          <line
            x1="462"
            y1="18"
            x2="462"
            y2="54"
            stroke={primaryStroke}
            strokeWidth="10"
            strokeLinecap="round"
          />
        </g>

        {/* Layer 5: Upper-Tier Illuminated Window Grid */}
        <g
          data-layer="5-windows-upper"
          className="attaie-layer-reveal"
          style={{ animationDelay: '540ms' }}
          fill={accentStroke}
        >
          <rect x="422" y="185" width="32" height="44" rx="4" />
          <rect x="472" y="185" width="32" height="44" rx="4" />
          <rect x="422" y="248" width="32" height="44" rx="4" />
          <rect x="472" y="248" width="32" height="44" rx="4" />
        </g>

        {/* Layer 6: Mid-Tier Architectural Window Mullions */}
        <g
          data-layer="6-windows-mid"
          className="attaie-layer-reveal"
          style={{ animationDelay: '680ms' }}
          fill={primaryStroke}
        >
          <rect x="422" y="312" width="32" height="44" rx="4" />
          <rect x="472" y="312" width="32" height="44" rx="4" />
          <rect x="312" y="330" width="26" height="170" rx="4" fill={secondaryFill} stroke={primaryStroke} strokeWidth="5" />
          <rect x="586" y="330" width="26" height="170" rx="4" fill={secondaryFill} stroke={primaryStroke} strokeWidth="5" />
        </g>

        {/* Layer 7: Grand Podium Entrance & Colonnade */}
        <g
          data-layer="7-podium"
          className="attaie-layer-reveal"
          style={{ animationDelay: '820ms' }}
        >
          <path
            d="M 426 608 L 426 495 A 36 36 0 0 1 498 495 L 498 608 Z"
            fill={secondaryFill}
            stroke={primaryStroke}
            strokeWidth="10"
          />
        </g>

        {/* Layer 8: ATTAIE Primary Wordmark */}
        <g
          data-layer="8-attaie-name"
          className="attaie-layer-reveal"
          style={{ animationDelay: '980ms' }}
        >
          <text
            x="740"
            y="375"
            fill={primaryStroke}
            fontFamily="DM Sans, system-ui, sans-serif"
            fontSize="162"
            fontWeight="800"
            letterSpacing="12"
          >
            ATTAIE
          </text>
        </g>

        {/* Layer 9: PROPERTIES Sub-Wordmark & Precision Rule */}
        <g
          data-layer="9-properties-text"
          className="attaie-layer-reveal"
          style={{ animationDelay: '1160ms' }}
        >
          <line
            x1="748"
            y1="425"
            x2="1675"
            y2="425"
            stroke={accentStroke}
            strokeWidth="8"
            strokeLinecap="round"
          />
          <text
            x="752"
            y="525"
            fill={accentStroke}
            fontFamily="DM Sans, system-ui, sans-serif"
            fontSize="82"
            fontWeight="700"
            letterSpacing="26"
          >
            PROPERTIES
          </text>
        </g>

        {/* Layer 10: Architectural Twin Keys Crest */}
        <g
          data-layer="10-keys"
          className="attaie-layer-reveal"
          style={{ animationDelay: '1340ms' }}
        >
          <circle
            cx="1595"
            cy="245"
            r="46"
            fill={secondaryFill}
            stroke={primaryStroke}
            strokeWidth="12"
          />
          <circle cx="1595" cy="245" r="16" fill={primaryStroke} />
          <path
            d="M 1641 245 L 1745 245 L 1745 280 M 1712 245 L 1712 274"
            fill="none"
            stroke={primaryStroke}
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  );
}
