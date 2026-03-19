import { MutationType } from '@/types/idea';

const LABELS: Record<MutationType, string> = {
  seed: '种子',
  tweak: '微调',
  crossover: '跨界',
  inversion: '反转',
  random: '随机突变',
  hybrid: '杂交',
};

const COLORS: Record<MutationType, string> = {
  seed: '#f0c86c',
  tweak: '#7c6cf0',
  crossover: '#6c9ff0',
  inversion: '#f06c8c',
  random: '#f06c8c',
  hybrid: '#6cf0c8',
};

interface Props { type: MutationType }

export function MutationBadge({ type }: Props) {
  const color = COLORS[type] ?? '#7c6cf0';
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {LABELS[type] ?? type}
    </span>
  );
}
