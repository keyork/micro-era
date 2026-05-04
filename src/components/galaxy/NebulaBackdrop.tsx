'use client';

/* Far stars: [left%, top%, size-px, base-opacity] */
const FAR_STARS: [number, number, number, number][] = [
  [2, 3, 0.8, 0.10], [5, 11, 0.6, 0.09], [9, 7, 1.0, 0.13], [14, 2, 0.7, 0.11],
  [18, 15, 0.8, 0.12], [23, 8, 0.9, 0.10], [28, 3, 0.6, 0.09], [33, 19, 1.0, 0.13],
  [37, 11, 0.7, 0.11], [41, 5, 0.8, 0.12], [46, 22, 0.9, 0.10], [50, 9, 0.6, 0.09],
  [55, 16, 1.0, 0.13], [59, 4, 0.7, 0.11], [63, 24, 0.8, 0.12], [68, 12, 0.9, 0.10],
  [72, 7, 0.6, 0.09], [77, 20, 1.0, 0.13], [81, 3, 0.7, 0.11], [85, 17, 0.8, 0.12],
  [90, 10, 0.9, 0.10], [94, 6, 0.6, 0.09], [97, 22, 0.7, 0.11], [3, 30, 0.8, 0.12],
  [7, 40, 0.9, 0.10], [11, 35, 0.6, 0.09], [16, 45, 1.0, 0.13], [21, 32, 0.7, 0.11],
  [26, 48, 0.8, 0.12], [31, 38, 0.9, 0.10], [36, 52, 0.6, 0.09], [40, 44, 1.0, 0.13],
  [44, 36, 0.7, 0.11], [49, 50, 0.8, 0.12], [53, 29, 0.9, 0.10], [58, 43, 0.6, 0.09],
  [62, 55, 0.7, 0.11], [67, 34, 0.8, 0.12], [71, 48, 0.9, 0.10], [75, 28, 0.6, 0.09],
  [80, 42, 0.8, 0.12], [84, 56, 0.7, 0.11], [88, 37, 0.9, 0.10], [92, 50, 0.6, 0.09],
  [96, 32, 0.8, 0.12], [4, 62, 0.9, 0.10], [8, 75, 0.6, 0.09], [13, 68, 1.0, 0.13],
  [17, 82, 0.7, 0.11], [22, 72, 0.8, 0.12], [27, 85, 0.9, 0.10], [32, 66, 0.6, 0.09],
  [37, 78, 0.7, 0.11], [42, 91, 0.8, 0.12], [47, 63, 0.9, 0.10], [52, 87, 0.6, 0.09],
  [57, 74, 0.7, 0.11], [61, 94, 0.8, 0.12], [66, 81, 0.9, 0.10], [70, 68, 0.6, 0.09],
  [74, 91, 0.7, 0.11], [79, 77, 0.8, 0.12], [83, 88, 0.9, 0.10], [87, 64, 0.6, 0.09],
  [91, 80, 0.7, 0.11], [95, 72, 0.8, 0.12], [98, 88, 0.6, 0.09], [1, 55, 0.9, 0.10],
];

/* Mid stars: [left%, top%, size-px, opacity, twinkle-duration] */
const MID_STARS: [number, number, number, number, number][] = [
  [4, 8, 1.6, 0.28, 2.8], [12, 24, 1.4, 0.22, 3.4], [18, 16, 1.8, 0.30, 2.2],
  [26, 10, 1.3, 0.20, 4.1], [34, 20, 2.0, 0.32, 2.8], [42, 8, 1.2, 0.18, 3.8],
  [52, 18, 1.7, 0.28, 2.4], [64, 12, 1.4, 0.22, 3.2], [74, 8, 2.4, 0.36, 1.8],
  [86, 18, 1.6, 0.26, 3.0], [92, 10, 1.3, 0.20, 4.4], [8, 40, 1.5, 0.24, 2.6],
  [16, 32, 2.1, 0.32, 1.9], [28, 38, 1.2, 0.18, 4.8], [36, 30, 1.7, 0.28, 2.4],
  [46, 42, 2.5, 0.38, 1.6], [58, 34, 1.5, 0.24, 3.4], [68, 40, 1.8, 0.30, 2.2],
  [78, 28, 1.1, 0.16, 5.2], [88, 36, 2.0, 0.32, 2.0], [10, 62, 1.6, 0.26, 2.8],
  [20, 70, 2.3, 0.36, 1.8], [32, 58, 1.4, 0.22, 3.6], [40, 74, 1.7, 0.28, 2.4],
  [50, 64, 2.1, 0.34, 1.9], [60, 72, 1.2, 0.18, 4.6], [70, 60, 1.9, 0.30, 2.2],
  [82, 70, 1.5, 0.24, 3.2], [90, 58, 2.2, 0.34, 1.9], [6, 86, 1.3, 0.20, 4.2],
  [18, 90, 1.7, 0.28, 2.4], [30, 84, 2.4, 0.38, 1.6], [44, 90, 1.4, 0.22, 3.8],
  [56, 86, 1.9, 0.30, 2.2], [68, 92, 1.3, 0.20, 4.6], [80, 84, 2.2, 0.34, 2.0],
  [92, 90, 1.6, 0.26, 3.0], [2, 4, 1.1, 0.18, 5.0], [7, 50, 1.8, 0.28, 2.6],
  [14, 68, 2.0, 0.32, 2.0], [22, 44, 1.3, 0.20, 4.0], [30, 14, 1.6, 0.26, 3.0],
  [38, 56, 2.2, 0.34, 2.0], [48, 26, 1.5, 0.24, 3.4], [54, 80, 1.9, 0.30, 2.2],
];

/* Bright/colored stars: [left%, top%, size-px, glow-color, twinkle-dur] */
const BRIGHT_STARS: [number, number, number, string, number][] = [
  [8,  6,  4.0, 'rgba(140, 148, 255, 0.65)', 3.8],
  [72, 8,  3.5, 'rgba(93, 216, 190, 0.55)',  4.4],
  [88, 38, 4.5, 'rgba(245, 204, 114, 0.60)', 3.0],
  [6,  64, 3.0, 'rgba(240, 108, 140, 0.55)', 5.2],
  [45, 90, 4.0, 'rgba(140, 148, 255, 0.60)', 3.6],
  [56, 22, 3.2, 'rgba(93, 216, 190, 0.50)',  4.8],
  [23, 52, 3.8, 'rgba(245, 204, 114, 0.55)', 3.2],
  [93, 72, 3.0, 'rgba(140, 148, 255, 0.50)', 4.2],
];

export function NebulaBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">

      {/* ── Deep space base ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 12% 18%, rgba(80, 60, 170, 0.26), transparent 30%),
            radial-gradient(ellipse at 22% 8%,  rgba(100, 110, 255, 0.18), transparent 26%),
            radial-gradient(ellipse at 72% 10%, rgba(70, 190, 165, 0.16), transparent 24%),
            radial-gradient(ellipse at 90% 25%, rgba(50, 70, 160, 0.20), transparent 28%),
            radial-gradient(ellipse at 50% 50%, rgba(30, 28, 88, 0.14),  transparent 48%),
            radial-gradient(ellipse at 15% 72%, rgba(230, 185, 95, 0.10), transparent 24%),
            radial-gradient(ellipse at 76% 68%, rgba(230, 95, 120, 0.09), transparent 20%),
            radial-gradient(ellipse at 45% 88%, rgba(80, 60, 170, 0.12), transparent 28%),
            linear-gradient(180deg, rgba(3,4,12,0.98), rgba(2,3,10,1))
          `,
        }}
      />

      {/* ── Milky Way diagonal band ── */}
      <div
        className="absolute"
        style={{
          inset: '-20%',
          background: `
            linear-gradient(
              -22deg,
              transparent 0%,
              rgba(190, 205, 255, 0.022) 22%,
              rgba(210, 220, 255, 0.048) 38%,
              rgba(230, 235, 255, 0.055) 50%,
              rgba(210, 220, 255, 0.038) 62%,
              rgba(190, 205, 255, 0.018) 74%,
              transparent 90%
            )
          `,
          filter: 'blur(3px)',
        }}
      />

      {/* ── Large nebula clouds ── */}
      <div className="absolute left-[-4%] top-[-6%] h-[750px] w-[860px] rounded-full nebula-cloud"
        style={{ background: 'rgba(78, 58, 192, 0.12)' }} />
      <div className="absolute left-[38%] top-[-8%] h-[700px] w-[800px] rounded-full nebula-cloud"
        style={{ background: 'rgba(70, 185, 162, 0.09)' }} />
      <div className="absolute left-[8%] top-[38%] h-[720px] w-[820px] rounded-full nebula-cloud"
        style={{ background: 'rgba(100, 108, 255, 0.09)' }} />
      <div className="absolute left-[52%] top-[32%] h-[640px] w-[740px] rounded-full nebula-cloud"
        style={{ background: 'rgba(228, 95, 120, 0.06)' }} />

      {/* ── Closer/brighter nebula accents ── */}
      <div className="absolute left-[2%] top-[2%] h-[400px] w-[520px] rounded-full nebula-cloud"
        style={{ background: 'rgba(108, 120, 255, 0.14)' }} />
      <div className="absolute left-[54%] top-[4%] h-[340px] w-[460px] rounded-full nebula-cloud"
        style={{ background: 'rgba(80, 206, 182, 0.12)' }} />
      <div className="absolute left-[12%] top-[56%] h-[420px] w-[520px] rounded-full nebula-cloud"
        style={{ background: 'rgba(240, 192, 100, 0.08)' }} />

      {/* ── Far star layer ── */}
      <div className="absolute inset-0">
        {FAR_STARS.map(([left, top, size, opacity], i) => (
          <span
            key={`far-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              background: 'rgba(220, 230, 255, 0.85)',
              opacity,
            }}
          />
        ))}
      </div>

      {/* ── Mid star layer (some twinkle) ── */}
      <div className="absolute inset-0">
        {MID_STARS.map(([left, top, size, opacity, dur], i) => {
          return (
            <span
              key={`mid-${i}`}
              className="absolute rounded-full"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: size,
                height: size,
                background: 'rgba(235, 240, 255, 0.9)',
                boxShadow: `0 0 ${size * 4}px rgba(220, 230, 255, 0.18)`,
                opacity,
                '--twinkle-dur': `${dur}s`,
                '--twinkle-delay': `${(i * 0.7) % 3.5}s`,
                '--t-base': String(opacity * 0.6),
                '--t-peak': String(Math.min(opacity * 1.8, 0.9)),
              } as React.CSSProperties}
            />
          );
        })}
      </div>

      {/* ── Bright colored stars ── */}
      <div className="absolute inset-0">
        {BRIGHT_STARS.map(([left, top, size, glow, dur], i) => (
          <span
            key={`bright-${i}`}
            className="star-bright absolute rounded-full"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              '--star-glow': glow,
              '--twinkle-dur': `${dur}s`,
              '--twinkle-delay': `${i * 1.1}s`,
              '--t-base': '0.7',
              '--t-peak': '1',
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* ── Edge vignette (helmet visor rim) ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at center, transparent 0%, transparent 42%, rgba(1,2,8,0.55) 82%, rgba(1,2,8,0.90) 100%),
            linear-gradient(to bottom, rgba(1,2,8,0.62) 0%, transparent 14%, transparent 78%, rgba(1,2,8,0.72) 100%)
          `,
        }}
      />
    </div>
  );
}
