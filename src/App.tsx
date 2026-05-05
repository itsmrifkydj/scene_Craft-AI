import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, Video, Loader2, Upload, Trash2, Image as ImageIcon, Sparkles } from 'lucide-react';

interface Scene {
  spokenText: string;
  gesture: string;
}

interface ScriptResponse {
  title: string;
  fullScript: string;
  scenes: Scene[];
}

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const PROMPT_CATEGORIES = [
  'Portrait', 'Intimate', 'Lifestyle', 'Fitness', 'Fashion', 'Beauty', 
  'Travel', 'Food', 'Nightlife', 'Artistic', 'Professional', 'Fantasy', 
  'Casual', 'Editorial'
];

export default function App() {
  const [view, setView] = useState<'script' | 'prompt'>('script');

  return (
    <div className="h-screen w-full bg-[#0F0F0F] text-[#E0E0E0] font-sans flex flex-col overflow-hidden selection:bg-[#C5FF4A] selection:text-black">
      <header className="h-20 border-b border-[#333] shrink-0 flex items-center justify-between px-6 lg:px-10 bg-[#0F0F0F]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#C5FF4A] rounded-full"></div>
          <h1 className="text-xl lg:text-2xl font-black tracking-tighter italic">SCENE_CRAFT AI</h1>
        </div>
        <nav className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-[#777]">
          <span 
            onClick={() => setView('script')} 
            className={`cursor-pointer transition-colors pb-1 ${view === 'script' ? 'text-[#C5FF4A] border-b border-[#C5FF4A]' : 'hover:text-[#E0E0E0]'}`}
          >
            Script Writer
          </span>
          <span 
            onClick={() => setView('prompt')} 
            className={`cursor-pointer transition-colors pb-1 ${view === 'prompt' ? 'text-[#C5FF4A] border-b border-[#C5FF4A]' : 'hover:text-[#E0E0E0]'}`}
          >
            Prompt Generator
          </span>
        </nav>
      </header>

      {view === 'script' ? <ScriptWriterView /> : <PromptGeneratorView />}

      <footer className="h-12 shrink-0 bg-[#C5FF4A] text-black flex items-center justify-between px-6 lg:px-10 text-[10px] font-black uppercase">
        <div className="flex gap-4 lg:gap-6">
          <span className="hidden sm:inline">Status: AI Models Online</span>
          <span>Export: .TXT / .JSON / .CSV</span>
        </div>
        <span>Scene_Craft 2.0 // Generated for HeyGen & Visuals</span>
      </footer>
    </div>
  );
}

function ScriptWriterView() {
  const [idea, setIdea] = useState('');
  const [platform, setPlatform] = useState('TikTok / Reels');
  const [duration, setDuration] = useState('1 min');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ScriptResponse | null>(null);
  const [error, setError] = useState('');
  const [copiedScript, setCopiedScript] = useState(false);

  const generateScript = async () => {
    if (!idea.trim() && imageFiles.length === 0) {
      setError('Please enter an idea or upload a product image for your video.');
      return;
    }

    setIsGenerating(true);
    setError('');
    
    try {
      const promptText = `Write a ${duration} UGC (User Generated Content) video script for an AI avatar video for ${platform} based on this idea: "${idea}". 
If I provided images of a product or its sale page, act as an expert product researcher. Extract its features, potential use cases, target audience, and (if visible) price or selling points. Seamlessly weave these details into a compelling UGC script.

CRITICAL REQUIREMENT: The VERY LAST sentence of the full script and the final scene MUST end with exactly this text: "For more AI info and tips, and don't forget to subscribe and follow my channel."`;

      const contents: any[] = [promptText];

      for (const file of imageFiles) {
        const part = await fileToGenerativePart(file);
        contents.push(part);
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, duration, platform, contents })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate script');
      }

      const parsed = await res.json() as ScriptResponse;
      setResult(parsed);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate script. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <main className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full mx-auto">
      <aside className="w-full lg:w-[420px] shrink-0 border-b lg:border-b-0 lg:border-r border-[#333] p-6 lg:p-10 flex flex-col gap-8 bg-[#141414] overflow-y-auto">
        <section>
          <label className="block text-[10px] uppercase tracking-widest text-[#777] mb-3 font-bold">News Hook / Idea</label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g. today Google launched new AI Gemini 3.2..."
            className="w-full h-32 bg-[#1A1A1A] border border-[#333] p-4 text-sm focus:border-[#C5FF4A] outline-none resize-none leading-relaxed transition-colors"
          />
          {error && (
            <div className="mt-4 p-3 bg-[#1A1A1A] text-red-500 font-mono text-xs border border-red-900/50">
              {error}
            </div>
          )}
        </section>

        <section>
          <label className="block text-[10px] uppercase tracking-widest text-[#777] mb-3 font-bold">Product Image / Listing (Optional)</label>
          <label className="flex flex-col items-center justify-center w-full min-h-20 bg-[#1A1A1A] border border-[#333] border-dashed hover:border-[#C5FF4A] transition-colors cursor-pointer text-[#777] hover:text-[#C5FF4A] group p-4">
            <Upload size={18} className="mb-2" />
            <span className="text-[10px] uppercase tracking-widest font-bold leading-none text-center">
              Upload Product Screenshots<br/>
              <span className="font-normal opacity-70 mt-1 block">To extract features & price</span>
            </span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
              if (e.target.files) {
                setImageFiles(prev => [...prev, ...Array.from(e.target.files!)]);
              }
            }}/>
          </label>
          {imageFiles.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {imageFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-2 bg-[#222] border border-[#333] px-2 py-1 rounded-sm text-xs group">
                  <ImageIcon size={12} className="text-[#C5FF4A]" />
                  <span className="truncate max-w-[120px] text-[10px] text-[#A0A0A0]">{file.name}</span>
                  <button onClick={() => removeImage(i)} className="text-[#777] hover:text-red-400">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <label className="block text-[10px] uppercase tracking-widest text-[#777] mb-3 font-bold">Target Duration</label>
          <div className="grid grid-cols-4 gap-2">
            {['30s', '1 min', '2 min', '5 min'].map(d => (
              <button 
                key={d}
                onClick={() => setDuration(d)}
                className={`py-2 border text-[10px] uppercase tracking-widest font-bold transition-all ${duration === d ? 'border-[#C5FF4A] text-[#C5FF4A] bg-[#C5FF4A]/10' : 'border-[#333] text-[#777] hover:bg-[#333] hover:text-[#E0E0E0]'}`}
              >
                {d}
              </button>
            ))}
          </div>
        </section>

        <section>
          <label className="block text-[10px] uppercase tracking-widest text-[#777] mb-3 font-bold">Platform Preset</label>
          <div className="grid grid-cols-2 gap-2">
            {['TikTok / Reels', 'YouTube Shorts'].map(p => (
              <button 
                key={p}
                onClick={() => setPlatform(p)}
                className={`py-3 border text-[10px] uppercase tracking-widest font-bold transition-all ${platform === p ? 'border-[#C5FF4A] text-[#C5FF4A] bg-[#C5FF4A]/10' : 'border-[#333] text-[#777] hover:bg-[#333] hover:text-[#E0E0E0]'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </section>

        <button
          onClick={generateScript}
          disabled={isGenerating || (!idea.trim() && imageFiles.length === 0)}
          className="mt-auto shrink-0 w-full bg-[#C5FF4A] text-black font-black py-6 flex flex-col items-center justify-center gap-1 group disabled:opacity-50 disabled:bg-[#333] disabled:text-[#777] transition-colors"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2 text-lg leading-none">
              <Loader2 className="animate-spin" size={18} /> GENERATING...
            </span>
          ) : (
            <span className="text-lg leading-none">GENERATE SCRIPT + SCENES</span>
          )}
          <span className="text-[10px] uppercase tracking-widest opacity-70 mt-1">Optimized for UGC / HeyGen</span>
        </button>
      </aside>

      <section className="flex-1 p-6 lg:p-10 flex flex-col gap-10 bg-[#0F0F0F] overflow-y-auto w-full">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center text-center p-8 border border-[#333] bg-[#141414] w-full"
            >
              <div className="w-16 h-16 bg-[#1A1A1A] text-[#555] flex items-center justify-center mb-6 rounded-full">
                <Video size={28} />
              </div>
              <h3 className="text-xl font-serif italic text-[#E0E0E0] mb-2">Awaiting Direction</h3>
              <p className="text-sm text-[#777] font-mono max-w-sm">
                Input your idea, upload a product image, or select parameters to generate a specialized UGC script.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-10 w-full"
            >
              <div className="flex flex-col w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4 w-full">
                  <h2 className="text-3xl lg:text-4xl xl:text-5xl font-serif italic text-white leading-tight">{result.title}</h2>
                  <div className="flex items-center gap-4 shrink-0 mt-4 sm:mt-0">
                    <button
                      onClick={() => copyToClipboard(result.fullScript)}
                      className="text-[10px] uppercase tracking-widest font-bold text-[#C5FF4A] hover:bg-[#C5FF4A]/10 px-3 py-1.5 border border-[#C5FF4A] transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                      {copiedScript ? <Check size={14} /> : <Copy size={14} />}
                      {copiedScript ? 'COPIED' : 'COPY SCRIPT'}
                    </button>
                    <span className="text-xs text-[#777] font-mono hidden sm:inline whitespace-nowrap">EST. DURATION: {duration.toUpperCase()}</span>
                  </div>
                </div>
                <div className="bg-[#1A1A1A] border border-[#333] p-6 lg:p-8 font-serif text-lg lg:text-xl leading-relaxed lg:leading-loose text-gray-300 w-full">
                  <p className="whitespace-pre-wrap">{result.fullScript}</p>
                </div>
              </div>

              <div className="flex flex-col w-full">
                <h3 className="text-[10px] uppercase tracking-[0.3em] text-[#777] mb-4 font-black">Avatar Gesture & Scene Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
                  {result.scenes.map((scene, idx) => (
                    <div key={idx} className={`bg-[#141414] border-l-2 ${idx % 2 === 0 ? 'border-[#C5FF4A]' : 'border-[#333]'} p-4 flex flex-col gap-2`}>
                      <span className="text-[10px] font-mono text-[#777]">SCENE {(idx + 1).toString().padStart(2, '0')}</span>
                      <p className="text-xs font-bold whitespace-pre-wrap">{scene.spokenText}</p>
                      <p className="text-[10px] leading-tight text-[#555] mt-auto pt-4">{scene.gesture}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}

function PromptGeneratorView() {
  const [category, setCategory] = useState(PROMPT_CATEGORIES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generatePrompts = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      const res = await fetch('/api/generatePrompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate prompts');
      }

      const data = await res.json();
      setPrompts(data.prompts || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate prompts. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyPrompt = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  return (
    <main className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full mx-auto">
      <aside className="w-full lg:w-[420px] shrink-0 border-b lg:border-b-0 lg:border-r border-[#333] p-6 lg:p-10 flex flex-col gap-8 bg-[#141414] overflow-y-auto">
        <section>
          <label className="block text-[10px] uppercase tracking-widest text-[#777] mb-3 font-bold">Select Prompt Category</label>
          <div className="flex flex-wrap gap-2">
            {PROMPT_CATEGORIES.map(cat => (
              <button 
                key={cat}
                onClick={() => setCategory(cat)}
                className={`py-2 px-3 border text-[10px] uppercase tracking-widest font-bold transition-all ${category === cat ? 'border-[#C5FF4A] text-[#C5FF4A] bg-[#C5FF4A]/10' : 'border-[#333] text-[#777] hover:bg-[#333] hover:text-[#E0E0E0]'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          {error && (
            <div className="mt-4 p-3 bg-[#1A1A1A] text-red-500 font-mono text-xs border border-red-900/50">
              {error}
            </div>
          )}
        </section>

        <button
          onClick={generatePrompts}
          disabled={isGenerating}
          className="mt-auto shrink-0 w-full bg-[#C5FF4A] text-black font-black py-6 flex flex-col items-center justify-center gap-1 group disabled:opacity-50 disabled:bg-[#333] disabled:text-[#777] transition-colors"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2 text-lg leading-none">
              <Loader2 className="animate-spin" size={18} /> GENERATING...
            </span>
          ) : (
            <span className="text-lg leading-none">GENERATE 10 PROMPTS</span>
          )}
          <span className="text-[10px] uppercase tracking-widest opacity-70 mt-1">For Midjourney / Stable Diffusion</span>
        </button>
      </aside>

      <section className="flex-1 p-6 lg:p-10 flex flex-col gap-10 bg-[#0F0F0F] overflow-y-auto w-full">
        <AnimatePresence mode="wait">
          {prompts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center text-center p-8 border border-[#333] bg-[#141414] w-full"
            >
              <div className="w-16 h-16 bg-[#1A1A1A] text-[#555] flex items-center justify-center mb-6 rounded-full">
                <Sparkles size={28} />
              </div>
              <h3 className="text-xl font-serif italic text-[#E0E0E0] mb-2">Ready to Generate</h3>
              <p className="text-sm text-[#777] font-mono max-w-sm">
                Select a photography or videography category and click generate to get 10 high-quality prompts.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6 w-full max-w-4xl mx-auto"
            >
              <div className="flex justify-between items-end border-b border-[#333] pb-4">
                <div>
                  <h2 className="text-2xl font-serif italic text-white flex items-center gap-3">
                    <Sparkles className="text-[#C5FF4A]" size={24} /> 
                    {category} Prompts
                  </h2>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {prompts.map((prompt, idx) => (
                  <div key={idx} className="group relative bg-[#1A1A1A] border border-[#333] p-5 hover:border-[#C5FF4A] transition-colors pr-16 flex flex-col gap-2">
                    <div className="text-[#C5FF4A] font-mono text-[10px] uppercase tracking-widest mb-1 opacity-70">
                      Prompt {idx + 1}
                    </div>
                    <p className="text-sm text-[#E0E0E0] leading-relaxed">
                      {prompt}
                    </p>
                    <button
                      onClick={() => copyPrompt(prompt, idx)}
                      className="absolute top-1/2 -translate-y-1/2 right-4 text-[#777] hover:text-[#C5FF4A] bg-[#222] p-2 border border-[#333] hover:border-[#C5FF4A] transition-all"
                      title="Copy Prompt"
                    >
                      {copiedIndex === idx ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}


