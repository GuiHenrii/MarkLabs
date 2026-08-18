import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos de Uso do MarkLabs, com regras de acesso, uso da plataforma, responsabilidades e limitações.",
};

const sections = [
  {
    title: "1. Aceitação dos Termos",
    body: [
      "Ao acessar ou usar o MarkLabs, você concorda com estes Termos de Uso e com o Aviso de Privacidade.",
      "Se você não concordar com qualquer parte destes termos, não deve utilizar a plataforma.",
    ],
  },
  {
    title: "2. Descrição do Serviço",
    body: [
      "O MarkLabs é uma plataforma de gestão de redes sociais para criação, agendamento, organização e análise de conteúdo.",
      "Podemos alterar, suspender ou descontinuar funcionalidades a qualquer momento, com ou sem aviso prévio quando permitido por lei.",
    ],
  },
  {
    title: "3. Elegibilidade e Cadastro",
    body: [
      "Você declara ter capacidade legal para aceitar estes termos.",
      "Ao criar uma conta, você deve fornecer informações verdadeiras, completas e atualizadas, mantendo seus dados corretos enquanto usar o serviço.",
      "Você é responsável por manter a confidencialidade das credenciais de acesso e por toda atividade realizada na sua conta.",
    ],
  },
  {
    title: "4. Contas de Terceiros e Integrações",
    body: [
      "O MarkLabs pode se integrar a serviços de terceiros, como Meta, LinkedIn, Google Cloud, Resend, Cloudinary e provedores de infraestrutura.",
      "O uso dessas integrações está sujeito também aos termos e políticas desses terceiros.",
      "Você é responsável por garantir que possui os direitos e permissões necessários para conectar contas, páginas, perfis e ativos digitais.",
    ],
  },
  {
    title: "5. Uso Permitido",
    body: [
      "Você concorda em usar o MarkLabs apenas para fins lícitos e de acordo com estes termos.",
      "É proibido usar a plataforma para spam, abuso, violação de direitos de terceiros, tentativa de exploração indevida de integrações ou qualquer atividade ilegal.",
      "Também é proibido tentar acessar áreas restritas, realizar engenharia reversa, interferir na segurança ou comprometer a estabilidade do serviço.",
    ],
  },
  {
    title: "6. Conteúdo do Usuário",
    body: [
      "Todo conteúdo enviado, agendado ou publicado por meio do MarkLabs permanece sob sua responsabilidade.",
      "Você declara possuir os direitos, licenças e autorizações necessários para utilizar textos, imagens, vídeos, marcas e outros materiais.",
      "Podemos remover, restringir ou bloquear conteúdo quando exigido por lei, por solicitação válida de terceiros ou para proteger a segurança da plataforma.",
    ],
  },
  {
    title: "7. Propriedade Intelectual",
    body: [
      "O software, design, marca, textos, interfaces, algoritmos e demais elementos do MarkLabs pertencem à empresa ou aos seus licenciantes.",
      "Não é concedida licença de uso, exceto a limitada, revogável e não exclusiva necessária para acessar e utilizar a plataforma conforme estes termos.",
    ],
  },
  {
    title: "8. Dados Pessoais e Privacidade",
    body: [
      "O tratamento de dados pessoais segue a LGPD, o Marco Civil da Internet e demais normas aplicáveis.",
      "O detalhamento sobre coleta, uso, compartilhamento, segurança e direitos do titular está descrito no Aviso de Privacidade.",
    ],
  },
  {
    title: "9. Segurança",
    body: [
      "Adotamos medidas técnicas e administrativas razoáveis para proteger os dados e o funcionamento do serviço.",
      "Ainda assim, nenhum sistema é totalmente livre de riscos, e você também deve adotar boas práticas de segurança, como o uso de senhas fortes e a proteção do acesso à sua conta.",
    ],
  },
  {
    title: "10. Disponibilidade do Serviço",
    body: [
      "Fazemos esforços para manter a plataforma disponível, mas não garantimos operação ininterrupta, livre de falhas ou erros.",
      "Podemos realizar manutenções, atualizações e ajustes de segurança que afetem parcial ou temporariamente o acesso ao serviço.",
    ],
  },
  {
    title: "11. Limitação de Responsabilidade",
    body: [
      "Na extensão permitida pela lei aplicável, o MarkLabs não se responsabiliza por perdas indiretas, lucros cessantes, interrupções decorrentes de terceiros ou uso indevido da plataforma.",
      "Nossa responsabilidade, quando aplicável, fica limitada conforme a legislação vigente e às condições contratadas entre as partes.",
    ],
  },
  {
    title: "12. Encerramento",
    body: [
      "Podemos suspender ou encerrar contas que violem estes termos, que apresentem risco à plataforma ou quando houver solicitação legal.",
      "Você pode encerrar sua conta a qualquer momento, sujeito aos procedimentos disponíveis na plataforma e à retenção mínima de dados exigida por lei.",
    ],
  },
  {
    title: "13. Lei Aplicável e Foro",
    body: [
      "Estes Termos são regidos pelas leis da República Federativa do Brasil.",
      "Se não houver solução amigável, fica eleito o foro da comarca competente, salvo disposição legal em contrário.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ marginBottom: "28px" }}>
          <Link href="/login" style={{ color: "#fb923c", textDecoration: "none", fontSize: "14px" }}>
            ← Voltar para o login
          </Link>
          <h1 style={{ fontSize: "40px", margin: "14px 0 8px", lineHeight: 1.1 }}>Termos de Uso</h1>
          <p style={{ color: "var(--text-muted)", maxWidth: "720px" }}>
            Estes termos descrevem as regras de uso do MarkLabs. O texto abaixo foi preparado para dar base operacional
            e de transparência ao serviço, mas deve ser revisado por assessoria jurídica antes de publicação final.
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
          <h2 style={{ margin: "0 0 8px", fontSize: "18px" }}>Contato</h2>
          <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            Em caso de dúvidas sobre estes termos, entre em contato pelo email{" "}
            <a href="mailto:support@marklabs.com" style={{ color: "#fb923c" }}>
              support@marklabs.com
            </a>
            .
          </p>
        </section>

        <div style={{ marginTop: "20px", display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "14px" }}>
          <Link href="/privacy" style={{ color: "#fb923c", textDecoration: "none" }}>
            Ver Aviso de Privacidade →
          </Link>
          <Link href="/login" style={{ color: "#fb923c", textDecoration: "none" }}>
            Voltar ao login →
          </Link>
        </div>
      </div>
    </main>
  );
}
