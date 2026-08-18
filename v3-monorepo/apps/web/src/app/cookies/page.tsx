import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description: "Política de Cookies do MarkLabs, com informações sobre tipos de cookies, finalidades e gerenciamento.",
};

const sections = [
  {
    title: "1. O que são cookies",
    body: [
      "Cookies são pequenos arquivos armazenados no seu navegador para permitir funcionalidades, lembrar preferências e entender como o site é usado.",
      "Também podemos usar tecnologias semelhantes, como local storage ou identificadores técnicos, quando necessário para o funcionamento do serviço.",
    ],
  },
  {
    title: "2. Cookies essenciais",
    body: [
      "São necessários para autenticação, manutenção de sessão, segurança e funcionamento básico da plataforma.",
      "Sem esses cookies, partes importantes do serviço podem não funcionar corretamente.",
    ],
  },
  {
    title: "3. Cookies de preferência",
    body: [
      "Podem ser usados para lembrar idioma, tema e outras preferências de navegação.",
      "Melhoram a experiência do usuário ao evitar que certas escolhas precisem ser refeitas a cada acesso.",
    ],
  },
  {
    title: "4. Cookies de análise e desempenho",
    body: [
      "Podem ser usados para medir uso da plataforma, identificar erros e melhorar desempenho.",
      "Se forem habilitados, devem ser descritos com mais detalhes na interface ou em documentação complementar.",
    ],
  },
  {
    title: "5. Cookies de terceiros",
    body: [
      "Alguns serviços integrados podem definir cookies próprios, conforme suas respectivas políticas.",
      "Exemplos podem incluir autenticação, email transacional, hospedagem de mídia ou provedores de analytics.",
    ],
  },
  {
    title: "6. Como gerenciar cookies",
    body: [
      "Você pode gerenciar cookies pelo seu navegador, removendo-os ou bloqueando-os nas configurações.",
      "Ao bloquear cookies essenciais, partes da plataforma podem deixar de funcionar como esperado.",
    ],
  },
  {
    title: "7. Atualizações",
    body: [
      "Esta política pode ser atualizada quando houver mudanças técnicas, legais ou operacionais.",
      "A versão vigente será sempre a publicada nesta página.",
    ],
  },
];

export default function CookiesPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ marginBottom: "28px" }}>
          <Link href="/login" style={{ color: "#fb923c", textDecoration: "none", fontSize: "14px" }}>
            ← Voltar para o login
          </Link>
          <h1 style={{ fontSize: "40px", margin: "14px 0 8px", lineHeight: 1.1 }}>Política de Cookies</h1>
          <p style={{ color: "var(--text-muted)", maxWidth: "720px" }}>
            Esta política explica como usamos cookies e tecnologias semelhantes no MarkLabs.
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
          <h2 style={{ margin: "0 0 8px", fontSize: "18px" }}>Gestão de preferências</h2>
          <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            Para alterar preferências de cookies, ajuste as configurações do navegador. Se houver cookies não essenciais
            no futuro, o MarkLabs poderá disponibilizar controles adicionais na própria plataforma.
          </p>
        </section>

        <div style={{ marginTop: "20px", display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "14px" }}>
          <Link href="/terms" style={{ color: "#fb923c", textDecoration: "none" }}>
            Ver Termos de Uso →
          </Link>
          <Link href="/privacy" style={{ color: "#fb923c", textDecoration: "none" }}>
            Ver Aviso de Privacidade →
          </Link>
        </div>
      </div>
    </main>
  );
}
