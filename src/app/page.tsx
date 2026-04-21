import { SeedInput } from '@/components/panels/SeedInput';
import { SettingsPanel } from '@/components/panels/SettingsPanel';

export default function HomePage() {
  return (
    <main className="cosmic-grain relative min-h-screen overflow-hidden px-4 py-12 sm:px-6 lg:px-10">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 15% 20%, rgba(241, 157, 109, 0.10), transparent 30%),
            radial-gradient(ellipse at 85% 15%, rgba(94, 201, 184, 0.12), transparent 28%),
            radial-gradient(ellipse at 55% 75%, rgba(119, 125, 247, 0.10), transparent 32%),
            radial-gradient(ellipse at 40% 45%, rgba(80, 70, 180, 0.06), transparent 50%)
          `,
        }}
      />

      <div className="relative mx-auto grid min-h-[calc(100vh-6rem)] max-w-7xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-10" style={{ animation: 'fade-in-up 0.8s ease-out' }}>
          <div className="space-y-6">
            <p
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em]"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'var(--color-gold)',
              }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: 'var(--color-gold)', animation: 'glow-pulse 2.5s ease-in-out infinite' }}
              />
              Idea Evolution Studio
            </p>

            <div className="space-y-5">
              <h1
                className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl"
                style={{ color: 'var(--text-primary)' }}
              >
                不是把想法写下来，
                <br />
                而是把它
                <span style={{ color: 'var(--color-primary)' }}> 演化出来</span>
              </h1>
              <p className="max-w-2xl text-base leading-7 sm:text-lg" style={{ color: 'var(--text-secondary)' }}>
                把一个模糊的内容念头扔进系统，实时看它分叉、淘汰、融合，直到收敛成一个能直接写稿或开拍的 Brief。
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {[
              ['01', '写下主题种子', '先描述你脑子里那个还没成型的方向。'],
              ['02', '选择内容形态', '视频、文章、播客或 Newsletter 会影响分支策略。'],
              ['03', '进入可视化画板', '等待过程会被完整展示，不再只有一个空白加载。'],
            ].map(([index, title, description], i) => (
              <div
                key={index}
                className="cosmic-lift rounded-3xl p-6"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
                  animation: `fade-in-up 0.6s ease-out ${0.1 + i * 0.08}s both`,
                }}
              >
                <p className="mb-4 text-xs font-semibold tracking-[0.24em]" style={{ color: 'var(--color-gold)' }}>
                  {index}
                </p>
                <h2 className="mb-2 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {title}
                </h2>
                <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          className="cosmic-float glass-panel rounded-[32px] p-5 sm:p-8"
          style={{
            animationDelay: '0.3s',
          }}
        >
          <SeedInput />
          <div className="mt-4">
            <SettingsPanel />
          </div>
        </section>
      </div>
    </main>
  );
}
