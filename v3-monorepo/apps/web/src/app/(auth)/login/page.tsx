"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Zap, Eye, EyeOff, ArrowRight, AlertCircle, Globe, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

type LegalTab = "terms" | "privacy" | "cookies" | null;

const meteors = [
  { top: "2%", left: "-14%", size: 52, duration: "7.8s", delay: "-1.2s", rotate: 26, drift: "-6px" },
  { top: "5%", left: "14%", size: 92, duration: "8.4s", delay: "-4.6s", rotate: 20, drift: "8px" },
  { top: "9%", left: "66%", size: 38, duration: "7.2s", delay: "-3.1s", rotate: 28, drift: "-10px" },
  { top: "18%", left: "-16%", size: 118, duration: "8.9s", delay: "-6.8s", rotate: 23, drift: "5px" },
  { top: "24%", left: "84%", size: 60, duration: "7.5s", delay: "-7.5s", rotate: 25, drift: "-8px" },
  { top: "31%", left: "2%", size: 142, duration: "9.2s", delay: "-2.8s", rotate: 17, drift: "7px" },
  { top: "39%", left: "-11%", size: 66, duration: "8.1s", delay: "-5.9s", rotate: 24, drift: "-5px" },
  { top: "47%", left: "78%", size: 108, duration: "8.7s", delay: "-8.2s", rotate: 21, drift: "6px" },
  { top: "56%", left: "-15%", size: 44, duration: "7.9s", delay: "-3.9s", rotate: 30, drift: "-7px" },
  { top: "66%", left: "10%", size: 126, duration: "8.6s", delay: "-9.4s", rotate: 18, drift: "8px" },
  { top: "74%", left: "72%", size: 70, duration: "9.4s", delay: "-5.7s", rotate: 22, drift: "-9px" },
  { top: "84%", left: "-8%", size: 54, duration: "7.6s", delay: "-6.3s", rotate: 27, drift: "4px" },
];

const particles = [
  { top: "12%", left: "22%", size: 4, duration: "11s", delay: "-1s" },
  { top: "18%", left: "68%", size: 3, duration: "13s", delay: "-4s" },
  { top: "28%", left: "42%", size: 5, duration: "14s", delay: "-7s" },
  { top: "41%", left: "16%", size: 3, duration: "10s", delay: "-3s" },
  { top: "53%", left: "79%", size: 4, duration: "12s", delay: "-6s" },
  { top: "67%", left: "34%", size: 3, duration: "15s", delay: "-8s" },
  { top: "76%", left: "58%", size: 5, duration: "11s", delay: "-5s" },
  { top: "88%", left: "27%", size: 3, duration: "13s", delay: "-2s" },
];

const legalContent: Record<Exclude<LegalTab, null>, { title: string; text: string[] }> = {
  terms: {
    title: "Termos de Uso",
    text: [
      "Ao acessar ou usar o MarkLabs, você concorda com estes termos e com as políticas complementares da plataforma.",
      "Você deve fornecer informações verdadeiras, manter suas credenciais seguras e responder pelo uso da sua conta.",
      "O serviço pode incluir integrações com terceiros, e o uso dessas integrações também depende das regras desses provedores.",
      "Podemos alterar funcionalidades, suspender recursos ou atualizar estes termos quando necessário.",
    ],
  },
  privacy: {
    title: "Aviso de Privacidade",
    text: [
      "Tratamos dados pessoais para autenticação, operação da conta, suporte, segurança, análises e cumprimento de obrigações legais.",
      "Podemos coletar dados cadastrais, conteúdo enviado, dados de uso, identificadores técnicos e informações de integração com redes sociais.",
      "Os dados podem ser compartilhados com provedores essenciais do serviço, como autenticação, hospedagem, analytics e envio de email.",
      "Você pode solicitar acesso, correção, exclusão e outras solicitações previstas na LGPD pelos canais oficiais da plataforma.",
    ],
  },
  cookies: {
    title: "Política de Cookies",
    text: [
      "Usamos cookies e tecnologias semelhantes para manter sua sessão, lembrar preferências e medir o uso da plataforma.",
      "Cookies essenciais são necessários para login, navegação e segurança.",
      "Cookies de análise podem ser usados para melhorar desempenho e experiência, quando habilitados.",
      "Você pode gerenciar cookies pelo navegador, mas bloquear itens essenciais pode afetar o funcionamento do serviço.",
    ],
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [legalTab, setLegalTab] = useState<LegalTab>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      setMouse({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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
          "ngrok-skip-browser-warning": "69420",
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

      const loginResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

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

  const activeLegal = legalTab ? legalContent[legalTab] : null;

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
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at center, rgba(0,0,0,0) 0 22%, rgba(0,0,0,0.94) 25%, rgba(0,0,0,0.99) 60%), linear-gradient(180deg, rgba(10,10,12,0.12), rgba(10,10,12,0.62))",
            transform: `translate3d(${mouse.x * 8}px, ${mouse.y * 8}px, 0)`,
            transition: "transform 120ms linear",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 50% 50%, rgba(255,122,0,0.16) 0%, rgba(255,122,0,0.06) 18%, rgba(0,0,0,0) 45%)",
            transform: `translate3d(${mouse.x * 3}px, ${mouse.y * 3}px, 0)`,
            transition: "transform 160ms linear",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 1,
            filter: "drop-shadow(0 0 12px rgba(255, 122, 0, 1)) drop-shadow(0 0 28px rgba(255, 96, 0, 0.82)) drop-shadow(0 0 46px rgba(255, 72, 0, 0.3))",
            transform: `translate3d(${mouse.x * 18}px, ${mouse.y * 18}px, 0)`,
            transition: "transform 90ms linear",
          }}
        >
          {particles.map((particle, index) => (
            <div
              key={`particle-${index}`}
              style={{
                position: "absolute",
                top: particle.top,
                left: particle.left,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                borderRadius: "999px",
                background: "rgba(255,122,0,0.9)",
                boxShadow: "0 0 10px rgba(255,122,0,0.75), 0 0 18px rgba(255,92,0,0.35)",
                animation: `particle-float ${particle.duration} linear ${particle.delay} infinite`,
                opacity: 0.38,
              }}
            />
          ))}
          {meteors.map((meteor, index) => (
            <div
              key={`${meteor.top}-${index}`}
              style={{
                position: "absolute",
                top: meteor.top,
                left: meteor.left,
                width: `${meteor.size}px`,
                height: `${meteor.size}px`,
                animationName: "meteor-fall",
                animationDuration: meteor.duration,
                animationTimingFunction: "linear",
                animationDelay: meteor.delay,
                animationIterationCount: "infinite",
                animationFillMode: "both",
                willChange: "transform, opacity",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: `${Math.max(20, Math.round(meteor.size * 0.34))}px`,
                  height: `${Math.max(20, Math.round(meteor.size * 0.34))}px`,
                  transform: `translate(-50%, -50%) rotate(${meteor.rotate}deg)`,
                  clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                  border: "1px solid rgba(255, 170, 70, 0.98)",
                  background: "linear-gradient(180deg, rgba(255, 242, 214, 0.98), rgba(255, 148, 36, 0.98) 48%, rgba(180, 58, 0, 0.98))",
                  boxShadow: "0 0 10px rgba(255, 160, 48, 0.92), 0 0 24px rgba(255, 122, 0, 0.82), 0 0 44px rgba(255, 92, 0, 0.38), inset 0 0 12px rgba(255, 210, 150, 0.22)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                }}
              />
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            top: "16%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "760px",
            height: "760px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,130,0,0.24) 0%, rgba(255,110,0,0.14) 12%, rgba(255,90,0,0.08) 24%, transparent 70%)",
            filter: "blur(18px)",
            animation: "halo-pulse 3.8s ease-in-out infinite",
            marginLeft: `${mouse.x * 24}px`,
            marginTop: `${mouse.y * 10}px`,
            transition: "margin 120ms linear",
          }}
        />
      </div>

        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            position: "relative",
            zIndex: 2,
            animation: "fadeIn 0.4s ease-out",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: "-22px -28px",
              borderRadius: "28px",
              background:
                "radial-gradient(circle at center, rgba(255,130,0,0.16) 0%, rgba(255,98,0,0.07) 26%, rgba(0,0,0,0) 64%)",
              filter: "blur(30px)",
              opacity: 0.9,
              zIndex: -1,
              animation: "card-glow 4.5s ease-in-out infinite",
            }}
          />
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <Logo width={220} className="mb-4" />
            <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "12px" }}>
              Gestão inteligente de redes sociais
          </p>
        </div>

        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "18px",
            padding: "32px",
          }}
          suppressHydrationWarning
          className="glass"
        >
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
              onClick={() => {
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
              }}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
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
              }}
            >
              Criar conta
            </button>
          </div>

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

          <form
            onSubmit={handleSubmit}
            suppressHydrationWarning
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {tab === "register" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label htmlFor="name-input" style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                  Nome
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Seu nome"
                  id="name-input"
                  required={tab === "register"}
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
                  }}
                />
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label htmlFor="email-input" style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
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
                suppressHydrationWarning
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label htmlFor="password-input" style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                Senha
              </label>
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
                  suppressHydrationWarning
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
              type="submit"
              disabled={isLoading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
                padding: "11px",
                background: isLoading ? "rgba(234,88,12,0.5)" : "linear-gradient(135deg, #ea580c, #c2410c)",
                border: "none",
                borderRadius: "10px",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: isLoading ? "not-allowed" : "pointer",
                boxShadow: "0 0 16px rgba(234,88,12,0.3)",
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

            <p
              style={{
                margin: "2px 0 0",
                fontSize: "12px",
                lineHeight: 1.6,
                color: "var(--text-muted)",
                textAlign: "center",
              }}
            >
              Ao continuar, você concorda com os{" "}
              <button
                type="button"
                onClick={() => setLegalTab("terms")}
                style={{
                  color: "#fb923c",
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                  fontWeight: 500,
                  cursor: "pointer",
                  padding: 0,
                  background: "transparent",
                  border: "none",
                }}
              >
                Termos de Uso
              </button>
              ,{" "}
              <button
                type="button"
                onClick={() => setLegalTab("privacy")}
                style={{
                  color: "#fb923c",
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                  fontWeight: 500,
                  cursor: "pointer",
                  padding: 0,
                  background: "transparent",
                  border: "none",
                }}
              >
                Política de Privacidade
              </button>{" "}
              e{" "}
              <button
                type="button"
                onClick={() => setLegalTab("cookies")}
                style={{
                  color: "#fb923c",
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                  fontWeight: 500,
                  cursor: "pointer",
                  padding: 0,
                  background: "transparent",
                  border: "none",
                }}
              >
                Política de Cookies
              </button>
              .
            </p>
          </form>
        </div>

        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: "0",
            borderRadius: "18px",
            overflow: "hidden",
            pointerEvents: "none",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.008) 20%, rgba(255,255,255,0.022) 50%, rgba(255,255,255,0.008) 80%, rgba(255,255,255,0.02))",
            mixBlendMode: "screen",
            opacity: 0.22,
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: "0",
            borderRadius: "18px",
            pointerEvents: "none",
            background:
              "repeating-linear-gradient(180deg, rgba(255,255,255,0) 0px, rgba(255,255,255,0) 3px, rgba(255,140,0,0.06) 4px, rgba(255,255,255,0) 7px)",
            opacity: 0.08,
            animation: "scanline-move 7s linear infinite",
          }}
        />
      </div>

      {activeLegal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLegalTab(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(720px, 100%)",
              maxHeight: "85vh",
              overflowY: "auto",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "18px",
              padding: "24px",
              boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
            }}
          >
            <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: "16px" }}>
              <div>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Informações legais
                </p>
                <h2 style={{ margin: "6px 0 0", fontSize: "28px", lineHeight: 1.1 }}>{activeLegal.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setLegalTab(null)}
                aria-label="Fechar"
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  borderRadius: "10px",
                  width: "36px",
                  height: "36px",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ marginTop: "20px", display: "grid", gap: "14px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
              {activeLegal.text.map((paragraph) => (
                <p key={paragraph} style={{ margin: 0 }}>
                  {paragraph}
                </p>
              ))}
            </div>

            <div style={{ marginTop: "20px", display: "flex", flexWrap: "wrap", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setLegalTab("terms")}
                style={{
                  border: "1px solid var(--border)",
                  background: legalTab === "terms" ? "rgba(234,88,12,0.16)" : "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  borderRadius: "999px",
                  padding: "8px 14px",
                  cursor: "pointer",
                }}
              >
                Termos
              </button>
              <button
                type="button"
                onClick={() => setLegalTab("privacy")}
                style={{
                  border: "1px solid var(--border)",
                  background: legalTab === "privacy" ? "rgba(234,88,12,0.16)" : "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  borderRadius: "999px",
                  padding: "8px 14px",
                  cursor: "pointer",
                }}
              >
                Privacidade
              </button>
              <button
                type="button"
                onClick={() => setLegalTab("cookies")}
                style={{
                  border: "1px solid var(--border)",
                  background: legalTab === "cookies" ? "rgba(234,88,12,0.16)" : "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  borderRadius: "999px",
                  padding: "8px 14px",
                  cursor: "pointer",
                }}
              >
                Cookies
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes meteor-fall {
          0% {
            transform: translate3d(-34vw, -12vh, 0) rotate(0deg) scale(0.9);
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          50% {
            transform: translate3d(48vw, 52vh, 0) rotate(0deg) translateX(0px) scale(1);
          }
          100% {
            transform: translate3d(138vw, 124vh, 0) rotate(0deg) translateX(0px) scale(1.02);
            opacity: 0;
          }
        }

        @keyframes halo-pulse {
          0%, 100% {
            transform: translateX(-50%) scale(0.98);
            opacity: 0.55;
          }
          50% {
            transform: translateX(-50%) scale(1.05);
            opacity: 1;
          }
        }

        @keyframes card-glow {
          0%, 100% {
            opacity: 0.65;
            transform: scale(0.98);
          }
          50% {
            opacity: 1;
            transform: scale(1.04);
          }
        }

        @keyframes scanline-move {
          from {
            background-position: 0 0;
          }
          to {
            background-position: 0 120px;
          }
        }

        @keyframes particle-float {
          0% {
            transform: translate3d(0, 0, 0);
            opacity: 0;
          }
          20% {
            opacity: 0.35;
          }
          100% {
            transform: translate3d(10px, -18px, 0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
