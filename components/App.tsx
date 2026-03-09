"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  HelpCircle,
  X,
  User,
  Bot,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// --- TIPE DATA ---
interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

interface Message {
  role: 'user' | 'bot';
  content: string;
}

interface DraftEmailState {
  isOpen: boolean;
  content: string;
  isLoading: boolean;
  copied: boolean;
}

// --- HELPER: Panggil Route API internal ---
// API key tersimpan aman di server (.env.local), tidak terekspos ke browser
const callChatAPI = async (prompt: string, systemPrompt: string = ""): Promise<string> => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, systemPrompt }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error ?? `HTTP Error: ${response.status}`);
  }

  const data = await response.json();
  return data.text ?? "Maaf, saya tidak dapat menghasilkan respon saat ini.";
};

const FAQ_DATA: FaqItem[] = [
  {
    id: 1,
    question: "Apa perbedaan antara akun Gmail pribadi dan akun Google Workspace for Education?",
    answer: "Akun Education tidak menampilkan iklan saat penelusuran, dapat dikelola secara massal oleh Admin institusi, dan penggunaan akunnya dapat dipantau untuk memastikan keamanan lingkungan belajar."
  },
  {
    id: 2,
    question: "Apakah data pengguna aman saat menggunakan solusi Google?",
    answer: "Sangat aman. Google menyediakan kontrol keamanan admin yang terpusat dan perlindungan proaktif terhadap ancaman digital. Untuk penggunaan AI, NotebookLM menyediakan asisten AI dengan perlindungan data tingkat perusahaan."
  },
  {
    id: 3,
    question: "Berapa kapasitas penyimpanan yang kami dapatkan dengan edisi gratis (Fundamentals)?",
    answer: "Institusi yang memenuhi syarat akan mendapatkan penyimpanan cloud gabungan sebesar 100 TB yang digunakan bersama di seluruh organisasi."
  },
  {
    id: 4,
    question: "Apa kelebihan utama dari Teaching & Learning Upgrade?",
    answer: "Edisi ini fokus pada dampak pengajaran, mencakup fitur deteksi plagiarisme (Originality Reports), Practice Sets untuk pembelajaran personal, serta kemampuan membuat pertanyaan interaktif pada video YouTube di Google Classroom. Anda juga mendapatkan tambahan penyimpanan 100 GB per lisensi."
  },
    {
    id: 5,
    question: "Mengapa harus meng-upgrade ke Education Plus?",
    answer: "Ini adalah solusi terlengkap yang mencakup fitur keamanan dan analitik tingkat lanjut, tambahan penyimpanan Drive untuk setiap lisensi guru dan siswa, serta akses ke fitur AI premium di seluruh aplikasi Workspace."
  },
  {
    id: 6,
    question: "Mengapa institusi harus berinvestasi pada Chromebook dibandingkan laptop biasa?",
    answer: "Chromebook memberikan penghematan biaya perangkat hingga 50% dan menghemat waktu tim IT hingga 76% dalam hal dukungan teknis."
  },
  {
    id: 7,
    question: "Seberapa aman Chromebook dari serangan siber?",
    answer: "Hingga saat ini, tercatat tidak ada serangan ransomware yang berhasil pada ChromeOS. Penggunaan Chromebook dapat menurunkan risiko serangan ransomware hingga 100%."
  },
  {
    id: 8,
    question: "Bagaimana jika institusi masih memiliki laptop lama yang bukan Chromebook?",
    answer: "Anda dapat menggunakan ChromeOS Flex untuk menyegarkan dan memperbarui perangkat lama (PC atau Mac) agar berjalan dengan sistem operasi cloud yang aman dan cepat."
  },
  {
    id: 9,
    question: "Apa kegunaan Gemini AI bagi dosen dan mahasiswa?",
    answer: "Dosen: Dapat membuat rencana pembelajaran, menyusun kuis otomatis, memberikan umpan balik yang disesuaikan, dan meringkas dokumen panjang di Docs atau Gmail. Mahasiswa: Berfungsi sebagai asisten belajar personal untuk riset, menganalisis dokumen, dan meningkatkan pemahaman materi."
  },
    {
    id: 10,
    question: "Apakah ada pelatihan resmi untuk penggunaan AI ini?",
    answer: "Ya, tersedia program Gemini Academy untuk pendidik guna membangun literasi AI dan cara menggunakan AI secara aman serta bertanggung jawab. Ada juga sertifikasi resmi untuk pendidik dan mahasiswa."
  },
   {
    id: 11,
    question: "Apa syarat utama untuk mengajukan Google Workspace for Education Fundamentals?",
    answer: "Institusi harus memiliki domain resmi sekolah (sch.id atau ac.id), status akreditasi yang valid (SK Operasional), dan akses DNS untuk verifikasi domain."
  },
  {
    id: 12,
    question: "Apa itu program Google Reference University?",
    answer: "Program ini adalah pengakuan bagi universitas teladan yang telah menggunakan teknologi Google (seperti Gemini dan Chromebook) untuk transformasi pendidikan. Keuntungannya meliputi pengakuan global, dukungan PR dari Google, dan akses awal ke produk terbaru."
  },
  {
    id: 13,
    question: "Apa saja persyaratan khusus untuk program Universitas Referensi?",
    answer: "Institusi harus menggunakan Google Workspace for Educaton Edu +, Chromebook >=50, Setidaknya 50% pengguna harus aktif dalam alat produktivitas Google Workspace for Education, (khususnya Google Docs, Sheets, dan Slides). Institusi juga harus menunjukkan komitmen untuk berbagi praktik terbaik dan berpartisipasi dalam studi kasus dengan Google."
  }
];

const faqContext: string = FAQ_DATA.map((f: FaqItem) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');

const App: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: 'Halo! Saya asisten pintar Google for Education. Ada yang bisa saya bantu hari ini?' }
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draftEmail, setDraftEmail] = useState<DraftEmailState>({
    isOpen: false,
    content: '',
    isLoading: false,
    copied: false
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const systemPrompt = `Anda adalah asisten virtual Google for Education yang ramah. Referensi: ${faqContext}`;
      const chatHistory = messages.slice(-4).map((m: Message) => `${m.role === 'user' ? 'User' : 'Bot'}: ${m.content}`).join('\n');
      const promptText = `Chat:\n${chatHistory}\n\nUser: ${userMessage.content}\nBot:`;

      const geminiResponse = await callChatAPI(promptText, systemPrompt);
      setMessages(prev => [...prev, { role: 'bot', content: geminiResponse }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', content: "Maaf, silakan coba lagi nanti." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDraft = async (faq: FaqItem): Promise<void> => {
    setDraftEmail({ isOpen: true, content: '', isLoading: true, copied: false });
    try {
      const promptText = `Buat draft email formal ke Admin IT tentang: ${faq.question}. Solusi: ${faq.answer}`;
      const response = await callChatAPI(promptText);
      setDraftEmail({ isOpen: true, content: response, isLoading: false, copied: false });
    } catch (error) {
      setDraftEmail({ isOpen: true, content: 'Gagal membuat draft.', isLoading: false, copied: false });
    }
  };

  const handleCopyToClipboard = (): void => {
    navigator.clipboard.writeText(draftEmail.content);
    setDraftEmail(prev => ({ ...prev, copied: true }));
    setTimeout(() => setDraftEmail(prev => ({ ...prev, copied: false })), 2000);
  };

  const toggleFaq = (id: number): void => {
    setOpenFaq(openFaq === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 pb-20">
      {/* --- NAVIGASI SEDERHANA --- */}
      <nav className="bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-center sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-4 h-4 bg-[#4285F4] rounded-full"></div>
            <div className="w-4 h-4 bg-[#EA4335] rounded-full"></div>
            <div className="w-4 h-4 bg-[#FBBC05] rounded-full"></div>
            <div className="w-4 h-4 bg-[#34A853] rounded-full"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-700 tracking-tight">Google for Education</h1>
        </div>
      </nav>

      {/* --- HERO SECTION DENGAN GURU WPAP --- */}
      <section className="py-16 px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-gray-900 leading-tight">
              Pusat Bantuan <br/>
              <span className="text-[#4285F4]">Cerdas & Cepat</span>
            </h2>
            <p className="text-xl text-gray-500 mb-8 max-w-lg">
              Solusi instan untuk kendala teknis Anda. Biarkan asisten pintar kami membantu merangkai pesan profesional untuk Admin sekolah.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
               <div className="bg-[#F8F9FA] px-6 py-3 rounded-full border border-gray-200 text-gray-600 font-medium flex items-center gap-2">
                 <Check size={18} className="text-[#34A853]" /> Akun Terverifikasi
               </div>
               <div className="bg-[#F8F9FA] px-6 py-3 rounded-full border border-gray-200 text-gray-600 font-medium flex items-center gap-2">
                 <Check size={18} className="text-[#34A853]" /> Support 24/7
               </div>
            </div>
          </div>

          {/* ILUSTRASI GURU WPAP (SVG GEOMETRIS) */}
          <div className="relative w-80 h-80 md:w-112.5d:h-[450px]">
            <div className="absolute inset-0 bg-[#FBBC05] rounded-full opacity-10 animate-pulse"></div>
            
            <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-xl">
              <path d="M50,150 L150,50 L350,150 L250,350 Z" fill="#4285F4" opacity="0.1" />
              <path d="M150,120 L250,120 L270,220 L200,280 L130,220 Z" fill="#FFDBAC" />
              <path d="M150,120 L200,120 L200,280 L130,220 Z" fill="#F1C27D" />
              <path d="M140,120 L160,80 L240,80 L260,120 L200,100 Z" fill="#424242" />
              <path d="M160,80 L200,60 L240,80 Z" fill="#212121" />
              <path d="M155,160 L195,160 L195,190 L155,190 Z" fill="none" stroke="#4285F4" strokeWidth="6" />
              <path d="M205,160 L245,160 L245,190 L205,190 Z" fill="none" stroke="#4285F4" strokeWidth="6" />
              <path d="M195,175 L205,175" stroke="black" strokeWidth="3" />
              <path d="M130,280 L270,280 L320,400 L80,400 Z" fill="#34A853" />
              <path d="M130,280 L200,330 L270,280" fill="white" />
              <path d="M190,330 L210,330 L210,400 L190,400 Z" fill="#EA4335" />
              <rect x="300" y="100" width="40" height="40" fill="#FBBC05" transform="rotate(45 320 120)" />
              <circle cx="80" cy="250" r="20" fill="#EA4335" opacity="0.6" />
            </svg>

            <div className="absolute -top-4 -right-4 bg-white p-4 rounded-2xl shadow-lg animate-bounce">
              <Sparkles className="text-[#FBBC05]" size={32} />
            </div>
          </div>
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <main className="max-w-4xl mx-auto py-12 px-6">
        <div className="flex items-center gap-3 mb-10 border-l-8 border-[#4285F4] pl-6">
          <HelpCircle className="text-[#4285F4] w-8 h-8" />
          <h3 className="text-3xl font-bold text-gray-800">Frequently Asked Question (FAQ)</h3>
        </div>

        <div className="space-y-6">
          {FAQ_DATA.map((faq: FaqItem) => (
            <div 
              key={faq.id} 
              className={`bg-white rounded-2xl border-2 transition-all duration-300 ${
                openFaq === faq.id 
                  ? 'border-[#4285F4] shadow-xl translate-x-2' 
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <button 
                onClick={() => toggleFaq(faq.id)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                aria-expanded={openFaq === faq.id}
              >
                <span className="font-bold text-gray-700 text-xl">{faq.question}</span>
                <div className={`p-2 rounded-full transition-colors ${openFaq === faq.id ? 'bg-blue-50' : ''}`}>
                  {openFaq === faq.id 
                    ? <ChevronUp className="text-[#4285F4]" /> 
                    : <ChevronDown className="text-gray-400" />
                  }
                </div>
              </button>
              
              {openFaq === faq.id && (
                <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2">
                  <div className="w-full text-gray-600 leading-relaxed mb-6 p-6 bg-blue-50/50 rounded-2xl border border-blue-100 text-lg">
                    {faq.answer}
                  </div>
                  <button 
                    onClick={() => handleGenerateDraft(faq)}
                    className="w-full flex items-center justify-center gap-3 bg-[#EA4335] text-white px-6 py-4 rounded-xl hover:bg-red-600 transition-all font-bold shadow-lg hover:shadow-red-200 text-lg"
                  >
                    <Sparkles size={20} />
                    Tulis Email Ke Kami
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* --- MODAL DRAFT EMAIL --- */}
      {draftEmail.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-4xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-[#4285F4] p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Sparkles size={24} className="text-yellow-300" />
                <h3 className="text-xl font-bold">Draft Email Pintar</h3>
              </div>
              <button 
                onClick={() => setDraftEmail(prev => ({ ...prev, isOpen: false }))} 
                className="hover:bg-white/20 p-2 rounded-full transition-colors"
                aria-label="Tutup modal"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8">
              {draftEmail.isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                  <div className="w-16 h-16 border-4 border-blue-100 border-t-[#4285F4] rounded-full animate-spin"></div>
                  <p className="text-gray-500 font-medium">Gemini sedang menulis...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-6 text-gray-700 whitespace-pre-wrap max-h-[40vh] overflow-y-auto leading-relaxed shadow-inner">
                    {draftEmail.content}
                  </div>
                  <button 
                    onClick={handleCopyToClipboard}
                    className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-lg transition-all ${
                      draftEmail.copied 
                        ? 'bg-[#34A853] text-white' 
                        : 'bg-[#4285F4] hover:bg-blue-600 text-white shadow-lg shadow-blue-200'
                    }`}
                  >
                    {draftEmail.copied ? <Check size={24} /> : <Copy size={24} />}
                    {draftEmail.copied ? 'Tersalin Ke Clipboard!' : 'Salin Draft Email'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-gray-100 py-12 px-6 mt-12 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          <div className="flex gap-2">
             <div className="w-10 h-1.5 bg-[#4285F4] rounded-full"></div>
             <div className="w-10 h-1.5 bg-[#EA4335] rounded-full"></div>
             <div className="w-10 h-1.5 bg-[#FBBC05] rounded-full"></div>
             <div className="w-10 h-1.5 bg-[#34A853] rounded-full"></div>
          </div>
          <p className="text-gray-400 font-medium tracking-wide">© 2026 Portal Bantuan Google Education Indonesia</p>
        </div>
      </footer>

      {/* --- CHATBOT WIDGET --- */}
      <div className="fixed bottom-8 right-8 z-40">
        {!isChatOpen ? (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="bg-[#4285F4] text-white px-8 py-5 rounded-full shadow-2xl hover:shadow-blue-200 hover:-translate-y-2 transition-all flex items-center gap-4 group"
            aria-label="Buka chat"
          >
            <Sparkles size={24} className="text-yellow-300 group-hover:animate-pulse" />
            <span className="font-bold text-lg">Tanya Googie!</span>
          </button>
        ) : (
          <div className="bg-white w-95 md:w-112.5 h-150 rounded-[2.5rem] shadow-2xl flex flex-col border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-10 origin-bottom-right">
            <div className="bg-[#4285F4] p-6 text-white flex justify-between items-center shadow-lg">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl">
                  <Bot size={28} />
                </div>
                <div>
                  <p className="font-bold text-lg">Asisten Edu</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <p className="text-xs text-blue-100 font-medium uppercase tracking-widest">Online</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)} 
                className="hover:bg-white/20 p-2 rounded-xl transition-colors"
                aria-label="Tutup chat"
              >
                <X size={24} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8F9FA]">
              {messages.map((msg: Message, idx: number) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-100 text-[#4285F4]' 
                        : 'bg-white border border-gray-100 text-[#EA4335]'
                    }`}>
                      {msg.role === 'user' ? <User size={20} /> : <Sparkles size={20} />}
                    </div>
                    <div className={`p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-[#4285F4] text-white rounded-tr-none' 
                        : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
                    }`}>
                      {msg.content.split('\n').map((line: string, i: number, arr: string[]) => (
                        <React.Fragment key={i}>
                          {line}
                          {i !== arr.length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-gray-100 flex gap-3">
              <input 
                type="text"
                value={inputValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                placeholder="Tulis pesan Anda..."
                className="flex-1 bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-[#4285F4] focus:bg-white transition-all outline-none"
              />
              <button 
                disabled={isLoading || !inputValue.trim()}
                type="submit"
                className="bg-[#4285F4] text-white p-4 rounded-2xl hover:shadow-lg disabled:bg-gray-300 transition-all shadow-md"
                aria-label="Kirim pesan"
              >
                <Send size={22} className="ml-1" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
