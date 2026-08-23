import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export const maxDuration = 60; // Análise de dados pode demorar mais

export async function POST(req: Request) {
  try {
    const { metaData, clientId } = await req.json();

    if (!metaData) {
      return new Response(JSON.stringify({ error: 'Nenhum dado da Meta fornecido.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = `
      Você é um especialista em marketing digital e análise de dados.
      O usuário forneceu os seguintes dados de anúncios/campanhas do Facebook/Instagram (Meta) para o cliente ${clientId || 'desconhecido'}:
      
      ${JSON.stringify(metaData, null, 2)}
      
      Gere um relatório estruturado e fácil de entender para o cliente, destacando:
      1. Resumo da performance (impressões, cliques, conversões, custo).
      2. Pontos fortes e o que funcionou bem.
      3. Pontos fracos e o que precisa melhorar.
      4. Recomendações acionáveis para as próximas campanhas.
    `;

    const { text } = await generateText({
      model: openai('gpt-4o'),
      prompt,
    });

    return new Response(JSON.stringify({ report: text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao analisar dados da Meta:', error);
    return new Response(JSON.stringify({ error: 'Falha ao analisar os dados da Meta.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
