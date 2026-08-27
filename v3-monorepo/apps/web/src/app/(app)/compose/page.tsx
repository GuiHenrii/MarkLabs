"use client";

import { useState, useEffect, useRef, type CSSProperties } from "react";
import {
  Image as ImageIcon, Video, Smile, Hash, AtSign, MapPin,
  Clock, Send, Save, ChevronDown, X, Plus, Eye,
  Camera, Video as VideoIcon, Briefcase, Globe, Sparkles, RectangleHorizontal, Square, Clapperboard, Check, ArrowUpRight
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

type MediaItem = {
  url: string;
  publicUrl?: string;
  previewUrl?: string;
  type: "IMAGE" | "VIDEO";
  width?: number;
  height?: number;
  duration?: number;
  order?: number;
  cropFocus?: number;
  coverTime?: number;
  coverUrl?: string;
};
type PostTypeId = (typeof postTypes)[number]["id"];

type MediaCheck = { status: "compatible" | "incompatible" | "unknown"; message: string };
type FormatCheck = { type: PostTypeId; label: string; check: MediaCheck };

function getTargetAspectRatio(postType: string | null | undefined) {
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
      img.onerror = () => reject(new Error("A imagem não pôde ser lida pelo navegador."));
      img.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function adjustImageToBestAspectRatio(file: File, postType: string | null | undefined, cropFocus = 0) {
  if (!file.type.startsWith("image/")) return file;

  const safePostType = postType ?? "POST";
  const targetRatio = getTargetAspectRatio(safePostType);
  let image: HTMLImageElement;
  try {
    image = await loadImageElement(file);
  } catch {
    return file;
  }

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
    const available = Math.max(image.naturalHeight - sourceHeight, 0);
    sourceY = Math.round(available / 2 + available * 0.35 * cropFocus);
    sourceY = Math.max(0, Math.min(sourceY, available));
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
  return new File([blob], `${baseName}-${safePostType.toLowerCase()}-${sourceWidth}x${sourceHeight}.${extension}`, {
    type: file.type || "image/jpeg",
    lastModified: Date.now(),
  });
}

async function fetchFileFromUrl(url: string, fileName: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Não foi possível carregar a mídia enviada.");
  const blob = await response.blob();
  const type = response.headers.get("content-type") || blob.type || "application/octet-stream";
  return new File([blob], fileName, { type, lastModified: Date.now() });
}

async function fileToPreviewUrl(file: File) {
  return URL.createObjectURL(file);
}

async function uploadPreparedMedia(teamId: string, file: File) {
  const form = new FormData();
  form.append("teamId", teamId);
  form.append("file", file);
  form.append("folder", "Geral");
  form.append("tags", "");

  const res = await fetch("/api/media/upload", { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Falha ao enviar o arquivo pelo servidor.");
  }

  return res.json();
}

function getImageDimensions(url: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("A imagem não pôde ser lida para validação."));
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

function getVideoMetadata(url: string) {
  return new Promise<{ width: number; height: number; duration: number }>((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: Number.isFinite(video.duration) ? video.duration : 0,
      });
    };
    video.onerror = () => reject(new Error("Não foi possível ler o vídeo selecionado."));
    video.src = url;
  });
}

function captureVideoFrame(url: string, time = 0.1) {
  return new Promise<string>((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.src = url;

    const cleanup = () => {
      video.onseeked = null;
      video.removeAttribute("src");
      video.load();
    };

    video.onloadedmetadata = () => {
      const seekTo = Math.min(Math.max(time, 0), Math.max(video.duration - 0.1, 0));
      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Não foi possível gerar a capa do vídeo.");
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.9));
        } catch (error) {
          reject(error);
        } finally {
          cleanup();
        }
      };
      video.currentTime = seekTo;
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Não foi possível capturar a capa do vídeo."));
    };
  });
}

async function validateInstagramMedia(postType: string, media: MediaItem[]) {
  if (!media.length) return null;
  const first = media[0];
  const isVideo = first.type === "VIDEO";
  const sourceUrl = first.previewUrl ?? first.url;
  const { width, height } = isVideo ? await getVideoDimensions(sourceUrl) : await getImageDimensions(sourceUrl);
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

function getFormatsStatus(postTypesSelected: PostTypeId[], media: MediaItem[]): FormatCheck[] {
  const safeTypes: PostTypeId[] = postTypesSelected.length > 0 ? postTypesSelected : ["POST"];
  return safeTypes.map((type) => ({
    type,
    label: postTypes.find((item) => item.id === type)?.label ?? type,
    check: getMediaCheck(type, media),
  }));
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
                  <video src={m.previewUrl ?? m.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} controls />
                ) : (
                  <img src={m.previewUrl ?? m.url} alt="media" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
  const [postTypesSelected, setPostTypesSelected] = useState<PostTypeId[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [previewPlatform, setPreviewPlatform] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [autoAdjustNotice, setAutoAdjustNotice] = useState<string | null>(null);
  const [activeToolbarMenu, setActiveToolbarMenu] = useState<string | null>(null);
  const [storyCropFocus, setStoryCropFocus] = useState(0);
  const [mediaCheck, setMediaCheck] = useState<MediaCheck>({ status: "unknown", message: "Adicione mídia para validar o formato." });
  const [videoCoverMessages, setVideoCoverMessages] = useState<Record<number, string | null>>({});
  const activePostType = postTypesSelected[0] ?? null;
  const selectedFormats: PostTypeId[] = postTypesSelected;
  const formatStatuses = getFormatsStatus(selectedFormats, media);
  const isStoryMode = activePostType === "STORY";
  const isCarouselMode = activePostType === "CAROUSEL";

  const toolbarData: Record<string, string[]> = {
    emoji: ["😀", "😂", "🥰", "😎", "🤔", "🔥", "✨", "🚀", "🎉", "👍"],
    hashtag: ["#marketing", "#socialmedia", "#vendas", "#business", "#empreendedorismo"],
    mention: ["@joaodasilva", "@empresa_ltda", "@parceiro_oficial", "@influencer_br"],
    location: ["São Paulo, SP", "Rio de Janeiro, RJ", "Belo Horizonte, MG", "Curitiba, PR"]
  };

  const updateMediaItem = (index: number, updater: (item: MediaItem) => MediaItem) => {
    setMedia((prev) => prev.map((item, itemIndex) => (itemIndex === index ? updater(item) : item)));
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
    if (!teamId || selectedAccounts.length === 0 || !content.trim() || postTypesSelected.length === 0) return;
    setIsPublishing(true);
    setMessage(null);
    const skippedFormats: string[] = [];

    try {
      const targetAccount = selectedAccountsData[0];
      const typesToPublish: PostTypeId[] = postTypesSelected;

      for (const type of typesToPublish) {
        if (!asDraft && targetAccount?.platform === "INSTAGRAM") {
          const validationError = await validateInstagramMedia(type, media);
          if (validationError) {
            skippedFormats.push(`${postTypes.find((t) => t.id === type)?.label ?? type}: ${validationError}`);
            continue;
          }
        }

        const preparedMedia: MediaItem[] = [];
        for (const item of media) {
          if (item.type === "VIDEO") {
            if (type === "REEL" && item !== media[0]) continue;
            preparedMedia.push(item);
            continue;
          }

          const original = await fetchFileFromUrl(item.previewUrl ?? item.publicUrl ?? item.url, `${type.toLowerCase()}-${Date.now()}.jpg`);
          const adjusted = await adjustImageToBestAspectRatio(original, type, item.cropFocus ?? 0).catch(() => original);
          const uploaded = await uploadPreparedMedia(teamId, adjusted);
          preparedMedia.push({
            url: uploaded.url,
            publicUrl: uploaded.url,
            type: uploaded.type,
            width: uploaded.width ?? undefined,
            height: uploaded.height ?? undefined,
            order: preparedMedia.length,
            cropFocus: item.cropFocus ?? 0,
          });
        }

        const scheduledAt = (!asDraft && isScheduling && scheduleDate)
          ? new Date(`${scheduleDate}T${scheduleTime || "12:00"}:00`).toISOString()
          : null;

        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamId,
            socialAccountId: selectedAccounts[0],
            content,
            postType: type,
            media: preparedMedia,
            isPublishNow: asDraft ? false : !isScheduling,
            scheduledAt,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || `Erro ao publicar ${type}.`);
        }
      }

      const successText = asDraft
        ? "Rascunho salvo com sucesso! 📝"
        : isScheduling
          ? "Posts agendados com sucesso! 🎉"
          : "Posts publicados e enviados para a fila! 🚀";

      setMessage({
        type: "success",
        text: skippedFormats.length > 0
          ? `${successText} Alguns formatos foram ignorados: ${skippedFormats.join(" | ")}`
          : successText,
      });
      setContent("");
      setMedia([]);
      setPostTypesSelected(["POST"]);
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
        const validationError = await validateInstagramMedia(activePostType, media);
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
        try {
          const dims = first.type === "VIDEO" ? await getVideoDimensions(first.previewUrl ?? first.url) : await getImageDimensions(first.previewUrl ?? first.url);
          if (!alive) return;
          setMedia((prev) => prev.map((item, index) => (index === 0 ? { ...item, ...dims } : item)));
        } catch {
          if (!alive) return;
          setMediaCheck({ status: "unknown", message: "Não foi possível ler a mídia; seguindo sem validação automática." });
          return;
        }
      }
      if (!alive) return;
      const check = getMediaCheck(activePostType, media);
      setMediaCheck(check);
    })().catch((error) => {
      if (!alive) return;
      setMediaCheck({ status: "unknown", message: error instanceof Error ? error.message : "Não foi possível validar a mídia." });
    });
    return () => { alive = false; };
  }, [media, activePostType, selectedPlatform]);

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
        }}
        className="tech-page compose-page animate-fade-in mobile-content"
      >
        {/* Left: Composer */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <section
            className="light-hero"
            style={{
              borderRadius: "26px",
              padding: "24px 26px",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ maxWidth: "760px" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 14px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.88)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.03em",
                    textTransform: "uppercase",
                  }}
                >
                  <Sparkles size={12} />
                  Mark Share studio
                </div>
                <h2 style={{ marginTop: "14px", fontSize: "36px", lineHeight: 1.02, letterSpacing: "-0.055em", color: "var(--text-primary)" }}>
                  Mark Share
                </h2>
                <p style={{ marginTop: "8px", fontSize: "18px", fontWeight: 700, color: "#ea580c" }}>
                  Conteúdo social com acabamento de marca.
                </p>
                <p style={{ marginTop: "10px", fontSize: "14px", color: "var(--text-secondary)", maxWidth: "62ch" }}>
                  Um painel editorial para criar, organizar e publicar com presença visual, fluidez e consistência.
                </p>
              </div>

              <div style={{ display: "grid", gap: "10px", minWidth: "260px" }}>
                <div className="light-card" style={{ padding: "14px", borderRadius: "18px" }}>
                  <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#c2410c", fontWeight: 800 }}>Status</div>
                  <div style={{ marginTop: "6px", fontSize: "14px", color: "var(--text-secondary)" }}>Ambiente pronto para compor seu próximo post.</div>
                </div>
                <Link href="/accounts" className="compose-accounts-link">
                    Ver contas
                </Link>
              </div>
            </div>
          </section>

          {/* Account Selection */}
          <section className="channel-selector">
            <div className="channel-heading">
              <div>
                <span className="channel-eyebrow"><Globe size={12} /> DISTRIBUIÇÃO</span>
                <h2>Onde vamos publicar?</h2>
                <p>Escolha um ou mais perfis para receber este conteúdo.</p>
              </div>
              <span className="selected-counter">
                <i />
                {selectedAccounts.length} selecionada{selectedAccounts.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="channel-groups">
              {(["INSTAGRAM", "FACEBOOK", "LINKEDIN"] as const).map((platform) => {
                const platformAccounts = connectedAccounts.filter((account) => account.platform === platform);
                if (platformAccounts.length === 0) return null;

                const GroupIcon = platformIcons[platform];
                const groupColor = platformColors[platform] ?? "#ea580c";

                return (
                  <div key={platform} className="channel-group" style={{ "--channel-color": groupColor } as CSSProperties}>
                    <div className="channel-group-heading">
                      <span>{GroupIcon && <GroupIcon size={15} />} {getPlatformLabel(platform)}</span>
                      <small>{platformAccounts.length} perfil{platformAccounts.length === 1 ? "" : "is"}</small>
                    </div>
                    <div className="channel-grid">
                      {platformAccounts.map((account) => {
                        const isSelected = selectedAccounts.includes(account.id);
                        const Icon = platformIcons[account.platform];

                        return (
                          <button
                            key={account.id}
                            id={`account-${account.id}`}
                            onClick={() => toggleAccount(account.id)}
                            aria-pressed={isSelected}
                            className={`channel-card${isSelected ? " is-selected" : ""}`}
                            style={{ "--channel-color": groupColor } as CSSProperties}
                          >
                            <div className="channel-avatar">
                              {account.avatar ? (
                                <img src={account.avatar} alt={account.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                account.name?.charAt(0) || "M"
                              )}
                            </div>
                            <div className="channel-copy">
                              <strong>{account.name}</strong>
                              <span>@{account.username || "perfil"}</span>
                            </div>
                            {Icon && <span className="channel-platform"><Icon size={14} /></span>}
                            <span className="channel-check"><Check size={13} strokeWidth={3} /></span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <Link href="/accounts" id="connect-account-btn" className="connect-channel">
                <span><Plus size={16} /></span>
                <div><strong>Nova conexão</strong><small>Adicionar outro perfil</small></div>
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </section>

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
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "-6px" }}>
              Selecione um ou mais formatos. O sistema vai ajustar a mesma foto para cada um e publicar separado.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px" }}>
              {postTypes.map((type) => {
                const active = postTypesSelected.includes(type.id);
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setPostTypesSelected((prev) => prev.includes(type.id) ? prev.filter((item) => item !== type.id) : [...prev, type.id])}
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
            {postTypesSelected.length === 0 && (
              <div style={{ fontSize: "12px", color: "#f59e0b", marginTop: "4px" }}>
                Selecione pelo menos um formato para continuar.
              </div>
            )}

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
                Formatos selecionados: <span style={{ color: "#fb923c", fontWeight: 700 }}>{selectedFormats.map((id) => postTypes.find((t) => t.id === id)?.label).filter(Boolean).join(", ")}</span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {media.length} mídia(s) anexada(s)
              </div>
            </div>

            {(isStoryMode || isCarouselMode) && media.some((item) => item.type === "IMAGE") && (
              <div
                style={{
                  padding: "12px",
                  borderRadius: "12px",
                  background: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(59,130,246,0.22)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                      {isStoryMode ? "Ajuste do Story" : "Ajuste do Carrossel"}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                      A imagem será cortada automaticamente. Use o controle para subir ou descer o enquadramento.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Media Preview */}
            {media.length > 0 && (
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {media.map((m, idx) => (
                  <div key={`${m.url}-${idx}`} style={{ position: "relative", width: "80px", height: "80px", borderRadius: "8px", overflow: "hidden", border: `1px solid ${mediaCheck.status === "compatible" ? "rgba(16,185,129,0.45)" : mediaCheck.status === "incompatible" ? "rgba(239,68,68,0.45)" : "var(--border)"}` }}>
                    {m.type === "VIDEO" ? (
                      <video src={m.previewUrl ?? m.url} poster={m.coverUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <img src={m.previewUrl ?? m.url} alt="upload" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
                    {(isStoryMode || isCarouselMode) && m.type === "IMAGE" && (
                      <div style={{ position: "absolute", left: "4px", right: "4px", bottom: "4px", display: "flex", alignItems: "center", gap: "4px", padding: "3px 5px", borderRadius: "999px", background: "rgba(0,0,0,0.74)" }}>
                        <button
                          onClick={() => setMedia((prev) => prev.map((item, index) => index === idx ? { ...item, cropFocus: Math.max(-1, (item.cropFocus ?? 0) - 0.2) } : item))}
                          style={{ width: "18px", height: "18px", borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.08)", color: "#fff", cursor: "pointer", fontSize: "12px" }}
                          title="Subir enquadramento"
                        >
                          ↑
                        </button>
                        <input
                          type="range"
                          min={-1}
                          max={1}
                          step={0.1}
                          value={m.cropFocus ?? 0}
                          onChange={(e) => setMedia((prev) => prev.map((item, index) => index === idx ? { ...item, cropFocus: Number(e.target.value) } : item))}
                          style={{ flex: 1, accentColor: "#38bdf8" }}
                        />
                        <button
                          onClick={() => setMedia((prev) => prev.map((item, index) => index === idx ? { ...item, cropFocus: Math.min(1, (item.cropFocus ?? 0) + 0.2) } : item))}
                          style={{ width: "18px", height: "18px", borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.08)", color: "#fff", cursor: "pointer", fontSize: "12px" }}
                          title="Descer enquadramento"
                        >
                          ↓
                        </button>
                      </div>
                    )}
                    {m.type === "VIDEO" && (
                      <div style={{ position: "absolute", left: "4px", right: "4px", bottom: "4px", display: "grid", gap: "4px", padding: "4px 5px", borderRadius: "8px", background: "rgba(0,0,0,0.74)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                          <span style={{ fontSize: "10px", color: "#fff", fontWeight: 700 }}>Capa</span>
                          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)" }}>
                            {m.coverTime !== undefined ? `${Math.round(m.coverTime)}s` : "auto"}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(1, Math.floor(m.duration ?? 5))}
                          step={0.1}
                          value={m.coverTime ?? 0}
                          onChange={async (e) => {
                            const nextTime = Number(e.target.value);
                            setVideoCoverMessages((prev) => ({ ...prev, [idx]: "Atualizando capa..." }));
                            try {
                              const nextCoverUrl = await captureVideoFrame(m.previewUrl ?? m.url, nextTime);
                              updateMediaItem(idx, (item) => ({ ...item, coverTime: nextTime, coverUrl: nextCoverUrl }));
                              setVideoCoverMessages((prev) => ({ ...prev, [idx]: null }));
                            } catch {
                              setVideoCoverMessages((prev) => ({ ...prev, [idx]: "Não foi possível gerar a capa." }));
                            }
                          }}
                          style={{ width: "100%", accentColor: "#38bdf8" }}
                          title="Selecionar capa do vídeo"
                        />
                        {videoCoverMessages[idx] && (
                          <span style={{ fontSize: "9px", color: "#fff", lineHeight: 1.2 }}>
                            {videoCoverMessages[idx]}
                          </span>
                        )}
                      </div>
                    )}
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
                          const preparedFile = await adjustImageToBestAspectRatio(file, activePostType, 0);
                          if (preparedFile !== file) {
                            setAutoAdjustNotice(`Imagem ajustada automaticamente para ${activePostType === "REEL" || activePostType === "STORY" ? "9:16" : activePostType === "CAROUSEL" ? "1:1" : "4:5"}.`);
                          }
                          const previewUrl = URL.createObjectURL(preparedFile);
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
                          let coverUrl: string | undefined;
                          let duration: number | undefined;
                          if (mediaItem.type === "VIDEO") {
                            try {
                              const metadata = await getVideoMetadata(previewUrl);
                              duration = metadata.duration;
                              coverUrl = await captureVideoFrame(
                                previewUrl,
                                Math.min(0.5, Math.max(metadata.duration * 0.15, 0.1)),
                              );
                            } catch {
                              coverUrl = undefined;
                              duration = undefined;
                            }
                          }
                          setMedia((prev) => [
                            ...prev,
                            {
                              url: mediaItem.url,
                              publicUrl: mediaItem.url,
                              previewUrl,
                              type: mediaItem.type,
                              width: mediaItem.width ?? undefined,
                              height: mediaItem.height ?? undefined,
                              duration,
                              coverUrl,
                              coverTime: coverUrl ? 0.5 : undefined,
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
                    {activePostType === "STORY"
                      ? "Story normalmente usa mídia única e tem janela curta de publicação."
                      : activePostType === "REEL"
                        ? "Reels prioriza vídeo vertical e pode ser entregue com compartilhamento no feed."
                      : activePostType === "CAROUSEL"
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
                disabled={selectedAccounts.length === 0 || !content.trim() || isPublishing || postTypesSelected.length === 0}
                style={{
                  flex: 2,
                  padding: "12px",
                  background:
                    selectedAccounts.length === 0 || !content.trim() || isPublishing || postTypesSelected.length === 0
                      ? "rgba(234,88,12,0.3)"
                      : "linear-gradient(135deg, #ea580c, #c2410c)",
                  border: "none",
                  borderRadius: "10px",
                  color: selectedAccounts.length === 0 || !content.trim() || isPublishing || postTypesSelected.length === 0 ? "rgba(255,255,255,0.4)" : "#fff",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: selectedAccounts.length === 0 || !content.trim() || isPublishing || postTypesSelected.length === 0 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  boxShadow: selectedAccounts.length > 0 && content.trim() && postTypesSelected.length > 0 ? "0 0 16px rgba(234,88,12,0.35)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
              {isScheduling ? <Clock size={15} /> : <Send size={15} />}
              {isPublishing ? "Enviando..." : isScheduling ? `Agendar ${selectedFormats.length} formato(s)` : `Publicar ${selectedFormats.length} formato(s)`}
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
                    {formatStatuses.map(({ type, label, check }) => (
                      <div key={`${account.id}-${type}`} style={{ marginBottom: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            {label}
                          </span>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: check.status === "compatible" ? "#10b981" : check.status === "incompatible" ? "#ef4444" : "var(--text-muted)" }}>
                            {check.status === "compatible" ? "Compatível" : check.status === "incompatible" ? "Incompatível" : "Aguardando"}
                          </span>
                        </div>
                        <PlatformPreview
                          platform={account.platform}
                          content={content}
                          account={account}
                          media={media}
                          postType={type}
                        />
                        <div style={{ marginTop: "8px", fontSize: "11px", color: "var(--text-muted)" }}>
                          Tipo: {label} · {selectedPlatform}
                        </div>
                      </div>
                    ))}
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
                  postType={activePostType}
                />
              </div>
            )}
          </div>
        </div>
      </main>
      <style>{`
        .compose-accounts-link{height:44px;padding:0 14px;display:inline-flex;align-items:center;justify-content:center;color:#eee;border:1px solid rgba(255,255,255,.13);border-radius:13px;background:rgba(255,255,255,.055);font-size:12px;font-weight:800;text-decoration:none;transition:.2s}.compose-accounts-link:hover{transform:translateY(-2px);border-color:rgba(244,84,11,.4)}
        .channel-selector{padding:20px;border:1px solid var(--border);border-radius:22px;background:var(--bg-card);box-shadow:0 16px 42px rgba(0,0,0,.1)}.channel-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:17px}.channel-eyebrow{display:flex;align-items:center;gap:7px;color:#f4540b;font-size:9px;font-weight:850;letter-spacing:.14em}.channel-heading h2{margin-top:5px;color:var(--text-primary);font-size:18px;letter-spacing:-.025em}.channel-heading p{margin-top:3px;color:var(--text-muted);font-size:11px}.selected-counter{display:flex;align-items:center;gap:7px;padding:7px 10px;white-space:nowrap;color:var(--text-muted);border:1px solid var(--border);border-radius:999px;background:var(--bg-secondary);font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.selected-counter i{width:6px;height:6px;border-radius:50%;background:#f4540b;box-shadow:0 0 10px rgba(244,84,11,.8)}
        .channel-groups{display:grid;gap:18px}.channel-group{display:grid;gap:9px}.channel-group+.channel-group{padding-top:17px;border-top:1px solid var(--border)}.channel-group-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}.channel-group-heading>span{display:flex;align-items:center;gap:7px;color:var(--channel-color);font-size:12px;font-weight:850;letter-spacing:.01em}.channel-group-heading small{padding:4px 8px;color:var(--text-muted);border:1px solid var(--border);border-radius:999px;background:var(--bg-secondary);font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}.channel-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.channel-card{--channel-color:#f4540b;position:relative;min-width:0;height:68px;padding:10px 40px 10px 10px;display:flex;align-items:center;gap:10px;overflow:hidden;text-align:left;color:var(--text-primary);border:1px solid var(--border);border-radius:14px;background:var(--bg-secondary);cursor:pointer;transition:transform .18s ease,border-color .18s ease,background .18s ease,box-shadow .18s ease}.channel-card:before{content:"";position:absolute;left:0;top:15px;bottom:15px;width:2px;border-radius:2px;background:var(--channel-color);opacity:.45}.channel-card:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--channel-color) 42%,var(--border));box-shadow:0 10px 25px rgba(0,0,0,.1)}.channel-card.is-selected{border-color:color-mix(in srgb,var(--channel-color) 58%,var(--border));background:color-mix(in srgb,var(--channel-color) 9%,var(--bg-secondary));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--channel-color) 18%,transparent)}.channel-card.is-selected:before{opacity:1;box-shadow:0 0 12px var(--channel-color)}.channel-avatar{width:38px;height:38px;display:grid;place-items:center;flex:0 0 auto;overflow:hidden;color:var(--channel-color);border:1px solid color-mix(in srgb,var(--channel-color) 24%,var(--border));border-radius:12px;background:color-mix(in srgb,var(--channel-color) 8%,var(--bg-card));font-size:12px;font-weight:900}.channel-copy{min-width:0;display:grid;gap:2px}.channel-copy strong,.channel-copy span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.channel-copy strong{font-size:11px;line-height:1.3}.channel-copy span{color:var(--text-muted);font-size:9px}.channel-platform{position:absolute;right:11px;top:10px;color:var(--channel-color);opacity:.75}.channel-check{position:absolute;right:10px;bottom:9px;width:18px;height:18px;display:grid;place-items:center;color:#fff;border-radius:50%;background:var(--channel-color);opacity:0;transform:scale(.7);transition:.18s}.channel-card.is-selected .channel-check{opacity:1;transform:scale(1)}
        .connect-channel{min-height:68px;padding:10px;display:flex;align-items:center;gap:10px;color:var(--text-muted);border:1px dashed var(--border-light);border-radius:14px;text-decoration:none;transition:.18s}.connect-channel:hover{color:#f4540b;border-color:rgba(244,84,11,.5);background:rgba(244,84,11,.04);transform:translateY(-2px)}.connect-channel>span{width:36px;height:36px;display:grid;place-items:center;flex:0 0 auto;border:1px solid var(--border);border-radius:11px;background:var(--bg-secondary)}.connect-channel>div{min-width:0;display:grid}.connect-channel strong{font-size:11px;color:var(--text-primary)}.connect-channel small{font-size:9px}.connect-channel>svg{margin-left:auto;flex:0 0 auto}
        html.light .channel-selector{box-shadow:0 16px 42px rgba(55,34,20,.06)}html.light .channel-card{background:#fffdfb}@media(max-width:1250px){.channel-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:720px){.channel-heading{align-items:flex-start;flex-direction:column}.channel-grid{grid-template-columns:1fr}}
      `}</style>
    </>
  );
}
