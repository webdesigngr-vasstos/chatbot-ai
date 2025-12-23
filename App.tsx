
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Message, Language } from './types';
import { GeminiService, playRawPCM } from './services/geminiService';
import { SendIcon, SpeakerIcon, CopyIcon, VasstosMark, GlobeIcon } from './components/Icons';

const BRAND_RED = '#910000';

const TRANSLATIONS = {
  pt: {
    welcome: 'Bem-vindo à Academia Profissional VASSTOS! Sou seu consultor acadêmico digital. Como posso ajudar você a trilhar um caminho de sucesso hoje?',
    placeholder: 'Pergunte sobre cursos, turmas ou certificações...',
    faqLabel: 'Sugestões Acadêmicas:',
    searchLabel: 'Grounding Web',
    syncLabel: 'Base Sincronizada',
    error: 'Houve um erro técnico. Por favor, tente novamente.',
    copyFeedback: 'Copiado!',
    sourcesLabel: 'Fontes Oficiais',
    siteLink: 'Website',
    policyLink: 'Políticas',
    searching: 'Analisando dados da VASSTOS...',
    eliteTag: 'Academia de Elite',
    hostedTag: 'Google Workspace Powered',
    faqs: [
      "Quais cursos estão disponíveis?",
      "Como funcionam as certificações?",
      "Próximas turmas e horários",
      "Inscrições e Valores"
    ]
  },
  en: {
    welcome: 'Welcome to VASSTOS Professional Academy! I am your digital academic advisor. How can I help you forge a path to success today?',
    placeholder: 'Ask about courses, classes, or certifications...',
    faqLabel: 'Academic Suggestions:',
    searchLabel: 'Web Grounding',
    syncLabel: 'Database Synced',
    error: 'A technical error occurred. Please try again.',
    copyFeedback: 'Copied!',
    sourcesLabel: 'Official Sources',
    siteLink: 'Website',
    policyLink: 'Policies',
    searching: 'Analyzing VASSTOS data...',
    eliteTag: 'Elite Academy',
    hostedTag: 'Google Workspace Powered',
    faqs: [
      "What courses are available?",
      "How do certifications work?",
      "Upcoming classes and schedules",
      "Enrollment and Fees"
    ]
  }
};

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('pt');
  const t = useMemo(() => TRANSLATIONS[language], [language]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: t.welcome,
      timestamp: new Date(),
    },
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const geminiService = useRef(new GeminiService());

  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 'welcome') {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: t.welcome,
        timestamp: new Date(),
      }]);
    }
  }, [language, t.welcome]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    const trimmedInput = textToSend.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await geminiService.current.generateResponse(
        [...messages, userMessage],
        language,
        useSearch
      );

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        sources: response.sources?.map((chunk: any) => ({
          title: chunk.web?.title || 'VASSTOS Info',
          uri: chunk.web?.uri || '',
        })).filter(s => s.uri),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, {
        id: 'error',
        role: 'assistant',
        content: t.error,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = async (text: string) => {
    const audioData = await geminiService.current.speakText(text, language);
    if (audioData) playRawPCM(audioData);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-[#050b1a] text-slate-200 overflow-hidden font-['Inter']">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#0a1229]/95 backdrop-blur-xl border-b border-[#910000]/30 sticky top-0 z-20 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#910000] rounded-xl flex items-center justify-center shadow-[0_0_25px_rgba(145,0,0,0.5)] border border-[#b30000]">
            <VasstosMark className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-xl tracking-tight text-white">VASSTOS</h1>
              <span className="px-2 py-0.5 rounded-full bg-[#910000]/10 border border-[#910000]/40 text-[8px] text-[#ff4d4d] font-black uppercase tracking-widest">{t.eliteTag}</span>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{t.hostedTag}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-900/60 rounded-xl p-1 border border-slate-800">
            <button 
              onClick={() => setLanguage('pt')}
              className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${language === 'pt' ? 'bg-[#910000] text-white' : 'text-slate-600 hover:text-slate-400'}`}
            >
              PT
            </button>
            <button 
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${language === 'en' ? 'bg-[#910000] text-white' : 'text-slate-600 hover:text-slate-400'}`}
            >
              EN
            </button>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group bg-slate-900/40 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-[#910000]/30 transition-all">
              <GlobeIcon className="w-3 h-3 text-slate-500 group-hover:text-[#910000]" />
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{t.searchLabel}</span>
              <div 
                onClick={() => setUseSearch(!useSearch)}
                className={`w-8 h-4 rounded-full p-0.5 transition-all duration-300 ${useSearch ? 'bg-[#910000]' : 'bg-slate-700'}`}
              >
                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-300 ${useSearch ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </label>
          </div>
        </div>
      </header>

      {/* Main Chat Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth scrollbar-thin scrollbar-thumb-slate-800">
        <div className="max-w-4xl mx-auto space-y-10 pb-16">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
              <div className={`flex gap-4 max-w-[95%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`mt-1 shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center border-2 ${
                  msg.role === 'user' 
                    ? 'bg-slate-900 border-slate-800 text-slate-500 shadow-inner' 
                    : 'bg-[#910000] border-[#b30000] shadow-[0_4px_15px_rgba(145,0,0,0.3)] text-white'
                }`}>
                  {msg.role === 'user' ? (
                    <span className="text-[10px] font-black">USER</span>
                  ) : (
                    <VasstosMark className="w-6 h-6" />
                  )}
                </div>
                
                <div className={`space-y-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`p-6 rounded-3xl shadow-xl leading-relaxed text-[15px] md:text-[16px] ${
                    msg.role === 'user' 
                      ? 'bg-[#910000] text-white rounded-tr-none border border-[#b30000]' 
                      : 'bg-[#0f172a] text-slate-100 border border-slate-800/50 rounded-tl-none'
                    }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    
                    {msg.role === 'assistant' && (
                      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-800/50">
                        <button 
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-500 hover:text-white relative"
                          title="Copy"
                        >
                          <CopyIcon className="w-4 h-4" />
                          {copyFeedback === msg.id && (
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-[10px] bg-green-600 text-white px-3 py-1 rounded-full shadow-lg">{t.copyFeedback}</span>
                          )}
                        </button>
                        <button 
                          onClick={() => handleSpeak(msg.content)}
                          className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-500 hover:text-white"
                          title="Listen"
                        >
                          <SpeakerIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-col gap-3 p-4 bg-[#910000]/5 border border-[#910000]/10 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#910000] rounded-full animate-pulse"></div>
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{t.sourcesLabel}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.sources.map((source, i) => (
                          <a 
                            key={i} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[11px] px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl hover:border-[#910000] hover:text-[#ff4d4d] transition-all flex items-center gap-2 shadow-sm"
                          >
                            <span className="text-[#910000] font-black">{i+1}</span>
                            <span className="max-w-[180px] truncate font-medium">{source.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-pulse">
              <div className="flex gap-4 max-w-[80%]">
                <div className="shrink-0 w-10 h-10 rounded-2xl bg-[#910000]/10 border border-[#910000]/20 flex items-center justify-center">
                  <VasstosMark className="w-6 h-6 text-[#910000]/40" />
                </div>
                <div className="bg-[#0f172a] border border-[#910000]/10 p-6 rounded-3xl rounded-tl-none flex flex-col gap-3 min-w-[220px]">
                  <span className="text-[10px] text-[#ff4d4d]/60 font-black uppercase tracking-widest">{t.searching}</span>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-[#910000] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-[#910000] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-[#910000] rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input & FAQ Section */}
      <footer className="p-6 md:p-10 bg-[#0a1229]/98 backdrop-blur-3xl border-t border-[#910000]/20 shadow-[0_-10px_50px_rgba(0,0,0,0.5)]">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* FAQ suggestions */}
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar items-center">
             <span className="shrink-0 text-[10px] text-slate-600 font-black uppercase tracking-tighter mr-2">{t.faqLabel}</span>
             {t.faqs.map((suggestion, idx) => (
               <button
                 key={idx}
                 onClick={() => handleSendMessage(suggestion)}
                 disabled={isLoading}
                 className="shrink-0 px-5 py-2.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-[12px] text-slate-400 font-semibold hover:text-white hover:border-[#910000]/60 hover:bg-[#910000]/10 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap shadow-sm"
               >
                 {suggestion}
               </button>
             ))}
          </div>

          {/* Prompt Input */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} 
            className="relative flex items-center"
          >
            <div className="absolute left-6 text-[#910000]/50 transition-colors pointer-events-none">
              <VasstosMark className="w-6 h-6" />
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              className="w-full bg-[#0d152b] border-2 border-slate-800 text-slate-100 py-6 pl-16 pr-20 rounded-3xl focus:outline-none focus:ring-4 focus:ring-[#910000]/20 focus:border-[#910000]/50 transition-all placeholder:text-slate-700 text-base font-medium shadow-2xl"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-4 p-4 bg-[#910000] text-white rounded-2xl hover:bg-[#b30000] disabled:opacity-20 disabled:grayscale transition-all shadow-xl shadow-[#910000]/30 active:scale-90 border border-[#b30000]"
            >
              <SendIcon className="w-6 h-6" />
            </button>
          </form>

          {/* Footer Metadata */}
          <div className="flex flex-col md:flex-row justify-between items-center px-4 gap-4 opacity-40 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-4 text-[10px] text-slate-600 font-black uppercase tracking-[0.4em]">
              <p>© 2024 VASSTOS ACADEMY</p>
              <div className="w-1.5 h-1.5 bg-slate-800 rounded-full"></div>
              <p>GOOGLE WORKSPACE ELITE PARTNER</p>
            </div>
            <div className="flex gap-8 text-[11px] font-black uppercase tracking-widest">
              <a href="https://www.vasstos.com" target="_blank" className="text-[#910000] hover:text-[#ff4d4d] transition-colors">{t.siteLink}</a>
              <a href="#" className="text-slate-700 hover:text-slate-400 transition-colors">{t.policyLink}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
