export default function Loading() {
  return <main className="route-state" aria-live="polite" aria-busy="true">
    <span className="route-spinner" aria-hidden="true" />
    <p>Carregando informações...</p>
  </main>;
}
