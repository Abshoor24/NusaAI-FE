import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { Cpu, Code2, Globe, FileText, Network, ArrowRight } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
  isLoaded: boolean;
}

const FeatureCard = ({ icon, title, description, index, isLoaded }: FeatureCardProps) => (
  <div 
    className={`bg-white p-6 rounded-2xl border border-gray-200/70 flex flex-col items-start transition-all duration-700 ease-out transform hover:border-gray-300 hover:shadow-sm ${
      isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
    }`}
    style={{ transitionDelay: `${(index + 2) * 150}ms` }}
  >
    <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-xl text-gray-700 mb-4">
      {icon}
    </div>
    <h3 className="text-base font-semibold text-gray-900 mb-1.5 tracking-tight">
      {title}
    </h3>
    <p className="text-gray-500 text-sm leading-relaxed">
      {description}
    </p>
  </div>
);

export default function WelcomeOnboarding() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    { 
      icon: <Network className="w-5 h-5" />, 
      title: "AI Chat Assistant", 
      description: "Engage in multi-turn conversations with an intelligent AI model for real-time assistance and problem-solving." 
    },
    { 
      icon: <FileText className="w-5 h-5" />, 
      title: "RAG Knowledge Base", 
      description: "Ingest PDF, DOCX, or TXT documents to give the AI context and factual answers based on your data." 
    },
    { 
      icon: <Code2 className="w-5 h-5" />, 
      title: "Code Sandbox", 
      description: "Execute Python, JavaScript, and Go code in an isolated, secure container directly from your browser." 
    },
    { 
      icon: <Globe className="w-5 h-5" />, 
      title: "Multimodal Capabilities", 
      description: "Attach images to your prompts for visual analysis and multi-modal AI reasoning capabilities." 
    }
  ];

  return (
    <main className="min-h-screen w-screen bg-white flex flex-col items-center justify-center p-6 md:p-12 font-sans selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      <div className="max-w-5xl w-full flex flex-col items-center">
        
        {/* Header Section */}
        <div 
          className={`flex flex-col items-center text-center mb-12 max-w-xl transition-all duration-1000 ease-out transform ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="bg-emerald-600 p-3 rounded-2xl mb-5 shadow-sm">
            <Cpu className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            nusaAI Platform
          </h1>
          <p className="text-gray-500 text-sm md:text-base leading-relaxed">
            Your production-ready AI Assistant. Empower your workflow with RAG document search and secure code execution sandbox.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-10">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              index={index}
              isLoaded={isLoaded}
              icon={feature.icon} 
              title={feature.title} 
              description={feature.description} 
            />
          ))}
        </div>

        {/* Action Box */}
        <div 
          className={`w-full bg-gray-50 border border-gray-200/80 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-700 ease-out transform ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '800ms' }}
        >
          <div className="text-center sm:text-left">
            <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Get started with your workspace</h4>
            <p className="text-xs text-gray-500">Access the AI chat assistant with RAG document knowledge and code sandbox.</p>
          </div>

          <Link 
            to="/chat"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 px-6 rounded-xl transition-all duration-200 text-sm group"
          >
            <span>Start Chatting</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

      </div>
    </main>
  );
}