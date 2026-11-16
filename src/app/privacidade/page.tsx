import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Política de Privacidade | OCTOPUS IA",
  description: "Como a OCTOPUS IA trata dados pessoais de visitantes, contatos, clientes e fornecedores."
};

export default function PrivacyPage() {
  return (
    <main className="legalPage">
      <div className="wrap">
        <span className="eyebrow">LGPD</span>
        <h1>Política de Privacidade</h1>
        <p className="updated">Última atualização: novembro de 2026</p>

        <h2>1. Quem somos</h2>
        <p>A <strong>OCTOPUS IA</strong> é o nome fantasia da {CONTACT.legalName}{CONTACT.cnpj ? `, CNPJ ${CONTACT.cnpj}` : ""}, com sede em Belo Horizonte/MG. Desenvolvemos e operamos sistemas com inteligência artificial para empresas.</p>

        <h2>2. Quando esta política se aplica</h2>
        <p>Ela explica como tratamos os dados pessoais de quem visita este site, conversa com a IA do site, preenche o formulário de contato, nos procura por e-mail, WhatsApp ou redes sociais, recebe nossas comunicações comerciais ou representa empresas clientes e fornecedoras.</p>
        <p>Nos sistemas que operamos para nossos clientes, quem decide sobre os dados é o cliente (controlador), e nós apenas os tratamos em nome dele. Nesses casos vale a política de privacidade do cliente.</p>

        <h2>3. Dados que coletamos e por quê</h2>
        <div className="tableScroll">
          <table>
            <thead><tr><th>Situação</th><th>Dados</th><th>Para quê</th><th>Base legal (LGPD)</th></tr></thead>
            <tbody>
              <tr><td>Formulário de contato</td><td>Nome, empresa, e-mail ou WhatsApp e a mensagem</td><td>Responder, fazer orçamentos e propostas</td><td>Procedimentos preliminares a contrato (art. 7º, V)</td></tr>
              <tr><td>Conversa com a IA do site</td><td>O texto que você digita e as respostas, sem identificação (e-mails, telefones e documentos são apagados automaticamente)</td><td>Gerar a resposta e entender o que os visitantes perguntam, para melhorar o serviço</td><td>Legítimo interesse (art. 7º, IX)</td></tr>
              <tr><td>Envio da conversa para a equipe</td><td>Nome, e-mail ou WhatsApp e a conversa com a IA, quando você pede para enviá-la</td><td>Responder ao seu pedido com o contexto da conversa</td><td>Procedimentos preliminares a contrato (art. 7º, V)</td></tr>
              <tr><td>Clientes e fornecedores</td><td>Dados de contato dos representantes, cobrança e notas fiscais</td><td>Executar o contrato e cumprir obrigações fiscais</td><td>Execução de contrato e obrigação legal (art. 7º, V e II)</td></tr>
              <tr><td>Prospecção comercial</td><td>Nome, cargo, empresa e contatos profissionais de fontes públicas</td><td>Apresentar nossos serviços a empresas que podem se interessar</td><td>Legítimo interesse (art. 7º, IX)</td></tr>
              <tr><td>Navegação</td><td>Endereço IP e dados técnicos de acesso</td><td>Manter o site funcionando e seguro</td><td>Legítimo interesse (art. 7º, IX)</td></tr>
            </tbody>
          </table>
        </div>
        <p>Na prospecção usamos apenas dados profissionais, e toda mensagem comercial traz uma forma simples de pedir para não receber mais contatos. Não coletamos de propósito dados sensíveis nem dados de crianças. Não envie senhas, documentos pessoais ou dados sensíveis pela IA do site.</p>

        <h2>4. Com quem compartilhamos</h2>
        <p>Não vendemos dados pessoais. Compartilhamos apenas o necessário com fornecedores que nos ajudam a operar (hospedagem, e-mail, WhatsApp e provedores de inteligência artificial, como a OpenAI, que processa as mensagens enviadas à IA do site), com serviços financeiros e contábeis, e com autoridades quando a lei exigir.</p>

        <h2>5. Transferência internacional</h2>
        <p>Alguns fornecedores, especialmente de inteligência artificial, processam dados fora do Brasil, como nos Estados Unidos. Nesses casos usamos os mecanismos previstos na LGPD e na regulamentação da ANPD.</p>

        <h2>6. Por quanto tempo guardamos</h2>
        <ul>
          <li>Conversas com a IA do site, sem identificação: até 90 dias, apagadas automaticamente.</li>
          <li>Contatos, conversas enviadas à equipe e propostas que não viraram contrato: até 2 anos após o último contato, ou antes, se você pedir a exclusão.</li>
          <li>Dados de clientes e fornecedores: durante o contrato e pelo prazo exigido pela legislação fiscal e contábil.</li>
          <li>Pedidos para não receber contatos: guardamos o mínimo necessário para não voltar a procurá-lo.</li>
        </ul>

        <h2>7. Cookies e armazenamento no navegador</h2>
        <p>Este site não usa cookies de publicidade nem de análise. Guardamos no seu navegador apenas a sua preferência de tema (claro ou escuro), que você pode apagar a qualquer momento nas configurações do navegador.</p>

        <h2>8. Seus direitos</h2>
        <p>Você pode pedir, sem custo, confirmação e acesso aos seus dados, correção, exclusão, anonimização ou bloqueio, portabilidade, informação sobre compartilhamento, revogação do consentimento e oposição ao tratamento baseado em legítimo interesse, incluindo parar de receber contatos comerciais. Respondemos em até 15 dias. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</p>

        <h2>9. Canal de contato</h2>
        <p>Para qualquer assunto sobre seus dados pessoais, escreva para <a href={`mailto:${CONTACT.privacyEmail}`}>{CONTACT.privacyEmail}</a>. Como agente de tratamento de pequeno porte, a OCTOPUS IA não indicou encarregado (DPO), conforme permite a Resolução CD/ANPD nº 2/2022; este canal atende titulares e a ANPD.</p>

        <h2>10. Segurança</h2>
        <p>Usamos conexões criptografadas, controle de acesso, backups e registro de acessos. Se ocorrer um incidente que possa causar risco relevante a você, comunicaremos você e a ANPD conforme a lei.</p>

        <h2>11. Alterações</h2>
        <p>Podemos atualizar esta política. A data da última versão fica no topo desta página. <Link href="/">Voltar ao início</Link>.</p>
      </div>
    </main>
  );
}
