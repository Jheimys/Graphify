
import React, { useState, useEffect, useRef } from 'react';
import { GraphFunction, Viewport, Point } from './types';
import Graph from './components/Graph';
import { GoogleGenAI, Type } from "@google/genai";
import { isValidExpression } from './utils/mathEvaluator';

interface InsightData {
  title: string;
  definition: string;
  properties: string[];
  application: string;
}

const App: React.FC = () => {
  const [functions, setFunctions] = useState<GraphFunction[]>([
    { id: '1', expression: 'y = log(x, 2)', color: '#256af4', visible: true, name: 'Logaritmo' },
    { id: '2', expression: 'y = sin(x)', color: '#f43f5e', visible: true, name: 'Seno' }
  ]);
  
  const [currentInput, setCurrentInput] = useState('y = log(8, 2)');
  const [viewport, setViewport] = useState<Viewport>({
    centerX: 0,
    centerY: 0,
    scale: 40,
    is3D: false,
    rotateX: -20,
    rotateY: 30
  });
  
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [language, setLanguage] = useState<'pt' | 'en'>('pt');
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [animDirection, setAnimDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const requestRef = useRef<number>(null);

  const animate = () => {
    setViewport(prev => ({
      ...prev,
      rotateY: animDirection === 'horizontal' ? prev.rotateY + 0.5 : prev.rotateY,
      rotateX: animDirection === 'vertical' ? prev.rotateX + 0.5 : prev.rotateX,
    }));
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isAnimating && viewport.is3D) {
      requestRef.current = requestAnimationFrame(animate);
    } else if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isAnimating, animDirection, viewport.is3D]);

  const handleAddFunction = (expr?: string) => {
    const targetExpr = expr || currentInput;
    if (!isValidExpression(targetExpr)) return;
    setFunctions(prev => [...prev, {
      id: Date.now().toString(),
      expression: targetExpr,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      visible: true,
      name: 'Função'
    }]);
    if (!expr) setCurrentInput('y = ');
  };

  const handleRotate = (dx: number, dy: number) => {
    setViewport(prev => ({ ...prev, rotateX: prev.rotateX + dx, rotateY: prev.rotateY + dy }));
  };

  const getMathInsight = async () => {
    if (!currentInput) return;
    
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      const msg = language === 'pt' 
        ? "Erro: Chave de API não encontrada (process.env.API_KEY). O recurso de IA requer configuração de ambiente."
        : "Error: API Key not found (process.env.API_KEY). AI features require environment configuration.";
      console.error(msg);
      alert(msg);
      return;
    }

    setLoadingInsight(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = language === 'pt' 
        ? `Analise a função matemática: ${currentInput}. Explique de forma didática.`
        : `Analyze the mathematical function: ${currentInput}. Explain in a didactic way.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              definition: { type: Type.STRING },
              properties: { type: Type.ARRAY, items: { type: Type.STRING } },
              application: { type: Type.STRING },
            },
            required: ["title", "definition", "properties", "application"]
          }
        }
      });
      
      const data = JSON.parse(response.text);
      setInsight(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInsight(false);
    }
  };

  const manualEntries = [
    { type: 'Constante', syntax: 'y = c', example: 'y = 5' },
    { type: 'Linear', syntax: 'y = ax + b', example: 'y = 2x + 3' },
    { type: 'Quadrática', syntax: 'y = ax^2 + bx + c', example: 'y = x^2 - 4' },
    { type: 'Polinomial', syntax: 'y = a*x^n...', example: 'y = 0.5x^3 - x' },
    { type: 'Racional', syntax: 'y = P(x) / Q(x)', example: 'y = 1 / (x - 2)' },
    { type: 'Radical', syntax: 'sqrt(x) ou cbrt(x)', example: 'y = sqrt(x + 5)' },
    { type: 'Modular', syntax: 'abs(x)', example: 'y = abs(x)' },
    { type: 'Exponencial', syntax: 'a^x ou e^x', example: 'y = 2^x' },
    { type: 'Logarítmica', syntax: 'log(x, base)', example: 'y = log(x, 0.5)', desc: 'Para base decimal use 0.5, 0.2, etc.' },
    { type: 'Trigonométrica', syntax: 'sin(x), cos(x), tan(x)', example: 'y = sin(x)' },
    { type: 'Hiperbólica', syntax: 'sinh(x), cosh(x)', example: 'y = tanh(x)' },
    { type: 'Por Partes', syntax: 'cond ? expr1 : expr2', example: 'y = x >= 0 ? x^2 : -x', desc: 'Usa lógica ternária (condição ? se_verdade : se_falso)' },
    { type: 'Degrau', syntax: 'unitStep(x)', example: 'y = unitStep(x)' },
    { type: 'Sinal', syntax: 'sign(x)', example: 'y = sign(x)' },
    { type: 'Piso', syntax: 'floor(x)', example: 'y = floor(x)' },
    { type: 'Teto', syntax: 'ceil(x)', example: 'y = ceil(x)' },
    { type: 'Gaussiana', syntax: 'e^(-x^2)', example: 'y = e^(-x^2)' },
    { type: 'Sigmoide', syntax: '1 / (1 + e^-x)', example: 'y = 1 / (1 + e^-x)' },
    { type: 'Especiais', syntax: 'Paramétrica / Polar', example: 'y = 2 * sin(x) + cos(x)', desc: 'Atualmente o motor renderiza funções na forma y = f(x).' }
  ];

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background-dark text-white font-display">
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-background-dark border-r border-white/5 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold tracking-tight">Camadas</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-white/40">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3">
            {functions.map(fn => (
              <div key={fn.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${fn.visible ? 'bg-primary/10 border-primary/20 shadow-lg' : 'bg-white/5 border-transparent opacity-60'}`}>
                <div className="flex items-center gap-3 overflow-hidden">
                  <button onClick={() => setFunctions(prev => prev.map(f => f.id === fn.id ? {...f, visible: !f.visible} : f))}>
                    <span className="material-symbols-outlined text-xl" style={{ color: fn.visible ? fn.color : 'gray' }}>
                      {fn.visible ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                  <p className="text-sm font-mono truncate">{fn.expression}</p>
                </div>
                <button onClick={() => setFunctions(prev => prev.filter(f => f.id !== fn.id))} className="text-white/20 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col md:pl-72 relative">
        <header className="p-4 z-40 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-white/70 bg-white/5 p-2 rounded-lg">
                <span className="material-symbols-outlined">menu</span>
              </button>
              
              {/* Language Selector */}
              <div className="flex bg-surface rounded-lg p-0.5 border border-white/5">
                <button onClick={() => setLanguage('pt')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${language === 'pt' ? 'bg-white/10 text-white' : 'text-white/20 hover:text-white/40'}`}>PT</button>
                <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${language === 'en' ? 'bg-white/10 text-white' : 'text-white/20 hover:text-white/40'}`}>EN</button>
              </div>

              {/* Manual Button */}
              <button 
                onClick={() => setIsManualOpen(true)}
                className="size-8 flex items-center justify-center rounded-lg bg-white/5 text-white/40 hover:text-primary hover:bg-primary/10 transition-all border border-white/5"
                title="Manual de Funções"
              >
                <span className="material-symbols-outlined text-xl">help</span>
              </button>
            </div>
            
            <div className="flex bg-surface p-1 rounded-full border border-white/5 shadow-inner">
              <button onClick={() => setViewport(v => ({...v, is3D: false}))} className={`px-4 py-1 rounded-full text-[10px] font-bold transition-all ${!viewport.is3D ? 'bg-primary shadow-lg text-white' : 'text-white/30'}`}>2D</button>
              <button onClick={() => setViewport(v => ({...v, is3D: true}))} className={`px-4 py-1 rounded-full text-[10px] font-bold transition-all ${viewport.is3D ? 'bg-primary shadow-lg text-white' : 'text-white/30'}`}>3D</button>
            </div>

            <button onClick={getMathInsight} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-bold hover:bg-primary/30 transition-all border border-primary/20">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              {loadingInsight ? (language === 'pt' ? 'Pensando...' : 'Thinking...') : (language === 'pt' ? 'IA Insight' : 'AI Insight')}
            </button>
          </div>

          <div className="glow-focus flex w-full items-stretch rounded-xl h-14 bg-surface border border-white/10 shadow-xl overflow-hidden transition-all">
            <div className="text-primary flex items-center justify-center pl-4 pr-2">
              <span className="material-symbols-outlined">function</span>
            </div>
            <input 
              className="flex w-full bg-transparent text-white focus:ring-0 placeholder:text-white/10 px-2 text-base font-medium" 
              placeholder={language === 'pt' ? "Ex: y = log(x, 2)" : "Ex: y = sin(x) * x"} 
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddFunction()}
            />
            <button onClick={() => handleAddFunction()} className="m-2 px-6 rounded-lg bg-primary text-white font-bold text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20">
              {language === 'pt' ? 'Plotar' : 'Plot'}
            </button>
          </div>
          
          {/* Didactic AI Insight Card */}
          {insight && (
            <div className="bg-surface/90 border border-primary/30 rounded-2xl p-5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 max-w-2xl relative z-40">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">school</span>
                  <h3 className="font-bold text-lg text-primary">{insight.title}</h3>
                </div>
                <button onClick={() => setInsight(null)} className="text-white/20 hover:text-white">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">{language === 'pt' ? 'Definição' : 'Definition'}</h4>
                    <p className="text-sm leading-relaxed text-white/80">{insight.definition}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">{language === 'pt' ? 'Propriedades' : 'Properties'}</h4>
                    <ul className="space-y-1">
                      {insight.properties.map((prop, i) => (
                        <li key={i} className="text-xs flex items-start gap-2 text-white/60">
                          <span className="text-primary mt-0.5">•</span>
                          {prop}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">{language === 'pt' ? 'Aplicações Reais' : 'Real-world Apps'}</h4>
                  <p className="text-xs text-white/60 italic leading-relaxed">"{insight.application}"</p>
                </div>
              </div>
            </div>
          )}
        </header>

        <div className="flex-1 relative">
          <Graph functions={functions} viewport={viewport} onHover={setHoverPoint} onViewportChange={setViewport} />

          {/* Floating Controls */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-4 items-end">
            {viewport.is3D && (
              <div className="flex flex-col gap-3">
                <div className="flex gap-1 p-1 bg-surface/80 backdrop-blur-lg border border-white/10 rounded-full shadow-2xl">
                  <button onClick={() => setIsAnimating(!isAnimating)} className={`size-10 flex items-center justify-center rounded-full transition-all ${isAnimating ? 'bg-primary text-white animate-pulse' : 'text-white/40 hover:bg-white/5'}`}>
                    <span className="material-symbols-outlined">{isAnimating ? 'pause' : 'play_arrow'}</span>
                  </button>
                  <button onClick={() => setAnimDirection('horizontal')} className={`size-10 flex items-center justify-center rounded-full transition-all ${isAnimating && animDirection === 'horizontal' ? 'text-primary' : 'text-white/20'}`}>
                    <span className="material-symbols-outlined">sync_alt</span>
                  </button>
                  <button onClick={() => setAnimDirection('vertical')} className={`size-10 flex items-center justify-center rounded-full transition-all ${isAnimating && animDirection === 'vertical' ? 'text-primary' : 'text-white/20'}`}>
                    <span className="material-symbols-outlined" style={{ transform: 'rotate(90deg)' }}>sync_alt</span>
                  </button>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-3xl bg-surface/80 backdrop-blur-lg border border-white/10 shadow-2xl">
                  <button onClick={() => handleRotate(5, 0)} className="size-10 flex items-center justify-center hover:bg-white/10 rounded-full"><span className="material-symbols-outlined">expand_less</span></button>
                  <div className="flex gap-1">
                    <button onClick={() => handleRotate(0, -5)} className="size-10 flex items-center justify-center hover:bg-white/10 rounded-full"><span className="material-symbols-outlined">chevron_left</span></button>
                    <button onClick={() => { setViewport(v => ({...v, rotateX: -20, rotateY: 30})); setIsAnimating(false); }} className="size-10 flex items-center justify-center bg-primary/20 text-primary rounded-full"><span className="material-symbols-outlined text-sm">refresh</span></button>
                    <button onClick={() => handleRotate(0, 5)} className="size-10 flex items-center justify-center hover:bg-white/10 rounded-full"><span className="material-symbols-outlined">chevron_right</span></button>
                  </div>
                  <button onClick={() => handleRotate(-5, 0)} className="size-10 flex items-center justify-center hover:bg-white/10 rounded-full"><span className="material-symbols-outlined">expand_more</span></button>
                </div>
              </div>
            )}
            <div className="flex flex-col rounded-2xl bg-surface/80 backdrop-blur-lg border border-white/10 shadow-2xl overflow-hidden">
              <button onClick={() => setViewport(v => ({...v, scale: v.scale * 1.2}))} className="size-12 hover:bg-white/10 border-b border-white/5 transition-colors"><span className="material-symbols-outlined">add</span></button>
              <button onClick={() => setViewport(v => ({...v, scale: v.scale / 1.2}))} className="size-12 hover:bg-white/10 transition-colors"><span className="material-symbols-outlined">remove</span></button>
            </div>
          </div>

          <div className="absolute bottom-6 left-6 flex flex-col gap-2">
            {!viewport.is3D && hoverPoint && (
              <div className="px-4 py-2 rounded-full bg-charcoal/80 border border-white/10 text-[10px] font-mono backdrop-blur-md shadow-lg border-primary/20">
                X: <span className="text-primary font-bold">{hoverPoint.x.toFixed(2)}</span> | 
                Y: <span className="text-primary font-bold ml-1">{hoverPoint.y.toFixed(2)}</span>
              </div>
            )}
            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[9px] font-bold uppercase tracking-widest text-white/30 backdrop-blur-sm">
              {viewport.is3D ? `3D ACTIVE: ROT(${viewport.rotateX.toFixed(0)}°, ${viewport.rotateY.toFixed(0)}°)` : (language === 'pt' ? 'VISTA CARTESIANA 2D' : '2D CARTESIAN VIEW')}
            </div>
          </div>
        </div>
      </main>

      {/* Manual Modal */}
      {isManualOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background-dark border border-white/10 rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">library_books</span>
                <h2 className="text-xl font-bold">{language === 'pt' ? 'Guia de Sintaxe Matemática' : 'Mathematical Syntax Guide'}</h2>
              </div>
              <button onClick={() => setIsManualOpen(false)} className="size-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {manualEntries.map((entry, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-surface/50 border border-white/5 hover:border-primary/30 transition-all group">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-bold text-primary uppercase tracking-widest">{entry.type}</span>
                      <button 
                        onClick={() => { handleAddFunction(entry.example); setIsManualOpen(false); }}
                        className="text-[10px] font-bold px-2 py-1 bg-primary/10 text-primary rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {language === 'pt' ? 'TESTAR' : 'TRY IT'}
                      </button>
                    </div>
                    <code className="block text-sm font-mono text-white/90 mb-1">{entry.syntax}</code>
                    <div className="text-[10px] text-white/40 font-mono">
                      {language === 'pt' ? 'Exemplo:' : 'Example:'} <span className="text-white/60">{entry.example}</span>
                    </div>
                    {entry.desc && (
                      <p className="mt-2 text-[10px] text-primary/60 italic leading-tight">{entry.desc}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 bg-white/5 border-t border-white/5 text-center">
              <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">
                Graphify Pro Engine • Powered by Math.js
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
