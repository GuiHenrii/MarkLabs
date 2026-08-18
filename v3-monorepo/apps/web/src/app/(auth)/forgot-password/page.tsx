"use client";

import { useState } from "react";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao solicitar reset");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "40px",
        }}
      >
        {!submitted ? (
          <>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  background: "rgba(234,88,12,0.15)",
                  border: "2px solid rgba(234,88,12,0.3)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <Mail size={28} style={{ color: "#ea580c" }} />
              </div>
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: "8px",
                }}
              >
                Recuperar Senha
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                Digite seu email para receber um link de recuperação
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    marginBottom: "8px",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#ea580c")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              {error && (
                <div
                  style={{
                    padding: "12px",
                    background: "rgba(239,68,68,0.15)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: "8px",
                    color: "#ef4444",
                    fontSize: "13px",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                style={{
                  padding: "10px",
                  background: loading || !email ? "rgba(234,88,12,0.4)" : "linear-gradient(135deg, #ea580c, #c2410c)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: loading || !email ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontSize: "14px",
                  transition: "all 0.2s",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail size={16} />
                    Enviar Link de Recuperação
                  </>
                )}
              </button>
            </form>

            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <Link
                href="/login"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  color: "#ea580c",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                <ArrowLeft size={14} />
                Voltar para Login
              </Link>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "70px",
                height: "70px",
                background: "rgba(16,185,129,0.15)",
                border: "2px solid rgba(16,185,129,0.3)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <CheckCircle2 size={40} style={{ color: "#10b981" }} />
            </div>

            <h2
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "8px",
              }}
            >
              Email Enviado!
            </h2>

            <p style={{ color: "var(--text-muted)", marginBottom: "20px", fontSize: "14px" }}>
              Verificamos sua caixa de entrada em <strong>{email}</strong>
            </p>

            <div
              style={{
                background: "rgba(234,88,12,0.1)",
                border: "1px solid rgba(234,88,12,0.2)",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "20px",
                textAlign: "left",
                fontSize: "13px",
                color: "var(--text-secondary)",
              }}
            >
              <strong style={{ display: "block", marginBottom: "8px" }}>📧 Próximos passos:</strong>
              <ol style={{ margin: 0, paddingLeft: "20px" }}>
                <li>Abra o email que enviamos</li>
                <li>Clique no link "Redefinir Senha"</li>
                <li>Crie uma nova senha segura</li>
                <li>Faça login com sua nova senha</li>
              </ol>
            </div>

            <p style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "20px" }}>
              Link expira em 24 horas
            </p>

            <Link
              href="/login"
              style={{
                display: "inline-block",
                padding: "10px 20px",
                background: "linear-gradient(135deg, #ea580c, #c2410c)",
                color: "#fff",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              Voltar para Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
