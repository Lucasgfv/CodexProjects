import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutCompany | Gestão Contábil",
  description: "Gestão interna de empresas clientes",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
