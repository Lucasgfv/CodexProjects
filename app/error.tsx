"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="route-state" role="alert">
    <h1>Não foi possível carregar esta página</h1>
    <p>Tente novamente. Se o problema continuar, informe ao administrador.</p>
    <button className="button" type="button" onClick={reset}>Tentar novamente</button>
  </main>;
}
