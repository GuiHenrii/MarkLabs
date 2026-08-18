"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Zap, Eye, EyeOff, ArrowRight, AlertCircle, Globe } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
    setSuccess(null);
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });
    
    console.log("[LOGIN DEBUG] Signin result:", result);

    if (result?.error) {
      setError("Email ou senha inválidos.");
      setIsLoading(false);
      return;
    }

    router.push("/select-team");
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420" 
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao criar conta.");
        setIsLoading(false);
        return;
      }

      setSuccess("Conta criada! Fazendo login...");

      // Auto-login after registration
      const loginResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });
      
      console.log("[REGISTER DEBUG] Auto-login result:", loginResult);

      if (loginResult?.error) {
        setTab("login");
        setSuccess("Conta criada! Faça login para continuar.");
        setIsLoading(false);
        return;
      }

      router.push("/select-team");
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "login") {
      await handleLogin();
    } else {
      await handleRegister();
    }
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
          background: "radial-gradient(circle, rgba(234,88,12,0.12) 0%, transparent 70%)",
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
          <Logo width={220} className="mb-4" />
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "12px" }}>
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
              gap: "4px",
            }}
          >
            <button
              type="button"
              id="tab-login"
              onClick={(e) => { 
                e.preventDefault();
                setTab("login"); 
                setError(null); 
                setSuccess(null); 
              }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "7px",
                border: tab === "login" ? "1px solid var(--border)" : "none",
                background: tab === "login" ? "var(--bg-card)" : "transparent",
                color: tab === "login" ? "var(--text-primary)" : "var(--text-muted)",
                fontSize: "13px",
                fontWeight: tab === "login" ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Entrar
            </button>
            <button
              type="button"
              id="tab-register"
              onClick={(e) => { 
                e.preventDefault();
                setTab("register"); 
                setError(null); 
                setSuccess(null); 
              }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "7px",
                border: tab === "register" ? "1px solid var(--border)" : "none",
                background: tab === "register" ? "var(--bg-card)" : "transparent",
                color: tab === "register" ? "var(--text-primary)" : "var(--text-muted)",
                fontSize: "13px",
                fontWeight: tab === "register" ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Criar conta
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: "10px",
                marginBottom: "16px",
                fontSize: "13px",
                color: "#ef4444",
              }}
            >
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                padding: "10px 14px",
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.25)",
                borderRadius: "10px",
                marginBottom: "16px",
                fontSize: "13px",
                color: "#10b981",
              }}
            >
              {success}
            </div>
          )}

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
                  name="name"
                  placeholder="Seu nome"
                  id="name-input"
                  required
                  value={formData.name}
                  onChange={handleChange}
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
                name="email"
                placeholder="seu@email.com"
                id="email-input"
                required
                value={formData.email}
                onChange={handleChange}
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
                    style={{ fontSize: "12px", color: "#fb923c", textDecoration: "none" }}
                  >
                    Esqueceu a senha?
                  </Link>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  id="password-input"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
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
                  ? "rgba(234,88,12,0.5)"
                  : "linear-gradient(135deg, #ea580c, #c2410c)",
                border: "none",
                borderRadius: "10px",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: isLoading ? "not-allowed" : "pointer",
                boxShadow: "0 0 16px rgba(234,88,12,0.3)",
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
              <Globe size={16} style={{ color: "#ea4335" }} />
              Google
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)", marginTop: "20px" }}>
          Ao continuar, você concorda com os{" "}
          <Link href="/terms" style={{ color: "#fb923c", textDecoration: "none" }}>
            Termos de Uso
          </Link>{" "}
          e{" "}
          <Link href="/privacy" style={{ color: "#fb923c", textDecoration: "none" }}>
            Política de Privacidade
          </Link>
        </p>
      </div>
    </div>
  );
}
