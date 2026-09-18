import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Settings, 
  Share2, 
  ChevronDown, 
  Cpu, 
  Check, 
  ShieldAlert,
  Copy
} from 'lucide-react';

// --- TYPES ---
interface ChatItem {
  id: string;
  title: string;
  isActive?: boolean;
}

interface ChatGroup {
  period: string;
  items: ChatItem[];
}

// --- MOCK DATA ---
const CHAT_HISTORY: ChatGroup[] = [
  {
    period: 'TODAY',
    items: [
      { id: '1', title: 'System Architecture & API Desi...', isActive: true },
      { id: '2', title: 'Lightweight python cache' },
      { id: '3', title: 'Tailwind styling logic' }
    ]
  },
  {
    period: 'YESTERDAY',
    items: [
      { id: '4', title: 'Docker orchestration build' },
      { id: '5', title: 'FastAPI middleware setup' }
    ]
  },
  {
    period: 'PREVIOUS 7 DAYS',
    items: [
      { id: '6', title: 'SQL optimizations on indexing' },
      { id: '7', title: 'Redis memory management' },
      { id: '8', title: 'LLM JSON schema validations' }
    ]
  }
];

const MODEL_OPTIONS = [
  'nusaAI Agent v2 (Active)',
  'nusaAI Agent v1.5 (Legacy)',
  'nusaAI Code Worker Pro',
  'nusaAI Data Pipeline Specialist'
];

export default function NusaAISettingsApp() {
  // --- STATES ---
  const [activeChat, setActiveChat] = useState<string>('1');
  const [selectedModel, setSelectedModel] = useState<string>('nusaAI Agent v2 (Active)');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState<boolean>(false);
  const [isHeaderAgentOpen, setIsHeaderAgentOpen] = useState<boolean>(false);
  const [apiKey] = useState<string>('sk_live_51NvC...8h2g');
  const [isRevoked, setIsRevoked] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleRevoke = () => {
    setIsRevoked(!isRevoked);
  };

  const handleCopyKey = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F9FA] font-sans text-neutral-900 antialiased selection:bg-black selection:text-white">
      
      {/* ========================================== */}
      {/* 1. SIDEBAR (Left Panel - approx 280px)     */}
      {/* ========================================== */}
      <aside className="flex w-72 flex-col justify-between border-r border-neutral-200/80 bg-[#F3F4F6] p-4 select-none">
        <div className="flex flex-col space-y-5">
          
          {/* Brand Header */}
          <div 
            className={`flex items-center space-x-2.5 px-2 pt-1 transition-all duration-500 transform ${
              isMounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
            }`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white shadow-md">
              <Cpu className="h-5 w-5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-black">
              nusaAI
            </span>
          </div>

          {/* New Chat Button */}
          <button
            className={`flex w-full items-center justify-center space-x-2 rounded-xl border border-neutral-300 bg-white py-2.5 text-xs font-semibold text-neutral-900 shadow-2xs transition-all duration-200 hover:border-black hover:bg-neutral-50 active:scale-95 transform ${
              isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </button>

          {/* Chat History Sections */}
          <div className="flex flex-col space-y-5 overflow-y-auto pr-1 scrollbar-none">
            {CHAT_HISTORY.map((group, groupIdx) => (
              <div 
                key={group.period}
                className={`space-y-1.5 transition-all duration-500 transform ${
                  isMounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}
                style={{ transitionDelay: `${(groupIdx + 1) * 100}ms` }}
              >
                <h4 className="px-2 text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
                  {group.period}
                </h4>

                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = activeChat === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveChat(item.id)}
                        className={`relative flex w-full items-center space-x-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium transition-all duration-200 hover:translate-x-0.5 ${
                          isActive 
                            ? 'bg-black text-white shadow-sm' 
                            : 'text-neutral-600 hover:bg-neutral-200/60 hover:text-neutral-900'
                        }`}
                      >
                        <MessageSquare className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                        <span className="truncate">{item.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Profile Footer */}
        <div 
          className={`mt-auto pt-4 transition-all duration-700 transform ${
            isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="flex items-center justify-between rounded-xl border border-neutral-200/90 bg-white p-2.5 shadow-2xs transition-all hover:border-neutral-300">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120&h=120"
                alt="Anna Vance"
                className="h-8 w-8 rounded-full object-cover ring-1 ring-neutral-200"
              />
              <div className="flex flex-col truncate">
                <div className="flex items-center space-x-1.5">
                  <span className="truncate text-xs font-bold text-neutral-900">
                    Anna Vance
                  </span>
                  <span className="rounded bg-black px-1.5 py-0.5 text-[9px] font-bold text-white tracking-wider uppercase">
                    PRO
                  </span>
                </div>
                <span className="truncate text-[10px] text-neutral-400">
                  anna@nusaai.dev
                </span>
              </div>
            </div>

            <button
              className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 hover:rotate-45 transition-all duration-200"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================== */}
      {/* 2. MAIN CONTENT AREA (Settings View)       */}
      {/* ========================================== */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#F8F9FA] p-6 md:p-10">
        <div className="mx-auto w-full max-w-4xl space-y-8">
          
          {/* Top Header Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200/60">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Settings
            </h1>

            <div className="flex items-center space-x-2">
              {/* Active Agent Dropdown Pill */}
              <div className="relative">
                <button
                  onClick={() => setIsHeaderAgentOpen(!isHeaderAgentOpen)}
                  className="flex items-center space-x-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-800 shadow-2xs hover:bg-neutral-50 transition-all active:scale-95"
                >
                  {/* Pulse Online Indicator (Black Dot) */}
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black opacity-40"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-black"></span>
                  </span>
                  <span>nusaAI Agent</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-neutral-400 transition-transform duration-200 ${isHeaderAgentOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu Header */}
                {isHeaderAgentOpen && (
                  <div className="absolute right-0 mt-2 w-52 z-30 rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-xl transition-all duration-200 animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                      Active Cluster Status
                    </div>
                    <button className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-neutral-900 hover:bg-neutral-100">
                      <span>Cluster EU-West-1</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-black"></span>
                    </button>
                    <button className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-neutral-500 hover:bg-neutral-100">
                      <span>Cluster US-East-2</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-neutral-300"></span>
                    </button>
                  </div>
                )}
              </div>

              {/* Share Icon Button */}
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-2xs hover:bg-neutral-50 hover:text-neutral-900 hover:scale-105 active:scale-95 transition-all"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* SECTION 1: Agent Profile */}
          <section className="space-y-4 pt-2">
            <h2 className="text-base font-bold text-neutral-900">
              Agent Profile
            </h2>

            <div className="flex items-center space-x-6">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200"
                  alt="Anna Vance Profile"
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-neutral-200 shadow-sm"
                />
              </div>

              <div className="flex flex-1 max-w-xl flex-col space-y-3">
                <input
                  type="text"
                  readOnly
                  value="Anna Vance"
                  className="w-full rounded-xl border border-neutral-200/90 bg-white px-4 py-2.5 text-xs font-medium text-neutral-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-black"
                />
                <input
                  type="email"
                  readOnly
                  value="anna@nusaai.dev"
                  className="w-full rounded-xl border border-neutral-200/90 bg-white px-4 py-2.5 text-xs font-medium text-neutral-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>
          </section>

          <hr className="border-neutral-200/70" />

          {/* SECTION 2: Agent Preferences */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-neutral-900">
              Agent Preferences
            </h2>

            <div className="max-w-md space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500">
                Default Agent Model
              </label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-medium text-neutral-900 shadow-2xs hover:border-neutral-300 focus:outline-none focus:ring-1 focus:ring-black transition-all"
                >
                  <span>{selectedModel}</span>
                  <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu Preferences */}
                {isModelDropdownOpen && (
                  <div className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg transition-all duration-200 animate-in fade-in slide-in-from-top-1">
                    {MODEL_OPTIONS.map((model) => (
                      <button
                        key={model}
                        onClick={() => {
                          setSelectedModel(model);
                          setIsModelDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                          selectedModel === model
                            ? 'bg-black text-white'
                            : 'text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <span>{model}</span>
                        {selectedModel === model && (
                          <Check className="h-3.5 w-3.5 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <hr className="border-neutral-200/70" />

          {/* SECTION 3: Agent API Keys */}
          <section className="space-y-3 pb-8">
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Agent API Keys
              </h2>
              <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                Provision API tokens to connect and control your nusaAI agents programmatically.
              </p>
            </div>

            <div className="flex max-w-xl items-center space-x-3 pt-1">
              {/* Masked API Key Input Field */}
              <div className="relative flex-1">
                <input
                  type="text"
                  readOnly
                  value={isRevoked ? 'sk_live_REVOKED_TOKEN' : apiKey}
                  className={`w-full rounded-xl border px-4 py-2.5 text-xs font-mono transition-all shadow-2xs ${
                    isRevoked
                      ? 'border-neutral-300 bg-neutral-100 text-neutral-400 line-through'
                      : 'border-neutral-200 bg-white text-neutral-800 focus:ring-1 focus:ring-black'
                  }`}
                />
                {!isRevoked && (
                  <button
                    onClick={handleCopyKey}
                    title="Copy Key"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 transition-colors"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-black" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>

              {/* Action Button: Revoke / Restore (Solid Black) */}
              <button
                onClick={handleRevoke}
                className={`flex items-center space-x-1.5 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-95 ${
                  isRevoked
                    ? 'bg-neutral-700 hover:bg-neutral-800'
                    : 'bg-black hover:bg-neutral-800'
                }`}
              >
                {isRevoked ? (
                  <span>Restore</span>
                ) : (
                  <>
                    <ShieldAlert className="h-3.5 w-3.5 opacity-80" />
                    <span>Revoke</span>
                  </>
                )}
              </button>
            </div>
          </section>

        </div>
      </main>

    </div>
  );
}