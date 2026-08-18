"use client";

import { useTeam } from "@/components/providers/TeamProvider";
import { useEffect, useState } from "react";
import { Building2, Save, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { teamId } = useTeam();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [team, setTeam] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!teamId) return;

    const fetchTeam = async () => {
      try {
        setLoading(true);
        const [teamRes, accountsRes] = await Promise.all([
          fetch(`/api/teams/${teamId}`),
          fetch(`/api/social/accounts?teamId=${teamId}`),
        ]);
        if (!teamRes.ok) throw new Error("Erro ao carregar team");
        const teamData = await teamRes.json();
        setTeam(teamData.team);
        setName(teamData.team.name);
        if (accountsRes.ok) {
          const accountData = await accountsRes.json();
          setAccounts(accountData);
        }
      } catch (err) {
        console.error("Erro ao buscar team:", err);
        setMessage({ type: "error", text: "Erro ao carregar dados da empresa" });
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [teamId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !name.trim()) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar");
      }

      const data = await res.json();
      setTeam(data.team);
      setMessage({ type: "success", text: "Empresa atualizada com sucesso! ✅" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-8 animate-fade-in max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Configurações da Empresa</h1>
        <p className="text-[var(--text-secondary)] text-sm">Gerencie os detalhes e preferências do seu workspace.</p>
      </div>

      <div className="glass rounded-xl border border-[var(--border)] p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--border)]">
          <div className="w-16 h-16 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
            <Building2 size={32} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{team?.name}</h2>
            <p className="text-sm text-[var(--text-muted)]">ID: {teamId}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Nome da Empresa
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg text-sm font-medium ${
                message.type === "success"
                  ? "bg-green-500/15 border border-green-500/30 text-green-600"
                  : "bg-red-500/15 border border-red-500/30 text-red-600"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>

      {/* Social Media Connections */}
      <div className="glass rounded-xl border border-[var(--border)] p-6 mt-6">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Redes Sociais Conectadas</h2>
            <p className="text-sm text-[var(--text-secondary)]">Reconecte Facebook e Instagram para emitir um token novo com os escopos corretos.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <a
            href={`/api/social/connect?platform=FACEBOOK&teamId=${teamId}`}
            className="flex items-center justify-center gap-3 bg-[#1877f2] hover:bg-[#166fe5] text-white px-5 py-3 rounded-lg text-sm font-semibold transition-colors shadow-lg"
          >
            Reconectar Facebook
          </a>
          <a
            href={`/api/social/connect?platform=INSTAGRAM&teamId=${teamId}`}
            className="flex items-center justify-center gap-3 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] hover:opacity-90 text-white px-5 py-3 rounded-lg text-sm font-semibold transition-colors shadow-lg"
          >
            Reconectar Instagram
          </a>
          <a
            href={`/api/social/connect?platform=LINKEDIN&teamId=${teamId}`}
            className="flex items-center justify-center gap-3 bg-[#0077b5] hover:bg-[#006097] text-white px-5 py-3 rounded-lg text-sm font-semibold transition-colors shadow-lg"
          >
            Conectar LinkedIn
          </a>
        </div>

        <div className="mt-8 grid gap-3">
          {accounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
              <div>
                <div className="font-semibold text-[var(--text-primary)]">{account.name}</div>
                <div className="text-sm text-[var(--text-muted)]">
                  {account.platform} · {account.username || "sem username"} · {account.isActive ? "Ativa" : "Inativa"}
                </div>
              </div>
              <a
                href={`/api/social/connect?platform=${account.platform}&teamId=${teamId}`}
                className="text-sm font-semibold text-orange-500 hover:text-orange-400"
              >
                Reconectar
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
