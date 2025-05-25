'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { IncomeExpenseComparison } from '@/components/income-expense-comparison';


export function HeroSection() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    
    // Create URL with message and image ID if available
    const searchParams = new URLSearchParams();
    searchParams.set('q', message.trim());
    
    if (selectedImage) {
      // Store image in sessionStorage with unique ID
      const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(imageId, selectedImage);
      searchParams.set('imageId', imageId);
    }
    
    router.push(`/search?${searchParams.toString()}`);
  };

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/5"
            initial={{
              width: `${(i + 1) * 400}px`,
              height: `${(i + 1) * 400}px`,
              x: '-50%',
              y: '-50%',
              opacity: 0.3,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.2, 0.3],
            }}
            transition={{
              duration: 8,
              delay: i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              left: '50%',
              top: '50%',
            }}
          />
        ))}
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl mx-auto px-4 text-center relative z-10"
      >        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >          <div className="mb-6 sm:mb-8 max-w-xs sm:max-w-md mx-auto">
            <IncomeExpenseComparison />
          </div>
          <h1 className="text-5xl font-bold mb-4">
            <span className="gradient-text">Catat Keuanganmu</span> dengan AI
          </h1>
          <p className="text-xl text-white/80 mb-8">
            Experience the future of finance with our AI-powered assistant.
          </p>
        </motion.div><form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto">
          {/* Image preview */}
          {selectedImage && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 relative inline-block"
            >
              <div className="relative h-24 w-24 rounded-lg border border-white/20 overflow-hidden">
                <Image 
                  src={selectedImage} 
                  alt="Upload preview" 
                  fill
                  className="object-cover"
                  unoptimized={true}
                />
              </div>
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1 transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </motion.div>
          )}
          
          <div className="relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell me your monthly income and expenses or upload receipt..."
              className="h-14 pl-6 pr-32 text-base bg-[#1A1B1E]/80 backdrop-blur-lg border-white/10 text-white placeholder:text-white/50 rounded-full shadow-lg"
              autoFocus
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {/* Upload button */}
              <Button
                type="button"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 bg-secondary hover:bg-secondary/90 rounded-full"
                disabled={isLoading}
              >
                <Upload className="w-4 h-4" />
              </Button>
              
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Button
                    type="submit"
                    size="icon"
                    className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full"
                    disabled={isLoading || !message.trim()}
                  >                 
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ArrowRight className="w-5 h-5" />
                    )}
                  </Button>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-wrap justify-center gap-2"
        >
        </motion.div>

      </motion.div>
    </section>
  );
}