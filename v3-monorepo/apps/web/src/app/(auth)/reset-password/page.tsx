"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !email) {
      setError("Link inválido ou expirado");
    }
  }, [token, email]);

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return "Senha deve ter no mínimo 8 caracteres";
    if (!/[A-Z]/.test(pwd)) return "Adicione pelo menos uma letra maiúscula";
    if (!/[0-9]/.test(pwd)) return "Adicione pelo menos um número";
    if (!/[!@#$%^&*]/.test(pwd)) return "Adicione pelo menos um símbolo (!@#$%^&*)";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || !confirmPassword) {
      setError("Preencha todos os campos");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao redefinir senha");
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
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
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
          Senha Atualizada! ✅
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "20px", fontSize: "14px" }}>
          Você será redirecionado para login...
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
          Ir para Login
        </Link>
      </div>
    );
  }

  return (
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
          <Lock size={28} style={{ color: "#ea580c" }} />
        </div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
          Redefinir Senha
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          Crie uma nova senha segura para sua conta
        </p>
      </div>

      {error && error.includes("inválido") && (
        <div style={{ padding: "12px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#ef4444", fontSize: "13px", marginBottom: "20px", display: "flex", gap: "8px", alignItems: "center" }}>
          <AlertCircle size={16} />
          <div>
            {error}
            <Link href="/forgot-password" style={{ display: "block", color: "#ea580c", marginTop: "4px" }}>
              Solicitar novo link
            </Link>
          </div>
        </div>
      )}

      {!error?.includes("inválido") && (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>
              Nova Senha
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: "100%", padding: "10px 12px 10px 12px", paddingRight: "40px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "14px", outline: "none" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>
              Confirmar Senha
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: "100%", padding: "10px 12px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "14px", outline: "none" }}
            />
          </div>

          <div style={{ padding: "12px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
            <strong style={{ display: "block", marginBottom: "6px" }}>Sua senha deve ter:</strong>
            <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: "1.8" }}>
              <li style={{ color: password.length >= 8 ? "#10b981" : "var(--text-muted)" }}>Mínimo 8 caracteres {password.length >= 8 && "✓"}</li>
              <li style={{ color: /[A-Z]/.test(password) ? "#10b981" : "var(--text-muted)" }}>Uma letra maiúscula {/[A-Z]/.test(password) && "✓"}</li>
              <li style={{ color: /[0-9]/.test(password) ? "#10b981" : "var(--text-muted)" }}>Um número {/[0-9]/.test(password) && "✓"}</li>
              <li style={{ color: /[!@#$%^&*]/.test(password) ? "#10b981" : "var(--text-muted)" }}>Um símbolo (!@#$%^&*) {/[!@#$%^&*]/.test(password) && "✓"}</li>
            </ul>
          </div>

          {error && !error.includes("inválido") && (
            <div style={{ padding: "12px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#ef4444", fontSize: "13px" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            style={{
              padding: "10px",
              background: loading || !password || !confirmPassword ? "rgba(234,88,12,0.4)" : "linear-gradient(135deg, #ea580c, #c2410c)",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontWeight: 600,
              cursor: loading || !password || !confirmPassword ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontSize: "14px",
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Lock size={16} />
                Redefinir Senha
              </>
            )}
          </button>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
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
        <Suspense fallback={<div style={{ textAlign: "center", padding: "40px" }}>Carregando...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
