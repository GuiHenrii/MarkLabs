"use client";

import { useState, useEffect, useRef } from "react";
import {
  Image as ImageIcon, Video, Smile, Hash, AtSign, MapPin,
  Clock, Send, Save, ChevronDown, X, Plus, Eye,
  Camera, Video as VideoIcon, Briefcase, Globe, Sparkles, RectangleHorizontal, Square, Clapperboard
} from "lucide-react";
import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { getPlatformLabel } from "@/lib/utils";

const platformIcons: Record<string, React.ElementType> = {
  INSTAGRAM: Camera,
  FACEBOOK: Globe,
  LINKEDIN: Briefcase,
  YOUTUBE: VideoIcon,
};

const platformColors: Record<string, string> = {
  INSTAGRAM: "#e1306c",
  FACEBOOK: "#1877f2",
  LINKEDIN: "#0a66c2",
  TIKTOK: "#010101",
  YOUTUBE: "#ff0000",
};

const characterLimits: Record<string, number> = {
  INSTAGRAM: 2200,
  FACEBOOK: 63206,
  LINKEDIN: 3000,
  TIKTOK: 150,
  YOUTUBE: 5000,
};

const postTypes = [
  { id: "POST", label: "Post", description: "Imagem, vídeo ou carrossel para o feed.", icon: Square },
  { id: "REEL", label: "Reel", description: "Conteúdo vertical com foco em alcance.", icon: Clapperboard },
  { id: "STORY", label: "Story", description: "Conteúdo rápido e efêmero para stories.", icon: Sparkles },
  { id: "CAROUSEL", label: "Carrossel", description: "Sequência de várias mídias no mesmo post.", icon: RectangleHorizontal },
] as const;

type MediaItem = { url: string; type: "IMAGE" | "VIDEO"; width?: number; height?: number; order?: number };

type MediaCheck = { status: "compatible" | "incompatible" | "unknown"; message: string };

function getTargetAspectRatio(postType: string) {
  if (postType === "REEL" || postType === "STORY") return 9 / 16;
  if (postType === "CAROUSEL") return 1;
  return 4 / 5;
}

async function loadImageElement(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Não foi possível ler a imagem selecionada."));
      img.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function adjustImageToBestAspectRatio(file: File, postType: string) {
  if (!file.type.startsWith("image/")) return file;

  const targetRatio = getTargetAspectRatio(postType);
  const image = await loadImageElement(file);
  const sourceRatio = image.naturalWidth / image.naturalHeight;

  if (Math.abs(sourceRatio - targetRatio) < 0.02) return file;

  const canvas = document.createElement("canvas");
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;

  if (sourceRatio > targetRatio) {
    sourceWidth = Math.round(image.naturalHeight * targetRatio);
    sourceX = Math.round((image.naturalWidth - sourceWidth) / 2);
  } else {
    sourceHeight = Math.round(image.naturalWidth / targetRatio);
    sourceY = Math.round((image.naturalHeight - sourceHeight) / 2);
  }

  canvas.width = sourceWidth;
  canvas.height = sourceHeight;

  const context = canvas.getContext("2d");
  if (!context) return file;

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, file.type || "image/jpeg", 0.92));
  if (!blob) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "");
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  return new File([blob], `${baseName}-${postType.toLowerCase()}-${sourceWidth}x${sourceHeight}.${extension}`, {
    type: file.type || "image/jpeg",
    lastModified: Date.now(),
  });
}

function getImageDimensions(url: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Não foi possível ler a imagem selecionada."));
    img.src = url;
  });
}

function getVideoDimensions(url: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => resolve({ width: video.videoWidth, height: video.videoHeight });
    video.onerror = () => reject(new Error("Não foi possível ler o vídeo selecionado."));
    video.src = url;
  });
}

async function validateInstagramMedia(postType: string, media: MediaItem[]) {
  if (!media.length) return null;
  const first = media[0];
  const isVideo = first.type === "VIDEO";
  const { width, height } = isVideo ? await getVideoDimensions(first.url) : await getImageDimensions(first.url);
  const ratio = width / height;

  if (postType === "REEL") {
    if (!isVideo) return "Reel precisa ser um vídeo.";
    if (ratio < 0.56 || ratio > 0.58) return "Reel precisa estar em proporção vertical 9:16.";
  }

  if (postType === "STORY") {
    if (ratio < 0.55 || ratio > 0.58) return "Story precisa estar em proporção vertical 9:16.";
  }

  if (postType === "POST") {
    if (ratio < 0.8 || ratio > 1.95) return "Post do Instagram precisa estar entre 4:5, 1:1 ou 1.91:1.";
  }

  if (postType === "CAROUSEL" && media.length < 2) {
    return "Carrossel precisa de pelo menos 2 mídias.";
  }

  return null;
}

function getMediaCheck(postType: string, media: MediaItem[]): MediaCheck {
  if (!media.length) {
    return { status: "unknown", message: "Adicione mídia para validar o formato." };
  }

  const first = media[0];
  const ratio = first.width && first.height ? first.width / first.height : null;

  if (postType === "REEL") {
    if (first.type !== "VIDEO") return { status: "incompatible", message: "Reel precisa ser vídeo vertical 9:16." };
    if (!ratio) return { status: "unknown", message: "Dimensões do vídeo ainda não foram lidas." };
    return ratio >= 0.56 && ratio <= 0.58
      ? { status: "compatible", message: "Reel compatível com 9:16." }
      : { status: "incompatible", message: "Reel fora de 9:16." };
  }

  if (postType === "STORY") {
    if (!ratio) return { status: "unknown", message: "Dimensões ainda não foram lidas." };
    return ratio >= 0.55 && ratio <= 0.58
      ? { status: "compatible", message: "Story compatível com 9:16." }
      : { status: "incompatible", message: "Story fora de 9:16." };
  }

  if (postType === "POST") {
    if (!ratio) return { status: "unknown", message: "Dimensões ainda não foram lidas." };
    if (ratio >= 0.8 && ratio <= 1.0) return { status: "compatible", message: "Formato bom para feed quadrado/retrato." };
    if (ratio >= 1.8 && ratio <= 2.0) return { status: "compatible", message: "Formato bom para feed paisagem." };
    return { status: "incompatible", message: "Formato pode falhar no feed do Instagram." };
  }

  if (postType === "CAROUSEL") {
    return media.length >= 2
      ? { status: "compatible", message: "Carrossel pronto para publicação." }
      : { status: "incompatible", message: "Carrossel precisa de pelo menos 2 mídias." };
  }

  return { status: "unknown", message: "Sem validação disponível." };
}

function moveMediaItem(items: MediaItem[], fromIndex: number, toIndex: number) {
  if (toIndex < 0 || toIndex >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next.map((entry, index) => ({ ...entry, order: index }));
}

// ─── Platform Preview ─────────────────────────────────────────────────────────
function PlatformPreview({
  platform,
  content,
  account,
  media = [],
  postType = "POST",
}: {
  platform: string;
  content: string;
  account: { id: string; platform: string; name: string; username?: string; avatar?: string } | undefined;
  media?: MediaItem[];
  postType?: string;
}) {
  const color = platformColors[platform] ?? "#ea580c";

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      {/* Preview header */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: color,
          }}
        />
        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
          Pré-visualização {getPlatformLabel(platform)}
        </span>
      </div>

      {/* Simulated post */}
      <div style={{ padding: "14px" }}>
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: `${color}20`,
              border: `2px solid ${color}40`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {account?.avatar ? (
              <img src={account.avatar} alt={account?.name ?? "Avatar"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              "🏢"
            )}
          </div>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
              {account?.name ?? "Sua Conta"}
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {account?.username ?? ""} · Agora
            </p>
          </div>
        </div>

        {content ? (
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}
          >
            {content}
          </p>
        ) : (
          <p style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>
            O texto do post aparecerá aqui...
          </p>
        )}

        {/* Media Preview Grid */}
        {media.length > 0 && (
          <div style={{ marginTop: "12px", borderRadius: "8px", overflow: "hidden", display: "grid", gridTemplateColumns: media.length === 1 ? "1fr" : "1fr 1fr", gap: "2px" }}>
            {media.map((m, idx) => (
              <div
                key={idx}
                style={{
                  aspectRatio:
                    postType === "REEL" || postType === "STORY"
                      ? "9/16"
                      : media.length === 1
                        ? "4/5"
                        : "1/1",
                  background: "#000",
                }}
              >
                {m.type === "VIDEO" ? (
                  <video src={m.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} controls />
                ) : (
                  <img src={m.url} alt="media" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reaction bar */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "12px",
            paddingTop: "10px",
            borderTop: "1px solid var(--border)",
          }}
        >
          {["❤️ Curtir", "💬 Comentar", "↗️ Compartilhar"].map((a) => (
            <span key={a} style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {a}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useTeam } from "@/components/providers/TeamProvider";

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ComposePage() {
  const { teamId } = useTeam();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [postType, setPostType] = useState<(typeof postTypes)[number]["id"]>("POST");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [previewPlatform, setPreviewPlatform] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [autoAdjustNotice, setAutoAdjustNotice] = useState<string | null>(null);
  const [activeToolbarMenu, setActiveToolbarMenu] = useState<string | null>(null);
  const [mediaCheck, setMediaCheck] = useState<MediaCheck>({ status: "unknown", message: "Adicione mídia para validar o formato." });

  const toolbarData: Record<string, string[]> = {
    emoji: ["😀", "😂", "🥰", "😎", "🤔", "🔥", "✨", "🚀", "🎉", "👍"],
    hashtag: ["#marketing", "#socialmedia", "#vendas", "#business", "#empreendedorismo"],
    mention: ["@joaodasilva", "@empresa_ltda", "@parceiro_oficial", "@influencer_br"],
    location: ["São Paulo, SP", "Rio de Janeiro, RJ", "Belo Horizonte, MG", "Curitiba, PR"]
  };

  // Fetch connected accounts from API
  useEffect(() => {
    if (!teamId) return;

    const fetchAccounts = async () => {
      try {
        setLoadingAccounts(true);
        const res = await fetch(`/api/social/accounts?teamId=${teamId}`);
        if (!res.ok) throw new Error("Erro ao carregar contas");
        const accounts = await res.json();
        setConnectedAccounts(accounts);
      } catch (err) {
        console.error("Erro ao buscar contas:", err);
        setConnectedAccounts([]);
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, [teamId]);

  const handlePublish = async (asDraft = false) => {
    if (!teamId || selectedAccounts.length === 0 || !content.trim()) return;
    setIsPublishing(true);
    setMessage(null);

    try {
      const targetAccount = selectedAccountsData[0];
      if (!asDraft && targetAccount?.platform === "INSTAGRAM") {
        const validationError = await validateInstagramMedia(postType, media);
        if (validationError) {
          setMessage({ type: "error", text: validationError });
          setIsPublishing(false);
          return;
        }
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          socialAccountId: selectedAccounts[0],
          content,
          postType,
          media,
          isPublishNow: asDraft ? false : !isScheduling,
          scheduledAt: (!asDraft && isScheduling && scheduleDate) ? `${scheduleDate}T${scheduleTime || "12:00"}:00Z` : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao publicar");
      }

      setMessage({ type: "success", text: asDraft ? "Rascunho salvo com sucesso! 📝" : isScheduling ? "Post agendado com sucesso! 🎉" : "Post publicado e enviado para a fila! 🚀" });
      setContent("");
      setMedia([]);
      setPostType("POST");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleTestPublish = async () => {
    if (!selectedAccountsData.length || !content.trim()) return;
    setIsPublishing(true);
    setMessage(null);
    try {
      const targetAccount = selectedAccountsData[0];
      if (targetAccount?.platform === "INSTAGRAM") {
        const validationError = await validateInstagramMedia(postType, media);
        if (validationError) {
          setMessage({ type: "error", text: validationError });
          return;
        }
      }
      setMessage({ type: "success", text: "Validação concluída. O post está pronto para enviar." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const selectedAccountsData = connectedAccounts.filter((a) =>
    selectedAccounts.includes(a.id)
  );
  const selectedPlatform = selectedAccountsData[0]?.platform ?? "INSTAGRAM";

  const activePreviewAccount = selectedAccountsData.find(
    (a) => a.platform === previewPlatform
  );

  // Character limit for most restrictive selected platform
  const limit = selectedAccountsData.length > 0
    ? Math.min(...selectedAccountsData.map((a) => characterLimits[a.platform] ?? 2200))
    : 2200;

  const charPercent = Math.min((content.length / limit) * 100, 100);
  const charColor = charPercent > 90 ? "#ef4444" : charPercent > 75 ? "#f59e0b" : "#10b981";

  useEffect(() => {
    let alive = true;
    (async () => {
      if (selectedPlatform !== "INSTAGRAM") {
        setMediaCheck({ status: "unknown", message: "Validação específica do Instagram disponível quando uma conta IG estiver selecionada." });
        return;
      }
      if (!media.length) {
        setMediaCheck({ status: "unknown", message: "Adicione mídia para validar o formato." });
        return;
      }
      const first = media[0];
      if (!first.width || !first.height) {
        const dims = first.type === "VIDEO" ? await getVideoDimensions(first.url) : await getImageDimensions(first.url);
        if (!alive) return;
        setMedia((prev) => prev.map((item, index) => index === 0 ? { ...item, ...dims } : item));
      }
      if (!alive) return;
      const check = getMediaCheck(postType, media);
      setMediaCheck(check);
    })().catch((error) => {
      if (!alive) return;
      setMediaCheck({ status: "unknown", message: error instanceof Error ? error.message : "Não foi possível validar a mídia." });
    });
    return () => { alive = false; };
  }, [media, postType, selectedPlatform]);

  return (
    <>
      <Topbar title="Criar Post" subtitle="Crie e agende posts para suas redes sociais" />

      <main
        style={{
          padding: "24px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(320px, 0.8fr)",
          gap: "20px",
          flex: 1,
          alignItems: "start",
          background: "linear-gradient(180deg, rgba(234,88,12,0.04), transparent 25%)",
        }}
        className="animate-fade-in"
      >
        {/* Left: Composer */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Account Selection */}
          <div
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.02), transparent 100%), var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "18px",
              padding: "20px",
              boxShadow: "0 18px 40px rgba(0,0,0,0.14)",
            }}
          >
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "14px" }}>
              Publicar em
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {connectedAccounts.map((account) => {
                const isSelected = selectedAccounts.includes(account.id);
                const color = platformColors[account.platform] ?? "#ea580c";
                const Icon = platformIcons[account.platform];

                return (
                  <button
                    key={account.id}
                    id={`account-${account.id}`}
                    onClick={() => toggleAccount(account.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 14px",
                      borderRadius: "10px",
                      border: isSelected ? `1.5px solid ${color}60` : "1.5px solid var(--border)",
                      background: isSelected ? `${color}15` : "var(--bg-secondary)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: isSelected ? `${color}25` : "var(--bg-card)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      {account.avatar ? (
                        <img src={account.avatar} alt={account.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        account.name?.charAt(0) || "👤"
                      )}
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: isSelected ? "var(--text-primary)" : "var(--text-secondary)" }}>
                        {account.name}
                      </p>
                      <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                        {account.username}
                      </p>
                    </div>
                    {Icon && (
                      <Icon size={13} style={{ color: isSelected ? color : "var(--text-muted)", marginLeft: "2px" }} />
                    )}
                  </button>
                );
              })}

              <Link
                href="/settings"
                id="connect-account-btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  border: "1.5px dashed var(--border-light)",
                  background: "transparent",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  fontSize: "12px",
                  transition: "all 0.15s ease",
                  textDecoration: "none"
                }}
              >
                <Plus size={13} />
                Conectar conta
              </Link>
            </div>
          </div>

          {/* Content Editor */}
          <div
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.02), transparent 100%), var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "18px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              boxShadow: "0 18px 40px rgba(0,0,0,0.14)",
            }}
          >
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
              Conteúdo
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px" }}>
              {postTypes.map((type) => {
                const active = postType === type.id;
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setPostType(type.id)}
                    style={{
                      textAlign: "left",
                      padding: "14px",
                      borderRadius: "14px",
                      border: active ? "1px solid rgba(234,88,12,0.45)" : "1px solid var(--border)",
                      background: active ? "linear-gradient(180deg, rgba(234,88,12,0.14), rgba(234,88,12,0.06))" : "var(--bg-secondary)",
                      cursor: "pointer",
                      color: "inherit",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <Icon size={16} style={{ color: active ? "#fb923c" : "var(--text-muted)" }} />
                      <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: active ? "#fb923c" : "var(--text-muted)", fontWeight: 700 }}>
                        {active ? "Selecionado" : "Formato"}
                      </span>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>{type.label}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>{type.description}</div>
                  </button>
                );
              })}
            </div>

            {selectedPlatform === "INSTAGRAM" && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: `1px solid ${mediaCheck.status === "compatible" ? "rgba(16,185,129,0.28)" : mediaCheck.status === "incompatible" ? "rgba(239,68,68,0.28)" : "var(--border)"}`,
                  background: mediaCheck.status === "compatible" ? "rgba(16,185,129,0.08)" : mediaCheck.status === "incompatible" ? "rgba(239,68,68,0.08)" : "var(--bg-secondary)",
                  color: "var(--text-secondary)",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <span>{mediaCheck.message}</span>
                <span style={{ fontWeight: 700, color: mediaCheck.status === "compatible" ? "#10b981" : mediaCheck.status === "incompatible" ? "#ef4444" : "var(--text-muted)" }}>
                  {mediaCheck.status === "compatible" ? "Compatível" : mediaCheck.status === "incompatible" ? "Incompatível" : "Aguardando"}
                </span>
              </div>
            )}

              <textarea
                id="post-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva seu post aqui... Use # para hashtags e @ para mencionar pessoas."
              rows={8}
              style={{
                width: "100%",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "14px",
                color: "var(--text-primary)",
                fontSize: "14px",
                lineHeight: 1.7,
                resize: "vertical",
                outline: "none",
                fontFamily: "inherit",
                transition: "border-color 0.15s ease",
              }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Formato atual: <span style={{ color: "#fb923c", fontWeight: 700 }}>{postTypes.find((t) => t.id === postType)?.label}</span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {media.length} mídia(s) anexada(s)
              </div>
            </div>

            {/* Media Preview */}
            {media.length > 0 && (
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {media.map((m, idx) => (
                  <div key={`${m.url}-${idx}`} style={{ position: "relative", width: "80px", height: "80px", borderRadius: "8px", overflow: "hidden", border: `1px solid ${mediaCheck.status === "compatible" ? "rgba(16,185,129,0.45)" : mediaCheck.status === "incompatible" ? "rgba(239,68,68,0.45)" : "var(--border)"}` }}>
                    {m.type === "VIDEO" ? (
                      <video src={m.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <img src={m.url} alt="upload" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                    <div style={{ position: "absolute", inset: "auto 4px 4px 4px", display: "flex", justifyContent: "space-between", gap: "4px" }}>
                      <button
                        onClick={() => setMedia((prev) => moveMediaItem(prev, idx, idx - 1))}
                        disabled={idx === 0}
                        style={{ width: "20px", height: "20px", borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.55)", color: "white", cursor: idx === 0 ? "not-allowed" : "pointer" }}
                        title="Mover para cima"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => setMedia((prev) => moveMediaItem(prev, idx, idx + 1))}
                        disabled={idx === media.length - 1}
                        style={{ width: "20px", height: "20px", borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.55)", color: "white", cursor: idx === media.length - 1 ? "not-allowed" : "pointer" }}
                        title="Mover para baixo"
                      >
                        ↓
                      </button>
                    </div>
                    <button
                      onClick={() => setMedia((prev) => prev.filter((_, i) => i !== idx).map((entry, order) => ({ ...entry, order })))}
                      style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", cursor: "pointer" }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "4px" }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                  hidden
                  onChange={async (e) => {
                      const files = e.target.files;
                      if (!files || !teamId) return;

                      try {
                        for (const file of Array.from(files)) {
                          const preparedFile = await adjustImageToBestAspectRatio(file, postType);
                          if (preparedFile !== file) {
                            setAutoAdjustNotice(`Imagem ajustada automaticamente para ${postType === "REEL" || postType === "STORY" ? "9:16" : postType === "CAROUSEL" ? "1:1" : "4:5"}.`);
                          }
                          const form = new FormData();
                          form.append("teamId", teamId);
                          form.append("file", preparedFile);
                          form.append("folder", "Geral");
                          form.append("tags", "");

                          const res = await fetch("/api/media/upload", {
                            method: "POST",
                            body: form,
                          });

                          if (!res.ok) {
                            const err = await res.json().catch(() => ({}));
                            throw new Error(err.error || "Falha ao enviar o arquivo pelo servidor.");
                          }

                          const mediaItem = await res.json();
                          setMedia((prev) => [
                            ...prev,
                            {
                              url: mediaItem.url,
                              type: mediaItem.type,
                              width: mediaItem.width ?? undefined,
                              height: mediaItem.height ?? undefined,
                              order: prev.length,
                            },
                          ]);
                        }
                    } finally {
                      e.target.value = "";
                    }
                  }}
                />
                <button
                  id="add-media-btn"
                  title="Adicionar Mídia"
                  onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
                  style={{
                    width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center",
                    background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "8px",
                    cursor: "pointer", color: "var(--text-muted)", transition: "all 0.15s ease",
                  }}
                >
                  <ImageIcon size={15} />
                </button>

                {[
                  { icon: Smile, label: "Emojis", id: "emoji" },
                  { icon: Hash, label: "Hashtags", id: "hashtag" },
                  { icon: AtSign, label: "Mencionar", id: "mention" },
                  { icon: MapPin, label: "Local", id: "location" },
                ].map(({ icon: Icon, label, id }) => (
                  <div key={id} style={{ position: "relative" }}>
                    <button
                      id={`add-${id}-btn`}
                      title={label}
                      onClick={() => setActiveToolbarMenu(activeToolbarMenu === id ? null : id)}
                      style={{
                        width: "34px",
                        height: "34px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: activeToolbarMenu === id ? "rgba(234,88,12,0.15)" : "var(--bg-secondary)",
                        border: "1px solid",
                        borderColor: activeToolbarMenu === id ? "rgba(234,88,12,0.3)" : "var(--border)",
                        borderRadius: "8px",
                        cursor: "pointer",
                        color: activeToolbarMenu === id ? "#ea580c" : "var(--text-muted)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <Icon size={15} />
                    </button>
                    {activeToolbarMenu === id && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "44px",
                          left: 0,
                          background: "var(--bg-card)",
                          border: "1px solid var(--border)",
                          borderRadius: "10px",
                          boxShadow: "0 -8px 24px rgba(0,0,0,0.15)",
                          padding: "8px",
                          zIndex: 10,
                          display: "grid",
                          gridTemplateColumns: id === "emoji" ? "repeat(5, 1fr)" : "1fr",
                          gap: "4px",
                          minWidth: id === "emoji" ? "180px" : "200px"
                        }}
                      >
                        {toolbarData[id].map((item) => (
                          <button
                            key={item}
                            onClick={() => {
                              setContent((prev) => prev + (id === "location" ? `📍 ${item} ` : `${item} `));
                              setActiveToolbarMenu(null);
                            }}
                            style={{
                              padding: "8px",
                              background: "none",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              textAlign: "left",
                              fontSize: id === "emoji" ? "18px" : "13px",
                              color: "var(--text-primary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: id === "emoji" ? "center" : "flex-start",
                            }}
                            className="toolbar-menu-item"
                          >
                            {id === "location" && <MapPin size={13} style={{ marginRight: "6px", color: "var(--text-muted)" }} />}
                            {item}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <style>{`
                .toolbar-menu-item:hover {
                  background: var(--bg-hover) !important;
                }
              `}</style>

              {/* Character counter */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <svg width="28" height="28" viewBox="0 0 28 28">
                  <circle cx="14" cy="14" r="11" fill="none" stroke="var(--border)" strokeWidth="2.5" />
                  <circle
                    cx="14"
                    cy="14"
                    r="11"
                    fill="none"
                    stroke={charColor}
                    strokeWidth="2.5"
                    strokeDasharray={`${2 * Math.PI * 11}`}
                    strokeDashoffset={`${2 * Math.PI * 11 * (1 - charPercent / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 14 14)"
                    style={{ transition: "stroke-dashoffset 0.3s ease, stroke 0.3s ease" }}
                  />
                </svg>
                <span style={{ fontSize: "12px", color: charPercent > 90 ? charColor : "var(--text-muted)", fontWeight: 500 }}>
                  {limit - content.length}
                </span>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.02), transparent 100%), var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "18px",
              padding: "20px",
              boxShadow: "0 18px 40px rgba(0,0,0,0.14)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                Agendamento
              </h2>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <div
                  onClick={() => setIsScheduling(!isScheduling)}
                  style={{
                    width: "40px",
                    height: "22px",
                    borderRadius: "11px",
                    background: isScheduling ? "#ea580c" : "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    position: "relative",
                    cursor: "pointer",
                    transition: "background 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      background: "#fff",
                      position: "absolute",
                      top: "2px",
                      left: isScheduling ? "20px" : "2px",
                      transition: "left 0.2s ease",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    }}
                  />
                </div>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  Agendar para depois
                </span>
              </label>
            </div>

            {isScheduling && (
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
                    Data
                  </label>
                  <input
                    id="schedule-date"
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
                    Horário
                  </label>
                  <input
                    id="schedule-time"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            )}

            {!isScheduling && (
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                O post será publicado imediatamente ao clicar em "Publicar agora".
              </p>
            )}

            <div style={{ marginTop: "14px", display: "grid", gap: "10px" }}>
              {autoAdjustNotice && (
                <div style={{ padding: "10px 12px", borderRadius: "12px", background: "rgba(14,165,233,0.10)", border: "1px solid rgba(14,165,233,0.22)", color: "#38bdf8", fontSize: "12px", fontWeight: 600 }}>
                  {autoAdjustNotice}
                </div>
              )}
              <div style={{ padding: "12px", borderRadius: "12px", background: "rgba(234,88,12,0.08)", border: "1px solid rgba(234,88,12,0.18)" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#fb923c", marginBottom: "4px" }}>Fluxo atual</div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {postType === "STORY"
                    ? "Story normalmente usa mídia única e tem janela curta de publicação."
                    : postType === "REEL"
                      ? "Reels prioriza vídeo vertical e pode ser entregue com compartilhamento no feed."
                      : postType === "CAROUSEL"
                        ? "Carrossel publica várias mídias na mesma peça."
                        : "Post padrão suporta imagem, vídeo ou múltiplas mídias no feed."}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              id="save-draft-btn"
              onClick={() => handlePublish(true)}
              disabled={selectedAccounts.length === 0 || !content.trim() || isPublishing}
              style={{
                flex: 1,
                padding: "12px",
                background: selectedAccounts.length === 0 || !content.trim() || isPublishing ? "var(--bg-secondary)" : "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                color: selectedAccounts.length === 0 || !content.trim() || isPublishing ? "var(--text-muted)" : "var(--text-secondary)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: selectedAccounts.length === 0 || !content.trim() || isPublishing ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                transition: "all 0.15s ease",
              }}
            >
              <Save size={15} />
              Salvar Rascunho
            </button>

            <button
              id="test-publish-btn"
              onClick={handleTestPublish}
              disabled={selectedAccounts.length === 0 || !content.trim() || isPublishing}
              style={{
                flex: 1.2,
                padding: "12px",
                background: selectedAccounts.length === 0 || !content.trim() || isPublishing ? "var(--bg-secondary)" : "rgba(14,165,233,0.15)",
                border: "1px solid rgba(14,165,233,0.25)",
                borderRadius: "10px",
                color: selectedAccounts.length === 0 || !content.trim() || isPublishing ? "var(--text-muted)" : "#38bdf8",
                fontSize: "14px",
                fontWeight: 600,
                cursor: selectedAccounts.length === 0 || !content.trim() || isPublishing ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                transition: "all 0.15s ease",
              }}
            >
              <Eye size={15} />
              Publicação Teste
            </button>

            {message && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  background: message.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                  border: `1px solid ${message.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                  color: message.type === "success" ? "#10b981" : "#ef4444",
                }}
              >
                {message.text}
              </div>
            )}

            <button
              id="publish-btn"
              onClick={() => handlePublish()}
              disabled={selectedAccounts.length === 0 || !content.trim() || isPublishing}
              style={{
                flex: 2,
                padding: "12px",
                background:
                  selectedAccounts.length === 0 || !content.trim() || isPublishing
                    ? "rgba(234,88,12,0.3)"
                    : "linear-gradient(135deg, #ea580c, #c2410c)",
                border: "none",
                borderRadius: "10px",
                color: selectedAccounts.length === 0 || !content.trim() || isPublishing ? "rgba(255,255,255,0.4)" : "#fff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: selectedAccounts.length === 0 || !content.trim() || isPublishing ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                boxShadow: selectedAccounts.length > 0 && content.trim() ? "0 0 16px rgba(234,88,12,0.35)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              {isScheduling ? <Clock size={15} /> : <Send size={15} />}
              {isPublishing ? "Enviando..." : isScheduling ? "Agendar Post" : "Publicar Agora"}
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "sticky", top: "88px" }}>
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Eye size={15} style={{ color: "#fb923c" }} />
              <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                Pré-visualização
              </h2>
            </div>

            {selectedAccountsData.length > 0 ? (
              <>
                {/* Platform selector tabs */}
                <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>
                  {selectedAccountsData.map((account) => {
                    const color = platformColors[account.platform] ?? "#ea580c";
                    const isActive = previewPlatform === account.platform;
                    return (
                      <button
                        key={account.id}
                        onClick={() => setPreviewPlatform(isActive ? null : account.platform)}
                        style={{
                          padding: "5px 11px",
                          borderRadius: "20px",
                          border: isActive ? `1px solid ${color}50` : "1px solid var(--border)",
                          background: isActive ? `${color}18` : "var(--bg-secondary)",
                          color: isActive ? color : "var(--text-muted)",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {getPlatformLabel(account.platform)}
                      </button>
                    );
                  })}
                </div>

                {(previewPlatform
                  ? selectedAccountsData.filter((a) => a.platform === previewPlatform)
                  : selectedAccountsData
                ).map((account) => (
                  <div key={account.id} style={{ marginBottom: "12px" }}>
                    <PlatformPreview
                      platform={account.platform}
                      content={content}
                      account={account}
                      media={media}
                    />
                    <div style={{ marginTop: "8px", fontSize: "11px", color: "var(--text-muted)" }}>
                      Tipo: {postTypes.find((t) => t.id === postType)?.label} · {selectedPlatform}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div>
                <PlatformPreview
                  platform="INSTAGRAM"
                  content={content}
                  account={undefined}
                  media={media}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
