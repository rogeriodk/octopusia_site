import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import "./globals.css";

export const metadata: Metadata = {
  title: "OCTOPUS IA | IA que entende. Soluções que transformam.",
  description: "Inteligência Artificial, automação e engenharia de software aplicadas a desafios reais de negócio.",
  openGraph: {
    title: "OCTOPUS IA",
    description: "IA que entende. Soluções que transformam.",
    type: "website"
  }
};

const navItems = [
  ["Soluções", "#solucoes"],
  ["Projetos", "#projetos"],
  ["Como funciona", "#como-funciona"],
  ["Sobre", "#sobre"]
] as const;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="siteHeader">
          <div className="wrap headerInner">
            <Link className="brandLink" href="#inicio" aria-label="OCTOPUS IA - início">
              <BrandLogo />
            </Link>

            <nav className="desktopNav" aria-label="Navegação principal">
              {navItems.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
            </nav>

            <div className="headerActions">
              <span className="systemBadge"><i /> Sistema online</span>
              <Link className="headerCta" href="#ia">Experimentar IA</Link>
            </div>

            <details className="mobileNav">
              <summary aria-label="Abrir menu"><span /><span /><span /></summary>
              <div>
                {navItems.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
                <Link className="mobileCta" href="#ia">Experimentar IA</Link>
              </div>
            </details>
          </div>
        </header>

        {children}

        <footer className="siteFooter">
          <div className="wrap footerGrid">
            <div className="footerBrand">
              <BrandLogo compact />
              <p>Inteligência Artificial que conecta tecnologia, processos, conhecimento e resultados.</p>
            </div>
            <div><strong>Navegação</strong><Link href="#solucoes">Soluções</Link><Link href="#projetos">Projetos</Link><Link href="#como-funciona">Como funciona</Link></div>
            <div><strong>Experimente</strong><Link href="#ia">IA ao vivo</Link><Link href="#diagnostico">Diagnóstico</Link><Link href="#sobre">Sobre a OCTOPUS</Link></div>
            <div><strong>Ambiente</strong><span>Site responsivo</span><span>Homologação automatizada</span><span>Segurança por desenho</span></div>
          </div>
          <div className="wrap footerBottom"><span>© 2026 OCTOPUS IA. Todos os direitos reservados.</span><span>octopusia.org</span></div>
        </footer>
      </body>
    </html>
  );
}
