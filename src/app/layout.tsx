import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import ThemeToggle from "@/components/ThemeToggle";
import { CONTACT, whatsappLink } from "@/lib/contact";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";
import "./mobile-polish.css";
import "./theme.css";

export const metadata: Metadata = {
  title: "OCTOPUS IA | IA que entende. Soluções que transformam.",
  description: "Inteligência Artificial, automação e engenharia de software aplicadas a desafios reais de negócio.",
  openGraph: {
    title: "OCTOPUS IA",
    description: "IA que entende. Soluções que transformam.",
    type: "website",
    images: [{ url: "/brand/octopus-ia-logo.png", width: 800, height: 746, alt: "OCTOPUS IA" }]
  }
};

const navItems = [
  ["Soluções", "/#solucoes"],
  ["Projetos", "/#projetos"],
  ["Como funciona", "/#como-funciona"],
  ["Contato", "/#contato"]
] as const;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const whatsapp = whatsappLink();
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <header className="siteHeader">
          <div className="wrap headerInner">
            <Link className="brandLink" href="/#inicio" aria-label="OCTOPUS IA - início">
              <BrandLogo />
            </Link>

            <nav className="desktopNav" aria-label="Navegação principal">
              {navItems.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
            </nav>

            <div className="headerActions">
              <Link className="headerCta" href="/#ia">Experimentar IA</Link>
            </div>

            <ThemeToggle />

            <details className="mobileNav">
              <summary aria-label="Abrir menu"><span /><span /><span /></summary>
              <div>
                {navItems.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
                <Link className="mobileCta" href="/#ia">Experimentar IA</Link>
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
            <div><strong>Navegação</strong><Link href="/#solucoes">Soluções</Link><Link href="/#projetos">Projetos</Link><Link href="/#como-funciona">Como funciona</Link><Link href="/#ia">IA ao vivo</Link></div>
            <div>
              <strong>Contato</strong>
              <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
              {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
              <Link href="/#contato">Formulário de contato</Link>
            </div>
            <div>
              <strong>Empresa</strong>
              <span>{CONTACT.legalName}</span>
              {CONTACT.cnpj && <span>CNPJ {CONTACT.cnpj}</span>}
              <span>{CONTACT.city}</span>
              <Link href="/privacidade">Política de privacidade</Link>
            </div>
          </div>
          <div className="wrap footerBottom"><span>© 2026 OCTOPUS IA. Todos os direitos reservados.</span><span>{CONTACT.site}</span></div>
        </footer>
      </body>
    </html>
  );
}
