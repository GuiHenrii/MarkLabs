"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Eye, EyeOff, ArrowRight, Chrome } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState<"login" | "register">("login");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Glow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          position: "relative",
          zIndex: 1,
          animation: "fadeIn 0.4s ease-out",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              borderRadius: "14px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 24px rgba(99, 102, 241, 0.5)",
              marginBottom: "16px",
            }}
          >
            <Zap size={24} color="#fff" />
          </div>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: 800,
              background: "linear-gradient(135deg, #f0f0ff, #a5b4fc)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            MarkLabs
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "6px" }}>
            Gestão inteligente de redes sociais
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "18px",
            padding: "32px",
          }}
          className="glass"
        >
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              background: "var(--bg-secondary)",
              borderRadius: "10px",
              padding: "4px",
              marginBottom: "28px",
            }}
          >
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "7px",
                  border: "none",
                  background: tab === t ? "var(--bg-card)" : "transparent",
                  color: tab === t ? "var(--text-primary)" : "var(--text-muted)",
                  fontSize: "13px",
                  fontWeight: tab === t ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
                }}
              >
                {t === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {tab === "register" && (
              <div>
                <label
                  style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}
                >
                  Nome completo
                </label>
                <input
                  type="text"
                  placeholder="Seu nome"
                  id="name-input"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "border-color 0.15s ease",
                  }}
                />
              </div>
            )}

            <div>
              <label
                style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}
              >
                Email
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                id="email-input"
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.15s ease",
                }}
              />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
                  Senha
                </label>
                {tab === "login" && (
                  <Link
                    href="/auth/forgot-password"
                    style={{ fontSize: "12px", color: "#818cf8", textDecoration: "none" }}
                  >
                    Esqueceu a senha?
                  </Link>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  id="password-input"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 40px 10px 14px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  id="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              id="submit-btn"
              type="submit"
              disabled={isLoading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
                padding: "11px",
                background: isLoading
                  ? "rgba(99,102,241,0.5)"
                  : "linear-gradient(135deg, #6366f1, #4f46e5)",
                border: "none",
                borderRadius: "10px",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: isLoading ? "not-allowed" : "pointer",
                boxShadow: "0 0 16px rgba(99,102,241,0.3)",
                transition: "all 0.2s ease",
                marginTop: "4px",
              }}
            >
              {isLoading ? (
                <span
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
              ) : (
                <>
                  {tab === "login" ? "Entrar" : "Criar conta"}
                  <ArrowRight size={15} />
                </>
              )}
            </button>

            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                color: "var(--text-muted)",
                fontSize: "12px",
              }}
            >
              <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
              ou continue com
              <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            </div>

            <button
              id="google-login-btn"
              type="button"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
                padding: "10px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                color: "var(--text-primary)",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Chrome size={16} style={{ color: "#ea4335" }} />
              Google
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)", marginTop: "20px" }}>
          Ao continuar, você concorda com os{" "}
          <Link href="/terms" style={{ color: "#818cf8", textDecoration: "none" }}>
            Termos de Uso
          </Link>{" "}
          e{" "}
          <Link href="/privacy" style={{ color: "#818cf8", textDecoration: "none" }}>
            Política de Privacidade
          </Link>
        </p>
      </div>
    </div>
  );
}
