"use client";

import { useTeam } from "@/components/providers/TeamProvider";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { 
  Plus, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  Camera,
  Globe,
  Briefcase
} from "lucide-react";
import { getPlatformLabel } from "@/lib/utils";

const platformIcons: Record<string, any> = {
  FACEBOOK: Globe,
  INSTAGRAM: Camera,
  LINKEDIN: Briefcase,
};

const platformColors: Record<string, string> = {
  FACEBOOK: "#1877f2",
  INSTAGRAM: "#ff9900",
  LINKEDIN: "#0077b5",
};

export default function AccountsPage() {
  const { teamId } = useTeam();
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (!teamId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/social/accounts?teamId=${teamId}`, {
        cache: 'no-store'
      });
      if (!res.ok) throw new Error("Erro ao buscar contas");
      const data = await res.json();
      setAccounts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts, searchParams]);

  const disconnectAccount = async (accountId: string) => {
    if (!confirm("Tem certeza que deseja desconectar esta conta?")) return;
    
    setDeletingId(accountId);
    try {
      const res = await fetch(`/api/social/accounts/${accountId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao desconectar");
      setAccounts(accounts.filter(a => a.id !== accountId));
    } catch (err) {
      alert("Falha ao desconectar conta.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Topbar title="Minhas Contas" subtitle="Gerencie as redes sociais conectadas ao seu workspace" />
      
      <main className="p-8 max-w-6xl animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Add New Account Cards */}
          <div className="glass rounded-2xl border border-[var(--border)] p-6 flex flex-col items-center justify-center text-center gap-4 hover:border-orange-500/50 transition-all group">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
              <Plus size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Nova Conexão</h3>
              <p className="text-sm text-[var(--text-secondary)]">Conecte uma nova rede social</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {['FACEBOOK', 'INSTAGRAM', 'LINKEDIN'].map(p => (
                <a
                  key={p}
                  href={`/api/social/connect?platform=${p}&teamId=${teamId}`}
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[10px] font-bold hover:bg-orange-500 hover:text-white transition-colors"
                >
                  + {getPlatformLabel(p)}
                </a>
              ))}
            </div>
          </div>

          {/* Existing Accounts */}
          {loading ? (
            <div className="col-span-full flex items-center justify-center p-12">
              <Loader2 className="animate-spin text-orange-500" size={32} />
            </div>
          ) : (
            accounts.map((account) => {
              const Icon = platformIcons[account.platform] || AlertCircle;
              const color = platformColors[account.platform] || "#666";

              return (
                <div key={account.id} className="glass rounded-2xl border border-[var(--border)] overflow-hidden flex flex-col">
                  <div className="p-6 flex flex-col gap-4 flex-1">
                    <div className="flex items-center justify-between">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
                        style={{ background: color }}
                      >
                        <Icon size={20} />
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold">
                        <CheckCircle2 size={10} /> ATIVA
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full border-2 border-[var(--border)] overflow-hidden bg-[var(--bg-secondary)]">
                        {account.avatar ? (
                          <img src={account.avatar} alt={account.name} className="w-full h-100 object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] text-xl font-bold">
                            {account.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[var(--text-primary)] font-semibold truncate">{account.name}</h4>
                        <p className="text-[var(--text-muted)] text-xs truncate">@{account.username || 'perfil'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-secondary)] p-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
                    <button
                      onClick={() => disconnectAccount(account.id)}
                      disabled={deletingId === account.id}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2 text-xs font-medium"
                    >
                      {deletingId === account.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      Desconectar
                    </button>
                    
                    <a
                      href={
                        account.platform === 'LINKEDIN' ? `https://www.linkedin.com/in/${account.platformId}` :
                        account.platform === 'INSTAGRAM' ? `https://instagram.com/${account.username}` :
                        account.platform === 'FACEBOOK' ? `https://facebook.com/${account.platformId}` : '#'
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-card)] transition-colors flex items-center gap-2 text-xs font-medium"
                    >
                      Ver perfil <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </>
  );
}
