// Letakkan file ini di: app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface ChatRequestBody {
  prompt: string;
  systemPrompt?: string;
}

interface GeminiContent {
  parts: { text: string }[];
  role: "user" | "model";
}

interface GeminiPayload {
  contents: GeminiContent[];
}

// Model dicoba berurutan sampai salah satu berhasil
const MODELS: string[] = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
];

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { prompt, systemPrompt }: ChatRequestBody = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt tidak boleh kosong.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY belum diisi di .env.local' },
        { status: 500 }
      );
    }

    // v1 tidak mendukung systemInstruction — gabungkan ke contents sebagai konteks awal
    const contents: GeminiContent[] = systemPrompt
  ? [
      { parts: [{ text: systemPrompt }], role: "user" },
      { parts: [{ text: "Baik, saya mengerti. Saya siap membantu." }], role: "model" },
      { parts: [{ text: prompt }], role: "user" },
    ]
  : [{ parts: [{ text: prompt }], role: "user" }];

    const payload: GeminiPayload = { contents };

    const bodyString = JSON.stringify(payload);

    let lastError = '';
    for (const model of MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

      // Buat request baru tiap iterasi agar body tidak "sudah dibaca"
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyString, // string literal, bisa dibaca berkali-kali oleh fetch baru
      });

      if (response.ok) {
        const data = await response.json();
        const text: string =
          data.candidates?.[0]?.content?.parts?.[0]?.text ??
          'Maaf, saya tidak dapat menghasilkan respon saat ini.';
        console.log(`✅ Model berhasil: ${model}`);
        return NextResponse.json({ text });
      }

      // Baca error sebagai teks mentah (aman, satu kali baca per response)
      const rawBody = await response.text().catch(() => '');
      let errMessage = `${model} → HTTP ${response.status}`;
      try {
        const errData = JSON.parse(rawBody);
        errMessage += `: ${errData?.error?.message ?? rawBody}`;
      } catch {
        if (rawBody) errMessage += `: ${rawBody}`;
      }
      console.warn(`⚠️ Model gagal: ${errMessage}`);
      lastError = errMessage;
    }

    return NextResponse.json(
      { error: `Semua model gagal. Error terakhir: ${lastError}` },
      { status: 503 }
    );

  } catch (error) {
    console.error('Route /api/chat error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}