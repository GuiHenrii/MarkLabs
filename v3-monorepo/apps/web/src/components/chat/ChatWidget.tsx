'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Botão de abrir/fechar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Janela de chat */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 flex h-[500px] w-[350px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950 sm:w-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-blue-600 p-4 text-white dark:border-gray-800">
            <div>
              <h3 className="font-semibold">Assistente MarkLabs</h3>
              <p className="text-xs text-blue-100">Como posso ajudar hoje?</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-gray-500">
                Olá! Faça uma pergunta sobre suas campanhas ou métricas.
              </div>
            ) : (
              messages.map(m => (
                <div
                  key={m.id}
                  className={cn(
                    "flex w-max max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                    m.role === 'user'
                      ? "ml-auto bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                  )}
                >
                  {m.content}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex w-max max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800">
                <span className="flex gap-1">
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce delay-75">.</span>
                  <span className="animate-bounce delay-150">.</span>
                </span>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-gray-100 p-3 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <input
                className="flex-1 rounded-full border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
                value={input}
                onChange={handleInputChange}
                placeholder="Digite sua mensagem..."
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white disabled:opacity-50 transition-colors hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Enviar</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
