'use client';

interface Props {
  eyebrow: string;
  title: string;
  description: string;
}

export function HomeAsyncPanel({ eyebrow, title, description }: Props) {
  return (
    <div className="grid gap-5 xl:grid-cols-[0.88fr_1.12fr]">
      <div className="lg:pt-6">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.28em]"
          style={{ color: 'var(--color-teal)' }}
        >
          {eyebrow}
        </p>
        <h1
          className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h1>
        <p className="mt-4 max-w-md text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>
      </div>

      <div
        className="min-h-[420px] overflow-hidden rounded-[30px] p-5 sm:p-6"
        style={{
          background: 'linear-gradient(180deg, rgba(9,13,24,0.9), rgba(8,11,20,0.72))',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 30px 100px rgba(0,0,0,0.28)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="space-y-4">
          <div
            className="h-5 w-24 rounded-full"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          />
          <div className="h-14 rounded-[20px]" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="h-14 rounded-[20px]" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="h-36 rounded-[24px]" style={{ background: 'rgba(255,255,255,0.03)' }} />
          <div className="h-24 rounded-[24px]" style={{ background: 'rgba(122,162,255,0.08)' }} />
        </div>
      </div>
    </div>
  );
}
