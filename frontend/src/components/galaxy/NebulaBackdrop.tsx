'use client';

const STARS = [
  [4, 8, 2.2], [12, 24, 1.4], [18, 16, 1.8], [26, 10, 1.3], [34, 20, 2], [42, 8, 1.2], [52, 18, 1.7],
  [64, 12, 1.4], [74, 8, 2.4], [86, 18, 1.6], [92, 10, 1.3], [8, 40, 1.5], [16, 32, 2.1], [28, 38, 1.2],
  [36, 30, 1.7], [46, 42, 2.5], [58, 34, 1.5], [68, 40, 1.8], [78, 28, 1.1], [88, 36, 2], [10, 62, 1.6],
  [20, 70, 2.3], [32, 58, 1.4], [40, 74, 1.7], [50, 64, 2.1], [60, 72, 1.2], [70, 60, 1.9], [82, 70, 1.5],
  [90, 58, 2.2], [6, 86, 1.3], [18, 90, 1.7], [30, 84, 2.4], [44, 90, 1.4], [56, 86, 1.9], [68, 92, 1.3],
  [80, 84, 2.2], [92, 90, 1.6],
];

export function NebulaBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 18% 18%, rgba(100,112,255,0.16), transparent 24%),
            radial-gradient(circle at 74% 14%, rgba(83,198,175,0.10), transparent 22%),
            radial-gradient(circle at 26% 74%, rgba(241,198,109,0.10), transparent 22%),
            radial-gradient(circle at 80% 72%, rgba(240,108,140,0.08), transparent 20%),
            linear-gradient(180deg, rgba(4,7,16,0.92), rgba(3,6,14,0.98))
          `,
        }}
      />

      <div
        className="absolute left-[6%] top-[8%] h-[320px] w-[420px] rounded-full nebula-cloud"
        style={{ background: 'rgba(104, 117, 255, 0.18)' }}
      />
      <div
        className="absolute left-[56%] top-[10%] h-[280px] w-[380px] rounded-full nebula-cloud"
        style={{ background: 'rgba(82, 199, 176, 0.14)' }}
      />
      <div
        className="absolute left-[18%] top-[58%] h-[340px] w-[460px] rounded-full nebula-cloud"
        style={{ background: 'rgba(241, 198, 109, 0.12)' }}
      />
      <div
        className="absolute left-[62%] top-[60%] h-[320px] w-[420px] rounded-full nebula-cloud"
        style={{ background: 'rgba(240, 108, 140, 0.09)' }}
      />

      <div className="absolute inset-0">
        {STARS.map(([left, top, size], index) => (
          <span
            key={`${left}-${top}-${index}`}
            className="nebula-star absolute rounded-full"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              opacity: 0.35 + (index % 4) * 0.14,
            }}
          />
        ))}
      </div>

      <div
        className="absolute inset-0 opacity-75"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, transparent 46%, rgba(3,5,11,0.72) 100%)',
        }}
      />
    </div>
  );
}
