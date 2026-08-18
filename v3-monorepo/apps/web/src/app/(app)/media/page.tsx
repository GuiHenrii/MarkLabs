"use client";

import { useRef, useState, useEffect } from "react";
import { Upload, Search, Grid3x3, List, Video, Folder, MoreHorizontal, Plus, X, ExternalLink, Download, Check, Loader2 } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { useTeam } from "@/components/providers/TeamProvider";

function formatSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

type MediaItem = {
  id: string;
  name: string;
  type: "IMAGE" | "VIDEO";
  size: number;
  url: string;
  publicId?: string;
  folder: string;
  tags: string[];
  width?: number;
  height?: number;
  createdAt: string;
};

const ALL_FOLDER = "Todos";

export default function MediaPage() {
  const { teamId } = useTeam();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedFolder, setSelectedFolder] = useState(ALL_FOLDER);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [customFolders, setCustomFolders] = useState<string[]>([]);

  // Fetch media from API
  useEffect(() => {
    if (!teamId) return;
    setLoading(true);
    fetch(`/api/media/upload?teamId=${teamId}`)
      .then((r) => r.json())
        .then((data: any[]) => {
          setMediaList(
            data.map((m) => ({
              id: m.id,
              name: m.name,
              type: m.type,
              size: m.size,
              url: m.url || `/api/media/${m.id}/file?teamId=${teamId}`,
              publicId: m.publicId,
              folder: m.folder || "Geral",
              tags: m.tags || [],
            width: m.width,
            height: m.height,
            createdAt: new Date(m.createdAt).toLocaleDateString("pt-BR"),
          }))
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [teamId]);

  // Folders derived from data + custom created
  const folders = [ALL_FOLDER, ...Array.from(new Set([...mediaList.map((m) => m.folder), ...customFolders])).sort()];

  const filtered = mediaList.filter((m) => {
    const matchFolder = selectedFolder === ALL_FOLDER || m.folder === selectedFolder;
    const q = searchQuery.toLowerCase();
    const matchSearch = m.name.toLowerCase().includes(q) || m.tags.some((t) => t.toLowerCase().includes(q));
    return matchFolder && matchSearch;
  });

  const toggleSelect = (id: string) => {
    setSelectedMedia((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleNewFolder = () => {
    const name = window.prompt("Nome da nova pasta:");
    if (name && name.trim()) {
      setCustomFolders((prev) => [...prev, name.trim()]);
      setSelectedFolder(name.trim());
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja apagar esta mídia?")) return;
    try {
      const res = await fetch(`/api/media/${id}?teamId=${teamId}`, { method: "DELETE" });
      if (res.ok) {
        setMediaList((prev) => prev.filter((m) => m.id !== id));
        if (previewItem?.id === id) setPreviewItem(null);
      } else {
        alert("Erro ao apagar a mídia.");
      }
    } catch (e) {
      alert("Erro ao apagar a mídia.");
    }
  };

  const totalSize = mediaList.reduce((acc, m) => acc + m.size, 0);

  return (
    <>
      <Topbar title="Banco de Mídias" subtitle="Organize e reutilize suas imagens e vídeos" />

      <main
        style={{ padding: "24px", display: "grid", gridTemplateColumns: "200px 1fr", gap: "20px", flex: 1, alignItems: "start" }}
        className="animate-fade-in"
      >
        {/* Left sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", position: "sticky", top: "88px" }}>
          {/* Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
            hidden
            onChange={async (e) => {
              const files = e.target.files;
              if (!files || !teamId) return;
              setUploading(true);
              try {
                for (const file of Array.from(files)) {
                  const folder = selectedFolder === ALL_FOLDER ? "Geral" : selectedFolder;
                  const fallbackForm = new FormData();
                  fallbackForm.append("teamId", teamId);
                  fallbackForm.append("file", file);
                  fallbackForm.append("folder", folder);
                  fallbackForm.append("tags", "");

                  const finalizeRes = await fetch("/api/media/upload", {
                    method: "POST",
                    body: fallbackForm,
                  });

                  if (!finalizeRes.ok) {
                    const err = await finalizeRes.json().catch(() => ({}));
                    throw new Error(err.error || "Arquivo enviado, mas falhou ao salvar a m�dia.");
                  }

                  const media = await finalizeRes.json();
                  setMediaList((prev) => [{
                    id: media.id,
                    name: media.name,
                    type: media.type,
                    size: media.size,
                    url: media.url,
                    publicId: media.publicId,
                    folder: media.folder || "Geral",
                    tags: media.tags || [],
                    width: media.width,
                    height: media.height,
                    createdAt: new Date(media.createdAt).toLocaleDateString("pt-BR"),
                  }, ...prev]);
                }
              } finally {
                setUploading(false);
                e.target.value = "";
              }
            }}
          />
          <button
            id="upload-media-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
              padding: "10px", background: uploading ? "rgba(234,88,12,0.5)" : "linear-gradient(135deg, #ea580c, #c2410c)",
              border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: 600,
              cursor: uploading ? "not-allowed" : "pointer", boxShadow: "0 0 12px rgba(234,88,12,0.3)",
              marginBottom: "12px", transition: "all 0.2s ease",
            }}
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? "Enviando..." : "Upload R2"}
          </button>

          {/* Stats */}
          <div style={{ padding: "10px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", marginBottom: "12px" }}>
            <p style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>Total usado</p>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{formatSize(totalSize)}</p>
            <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>{mediaList.length} arquivo{mediaList.length !== 1 ? "s" : ""}</p>
          </div>

          <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", padding: "0 8px", marginBottom: "6px" }}>
            Pastas
          </p>

          {folders.map((folder) => (
            <button
              key={folder}
              id={`folder-${folder}`}
              onClick={() => setSelectedFolder(folder)}
              style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "8px",
                border: "none", background: selectedFolder === folder ? "rgba(234,88,12,0.15)" : "transparent",
                color: selectedFolder === folder ? "#fb923c" : "var(--text-secondary)", fontSize: "13px",
                fontWeight: selectedFolder === folder ? 600 : 400, cursor: "pointer", textAlign: "left",
                transition: "all 0.15s ease",
              }}
            >
              <Folder size={13} style={{ color: selectedFolder === folder ? "#fb923c" : "var(--text-muted)" }} />
              {folder}
            </button>
          ))}

          <button
            onClick={handleNewFolder}
            style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "8px",
              border: "1px dashed var(--border-light)", background: "transparent", color: "var(--text-muted)",
              fontSize: "12px", cursor: "pointer", marginTop: "8px",
            }}
          >
            <Plus size={12} /> Nova pasta
          </button>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "9px", padding: "0 12px", height: "36px" }}>
              <Search size={13} style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Buscar por nome ou tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="media-search"
                style={{ background: "none", border: "none", outline: "none", fontSize: "13px", color: "var(--text-primary)", width: "100%" }}
              />
            </div>

            <div style={{ display: "flex", gap: "4px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "9px", padding: "3px" }}>
              {[{ id: "grid", icon: Grid3x3 }, { id: "list", icon: List }].map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  id={`view-${id}`}
                  onClick={() => setView(id as "grid" | "list")}
                  style={{
                    width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: "6px", border: "none", background: view === id ? "rgba(234,88,12,0.2)" : "transparent",
                    color: view === id ? "#fb923c" : "var(--text-muted)", cursor: "pointer",
                  }}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>

            {selectedMedia.length > 0 && (
              <button
                onClick={() => setSelectedMedia([])}
                style={{ padding: "6px 12px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#ef4444", fontSize: "12px", cursor: "pointer" }}
              >
                Cancelar ({selectedMedia.length})
              </button>
            )}

            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{filtered.length} arquivo{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Drop zone */}
          <div
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDrop={() => setIsDragging(false)}
            onDragOver={(e) => e.preventDefault()}
            style={{
              border: `2px dashed ${isDragging ? "#ea580c" : "var(--border-light)"}`,
              borderRadius: "12px", padding: "20px", textAlign: "center",
              background: isDragging ? "rgba(234,88,12,0.08)" : "transparent",
              transition: "all 0.2s ease", cursor: "pointer",
            }}
          >
            <Upload size={20} style={{ color: isDragging ? "#fb923c" : "var(--text-muted)", margin: "0 auto 8px" }} />
            <p style={{ fontSize: "13px", color: isDragging ? "#fb923c" : "var(--text-muted)", fontWeight: isDragging ? 600 : 400 }}>
              {isDragging ? "Solte os arquivos aqui!" : "Arraste arquivos ou clique em \"Upload R2\""}
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>PNG, JPG, GIF, MP4 — máx. 50MB</p>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
              <p style={{ fontSize: "13px" }}>Carregando mídias...</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 16px", border: "1px dashed var(--border-light)", borderRadius: "14px" }}>
              <p style={{ fontSize: "28px", marginBottom: "12px" }}>🖼️</p>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>Nenhuma mídia encontrada</p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Clique em "Upload R2" para adicionar suas primeiras imagens</p>
            </div>
          )}

          {/* Grid view */}
          {!loading && view === "grid" && filtered.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
              {filtered.map((media) => {
                const isSelected = selectedMedia.includes(media.id);
                return (
                  <div
                    key={media.id}
                    id={`media-${media.id}`}
                    style={{
                      background: "var(--bg-card)", border: isSelected ? "2px solid #ea580c" : "1px solid var(--border)",
                      borderRadius: "12px", overflow: "hidden", cursor: "pointer",
                      transition: "all 0.15s ease", position: "relative",
                    }}
                    className="media-card"
                    onClick={() => toggleSelect(media.id)}
                  >
                    {/* Thumbnail */}
                    <div style={{ height: "120px", background: "var(--bg-secondary)", position: "relative", overflow: "hidden" }}>
                      {media.type === "VIDEO" ? (
                        <video src={media.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <img src={media.url} alt={media.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                      )}

                      {/* Overlay actions */}
                      <div className="media-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: 0, transition: "opacity 0.15s ease" }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setPreviewItem(media); }}
                          style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <ExternalLink size={13} style={{ color: "#000" }} />
                        </button>
                        <a
                          href={media.url}
                          download
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Download size={13} style={{ color: "#000" }} />
                        </a>
                      </div>

                      {media.type === "VIDEO" && (
                        <div style={{ position: "absolute", bottom: "6px", right: "6px", background: "rgba(0,0,0,0.6)", borderRadius: "4px", padding: "2px 5px", fontSize: "10px", color: "#fff", display: "flex", alignItems: "center", gap: "3px" }}>
                          <Video size={9} /> VID
                        </div>
                      )}

                      {isSelected && (
                        <div style={{ position: "absolute", top: "8px", right: "8px", width: "22px", height: "22px", borderRadius: "50%", background: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Check size={13} color="#fff" />
                        </div>
                      )}
                    </div>

                    <div style={{ padding: "10px" }}>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {media.name}
                      </p>
                      <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>{formatSize(media.size)}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", marginTop: "6px" }}>
                        {media.tags.slice(0, 2).map((tag) => (
                          <span key={tag} style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "20px", background: "rgba(234,88,12,0.15)", color: "#fb923c" }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List view */}
          {!loading && view === "list" && filtered.length > 0 && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
              {filtered.map((media, i) => (
                <div
                  key={media.id}
                  id={`media-list-${media.id}`}
                  style={{
                    display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px",
                    borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                    cursor: "pointer", transition: "background 0.15s ease",
                  }}
                  className="media-list-item"
                  onClick={() => toggleSelect(media.id)}
                >
                  {/* Thumb */}
                  <div style={{ width: "48px", height: "48px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                    {media.type === "VIDEO" ? (
                      <video src={media.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <img src={media.url} alt={media.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{media.name}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{media.folder} · {formatSize(media.size)} · {media.createdAt}</p>
                  </div>

                  <div style={{ display: "flex", gap: "4px" }}>
                    {media.tags.map((tag) => (
                      <span key={tag} style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "20px", background: "rgba(234,88,12,0.15)", color: "#fb923c" }}>#{tag}</span>
                    ))}
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); setPreviewItem(media); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}
                  >
                    <MoreHorizontal size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Preview Modal */}
      {previewItem && (
        <div
          onClick={() => setPreviewItem(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--bg-card)", borderRadius: "16px", overflow: "hidden", maxWidth: "800px", width: "100%", border: "1px solid var(--border)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
          >
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{previewItem.name}</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => handleDelete(previewItem.id)} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", background: "rgba(239,68,68,0.15)", borderRadius: "8px", color: "#ef4444", fontSize: "12px", border: "none", cursor: "pointer" }}>
                  Deletar
                </button>
                <a href={previewItem.url} download style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", background: "rgba(234,88,12,0.15)", borderRadius: "8px", color: "#fb923c", fontSize: "12px", textDecoration: "none" }}>
                  <Download size={12} /> Baixar
                </a>
                <button onClick={() => setPreviewItem(null)} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "8px", padding: "6px", cursor: "pointer", color: "var(--text-muted)" }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Media */}
            <div style={{ background: "#000", display: "flex", alignItems: "center", justifyContent: "center", maxHeight: "500px" }}>
              {previewItem.type === "VIDEO" ? (
                <video src={previewItem.url} controls style={{ maxHeight: "500px", maxWidth: "100%", display: "block" }} />
              ) : (
                <img src={previewItem.url} alt={previewItem.name} style={{ maxHeight: "500px", maxWidth: "100%", display: "block", objectFit: "contain" }} />
              )}
            </div>

            {/* Meta info */}
            <div style={{ padding: "14px 20px", display: "flex", gap: "20px", borderTop: "1px solid var(--border)" }}>
              {[
                { label: "Tamanho", value: formatSize(previewItem.size) },
                { label: "Tipo", value: previewItem.type },
                { label: "Pasta", value: previewItem.folder },
                ...(previewItem.width ? [{ label: "Dimensões", value: `${previewItem.width}×${previewItem.height}px` }] : []),
                { label: "Data", value: previewItem.createdAt },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>{label}</p>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .media-card:hover { border-color: rgba(234,88,12,0.4) !important; transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
        .media-card:hover .media-overlay { opacity: 1 !important; }
        .media-list-item:hover { background: var(--bg-hover); }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

