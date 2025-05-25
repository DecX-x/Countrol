'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ChatBar() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    setMessage('');
  };

  return (
    <div className="max-w-3xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-button p-4"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-primary/20">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Shopping Assistant</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="relative">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask me anything about our products..."
            className="pr-24 bg-white/5 border-white/10 text-white placeholder:text-white/50"
          />
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <Button
                type="submit"
                size="icon"
                className="bg-primary hover:bg-primary/90"
                disabled={isLoading || !message.trim()}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </Button>
            </motion.div>
          </AnimatePresence>
        </form>
      </motion.div>
    </div>
  );
}