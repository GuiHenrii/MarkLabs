'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { X, Send, Cpu, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat();

  const isLoading = status === 'submitted' || status === 'streaming';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ role: 'user', parts: [{ type: 'text', text: input }] });
    setInput('');
  };

  return (
    <aside 
      className="fixed z-[9999]" 
      style={{ bottom: '24px', right: '24px', minHeight: 'auto' }}
    >
      {/* Botão de abrir/fechar com glow laranja (Tony Stark vibe) */}
      <div className="relative group">
        <div className="absolute -inset-0.5 rounded-full bg-orange-500 opacity-40 blur-md group-hover:opacity-80 transition duration-500 animate-pulse"></div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-black/90 text-orange-500 border border-orange-500/60 shadow-[0_0_15px_rgba(249,115,22,0.6)] backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Cpu className="h-7 w-7" />}
        </button>
      </div>

      {/* Janela de chat estilo Interface Holográfica */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 flex h-[550px] w-[350px] sm:w-[400px] flex-col overflow-hidden rounded-2xl border border-orange-500/40 bg-black/70 shadow-[0_0_40px_rgba(249,115,22,0.2)] backdrop-blur-xl">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-orange-500/40 bg-black/50 p-4 text-orange-100">
            <div className="flex items-center gap-3">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-orange-500/50 bg-orange-500/10">
                <Bot className="h-4 w-4 text-orange-400" />
                <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.9)] animate-pulse"></div>
              </div>
              <div>
                <h3 className="font-bold uppercase tracking-wider text-orange-500 text-sm">VANTA</h3>
                <p className="text-[10px] text-orange-500/70 font-mono tracking-widest">OPERANDO</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-orange-500/70 hover:text-orange-400 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center space-y-4 text-center opacity-80">
                <div className="relative flex h-20 w-20 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-orange-500/20 animate-[spin_4s_linear_infinite]"></div>
                  <div className="absolute inset-2 rounded-full border border-orange-500/40 border-dashed animate-[spin_3s_linear_infinite_reverse]"></div>
                  <Cpu className="h-8 w-8 text-orange-500/60" />
                </div>
                <p className="text-sm text-orange-400/60 font-mono">
                  SISTEMA INICIADO.<br />AGUARDANDO COMANDOS...
                </p>
              </div>
            ) : (
              messages.map(m => (
                <div
                  key={m.id}
                  className={cn(
                    "flex w-max max-w-[85%] flex-col gap-1 rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm",
                    m.role === 'user'
                      ? "ml-auto bg-orange-500/10 border border-orange-500/40 text-orange-100 rounded-tr-none"
                      : "bg-black/60 border border-white/10 text-gray-200 rounded-tl-none"
                  )}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 mb-0.5" style={{ color: m.role === 'user' ? '#f97316' : '#9ca3af' }}>
                    {m.role === 'user' ? 'USER' : 'SYSTEM'}
                  </span>
                  {typeof m.content === 'string' ? m.content : m.parts?.map((part, i) => (
                    <span key={i}>{part.type === 'text' ? part.text : ''}</span>
                  ))}
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex w-max max-w-[80%] flex-col gap-2 rounded-xl rounded-tl-none border border-white/10 bg-black/60 px-4 py-3 text-sm text-gray-200">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 opacity-60 mb-0.5">SYSTEM</span>
                <span className="flex items-center gap-1.5 h-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse delay-150"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse delay-300"></span>
                </span>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-orange-500/40 bg-black/60 p-3">
            <div className="relative flex items-center group">
              <input
                className="flex-1 rounded-lg border border-orange-500/30 bg-black/50 px-4 py-3 text-sm text-orange-100 font-mono placeholder:text-orange-500/40 focus:border-orange-500/70 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all shadow-inner"
                value={input}
                onChange={handleInputChange}
                placeholder="Insira o comando..."
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input?.trim()}
                className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-md bg-orange-500/20 text-orange-400 disabled:opacity-30 transition-all hover:bg-orange-500 hover:text-black hover:shadow-[0_0_10px_rgba(249,115,22,0.8)]"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Enviar</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </aside>
  );
}
