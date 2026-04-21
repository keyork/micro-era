'use client';

const STARS = [
  [4, 8, 2.2], [12, 24, 1.4], [18, 16, 1.8], [26, 10, 1.3], [34, 20, 2], [42, 8, 1.2], [52, 18, 1.7],
  [64, 12, 1.4], [74, 8, 2.4], [86, 18, 1.6], [92, 10, 1.3], [8, 40, 1.5], [16, 32, 2.1], [28, 38, 1.2],
  [36, 30, 1.7], [46, 42, 2.5], [58, 34, 1.5], [68, 40, 1.8], [78, 28, 1.1], [88, 36, 2], [10, 62, 1.6],
  [20, 70, 2.3], [32, 58, 1.4], [40, 74, 1.7], [50, 64, 2.1], [60, 72, 1.2], [70, 60, 1.9], [82, 70, 1.5],
  [90, 58, 2.2], [6, 86, 1.3], [18, 90, 1.7], [30, 84, 2.4], [44, 90, 1.4], [56, 86, 1.9], [68, 92, 1.3],
  [80, 84, 2.2], [92, 90, 1.6],
  [2, 4, 1.1], [7, 50, 1.8], [14, 68, 2.0], [22, 44, 1.3], [30, 14, 1.6], [38, 56, 2.2],
  [48, 26, 1.5], [54, 80, 1.9], [62, 48, 1.2], [72, 34, 2.1], [76, 76, 1.4], [84, 52, 1.7],
  [96, 14, 1.5], [3, 72, 2.0], [11, 94, 1.3], [24, 82, 1.8], [33, 6, 1.6], [41, 48, 2.3],
  [49, 92, 1.1], [57, 12, 1.9], [65, 78, 1.4], [73, 42, 2.0], [81, 22, 1.7], [89, 66, 1.5],
  [95, 40, 1.8], [1, 30, 1.2], [9, 16, 2.1], [17, 54, 1.4], [25, 96, 1.7], [35, 68, 1.3],
  [43, 4, 1.9], [51, 38, 2.2], [59, 88, 1.1], [67, 20, 1.6], [75, 54, 2.0], [83, 96, 1.5],
  [91, 32, 1.8], [97, 74, 1.3], [5, 58, 2.4], [15, 12, 1.2], [45, 62, 1.7], [55, 46, 1.4],
  [85, 88, 2.0], [94, 50, 1.6], [8, 78, 1.3], [20, 36, 1.9], [37, 82, 1.5], [66, 4, 2.2],
];

const TWINKLE_INDICES = new Set([
  3, 7, 12, 18, 24, 29, 34, 40, 45, 51, 58, 63, 70, 76, 82, 88, 94,
]);

export function NebulaBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 12% 22%, rgba(100,112,255,0.18), transparent 28%),
            radial-gradient(ellipse at 78% 12%, rgba(83,198,175,0.12), transparent 24%),
            radial-gradient(ellipse at 22% 78%, rgba(241,198,109,0.10), transparent 24%),
            radial-gradient(ellipse at 84% 74%, rgba(240,108,140,0.08), transparent 20%),
            radial-gradient(ellipse at 50% 50%, rgba(60,50,120,0.06), transparent 50%),
            linear-gradient(180deg, rgba(4,7,16,0.94), rgba(3,6,14,0.98))
          `,
        }}
      />

      <div
        className="absolute left-[4%] top-[4%] h-[380px] w-[480px] rounded-full nebula-cloud"
        style={{ background: 'rgba(104, 117, 255, 0.20)', animation: 'drift-slow 40s ease-in-out infinite' }}
      />
      <div
        className="absolute left-[52%] top-[6%] h-[320px] w-[440px] rounded-full nebula-cloud"
        style={{ background: 'rgba(82, 199, 176, 0.16)', animation: 'drift-slow 50s ease-in-out 5s infinite' }}
      />
      <div
        className="absolute left-[14%] top-[54%] h-[400px] w-[500px] rounded-full nebula-cloud"
        style={{ background: 'rgba(241, 198, 109, 0.13)', animation: 'drift-slow 45s ease-in-out 10s infinite' }}
      />
      <div
        className="absolute left-[58%] top-[56%] h-[360px] w-[460px] rounded-full nebula-cloud"
        style={{ background: 'rgba(240, 108, 140, 0.10)', animation: 'drift-slow 55s ease-in-out 8s infinite' }}
      />

      <div
        className="absolute left-[30%] top-[20%] h-[200px] w-[260px] rounded-full nebula-cloud"
        style={{ background: 'rgba(80, 70, 180, 0.12)', animation: 'drift-slow 60s ease-in-out 3s infinite' }}
      />
      <div
        className="absolute left-[65%] top-[35%] h-[180px] w-[240px] rounded-full nebula-cloud"
        style={{ background: 'rgba(83, 198, 175, 0.08)', animation: 'drift-slow 48s ease-in-out 12s infinite' }}
      />

      <div
        className="absolute left-[8%] top-[35%] h-[100px] w-[140px] rounded-full nebula-cloud"
        style={{ background: 'rgba(160, 140, 255, 0.10)', animation: 'drift-slow 35s ease-in-out 2s infinite' }}
      />
      <div
        className="absolute left-[72%] top-[82%] h-[120px] w-[160px] rounded-full nebula-cloud"
        style={{ background: 'rgba(241, 198, 109, 0.07)', animation: 'drift-slow 42s ease-in-out 7s infinite' }}
      />

      <div className="absolute inset-0">
        {STARS.map(([left, top, size], index) => {
          const shouldTwinkle = TWINKLE_INDICES.has(index);
          return (
            <span
              key={`${left}-${top}-${index}`}
              className={`nebula-star absolute rounded-full${shouldTwinkle ? ' nebula-star--twinkle' : ''}`}
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: size,
                height: size,
                opacity: 0.25 + (index % 5) * 0.12,
                '--twinkle-dur': `${2.5 + (index % 4) * 1.2}s`,
                '--twinkle-delay': `${(index % 7) * 0.8}s`,
              } as React.CSSProperties}
            />
          );
        })}
      </div>

      <div
        className="absolute inset-0 opacity-70"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, transparent 44%, rgba(3,5,11,0.78) 100%)',
        }}
      />
    </div>
  );
}
