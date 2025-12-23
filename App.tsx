
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Message, Language } from './types';
import { GeminiService, playRawPCM } from './services/geminiService';
import { SendIcon, SpeakerIcon, CopyIcon, VasstosMark, GlobeIcon } from './components/Icons';

const BRAND_RED = '#910000';

const getGreeting = (lang: Language) => {
  const hour = new Date().getHours();
  if (lang === 'pt') {
    if (hour >= 5 && hour < 12) return "Bom dia";
    if (hour >= 12 && hour < 18) return "Boa tarde";
    return "Boa noite";
  } else {
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 18) return "Good afternoon";
    return "Good evening";
  }
};

const TRANSLATIONS = {
  pt: {
    welcome: (greeting: string) => `${greeting}! Sou o assistente da VASSTOS. Como posso ajudar na sua carreira hoje?`,
    placeholder: 'Pergunte algo...',
    faqLabel: 'Sugestões:',
    searchLabel: 'Busca Ativa',
    syncLabel: 'Online',
    error: 'Erro técnico. Tente novamente.',
    copyFeedback: 'Copiado!',
    sourcesLabel: 'Fontes:',
    siteLink: 'Site',
    policyLink: 'Políticas',
    searching: 'Consultando...',
    eliteTag: 'Elite',
    hostedTag: 'Google Workspace',
    faqs: [
      "Quais são os cursos?",
      "Como obter certificação?",
      "Próximas turmas disponíveis",
      "Processo de inscrição"
    ]
  },
  en: {
    welcome: (greeting: string) => `${greeting}! I am your VASSTOS assistant. How can I help your career today?`,
    placeholder: 'Ask me anything...',
    faqLabel: 'Suggestions:',
    searchLabel: 'Web Search',
    syncLabel: 'Synced',
    error: 'Error. Try again.',
    copyFeedback: 'Copied!',
    sourcesLabel: 'Sources:',
    siteLink: 'Website',
    policyLink: 'Policies',
    searching: 'Querying...',
    eliteTag: 'Elite',
    hostedTag: 'Google Workspace',
    faqs: [
      "What are the courses?",
      "How to get certified?",
      "Available upcoming classes",
      "Enrollment process"
    ]
  }
};

const App: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('pt');
  const t = useMemo(() => TRANSLATIONS[language], [language]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [useSearch, setUseSearch] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const geminiService = useRef(new GeminiService());

  // Initialize Welcome Message and Suggestions
  useEffect(() => {
    const greeting = getGreeting(language);
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: t.welcome(greeting),
      timestamp: new Date(),
    }]);
    setSuggestions(t.faqs);
  }, [language, t]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isLoading, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    const trimmedInput = textToSend.trim();
    if (!trimmedInput || isLoading) return;

    setIsSendingFeedback(true);
    setTimeout(() => setIsSendingFeedback(false), 400);

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
      
      if (response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
      }
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
    <div className="fixed inset-0 pointer-events-none z-[9999] flex items-end justify-end p-4 md:p-6 font-['Inter']">
      
      {/* Janela do Chat - Estética Clean Profissional */}
      <div className={`
        pointer-events-auto
        flex flex-col
        w-full max-w-[400px] h-[600px] max-h-[85vh]
        bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.1)]
        transition-all duration-500 ease-in-out origin-bottom-right
        ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-10 pointer-events-none'}
      `}>
        {/* Header - Light Identity */}
        <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#910000] rounded-lg flex items-center justify-center border border-[#b30000] shadow-sm">
              <VasstosMark className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-slate-900 leading-none">VASSTOS AI</h1>
              <span className="text-[8px] text-[#910000] font-black uppercase tracking-widest">Consultor Online</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button onClick={() => setLanguage('pt')} className={`px-2 py-0.5 text-[8px] font-black rounded transition-all ${language === 'pt' ? 'bg-[#910000] text-white shadow-sm' : 'text-slate-500'}`}>PT</button>
              <button onClick={() => setLanguage('en')} className={`px-2 py-0.5 text-[8px] font-black rounded transition-all ${language === 'en' ? 'bg-[#910000] text-white shadow-sm' : 'text-slate-500'}`}>EN</button>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Chat Area - Light Background */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth no-scrollbar bg-[#f8fafc]">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`flex gap-2 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`mt-1 shrink-0 w-6 h-6 rounded-md flex items-center justify-center border ${
                  msg.role === 'user' ? 'bg-white border-slate-200 text-slate-400 shadow-sm' : 'bg-[#910000] border-[#b30000] text-white shadow-sm'
                }`}>
                  {msg.role === 'user' ? <span className="text-[7px] font-black uppercase">Eu</span> : <VasstosMark className="w-4 h-4" />}
                </div>
                
                <div className={`space-y-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`p-3 rounded-2xl text-[13px] shadow-sm leading-tight ${
                    msg.role === 'user' ? 'bg-[#910000] text-white rounded-tr-none border border-[#b30000]' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                  }`}>
                    {msg.content}
                    {msg.role === 'assistant' && (
                      <div className="flex justify-end gap-1.5 mt-2 opacity-50 hover:opacity-100 transition-opacity">
                        <button onClick={() => handleCopy(msg.content, msg.id)} className="p-1 hover:bg-slate-50 rounded text-slate-400 relative">
                          <CopyIcon className="w-3 h-3" />
                          {copyFeedback === msg.id && <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[7px] bg-[#910000] text-white px-1.5 py-0.5 rounded-full">{t.copyFeedback}</span>}
                        </button>
                        <button onClick={() => handleSpeak(msg.content)} className="p-1 hover:bg-slate-50 rounded text-slate-400"><SpeakerIcon className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1 px-1">
                      {msg.sources.map((s, i) => (
                        <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[8px] px-1.5 py-0.5 bg-white border border-slate-100 rounded text-slate-500 hover:text-[#910000] hover:border-[#910000]/30 max-w-[80px] truncate transition-all shadow-xs">{s.title}</a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-1.5 p-2 bg-white border border-slate-100 rounded-xl rounded-tl-none shadow-sm">
                <div className="w-1.5 h-1.5 bg-[#910000] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-[#910000] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-[#910000] rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Footer - White */}
        <footer className="p-4 bg-white border-t border-slate-100">
          <div className="space-y-3">
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar animate-in fade-in duration-500">
               {suggestions.map((f, idx) => (
                 <button 
                  key={`${idx}-${f}`} 
                  onClick={() => handleSendMessage(f)} 
                  disabled={isLoading} 
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[10px] text-slate-600 hover:bg-[#910000]/5 hover:text-[#910000] hover:border-[#910000]/30 transition-all whitespace-nowrap active:scale-95 shadow-sm"
                 >
                  {f}
                 </button>
               ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.placeholder}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 py-3.5 pl-4 pr-12 rounded-xl focus:outline-none focus:border-[#910000]/30 focus:bg-white text-xs placeholder:text-slate-400 transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`absolute right-1.5 p-2 bg-[#910000] text-white rounded-lg disabled:opacity-30 border border-[#b30000] transition-all duration-300 shadow-md ${isSendingFeedback ? 'animate-send-feedback' : 'hover:scale-105 active:scale-95'}`}
              >
                <SendIcon className="w-4 h-4" />
              </button>
            </form>
            <div className="flex justify-between items-center text-[7px] text-slate-400 font-black tracking-widest uppercase">
              <span>© VASSTOS ACADEMY</span>
              <button onClick={() => setUseSearch(!useSearch)} className={`flex items-center gap-1 transition-colors ${useSearch ? 'text-[#910000]' : 'text-slate-300'}`}>
                <GlobeIcon className="w-2.5 h-2.5" /> {t.searchLabel}
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Bubble Button - Red Identity */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          pointer-events-auto
          mt-4 w-14 h-14 md:w-16 h-16 
          bg-[#910000] border-2 border-[#b30000] rounded-full
          flex items-center justify-center text-white shadow-[0_8px_25px_rgba(145,0,0,0.3)]
          hover:scale-110 active:scale-95 transition-all duration-300
          relative group
          ${!isOpen ? 'animate-brand-pulse' : ''}
        `}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <VasstosMark className="w-8 h-8" />
        )}
      </button>
    </div>
  );
};

export default App;
