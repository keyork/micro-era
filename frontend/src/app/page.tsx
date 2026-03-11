import { SeedInput } from '@/components/panels/SeedInput';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="text-center mb-12">
        <h1
          className="text-5xl font-bold mb-4 tracking-tight"
          style={{
            background: 'linear-gradient(135deg, var(--text-primary), var(--color-primary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          微纪元
        </h1>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
          Stop brainstorming. Start evolving.
        </p>
      </div>
      <SeedInput />
    </main>
  );
}
