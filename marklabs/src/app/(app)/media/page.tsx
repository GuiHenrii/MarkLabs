"use client";

import { useState } from "react";
import { Upload, Search, Grid3x3, List, Image as ImageIcon, Video, Folder, Tag, MoreHorizontal, Plus } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { formatNumber } from "@/lib/utils";

const mockMedia = [
  { id: "1", name: "banner-agosto.jpg", type: "IMAGE", size: 248000, url: "🖼️", folder: "Banners", tags: ["marketing", "agosto"], createdAt: "12/08/2026" },
  { id: "2", name: "video-produto.mp4", type: "VIDEO", size: 15600000, url: "🎬", folder: "Vídeos", tags: ["produto"], createdAt: "11/08/2026" },
  { id: "3", name: "logo-empresa.png", type: "IMAGE", size: 45000, url: "🏢", folder: "Branding", tags: ["logo", "branding"], createdAt: "10/08/2026" },
  { id: "4", name: "post-instagram-01.jpg", type: "IMAGE", size: 312000, url: "📸", folder: "Instagram", tags: ["instagram"], createdAt: "10/08/2026" },
  { id: "5", name: "stories-template.png", type: "IMAGE", size: 189000, url: "✨", folder: "Templates", tags: ["stories", "template"], createdAt: "09/08/2026" },
  { id: "6", name: "depoimento-cliente.mp4", type: "VIDEO", size: 22400000, url: "🎥", folder: "Vídeos", tags: ["depoimento", "cliente"], createdAt: "08/08/2026" },
  { id: "7", name: "produto-hero.jpg", type: "IMAGE", size: 425000, url: "🌟", folder: "Produtos", tags: ["produto", "hero"], createdAt: "07/08/2026" },
  { id: "8", name: "equipe-foto.jpg", type: "IMAGE", size: 567000, url: "👥", folder: "Equipe", tags: ["equipe", "empresa"], createdAt: "06/08/2026" },
];

const folders = ["Todos", "Banners", "Branding", "Instagram", "Produtos", "Templates", "Vídeos", "Equipe"];

function formatSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

export default function MediaPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedFolder, setSelectedFolder] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const filtered = mockMedia.filter((m) => {
    const matchFolder = selectedFolder === "Todos" || m.folder === selectedFolder;
    const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.tags.some((t) => t.includes(searchQuery.toLowerCase()));
    return matchFolder && matchSearch;
  });

  const toggleSelect = (id: string) => {
    setSelectedMedia((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <>
      <Topbar title="Banco de Mídias" subtitle="Organize e reutilize suas imagens e vídeos" />

      <main style={{ padding: "24px", display: "grid", gridTemplateColumns: "200px 1fr", gap: "20px", flex: 1, alignItems: "start" }} className="animate-fade-in">
        {/* Left sidebar: Folders */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", position: "sticky", top: "88px" }}>
          <button
            id="upload-media-btn"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
              padding: "10px", background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: 600,
              cursor: "pointer", boxShadow: "0 0 12px rgba(99,102,241,0.3)", marginBottom: "12px",
            }}
          >
            <Upload size={14} />
            Upload
          </button>

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
                border: "none", background: selectedFolder === folder ? "rgba(99,102,241,0.15)" : "transparent",
                color: selectedFolder === folder ? "#818cf8" : "var(--text-secondary)", fontSize: "13px",
                fontWeight: selectedFolder === folder ? 600 : 400, cursor: "pointer", textAlign: "left",
                transition: "all 0.15s ease",
              }}
            >
              <Folder size={13} style={{ color: selectedFolder === folder ? "#818cf8" : "var(--text-muted)" }} />
              {folder}
            </button>
          ))}

          <button
            style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "8px",
              border: "1px dashed var(--border-light)", background: "transparent", color: "var(--text-muted)",
              fontSize: "12px", cursor: "pointer", marginTop: "8px",
            }}
          >
            <Plus size={12} />
            Nova pasta
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
                    borderRadius: "6px", border: "none", background: view === id ? "rgba(99,102,241,0.2)" : "transparent",
                    color: view === id ? "#818cf8" : "var(--text-muted)", cursor: "pointer",
                  }}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>

            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{filtered.length} arquivo{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Upload drop zone */}
          <div
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDrop={() => setIsDragging(false)}
            onDragOver={(e) => e.preventDefault()}
            style={{
              border: `2px dashed ${isDragging ? "#6366f1" : "var(--border-light)"}`,
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
              background: isDragging ? "rgba(99,102,241,0.08)" : "transparent",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
          >
            <Upload size={20} style={{ color: isDragging ? "#818cf8" : "var(--text-muted)", margin: "0 auto 8px" }} />
            <p style={{ fontSize: "13px", color: isDragging ? "#818cf8" : "var(--text-muted)", fontWeight: isDragging ? 600 : 400 }}>
              {isDragging ? "Solte os arquivos aqui!" : "Arraste arquivos aqui ou clique para fazer upload"}
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>PNG, JPG, GIF, MP4 — máx. 100MB</p>
          </div>

          {/* Media grid */}
          {view === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
              {filtered.map((media) => {
                const isSelected = selectedMedia.includes(media.id);
                return (
                  <div
                    key={media.id}
                    id={`media-${media.id}`}
                    onClick={() => toggleSelect(media.id)}
                    style={{
                      background: "var(--bg-card)",
                      border: isSelected ? "2px solid #6366f1" : "1px solid var(--border)",
                      borderRadius: "12px",
                      overflow: "hidden",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      position: "relative",
                    }}
                    className="media-card"
                  >
                    {/* Thumbnail */}
                    <div style={{ height: "120px", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", position: "relative" }}>
                      {media.url}
                      {media.type === "VIDEO" && (
                        <div style={{ position: "absolute", bottom: "6px", right: "6px", background: "rgba(0,0,0,0.6)", borderRadius: "4px", padding: "2px 5px", fontSize: "10px", color: "#fff", display: "flex", alignItems: "center", gap: "3px" }}>
                          <Video size={9} /> VID
                        </div>
                      )}
                      {isSelected && (
                        <div style={{ position: "absolute", top: "8px", right: "8px", width: "20px", height: "20px", borderRadius: "50%", background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: "11px", color: "#fff", fontWeight: 700 }}>✓</span>
                        </div>
                      )}
                    </div>

                    <div style={{ padding: "10px" }}>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {media.name}
                      </p>
                      <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                        {formatSize(media.size)}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", marginTop: "6px" }}>
                        {media.tags.slice(0, 2).map((tag) => (
                          <span key={tag} style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "20px", background: "rgba(99,102,241,0.15)", color: "#818cf8" }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
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
                >
                  <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>
                    {media.url}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{media.name}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{media.folder} · {formatSize(media.size)} · {media.createdAt}</p>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {media.tags.map((tag) => (
                      <span key={tag} style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "20px", background: "rgba(99,102,241,0.15)", color: "#818cf8" }}>#{tag}</span>
                    ))}
                  </div>
                  <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                    <MoreHorizontal size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <style>{`
        .media-card:hover { border-color: rgba(99,102,241,0.4) !important; transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
        .media-list-item:hover { background: var(--bg-hover); }
      `}</style>
    </>
  );
}
