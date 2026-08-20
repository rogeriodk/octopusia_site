import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "OCTOPUS IA | IA que entende. Soluções que transformam.",
  description: "Inteligência Artificial, automação e engenharia de software aplicadas a desafios reais de negócio."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="header">
          <div className="wrap nav">
            <Link className="brand" href="/"><span>O</span><strong>OCTOPUS IA</strong></Link>
            <nav><Link href="#solucoes">Soluções</Link><Link href="#projetos">Projetos</Link><Link href="#ia">IA ao vivo</Link><Link href="#sobre">Sobre</Link></nav>
            <Link className="btn dark" href="#contato">Falar com especialista</Link>
          </div>
        </header>
        {children}
        <footer className="footer" id="contato">
          <div className="wrap footerGrid"><div><div className="brand footerBrand"><span>O</span><strong>OCTOPUS IA</strong></div><p>Inteligência Artificial que conecta tecnologia, pessoas e resultados.</p></div><div><strong>Ambiente</strong><small>Homologação automatizada</small><small>Health check ativo</small></div><div><strong>Contato</strong><small>Fluxo comercial em implementação</small></div></div>
          <div className="wrap copy">© 2026 OCTOPUS IA.</div>
        </footer>
      </body>
    </html>
  );
}
