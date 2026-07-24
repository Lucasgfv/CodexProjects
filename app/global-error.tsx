"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="pt-BR"><body><main className="route-state" role="alert">
    <h1>O sistema encontrou um problema</h1>
    <p>Nenhum dado foi alterado por esta tela. Tente carregar novamente.</p>
    <button className="button" type="button" onClick={reset}>Recarregar</button>
  </main></body></html>;
}
