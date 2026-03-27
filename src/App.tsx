import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Upload, Watch, Shirt, Download, Loader2, Image as ImageIcon, Wand2, ScanLine, Scissors } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type Category = 'watch' | 'shirt' | 'jeans' | 'shoes';

export default function App() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [category, setCategory] = useState<Category>('watch');
  
  // Options state
  const [watchHand, setWatchHand] = useState<'left' | 'right'>('left');
  const [stylePrompt, setStylePrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSourceImage(event.target?.result as string);
      setResultImage(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const getBase64Data = (dataUrl: string) => {
    return dataUrl.split(',')[1];
  };

  const getMimeType = (dataUrl: string) => {
    return dataUrl.split(';')[0].split(':')[1];
  };

  const handleTryOn = async () => {
    if (!sourceImage) return;
    
    setIsGenerating(true);
    setError(null);

    try {
      const base64Data = getBase64Data(sourceImage);
      const mimeType = getMimeType(sourceImage);

      let prompt = '';
      if (category === 'watch') {
        prompt = `Edit this image to realistically add a ${stylePrompt || 'stylish premium'} watch on the person's ${watchHand} wrist. Ensure the lighting, shadows, and perspective match the original image perfectly.`;
      } else if (category === 'shirt') {
        prompt = `Edit this image to change the person's top clothing to a ${stylePrompt || 'stylish shirt'}. Make it look extremely realistic, matching the body shape, lighting, and fabric folds.`;
      } else if (category === 'jeans') {
        prompt = `Edit this image to change the person's bottom clothing/pants to ${stylePrompt || 'stylish jeans'}. Make it look extremely realistic, matching the body shape, lighting, and fabric folds.`;
      } else if (category === 'shoes') {
        prompt = `Edit this image to change the person's shoes to ${stylePrompt || 'stylish sneakers'}. Make it look extremely realistic, matching the perspective and lighting of the floor and feet.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      let generatedImageUrl = null;
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            generatedImageUrl = `data:image/jpeg;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (generatedImageUrl) {
        setResultImage(generatedImageUrl);
      } else {
        throw new Error('Failed to generate image. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `try-now-${category}-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Try Now</h1>
          </div>
          <div className="text-sm text-neutral-400 font-medium">
            AI Virtual Fitting Room
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Image Preview */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-[3/4] sm:aspect-square lg:aspect-[4/5] w-full bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden flex items-center justify-center group">
              
              <AnimatePresence mode="wait">
                {!sourceImage ? (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <ImageIcon className="w-8 h-8 text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Upload your photo</h3>
                    <p className="text-sm text-neutral-500 max-w-xs mb-6">
                      For best results, use a clear, well-lit photo showing the area you want to try items on.
                    </p>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-neutral-200 transition-colors flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Select from Gallery
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="image"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0"
                  >
                    <img 
                      src={resultImage || sourceImage} 
                      alt="Preview" 
                      className="w-full h-full object-contain bg-black"
                    />
                    
                    {/* Scanning Animation Overlay */}
                    {isGenerating && (
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                        <motion.div 
                          initial={{ top: '0%' }}
                          animate={{ top: '100%' }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent via-indigo-500/20 to-indigo-500/50 border-b border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-end justify-center pb-2"
                        >
                          <ScanLine className="w-6 h-6 text-indigo-300 animate-pulse" />
                        </motion.div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-3 border border-neutral-700">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                            <span className="font-medium text-sm">AI is fitting your {category}...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            {sourceImage && !isGenerating && (
              <div className="flex justify-between items-center">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-neutral-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Change Photo
                </button>
                
                {resultImage && (
                  <button 
                    onClick={handleDownload}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download Result
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Controls */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">1. Choose Category</h2>
              <div className="grid grid-cols-2 gap-3">
                <CategoryButton 
                  active={category === 'watch'} 
                  onClick={() => setCategory('watch')}
                  icon={<Watch className="w-5 h-5" />}
                  label="Watch"
                />
                <CategoryButton 
                  active={category === 'shirt'} 
                  onClick={() => setCategory('shirt')}
                  icon={<Shirt className="w-5 h-5" />}
                  label="Topwear"
                />
                <CategoryButton 
                  active={category === 'jeans'} 
                  onClick={() => setCategory('jeans')}
                  icon={<Scissors className="w-5 h-5" />}
                  label="Bottomwear"
                />
                <CategoryButton 
                  active={category === 'shoes'} 
                  onClick={() => setCategory('shoes')}
                  icon={<div className="font-bold text-lg leading-none">👟</div>}
                  label="Footwear"
                />
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-lg font-semibold">2. Customize Style</h2>
              
              {category === 'watch' && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-neutral-400">Which hand?</label>
                  <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                    <button
                      onClick={() => setWatchHand('left')}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${watchHand === 'left' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'}`}
                    >
                      Left Hand
                    </button>
                    <button
                      onClick={() => setWatchHand('right')}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${watchHand === 'right' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'}`}
                    >
                      Right Hand
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-sm font-medium text-neutral-400">
                  Describe the {category} (Brand, Color, Style)
                </label>
                <textarea
                  value={stylePrompt}
                  onChange={(e) => setStylePrompt(e.target.value)}
                  placeholder={
                    category === 'watch' ? "e.g., Rolex Submariner, Apple Watch Ultra, or 'the watch James Bond wears'" :
                    category === 'shirt' ? "e.g., Red flannel shirt, black oversized hoodie, formal white shirt" :
                    category === 'jeans' ? "e.g., Blue ripped denim, black cargo pants, formal trousers" :
                    "e.g., Nike Air Jordan 1 red/white, brown leather boots"
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none h-24"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleTryOn}
                disabled={!sourceImage || isGenerating}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                  !sourceImage 
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
                    : isGenerating
                      ? 'bg-indigo-600/50 text-white cursor-wait'
                      : 'bg-white text-black hover:bg-neutral-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(255,255,255,0.1)]'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Fitting...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Try It On
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

function CategoryButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
        active 
          ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' 
          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
