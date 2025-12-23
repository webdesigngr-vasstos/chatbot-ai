
import React, { useState, useRef, useEffect } from 'react';
import { Message } from './types';
import { GeminiService, playRawPCM } from './services/geminiService';
import { SendIcon, BotIcon, SpeakerIcon } from './components/Icons';

const FAQ_SUGGESTIONS = [
  "Quais soluções de IA a VASSTOS oferece?",
  "Como a VASSTOS ajuda na transformação digital?",
  "Como entrar em contato com o suporte?",
  "A VASSTOS faz desenvolvimento sob medida?",
  "Integração de APIs e Automação"
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Bem-vindo ao Centro de Conhecimento VASSTOS. Sou seu especialista em inovação digital. Como posso potencializar seu negócio hoje?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const geminiService = useRef(new GeminiService());

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
        useSearch
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        sources: response.sources?.map((chunk: any) => ({
          title: chunk.web?.title || 'Base de Conhecimento',
          uri: chunk.web?.uri || '',
        })).filter(s => s.uri),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: 'error',
        role: 'assistant',
        content: 'Tive uma instabilidade ao acessar a base de conhecimento. Poderia repetir a pergunta?',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = async (text: string) => {
    const audioData = await geminiService.current.speakText(text);
    if (audioData) {
      playRawPCM(audioData);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 glass-effect border-b border-indigo-500/20 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/40 relative group">
            <BotIcon className="w-6 h-6 text-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-slate-950 rounded-full animate-pulse"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight">VASSTOS</h1>
              <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 font-bold uppercase">KB Expert</span>
            </div>
            <p className="text-xs text-slate-400 font-medium tracking-wide">Knowledge Base & Support</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
            <span className="text-[10px] text-slate-400 uppercase tracking-tighter font-semibold">Base de Conhecimento Ativa</span>
          </div>
          <label className="flex items-center gap-3 cursor-pointer group bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800 hover:border-indigo-500/40 transition-all">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Web Search</span>
            <div 
              onClick={() => setUseSearch(!useSearch)}
              className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ${useSearch ? 'bg-indigo-600' : 'bg-slate-700'}`}
            >
              <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-200 ${useSearch ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </label>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`mt-1 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-slate-800 border border-slate-700' : 'bg-indigo-600 shadow-lg shadow-indigo-500/20'}`}>
                  {msg.role === 'user' ? (
                    <span className="text-[10px] font-bold text-slate-300 uppercase">You</span>
                  ) : (
                    <BotIcon className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="space-y-2">
                  <div className={`p-4 rounded-2xl shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'glass-effect text-slate-200 border-indigo-500/10 rounded-tl-none'
                    }`}>
                    <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base font-normal">{msg.content}</p>
                    
                    {msg.role === 'assistant' && (
                      <div className="flex justify-end mt-2">
                        <button 
                          onClick={() => handleSpeak(msg.content)}
                          className="p-1.5 hover:bg-indigo-500/20 rounded-lg transition-colors text-slate-500 hover:text-indigo-400"
                          title="Reproduzir áudio"
                        >
                          <SpeakerIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-col gap-1.5 pl-1 pt-1">
                      <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Fontes Consultadas:</span>
                      <div className="flex flex-wrap gap-2">
                        {msg.sources.map((source, i) => (
                          <a 
                            key={i} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] px-2.5 py-1 bg-indigo-500/5 border border-indigo-500/10 rounded-md hover:bg-indigo-500/20 text-indigo-300 transition-all flex items-center gap-1.5 group"
                          >
                            <span className="w-1 h-1 bg-indigo-500 rounded-full group-hover:scale-125 transition-transform"></span>
                            {source.title.length > 40 ? source.title.substring(0, 40) + '...' : source.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className="text-[10px] text-slate-600 block px-1 font-medium">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[85%]">
                <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center animate-pulse">
                  <BotIcon className="w-4 h-4 text-white/40" />
                </div>
                <div className="glass-effect p-4 rounded-2xl rounded-tl-none flex items-center gap-2 border-indigo-500/5">
                  <span className="text-xs text-slate-500 font-medium">Consultando Base de Dados...</span>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* FAQ Suggestions & Input Area */}
      <footer className="p-4 md:p-6 border-t border-slate-900 bg-slate-950/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* FAQ Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar flex-nowrap items-center">
             <span className="shrink-0 text-[10px] text-slate-500 font-bold uppercase pr-2 border-r border-slate-800">FAQ:</span>
             {FAQ_SUGGESTIONS.map((suggestion, idx) => (
               <button
                 key={idx}
                 onClick={() => handleSendMessage(suggestion)}
                 disabled={isLoading}
                 className="shrink-0 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400 hover:text-indigo-300 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all active:scale-95 disabled:opacity-50"
               >
                 {suggestion}
               </button>
             ))}
          </div>

          {/* Form */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} 
            className="relative group flex items-center"
          >
            <div className="absolute left-4 text-indigo-500/50 group-focus-within:text-indigo-400 transition-colors">
              <BotIcon className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua dúvida sobre a VASSTOS ou escolha um FAQ acima..."
              className="w-full bg-slate-900/80 border border-slate-800 text-slate-200 py-4 pl-12 pr-14 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-slate-900 transition-all placeholder:text-slate-600 text-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-3 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-20 disabled:grayscale transition-all shadow-lg shadow-indigo-500/10 active:scale-95"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </form>

          <div className="flex justify-between items-center px-2 text-[9px] text-slate-700 font-bold uppercase tracking-[0.2em]">
            <p>© 2024 VASSTOS AI SOLUTIONS</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-indigo-500 transition-colors">Segurança</a>
              <a href="#" className="hover:text-indigo-500 transition-colors">Termos</a>
              <a href="https://www.vasstos.com" target="_blank" className="text-indigo-500/80 hover:text-indigo-400">Website</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
