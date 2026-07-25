export class PersistenceUnavailableError extends Error {
  constructor() {
    super(
      "PostgreSQL não conectado. O modo demonstração é somente leitura e não salva alterações.",
    );
    this.name = "PersistenceUnavailableError";
  }
}
