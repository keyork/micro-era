import { GalaxyCanvas } from '@/components/galaxy/GalaxyCanvas';

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default async function EvolvePage({ params }: Props) {
  const { sessionId } = await params;
  return <GalaxyCanvas sessionId={sessionId} />;
}
