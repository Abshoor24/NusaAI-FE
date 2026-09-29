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
    className={`bg-card p-6 rounded-2xl border border-border flex flex-col items-start transition-all duration-700 ease-out transform hover:border-primary/40 hover:shadow-sm ${
      isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
    }`}
    style={{ transitionDelay: `${(index + 2) * 150}ms` }}
  >
    <div className="bg-muted border border-border p-2.5 rounded-xl text-foreground mb-4">
      {icon}
    </div>
    <h3 className="text-base font-semibold text-foreground mb-1.5 tracking-tight">
      {title}
    </h3>
    <p className="text-muted-foreground text-sm leading-relaxed">
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
      icon: <Network className="w-5 h-5 text-primary" />, 
      title: "AI Chat Assistant", 
      description: "Engage in multi-turn conversations with an intelligent AI model for real-time assistance and problem-solving." 
    },
    { 
      icon: <FileText className="w-5 h-5 text-primary" />, 
      title: "RAG Knowledge Base", 
      description: "Ingest PDF, DOCX, or TXT documents to give the AI context and factual answers based on your data." 
    },
    { 
      icon: <Code2 className="w-5 h-5 text-primary" />, 
      title: "Code Sandbox", 
      description: "Execute Python, JavaScript, and Go code in an isolated, secure container directly from your browser." 
    },
    { 
      icon: <Globe className="w-5 h-5 text-primary" />, 
      title: "Multimodal Capabilities", 
      description: "Attach images to your prompts for visual analysis and multi-modal AI reasoning capabilities." 
    }
  ];

  return (
    <div className="w-full flex flex-col items-center justify-center p-6 md:p-12 font-sans overflow-x-hidden">
      <div className="max-w-5xl w-full flex flex-col items-center">
        
        {/* Header Section */}
        <div 
          className={`flex flex-col items-center text-center mb-12 max-w-xl transition-all duration-1000 ease-out transform ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="bg-primary p-3 rounded-2xl mb-5 shadow-sm">
            <Cpu className="w-6 h-6 text-primary-foreground" strokeWidth={2} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
            nusaAI Platform
          </h1>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
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
          className={`w-full bg-card border border-border p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-700 ease-out transform ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '800ms' }}
        >
          <div className="text-center sm:text-left">
            <h4 className="text-sm font-semibold text-foreground mb-0.5">Get started with your workspace</h4>
            <p className="text-xs text-muted-foreground">Access the AI chat assistant with RAG document knowledge and code sandbox.</p>
          </div>

          <Link 
            to="/chat"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 px-6 rounded-xl transition-all duration-200 text-sm group shadow-xs"
          >
            <span>Start Chatting</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}