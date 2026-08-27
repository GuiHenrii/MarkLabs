"use client";

import Link from "next/link";
import { useEffect, useState, type ElementType } from "react";
import { ArrowUpRight, CalendarDays, CircleCheck, Clock3, Globe2, Layers3, Orbit, PenTool, Radio, Sparkles, Zap } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { useTeam } from "@/components/providers/TeamProvider";

type Metrics = { connectedAccounts?: number; publishedPosts?: number; scheduledPosts?: number; byPlatform?: Record<string, number> };
type Action = { href: string; label: string; title: string; text: string; icon: ElementType };

const actions: Action[] = [
  { href: "/compose", label: "Produzir", title: "Criar publicação", text: "Transforme uma ideia em conteúdo pronto para as redes.", icon: PenTool },
  { href: "/accounts", label: "Organizar", title: "Gerenciar contas", text: "Controle todas as conexões em um só lugar.", icon: Globe2 },
  { href: "/calendar", label: "Planejar", title: "Abrir calendário", text: "Organize a cadência e as próximas entregas.", icon: CalendarDays },
];

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: ElementType }) {
  return (
    <article className="metric-card">
      <div className="metric-head"><span className="metric-icon"><Icon size={17} /></span><span className="live"><i /> AO VIVO</span></div>
      <strong>{value}</strong>
      <div><h3>{label}</h3><p>{detail}</p></div>
    </article>
  );
}

export default function DashboardPage() {
  const { teamId } = useTeam();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/dashboard/metrics?teamId=${teamId}`);
        if (response.ok) setMetrics(await response.json());
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [teamId]);

  const connected = metrics?.connectedAccounts ?? 0;
  const published = metrics?.publishedPosts ?? 0;
  const scheduled = metrics?.scheduledPosts ?? 0;
  const channels = Object.keys(metrics?.byPlatform ?? {}).length;
  const show = (value: number) => loading ? "--" : String(value);

  return (
    <>
      <Topbar title="Dashboard" subtitle="Sua operação social, clara e pronta para avançar." />
      <main className="dash animate-fade-in">
        <section className="command-hero">
          <div className="hero-grid" />
          <div className="hero-rings"><span /><i /></div>
          <div className="hero-copy">
            <span className="kicker"><Sparkles size={13} /> MARK SHARE / COMMAND CENTER</span>
            <h1>Ideias em movimento.<br /><em>Marcas em evidência.</em></h1>
            <p>Crie, conecte e organize sua presença digital em um espaço feito para manter o trabalho fluindo.</p>
            <div className="hero-actions">
              <Link href="/compose" className="primary">Começar a criar <ArrowUpRight size={17} /></Link>
              <Link href="/accounts" className="secondary">Ver minhas contas</Link>
            </div>
          </div>
          <div className="console">
            <div className="console-head"><span><i /> SISTEMA OPERACIONAL</span><Orbit size={18} /></div>
            <div className="console-status"><b><CircleCheck size={20} /></b><div><small>STATUS DO WORKSPACE</small><strong>Pronto para publicar</strong></div></div>
            <div className="console-lines">
              <div><span>Contas sincronizadas</span><b>{show(connected)}</b></div>
              <div><span>Canais em operação</span><b>{show(channels)}</b></div>
              <div><span>Fila programada</span><b>{show(scheduled)}</b></div>
            </div>
          </div>
        </section>

        <section className="metrics">
          <Metric label="Contas conectadas" value={show(connected)} detail="Perfis disponíveis" icon={Globe2} />
          <Metric label="Posts publicados" value={show(published)} detail="Conteúdos distribuídos" icon={Zap} />
          <Metric label="Agendamentos" value={show(scheduled)} detail="Publicações na fila" icon={Clock3} />
          <Metric label="Canais ativos" value={show(channels)} detail="Redes em operação" icon={Layers3} />
        </section>

        <section className="dash-bottom">
          <div className="flow-panel">
            <div className="section-title"><div><span>ACESSO RÁPIDO</span><h2>Continue de onde parou</h2></div><Radio size={18} /></div>
            <div className="action-grid">
              {actions.map(({ href, label, title, text: description, icon: Icon }, index) => (
                <Link href={href} className="action-card" key={href}>
                  <b className="index">0{index + 1}</b><span className="action-icon"><Icon size={19} /></span>
                  <div><small>{label}</small><h3>{title}</h3><p>{description}</p></div><ArrowUpRight className="arrow" size={18} />
                </Link>
              ))}
            </div>
          </div>
          <aside className="next-panel">
            <div className="pulse"><span /><i /><b><Orbit size={28} /></b></div>
            <small>PRÓXIMO MOVIMENTO</small><h2>Sua próxima publicação começa aqui.</h2>
            <p>O workspace está organizado. Dê forma à próxima ideia.</p>
            <Link href="/compose">Abrir estúdio <ArrowUpRight size={16} /></Link>
          </aside>
        </section>
      </main>
      <style>{`
        .dash{display:flex;flex-direction:column;gap:16px}.command-hero{position:relative;min-height:310px;padding:34px 38px;display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,.65fr);align-items:center;gap:42px;overflow:hidden;border:1px solid #2b2928;border-radius:28px;color:#fff;background:linear-gradient(120deg,#111112 0%,#0d0d0e 58%,#1b100a 100%);box-shadow:0 24px 70px rgba(0,0,0,.2);isolation:isolate}
        .hero-grid{position:absolute;inset:0;z-index:-2;opacity:.18;background-image:linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px);background-size:42px 42px;mask-image:linear-gradient(90deg,#000,transparent 75%)}.command-hero:before{content:"";position:absolute;width:460px;height:460px;right:-100px;top:-160px;z-index:-1;border-radius:50%;background:radial-gradient(circle,rgba(249,85,12,.32),rgba(249,85,12,.06) 44%,transparent 70%);animation:glow 8s ease-in-out infinite}.command-hero:after{content:"";position:absolute;width:3px;height:58%;left:0;top:21%;background:linear-gradient(transparent,#ff5a0a,transparent);box-shadow:0 0 26px #ff5a0a}
        .hero-rings{position:absolute;right:-35px;top:50%;width:320px;height:320px;transform:translateY(-50%);border:1px solid rgba(255,107,35,.2);border-radius:50%;animation:pulse 6s ease-in-out infinite}.hero-rings span,.hero-rings i{position:absolute;inset:44px;border:1px solid rgba(255,107,35,.2);border-radius:50%}.hero-rings i{inset:88px}.hero-copy,.console{position:relative;z-index:1}.kicker{display:inline-flex;align-items:center;gap:8px;color:#ff7a38;font-size:10px;font-weight:800;letter-spacing:.14em}.hero-copy h1{margin-top:18px;max-width:720px;font-size:clamp(36px,4.2vw,62px);line-height:.98;letter-spacing:-.055em;font-weight:800}.hero-copy h1 em{color:#ff5a0a;font-style:normal}.hero-copy p{margin-top:18px;max-width:570px;color:#aaa7a5;font-size:14px;line-height:1.7}.hero-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}.hero-actions a{height:44px;padding:0 17px;display:inline-flex;align-items:center;gap:8px;border-radius:12px;text-decoration:none;font-size:12px;font-weight:800;transition:.2s}.hero-actions a:hover{transform:translateY(-2px)}.primary{color:#fff;background:#f4540b;box-shadow:0 10px 28px rgba(244,84,11,.28)}.secondary{color:#e5e5e5;border:1px solid #353333;background:rgba(255,255,255,.045)}
        .console{padding:18px;border:1px solid rgba(255,255,255,.1);border-radius:20px;background:rgba(12,12,13,.72);backdrop-filter:blur(12px);box-shadow:0 18px 45px rgba(0,0,0,.3)}.console-head{display:flex;justify-content:space-between;padding-bottom:14px;color:#777;border-bottom:1px solid #282626}.console-head span{display:flex;align-items:center;gap:7px;font-size:9px;font-weight:800;letter-spacing:.12em}.console-head i,.live i{width:6px;height:6px;border-radius:50%;background:#ff5a0a;box-shadow:0 0 12px #ff5a0a}.console-status{display:flex;align-items:center;gap:12px;padding:18px 0}.console-status>b{width:42px;height:42px;display:grid;place-items:center;color:#ff6a21;border:1px solid rgba(255,90,10,.2);border-radius:13px;background:rgba(255,90,10,.1)}.console-status div{display:grid;gap:3px}.console-status small{color:#777;font-size:9px;letter-spacing:.11em}.console-status strong{font-size:15px}.console-lines{display:grid;gap:1px;overflow:hidden;border:1px solid #292727;border-radius:12px;background:#292727}.console-lines div{padding:10px 12px;display:flex;justify-content:space-between;background:#151516;color:#888;font-size:11px}.console-lines b{color:#fff}
        .metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.metric-card,.flow-panel{border:1px solid var(--border);background:var(--bg-card)}.metric-card{min-height:166px;padding:18px;display:flex;flex-direction:column;justify-content:space-between;border-radius:18px;transition:.2s}.metric-card:hover{transform:translateY(-3px);border-color:rgba(244,84,11,.4)}.metric-head{display:flex;justify-content:space-between}.metric-icon{width:36px;height:36px;display:grid;place-items:center;color:#f4540b;border:1px solid rgba(244,84,11,.18);border-radius:11px;background:rgba(244,84,11,.08)}.live{display:flex;align-items:center;gap:6px;color:var(--text-muted);font-size:8px;font-weight:800;letter-spacing:.1em}.metric-card>strong{margin:13px 0 10px;color:var(--text-primary);font-size:29px;line-height:1}.metric-card h3{font-size:12px}.metric-card p{margin-top:3px;color:var(--text-muted);font-size:10px}
        .dash-bottom{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(280px,.65fr);gap:16px}.flow-panel{padding:22px;border-radius:22px}.section-title{display:flex;justify-content:space-between;margin-bottom:17px;color:#f4540b}.section-title span,.next-panel>small{color:#f4540b;font-size:9px;font-weight:800;letter-spacing:.14em}.section-title h2{margin-top:4px;color:var(--text-primary);font-size:18px}.action-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.action-card{position:relative;min-height:190px;padding:16px;display:flex;flex-direction:column;color:inherit;overflow:hidden;border:1px solid var(--border);border-radius:16px;background:var(--bg-secondary);text-decoration:none;transition:.22s}.action-card:after{content:"";position:absolute;width:100px;height:100px;right:-55px;bottom:-55px;border-radius:50%;background:rgba(244,84,11,.08);transition:.25s}.action-card:hover{transform:translateY(-3px);border-color:rgba(244,84,11,.4);box-shadow:0 16px 35px rgba(0,0,0,.08)}.action-card:hover:after{transform:scale(1.7)}.index{position:absolute;right:14px;top:12px;color:var(--text-muted);font-size:9px}.action-icon{width:39px;height:39px;display:grid;place-items:center;color:#f4540b;border:1px solid rgba(244,84,11,.2);border-radius:12px;background:rgba(244,84,11,.07)}.action-card>div{margin-top:auto;position:relative;z-index:1}.action-card small{color:#f4540b;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.1em}.action-card h3{margin-top:4px;font-size:14px}.action-card p{margin-top:6px;color:var(--text-muted);font-size:10px;line-height:1.5}.arrow{position:absolute;right:14px;bottom:14px;color:var(--text-muted);opacity:0;transition:.2s}.action-card:hover .arrow{opacity:1}
        .next-panel{position:relative;padding:22px;display:flex;flex-direction:column;justify-content:flex-end;min-height:286px;overflow:hidden;color:#fff;border:1px solid #302a26;border-radius:22px;background:linear-gradient(150deg,#171513,#0e0e0f)}.pulse{position:absolute;right:-50px;top:-70px;width:230px;height:230px;display:grid;place-items:center}.pulse span,.pulse i{position:absolute;inset:0;border:1px solid rgba(255,91,12,.2);border-radius:50%;animation:pulse 4s ease-in-out infinite}.pulse i{inset:38px;animation-delay:-2s}.pulse b{width:64px;height:64px;display:grid;place-items:center;color:#ff6420;border-radius:50%;background:rgba(255,92,15,.1);box-shadow:0 0 60px rgba(255,92,15,.3)}.next-panel h2{position:relative;max-width:300px;margin-top:9px;font-size:23px;line-height:1.1}.next-panel p{position:relative;margin-top:10px;color:#8e8a87;font-size:11px}.next-panel>a{position:relative;margin-top:18px;display:inline-flex;align-items:center;gap:7px;width:max-content;color:#fff;font-size:11px;font-weight:800;text-decoration:none}
        html.light .metric-card,html.light .flow-panel{box-shadow:0 12px 38px rgba(33,24,18,.06)}html.light .action-card{background:#fffdfb}@keyframes glow{50%{transform:translate(-18px,18px) scale(1.08);opacity:.75}}@keyframes pulse{50%{transform:scale(.94);opacity:.45}}@media(max-width:1100px){.command-hero{grid-template-columns:1fr}.console{max-width:560px}.metrics{grid-template-columns:repeat(2,1fr)}.dash-bottom{grid-template-columns:1fr}}@media(max-width:720px){.command-hero{padding:28px 22px;border-radius:22px}.hero-copy h1{font-size:38px}.metrics,.action-grid{grid-template-columns:1fr}.metric-card{min-height:140px}.flow-panel{padding:16px}.action-card{min-height:150px}}@media(prefers-reduced-motion:reduce){.command-hero:before,.hero-rings,.pulse span,.pulse i{animation:none}}
      `}</style>
    </>
  );
}
