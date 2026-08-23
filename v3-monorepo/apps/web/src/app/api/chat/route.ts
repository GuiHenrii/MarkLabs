import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Permite streaming de respostas em até 30 segundos
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      messages,
      system: 'Você é um assistente virtual útil para a plataforma MarkLabs, ajudando usuários com gestão de redes sociais, tráfego e relatórios. Seja conciso e prestativo.',
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Erro na API de Chat:', error);
    return new Response(JSON.stringify({ error: 'Falha ao processar a requisição de chat.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
