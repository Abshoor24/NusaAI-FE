import { useState, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { 
  Cpu, Plus, MessageSquare, Settings, Share2, Paperclip, 
  ArrowUp, Play, Calendar, Terminal, CheckCircle2, CircleDot, ChevronDown,
  Search, ShieldAlert, Activity, GitBranch, GitCommit, Clock, Pause, RefreshCw,
  Sliders, Command, Server, FileText, CornerDownLeft, AlertTriangle, Layers,
  Check, X, ChevronRight, Lock
} from 'lucide-react';

// --- TYPES & INTERFACES (Backend-Ready) ---
type PipelineStatus = 'Executing' | 'Idle' | 'Failed' | 'Successful' | 'Paused';
type LogLevel = 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  step?: string;
}

interface PipelineStep {
  id: string;
  name: string;
  status: 'completed' | 'running' | 'waiting' | 'failed';
  duration?: string;
  details: string;
}

interface TaskItem {
  id: string;
  title: string;
  category: 'Active' | 'Scheduled' | 'Maintenance';
  status: PipelineStatus;
  env: string;
  branch: string;
  commit: string;
  duration: string;
  startedAt: string;
  trigger: string;
  risk: 'Low' | 'Medium' | 'High';
}

export default function Dashboard() {
  // --- STATE MANAGEMENT ---
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activeTaskId, setActiveTaskId] = useState('task-1');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'logs' | 'agent' | 'history'>('pipeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mock Tasks Dataset
  const tasks: TaskItem[] = [
    { id: 'task-1', title: 'Auto Deploy Pipeline', category: 'Active', status: 'Executing', env: 'Staging', branch: 'release', commit: 'a82f91c', duration: '02m 34s', startedAt: '09:42:15', trigger: 'AI Agent', risk: 'Low' },
    { id: 'task-2', title: 'Code Review Sprint #12', category: 'Active', status: 'Idle', env: 'Production', branch: 'feature/auth', commit: '7b3e10a', duration: '05m 12s', startedAt: '08:15:00', trigger: 'Manual', risk: 'Medium' },
    { id: 'task-3', title: 'Data Migration v2.1', category: 'Active', status: 'Idle', env: 'Staging', branch: 'main', commit: '9f1c44b', duration: '12m 45s', startedAt: '07:30:22', trigger: 'Scheduled', risk: 'High' },
    { id: 'task-4', title: 'API Schema Validation', category: 'Scheduled', status: 'Idle', env: 'Staging', branch: 'main', commit: '3d2a11e', duration: '-', startedAt: 'Scheduled', trigger: 'Scheduled', risk: 'Low' },
    { id: 'task-5', title: 'Security Audit Scan', category: 'Scheduled', status: 'Idle', env: 'Production', branch: 'main', commit: '5c4b89f', duration: '-', startedAt: 'Scheduled', trigger: 'Scheduled', risk: 'Low' },
    { id: 'task-6', title: 'Performance Optimization', category: 'Maintenance', status: 'Idle', env: 'Staging', branch: 'perf/index', commit: '1a2b3c4', duration: '-', startedAt: '-', trigger: 'Manual', risk: 'Low' },
  ];

  const currentTask = tasks.find(t => t.id === activeTaskId) || tasks[0];

  // Pipeline Steps Mock
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([
    { id: 's1', name: 'Checkout release branch', status: 'completed', duration: '18s', details: 'Successfully fetched commit hash and validated cryptographic signature.' },
    { id: 's2', name: 'Build Docker container artifact', status: 'completed', duration: '1m 12s', details: 'Multi-stage build completed successfully. Pushed image to secure registry.' },
    { id: 's3', name: 'Run automated smoke tests', status: 'running', duration: '0m 45s', details: 'Executing 12 test endpoints against staging cluster. Awaiting latency metrics.' },
    { id: 's4', name: 'Verify API health endpoints', status: 'waiting', details: 'Checking response status and error rates.' },
    { id: 's5', name: 'Production rollout approval', status: 'waiting', details: 'Requires manual security sign-off.' },
  ]);

  // Logs Mock
  const logs: LogEntry[] = [
    { id: 'l1', timestamp: '09:42:15', level: 'INFO', message: 'Checkout release branch (a82f91c)...', step: 'Checkout' },
    { id: 'l2', timestamp: '09:42:33', level: 'SUCCESS', message: 'Commit validated successfully with GPG signature.', step: 'Checkout' },
    { id: 'l3', timestamp: '09:43:08', level: 'INFO', message: 'Initiating multi-stage Docker container build...', step: 'Build' },
    { id: 'l4', timestamp: '09:43:21', level: 'SUCCESS', message: 'Artifact nusaai-core:v2.4.1 built and pushed to registry.', step: 'Build' },
    { id: 'l5', timestamp: '09:43:50', level: 'INFO', message: 'Triggered 12 endpoint smoke tests on staging cluster.', step: 'Tests' },
    { id: 'l6', timestamp: '09:44:12', level: 'WARN', message: 'Endpoint /api/v1/telemetry latency increased by 23% (Threshold: 200ms).', step: 'Tests' },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    
    // Global Keyboard Shortcut for Command Palette (Cmd+K / Ctrl+K)
    const handleKeyDown = (e: KeyboardEvent | any) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown as any);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown as any);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCommandSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    showToast(`Command sent to Agent: "${inputValue}"`);
    setInputValue('');
  };

  return (
    <div className="flex h-screen w-screen bg-white font-sans text-gray-900 overflow-hidden select-none">
      
      {/* --- SIDEBAR --- */}
      <aside className={`w-64 bg-gray-50/70 border-r border-gray-200/80 flex flex-col justify-between flex-shrink-0 z-30 transition-all duration-200 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex flex-col h-full overflow-hidden">
          
          {/* Workspace Switcher Header */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200/80 flex-none bg-gray-50/50">
            <div className="flex items-center gap-2.5 truncate">
              <div className="bg-gray-900 p-1.5 rounded-lg flex items-center justify-center flex-shrink-0">
                <Cpu className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col truncate">
                <span className="font-semibold text-xs tracking-tight text-gray-900 truncate">nusaAI Workspace</span>
                <span className="text-[10px] text-gray-500 font-medium">Staging Environment</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          </div>

          {/* Action / Command Palette Trigger */}
          <div className="p-3 flex-none space-y-2">
            <button 
              onClick={() => showToast("Opening New Task Session creator...")}
              className="w-full flex items-center justify-between bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-3 rounded-xl transition-all text-xs shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-3.5 h-3.5" />
                <span>New Task Session</span>
              </div>
              <kbd className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700">⌘N</kbd>
            </button>

            <button 
              onClick={() => setIsCommandPaletteOpen(true)}
              className="w-full flex items-center justify-between bg-white border border-gray-200/80 hover:border-gray-300 text-gray-500 hover:text-gray-900 py-1.5 px-3 rounded-xl transition-all text-xs"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-gray-400" />
                <span>Search or run...</span>
              </div>
              <kbd className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 font-mono">⌘K</kbd>
            </button>
          </div>

          {/* Navigation Groups */}
          <div className="px-3 overflow-y-auto flex-1 space-y-6 pt-1 pb-4">
            
            {/* Active Tasks */}
            <div>
              <div className="flex items-center justify-between px-2 mb-1.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Active Sessions</span>
                <span className="text-[10px] bg-gray-200/70 text-gray-700 font-semibold px-1.5 py-0.2 rounded">3</span>
              </div>
              <ul className="space-y-0.5">
                {tasks.filter(t => t.category === 'Active').map((task) => (
                  <li key={task.id}>
                    <button 
                      onClick={() => setActiveTaskId(task.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                        activeTaskId === task.id 
                          ? 'bg-gray-200/80 text-gray-900 font-semibold shadow-2xs' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${activeTaskId === task.id ? 'text-gray-900' : 'text-gray-400'}`} />
                        <span className="truncate">{task.title}</span>
                      </div>
                      {task.status === 'Executing' ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" title="Executing"></span>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-mono">{task.duration}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Scheduled Tasks */}
            <div>
              <div className="px-2 mb-1.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Scheduled</span>
              </div>
              <ul className="space-y-0.5">
                {tasks.filter(t => t.category === 'Scheduled').map((task) => (
                  <li key={task.id}>
                    <button 
                      onClick={() => setActiveTaskId(task.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                        activeTaskId === task.id ? 'bg-gray-200/80 text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{task.title}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">Cron</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Maintenance */}
            <div>
              <div className="px-2 mb-1.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Maintenance</span>
              </div>
              <ul className="space-y-0.5">
                {tasks.filter(t => t.category === 'Maintenance').map((task) => (
                  <li key={task.id}>
                    <button 
                      onClick={() => setActiveTaskId(task.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                        activeTaskId === task.id ? 'bg-gray-200/80 text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Server className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{task.title}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-gray-200/80 bg-gray-50 flex-none">
          <div className="flex items-center justify-between bg-white border border-gray-200/80 p-2 rounded-xl hover:border-gray-300 transition-all cursor-pointer shadow-2xs">
            <div className="flex items-center gap-2.5 truncate">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=250&auto=format&fit=crop" 
                alt="Anna Vance" 
                className="w-7 h-7 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-gray-900 leading-tight truncate">Anna Vance</span>
                <span className="text-[10px] text-gray-500">Engineering</span>
              </div>
            </div>
            <button onClick={() => showToast("Opening settings panel...")} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors">
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        
        {/* TOP BAR */}
        <header className="flex-none h-14 border-b border-gray-200/80 bg-white flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-2 truncate">
            <h1 className="text-xs md:text-sm font-medium text-gray-500 tracking-tight flex items-center gap-2 truncate">
              <span>Pipeline Monitoring</span>
              <span className="text-gray-300">/</span>
              <span className="text-gray-900 font-semibold truncate">{currentTask.title}</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 border border-gray-200/80 rounded-md text-[11px] font-medium text-gray-700">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>Env: {currentTask.env}</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200/60 rounded-md text-[11px] font-medium text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Agent Active</span>
            </div>
            
            <button 
              onClick={() => showToast("Session secure link copied to clipboard.")}
              className="p-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-all"
              title="Share Session"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* WORKSPACE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <div className={`max-w-4xl mx-auto space-y-6 transition-all duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            
            {/* 3. TASK HEADER & METADATA */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight">{currentTask.title}</h2>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded text-[10px] font-semibold uppercase">
                      {currentTask.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Deploying latest microservice build to staging cluster, running regression tests, and verifying API health endpoints prior to production rollout.
                  </p>
                </div>

                {/* Quick Task Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => showToast("Pausing pipeline execution...")} className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-all">
                    <Pause className="w-3.5 h-3.5 text-gray-500" /> Pause
                  </button>
                  <button onClick={() => showToast("Retrying failed pipeline steps...")} className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-all">
                    <RefreshCw className="w-3.5 h-3.5 text-gray-500" /> Retry
                  </button>
                  <button onClick={() => showToast("Opening deployment confirmation modal...")} className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-all">
                    <Play className="w-3.5 h-3.5" /> Deploy Prod
                  </button>
                </div>
              </div>

              {/* Task Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 block mb-0.5 font-medium">Triggered By</span>
                  <span className="font-semibold text-gray-800 flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-blue-600" /> {currentTask.trigger}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5 font-medium">Branch / Commit</span>
                  <span className="font-mono text-gray-800 flex items-center gap-1">
                    <GitBranch className="w-3.5 h-3.5 text-gray-500" /> {currentTask.branch} (<GitCommit className="w-3 h-3 inline text-gray-400"/>{currentTask.commit})
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5 font-medium">Elapsed Time</span>
                  <span className="font-mono text-gray-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-500" /> {currentTask.duration}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5 font-medium">Deployment Risk</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> {currentTask.risk} Risk
                  </span>
                </div>
              </div>
            </div>

            {/* 6. AI AGENT ACTIVITY PANEL */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">AI Agent Reasoning & Plan</span>
                </div>
                <span className="text-[11px] font-mono text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">Active Worker</span>
              </div>
              <p className="text-xs text-blue-900 font-medium mb-3">
                "Smoke tests are taking longer than expected due to network latency on endpoint <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">/api/v1/telemetry</code>. I am analyzing response anomalies before triggering verification."
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2 border-t border-blue-200/60 text-[11px]">
                <div className="flex items-center gap-1.5 text-blue-900 font-medium"><Check className="w-3.5 h-3.5 text-emerald-600"/> 1. Checkout</div>
                <div className="flex items-center gap-1.5 text-blue-900 font-medium"><Check className="w-3.5 h-3.5 text-emerald-600"/> 2. Docker Build</div>
                <div className="flex items-center gap-1.5 text-blue-950 font-bold bg-blue-100 px-2 py-1 rounded"><CircleDot className="w-3.5 h-3.5 text-blue-600 animate-spin"/> 3. Smoke Tests</div>
                <div className="flex items-center gap-1.5 text-gray-500"><CircleDot className="w-3.5 h-3.5"/> 4. API Health</div>
                <div className="flex items-center gap-1.5 text-gray-500"><Lock className="w-3.5 h-3.5"/> 5. Rollout</div>
              </div>
            </div>

            {/* NAVIGATION TABS FOR SECTIONS */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
              <button 
                onClick={() => setActiveTab('pipeline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'pipeline' ? 'bg-gray-900 text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Pipeline Timeline
              </button>
              <button 
                onClick={() => setActiveTab('logs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'logs' ? 'bg-gray-900 text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Execution Logs ({logs.length})
              </button>
              <button 
                onClick={() => setActiveTab('agent')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'agent' ? 'bg-gray-900 text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Smart Alerts & Risks
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'history' ? 'bg-gray-900 text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Run History
              </button>
            </div>

            {/* 4. PIPELINE TIMELINE VIEW */}
            {activeTab === 'pipeline' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Pipeline Steps</span>
                  <span className="text-xs text-gray-400 font-mono">Staging Cluster #884</span>
                </div>

                <div className="space-y-2.5">
                  {pipelineSteps.map((step, idx) => (
                    <div key={step.id} className={`border p-3.5 rounded-xl transition-all ${step.status === 'running' ? 'bg-white border-gray-300 shadow-sm ring-1 ring-blue-500/20' : 'bg-gray-50/70 border-gray-200/80'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {step.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                          {step.status === 'running' && <CircleDot className="w-4 h-4 text-blue-600 flex-shrink-0 animate-spin" />}
                          {step.status === 'waiting' && <CircleDot className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                          <span className="text-xs font-semibold text-gray-900">{idx + 1}. {step.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {step.duration && <span className="text-[11px] font-mono text-gray-500">{step.duration}</span>}
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded font-mono ${
                            step.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                            step.status === 'running' ? 'bg-blue-50 text-blue-700 animate-pulse' : 'bg-gray-200/70 text-gray-600'
                          }`}>
                            {step.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2 pl-6">{step.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. LIVE LOGS VIEWER */}
            {activeTab === 'logs' && (
              <div className="bg-gray-900 text-gray-100 rounded-xl p-4 font-mono text-xs shadow-inner space-y-2">
                <div className="flex items-center justify-between pb-3 border-b border-gray-800 text-[11px] text-gray-400">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>stdout / live-stream-daemon.log</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 flex items-center gap-1">● Live Streaming</span>
                    <button onClick={() => showToast("Logs copied to clipboard")} className="hover:text-white underline">Copy</button>
                  </div>
                </div>

                <div className="space-y-1.5 py-2 max-h-80 overflow-y-auto">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 hover:bg-gray-800/50 p-1 rounded">
                      <span className="text-gray-500 flex-shrink-0">{log.timestamp}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold flex-shrink-0 ${
                        log.level === 'SUCCESS' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' :
                        log.level === 'WARN' ? 'bg-amber-950 text-amber-400 border border-amber-800/50' :
                        'bg-blue-950 text-blue-400 border border-blue-800/50'
                      }`}>
                        {log.level}
                      </span>
                      <span className="text-gray-300 break-all">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 8. SMART ALERTS & RISKS */}
            {activeTab === 'agent' && (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-amber-900">Smoke Test Latency Regression Detected (+23%)</span>
                      <span className="font-mono text-amber-700">09:44:12</span>
                    </div>
                    <p className="text-amber-800 mb-2">3 endpoints exceeded the expected threshold of 200ms latency. The AI Agent has flagged this for review before production deployment.</p>
                    <button onClick={() => showToast("Inspecting anomalous endpoints...")} className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium transition-all shadow-2xs">
                      Inspect Endpoints with Agent
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 9. RUN HISTORY */}
            {activeTab === 'history' && (
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 flex justify-between">
                  <span>Run ID & Status</span>
                  <span>Duration & Timestamp</span>
                </div>
                <div className="divide-y divide-gray-100 text-xs font-medium">
                  <div className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer" onClick={() => showToast("Loaded run #284 details")}>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-gray-900">#284</span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px]">Successful</span>
                    </div>
                    <div className="text-gray-500 font-mono text-[11px]">4m 21s • 2 min ago</div>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer" onClick={() => showToast("Loaded run #283 details")}>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-gray-900">#283</span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px]">Successful</span>
                    </div>
                    <div className="text-gray-500 font-mono text-[11px]">3m 52s • 1 hour ago</div>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer" onClick={() => showToast("Loaded run #282 details")}>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-gray-900">#282</span>
                      <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[10px]">Failed</span>
                    </div>
                    <div className="text-gray-500 font-mono text-[11px]">5m 12s • Yesterday</div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* 7. AI COMMAND BAR (BOTTOM INPUT) */}
        <div className="flex-none border-t border-gray-200/80 bg-white px-6 py-4 z-20">
          <div className="max-w-4xl mx-auto flex flex-col gap-2.5">
            
            <form onSubmit={handleCommandSubmit} className="flex items-center gap-2 p-1.5 border border-gray-300 rounded-xl bg-gray-50/50 focus-within:bg-white focus-within:border-gray-500 transition-all shadow-2xs">
              <button 
                type="button" 
                onClick={() => showToast("Attach configuration file or log dump")}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask the agent to inspect, run, deploy, or explain... (e.g. /logs, /retry, /explain)" 
                className="flex-1 bg-transparent border-none outline-none text-xs md:text-sm text-gray-900 placeholder-gray-400 px-1 font-medium"
              />
              
              <button 
                type="submit"
                disabled={!inputValue.trim()}
                className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                  inputValue.trim() 
                    ? 'bg-gray-900 hover:bg-gray-800 text-white shadow-2xs' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </form>

            {/* Slash Command Suggestions */}
            <div className="flex items-center gap-2 overflow-x-auto text-[11px]">
              <span className="text-gray-400 font-medium">Suggestions:</span>
              <button onClick={() => setInputValue('/logs --failed')} className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-200 font-mono transition-all">/logs</button>
              <button onClick={() => setInputValue('/retry')} className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-200 font-mono transition-all">/retry</button>
              <button onClick={() => setInputValue('/explain latency')} className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-200 font-mono transition-all">/explain</button>
              <button onClick={() => setInputValue('/rollback')} className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-200 font-mono transition-all">/rollback</button>
            </div>

          </div>
        </div>

      </main>

      {/* --- 12. COMMAND PALETTE MODAL (CMD+K) --- */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-2xs z-50 flex items-start justify-center pt-20 px-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center px-4 border-b border-gray-200">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input 
                type="text" 
                placeholder="Type a command or search tasks..."
                autoFocus
                className="w-full h-12 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400"
              />
              <button onClick={() => setIsCommandPaletteOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 space-y-1 text-xs font-medium text-gray-700 max-h-72 overflow-y-auto">
              <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Quick Actions</div>
              <button onClick={() => { setIsCommandPaletteOpen(false); showToast("Triggered New Task"); }} className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 rounded-lg">
                <span className="flex items-center gap-2"><Plus className="w-3.5 h-3.5 text-gray-500"/> Create New Task Session</span>
                <kbd className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-400">⌘N</kbd>
              </button>
              <button onClick={() => { setIsCommandPaletteOpen(false); showToast("Retrying Pipeline..."); }} className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 rounded-lg">
                <span className="flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5 text-gray-500"/> Retry Current Pipeline</span>
                <kbd className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-400">R</kbd>
              </button>
              <button onClick={() => { setIsCommandPaletteOpen(false); showToast("Toggled Theme"); }} className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 rounded-lg">
                <span className="flex items-center gap-2"><Settings className="w-3.5 h-3.5 text-gray-500"/> Open Workspace Settings</span>
              </button>
            </div>
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-mono">
              <span>Navigate with arrow keys</span>
              <span>ESC to close</span>
            </div>
          </div>
        </div>
      )}

      {/* --- TOAST NOTIFICATION --- */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-xs font-medium shadow-xl z-50 flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}