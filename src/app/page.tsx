import Link from 'next/link';

export default function Home() {
  return (
    <main className="p-8">
      <h1>Mi Jarvis</h1>
      <Link href="/agent" className="underline">Abrir agente de voz</Link>
    </main>
  );
}
