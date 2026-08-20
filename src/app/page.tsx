import AIInteractive from "../components/ai-interactive";

const solutions = [
  { icon: "⚖", title: "IA Jurídica", text: "Converse com contratos, documentos e contexto jurídico com apoio de IA e evidências.", color: "green" },
  { icon: "⌘", title: "Automação", text: "Automatize tarefas repetitivas e conecte sistemas, dados e Inteligência Artificial.", color: "blue" },
  { icon: "◌", title: "Atendimento Inteligente", text: "Assistentes que entendem contexto, consultam conhecimento e ajudam a resolver solicitações.", color: "violet" },
  { icon: "▤", title: "Documentos & Engenharia", text: "Extração, interpretação e organização inteligente de documentos técnicos.", color: "teal" }
];

const projects = [
  { tag: "DOCUMENTOS + IA", title: "IA Jurídica", text: "Experiência de conversa com documentos, contexto processual e pesquisa orientada por evidências.", caps: ["RAG", "Documentos", "Contexto"] },
  { tag: "CONHECIMENTO", title: "Central de Conhecimento Escolar", text: "Assistente contextual que transforma documentos institucionais em respostas úteis para atendimento.", caps: ["Busca semântica", "Sessão", "Auditoria"] },
  { tag: "PRODUTO DIGITAL", title: "Aproxima Fidelização", text: "Produto digital para relacionamento, cartão de fidelidade, campanhas e experiências do cliente.", caps: ["SaaS", "PWA", "Automação"] },
  { tag: "ENGENHARIA", title: "Engenharia Documental", text: "Leitura e estruturação de documentos técnicos para apoiar análise, quantitativos e reconstrução de informação.", caps: ["Extração", "Dados", "IA"] }
];

const capabilities = [
  "Conversar com documentos",
  "Automatizar processos",
  "Integrar sistemas e APIs",
  "Criar agentes com contexto",
  "Interpretar dados e evidências"
];

export default function Home() {
  return (
    <main>
      <section className="hero" id="inicio">
        <div className="wrap heroGrid">
          <div className="heroCopy">
            <span className="eyebrow">INTELIGÊNCIA ARTIFICIAL PARA RESULTADOS REAIS</span>
            <h1>IA que entende.<br />Soluções que <em>transformam.</em></h1>
            <p className="lead">A OCTOPUS IA cria soluções inteligentes, seguras e personalizadas para otimizar processos, reduzir trabalho manual e gerar impacto real no seu negócio.</p>
            <div className="actions">
              <a className="btn primary" href="#ia">Experimentar a IA <span>→</span></a>
              <a className="btn light" href="#solucoes">Ver Soluções</a>
            </div>
            <div className="miniTrust">
              <span><i className="greenDot" /> Tecnologia aplicada</span>
              <span><i className="shieldMark">✓</i> Segurança por desenho</span>
              <span><i className="chartMark">↗</i> Foco em resultado</span>
            </div>
          </div>
          <AIInteractive />
        </div>
      </section>

      <section className="section solutionsSection" id="solucoes">
        <div className="wrap">
          <div className="sectionIntro">
            <div><span className="eyebrow">NOSSAS SOLUÇÕES</span><h2>Soluções inteligentes para desafios reais</h2></div>
            <p>Da análise de documentos à automação completa de processos, combinamos IA, segurança e engenharia para criar soluções que se encaixam na operação real.</p>
          </div>
          <div className="solutionGrid">
            {solutions.map((solution) => (
              <article className={`solutionCard ${solution.color}`} key={solution.title}>
                <span className="solutionIcon">{solution.icon}</span>
                <h3>{solution.title}</h3>
                <p>{solution.text}</p>
                <a href="#ia">Explorar com a IA <span>→</span></a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section projectsSection" id="projetos">
        <div className="wrap">
          <div className="sectionIntro compact">
            <div><span className="eyebrow">PROJETOS & EXPERIÊNCIAS</span><h2>IA em ação, não apenas em apresentação</h2></div>
            <p>O portfólio mostra classes de problema que já estamos transformando em produtos, motores e experiências demonstráveis.</p>
          </div>
          <div className="projectGrid">
            {projects.map((project, index) => (
              <article className="projectCard" key={project.title}>
                <div className={`projectVisual projectVisual${index + 1}`} aria-hidden="true"><span>{index + 1}</span><i /></div>
                <div className="projectContent">
                  <span className="projectTag">{project.tag}</span>
                  <h3>{project.title}</h3>
                  <p>{project.text}</p>
                  <div className="capRow">{project.caps.map((cap) => <span key={cap}>{cap}</span>)}</div>
                  <a href="#ia">Quero entender este caso <span>→</span></a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="capabilitiesBand" id="capacidades">
        <div className="wrap">
          <span className="eyebrow">CAPACIDADES OCTOPUS</span>
          <div className="capabilityGrid">
            {capabilities.map((capability, index) => <div key={capability}><span>0{index + 1}</span><strong>{capability}</strong></div>)}
          </div>
        </div>
      </section>

      <section className="section processSection" id="como-funciona">
        <div className="wrap processGrid">
          <div className="processCopy">
            <span className="eyebrow">COMO TRABALHAMOS</span>
            <h2>Do problema real à solução funcionando</h2>
            <p>A tecnologia entra depois do entendimento do processo. O objetivo é resolver a classe do problema, integrar o que já existe e medir o comportamento da solução.</p>
            <a className="textLink" href="#ia">Conte seu problema para a IA <span>→</span></a>
          </div>
          <div className="processSteps">
            <article><span>01</span><div><strong>Entender</strong><p>Mapeamos processo, contexto, dados e objetivo.</p></div></article>
            <article><span>02</span><div><strong>Projetar</strong><p>Definimos capacidades, integrações e controles necessários.</p></div></article>
            <article><span>03</span><div><strong>Construir</strong><p>Implementamos software, IA, automações e observabilidade.</p></div></article>
            <article><span>04</span><div><strong>Homologar</strong><p>Testamos, medimos, corrigimos e evoluímos antes de produção.</p></div></article>
          </div>
        </div>
      </section>

      <section className="diagnosticSection" id="diagnostico">
        <div className="wrap diagnosticBox">
          <div>
            <span className="eyebrow">DIAGNÓSTICO OCTOPUS</span>
            <h2>Tem um problema que ainda não sabe como automatizar?</h2>
            <p>Converse com a IA do site. Ela pode organizar seu cenário, identificar oportunidades e sugerir uma arquitetura inicial sem exigir cadastro antes da experiência.</p>
          </div>
          <a className="btn primary" href="#ia">Iniciar diagnóstico <span>→</span></a>
        </div>
      </section>

      <section className="section aboutSection" id="sobre">
        <div className="wrap aboutGrid">
          <div><span className="eyebrow">SOBRE A OCTOPUS IA</span><h2>Uma inteligência central conectada a várias capacidades.</h2></div>
          <div><p>Construímos soluções sob medida combinando Inteligência Artificial, desenvolvimento de software, documentos, dados, integrações e automação.</p><p>O site foi pensado para demonstrar essa abordagem na prática: você pode conhecer o portfólio e, ao mesmo tempo, conversar com uma IA sobre o seu próprio negócio.</p></div>
        </div>
      </section>

      <section className="finalCta" id="contato">
        <div className="wrap finalCtaBox">
          <div><span className="eyebrow inverted">VAMOS CRIAR ALGO</span><h2>O próximo projeto pode começar com uma conversa.</h2><p>Descreva o processo, problema ou ideia. A IA ajuda a estruturar o primeiro diagnóstico.</p></div>
          <a className="btn whiteButton" href="#ia">Falar com a OCTOPUS <span>→</span></a>
        </div>
      </section>
    </main>
  );
}
