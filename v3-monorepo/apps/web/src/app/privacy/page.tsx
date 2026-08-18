import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Aviso de Privacidade",
  description: "Aviso de Privacidade do MarkLabs, com informações sobre coleta, uso, compartilhamento, segurança e direitos do titular.",
};

const sections = [
  {
    title: "1. Quem somos",
    body: [
      "O MarkLabs é uma plataforma de gestão de redes sociais.",
      "Para fins da LGPD, atuamos como controlador dos dados pessoais tratados para disponibilização do serviço.",
    ],
  },
  {
    title: "2. Quais dados coletamos",
    body: [
      "Podemos coletar dados cadastrais, como nome, email, senha criptografada, informações de equipe, permissões e identificadores técnicos de sessão.",
      "Também tratamos dados inseridos por você no uso do serviço, como posts, mídias, nomes de contas conectadas, tokens de acesso e métricas associadas às integrações habilitadas.",
      "Podemos coletar dados técnicos de navegação, como IP, data e hora de acesso, logs, identificação do dispositivo e cookies necessários.",
    ],
  },
  {
    title: "3. Para que usamos os dados",
    body: [
      "Usamos os dados para autenticação, gestão de conta, organização de equipes, conexão com plataformas de terceiros, publicação/agendamento de conteúdo, suporte, segurança, prevenção a fraudes e melhoria do serviço.",
      "Também usamos os dados para cumprir obrigações legais, regulatórias e contratuais.",
    ],
  },
  {
    title: "4. Bases legais",
    body: [
      "Quando aplicável, tratamos dados com base no consentimento, execução de contrato, cumprimento de obrigação legal ou regulatória, legítimo interesse e exercício regular de direitos.",
      "A base legal específica depende da finalidade e do contexto do tratamento.",
    ],
  },
  {
    title: "5. Compartilhamento",
    body: [
      "Podemos compartilhar dados com fornecedores e parceiros necessários para operar o serviço, como hospedagem, autenticação, email transacional, armazenamento de arquivos, logs e analytics.",
      "Também podemos compartilhar dados com provedores de redes sociais e APIs integradas, conforme necessário para executar as funcionalidades que você ativar.",
      "Não vendemos seus dados pessoais.",
    ],
  },
  {
    title: "6. Transferência internacional",
    body: [
      "Alguns provedores podem processar dados fora do Brasil.",
      "Quando isso ocorrer, adotamos medidas contratuais e técnicas compatíveis com as exigências legais aplicáveis.",
    ],
  },
  {
    title: "7. Segurança",
    body: [
      "Adotamos práticas razoáveis de segurança da informação para proteger dados contra acesso não autorizado, alteração, perda e divulgação indevida.",
      "Ainda assim, nenhum ambiente digital é totalmente livre de riscos. Recomendamos que você também proteja suas credenciais e dispositivos.",
    ],
  },
  {
    title: "8. Retenção",
    body: [
      "Mantemos os dados apenas pelo tempo necessário para cumprir as finalidades informadas, obrigações legais, requisitos de segurança e exercício regular de direitos.",
      "Quando aplicável, podemos reter informações por prazos adicionais para auditoria, prevenção de fraude ou conformidade legal.",
    ],
  },
  {
    title: "9. Cookies e tecnologias semelhantes",
    body: [
      "Utilizamos cookies e tecnologias semelhantes para manter sua sessão, lembrar preferências e melhorar a experiência de uso.",
      "Se o app usar cookies não essenciais no futuro, esta política deve ser atualizada para detalhar finalidade, duração e meios de gestão.",
    ],
  },
  {
    title: "10. Seus direitos",
    body: [
      "Você pode solicitar confirmação da existência de tratamento, acesso, correção, anonimização, bloqueio, eliminação, portabilidade, informação sobre compartilhamento, revogação de consentimento e oposição, quando aplicável.",
      "Também pode solicitar informações adicionais sobre o uso dos seus dados e sobre os agentes de tratamento.",
    ],
  },
  {
    title: "11. Como exercer seus direitos",
    body: [
      "Para exercer seus direitos, entre em contato pelo email support@marklabs.com.",
      "Poderemos solicitar informações adicionais para confirmar sua identidade e proteger seus dados.",
    ],
  },
  {
    title: "12. Alterações neste aviso",
    body: [
      "Podemos atualizar este Aviso de Privacidade para refletir mudanças no serviço, na legislação ou nas práticas de tratamento.",
      "A versão vigente será sempre a publicada nesta página.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ marginBottom: "28px" }}>
          <Link href="/login" style={{ color: "#fb923c", textDecoration: "none", fontSize: "14px" }}>
            ← Voltar para o login
          </Link>
          <h1 style={{ fontSize: "40px", margin: "14px 0 8px", lineHeight: 1.1 }}>Aviso de Privacidade</h1>
          <p style={{ color: "var(--text-muted)", maxWidth: "720px" }}>
            Este aviso explica como o MarkLabs trata dados pessoais. Ele foi escrito para cobrir as operações reais da
            plataforma, mas deve ser revisado por assessoria jurídica antes da publicação final.
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "8px" }}>
            Última atualização: 18 de agosto de 2026.
          </p>
        </div>

        <section style={{ display: "grid", gap: "18px" }}>
          {sections.map((section) => (
            <article
              key={section.title}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <h2 style={{ margin: "0 0 12px", fontSize: "20px" }}>{section.title}</h2>
              <div style={{ display: "grid", gap: "12px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                {section.body.map((paragraph) => (
                  <p key={paragraph} style={{ margin: 0 }}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section style={{ marginTop: "24px", padding: "24px", borderRadius: "16px", background: "rgba(234,88,12,0.08)", border: "1px solid rgba(234,88,12,0.2)" }}>
          <h2 style={{ margin: "0 0 8px", fontSize: "18px" }}>Encarregado / contato</h2>
          <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            Para dúvidas, solicitações ou exercício de direitos relacionados a dados pessoais, envie um email para{" "}
            <a href="mailto:support@marklabs.com" style={{ color: "#fb923c" }}>
              support@marklabs.com
            </a>
            .
          </p>
        </section>

        <div style={{ marginTop: "20px", display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "14px" }}>
          <Link href="/terms" style={{ color: "#fb923c", textDecoration: "none" }}>
            Ver Termos de Uso →
          </Link>
          <Link href="/cookies" style={{ color: "#fb923c", textDecoration: "none" }}>
            Ver Política de Cookies →
          </Link>
          <Link href="/login" style={{ color: "#fb923c", textDecoration: "none" }}>
            Voltar ao login →
          </Link>
        </div>
      </div>
    </main>
  );
}
