import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// Inicializando o client padrão da OpenAI para rotas que não usam streaming de texto diretamente, 
// como o Whisper (audio.transcriptions).
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const maxDuration = 60; // Pode demorar dependendo do tamanho do áudio

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // A API do Whisper aceita objetos File (padrão Web API)
    const transcription = await openaiClient.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      response_format: 'srt', // Retornar formato legenda
    });

    return NextResponse.json({ 
      success: true, 
      captions: transcription 
    });
  } catch (error) {
    console.error('Erro na transcrição:', error);
    return NextResponse.json(
      { error: 'Falha ao processar a transcrição com Whisper.' },
      { status: 500 }
    );
  }
}
