'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Bot, ArrowLeft, ArrowRight, Loader2, Upload, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Message {
  type: 'user' | 'assistant';
  content: string;
  followUpQuestions?: string[];
  image?: string | null;
  isStreaming?: boolean;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const imageId = searchParams.get('imageId');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [threadId] = useState(() => `thread_${Date.now()}`);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialCallMade = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  // Get image from sessionStorage if imageId is provided
  useEffect(() => {
    if (imageId) {
      const storedImage = sessionStorage.getItem(imageId);
      if (storedImage) {
        setSelectedImage(storedImage);
        // Clean up sessionStorage after retrieving
        sessionStorage.removeItem(imageId);
      }
    }
  }, [imageId]);

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
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isTyping) return;

    const userMessage = newMessage.trim();
    const imageToSend = selectedImage;
    
    setNewMessage('');
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }    
    setMessages(prev => [...prev, { type: 'user', content: userMessage, image: imageToSend }]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          image: imageToSend,
          threadId: threadId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream available');
      }

      let assistantMessage = '';
      let currentStatus = '';

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.type === 'status') {
                    currentStatus = data.content;                  } else if (data.type === 'content') {
                    assistantMessage = data.content;
                    // Update the assistant message with streaming effect
                    setMessages(prev => {
                      const newMessages = [...prev];
                      const lastMessage = newMessages[newMessages.length - 1];
                      if (lastMessage?.type === 'assistant') {
                        lastMessage.content = assistantMessage;
                        lastMessage.isStreaming = true;
                      } else {
                        newMessages.push({
                          type: 'assistant',
                          content: assistantMessage,
                          followUpQuestions: [],
                          isStreaming: true
                        });
                      }
                      return newMessages;
                    });
                    
                    // Apply streaming effect
                    simulateStreaming(assistantMessage, (streamedText) => {
                      setStreamingText(streamedText);
                    });
                  } else if (data.type === 'done') {
                    assistantMessage = data.content;
                    
                    // Final update with complete message
                    setMessages(prev => {
                      const newMessages = [...prev];
                      const lastMessage = newMessages[newMessages.length - 1];
                      if (lastMessage?.type === 'assistant') {
                        lastMessage.content = assistantMessage;
                        lastMessage.isStreaming = false;
                      }
                      return newMessages;
                    });
                    
                    setIsStreaming(false);
                    setStreamingText('');
                    break;
                  } else if (data.type === 'error') {
                    throw new Error(data.content);
                  }
                } catch (parseError) {
                  console.error('Error parsing SSE data:', parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      };

      await processStream();      // Generate follow-up questions based on the response
      const followUpQuestions = generateFollowUpQuestions(assistantMessage);
      
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage?.type === 'assistant') {
          lastMessage.followUpQuestions = followUpQuestions;
          lastMessage.isStreaming = false;
        } else {
          newMessages.push({
            type: 'assistant',
            content: assistantMessage,
            followUpQuestions: followUpQuestions,
            isStreaming: false
          });
        }
        return newMessages;
      });    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: 'Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.',
        followUpQuestions: [],
        isStreaming: false
      }]);
    } finally {
      setIsTyping(false);
      setIsStreaming(false);
      setStreamingText('');
    }
  };

  const generateFollowUpQuestions = (response: string): string[] => {
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('transaksi') || lowerResponse.includes('berhasil')) {
      return [
        "Lihat semua transaksi saya",
        "Tambah transaksi lainnya",
        "Analisis pengeluaran bulan ini"
      ];
    } else if (lowerResponse.includes('budget') || lowerResponse.includes('anggaran')) {
      return [
        "Buat anggaran bulanan",
        "Tips menghemat pengeluaran",
        "Analisis kategori pengeluaran"
      ];
    } else if (lowerResponse.includes('investasi') || lowerResponse.includes('invest')) {
      return [
        "Strategi investasi pemula",
        "Diversifikasi portfolio",
        "Reksa dana vs saham"
      ];
    } else {
      return [
        "Cara membuat budget",
        "Tips menabung efektif",
        "Analisis keuangan pribadi"
      ];
    }
  };  useEffect(() => {
    console.log("=== SEARCH PAGE USEEFFECT TRIGGERED ===");
    console.log("Query:", query);
    console.log("ThreadId:", threadId);
    console.log("Initial call made:", initialCallMade.current);
    
    const simulateInitialResponse = async () => {
      if (!query) {
        console.log("No query provided, skipping initial response");
        return;
      }

      // Check if we already made the initial call to prevent double execution
      if (initialCallMade.current) {
        console.log("Initial call already made, skipping duplicate call");
        return;
      }

      console.log("Starting initial response for query:", query);
      initialCallMade.current = true;
      setIsLoading(true);
      
      // Wait a bit for selectedImage to be set from sessionStorage
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get the current selectedImage value
      const currentImage = selectedImage || (imageId ? sessionStorage.getItem(imageId) : null);
      
      // Send initial query to the API
      try {
        setMessages([{ type: 'user', content: query, image: currentImage }]);
        setIsTyping(true);

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: query,
            image: currentImage,
            threadId: threadId,
          }),
        });

        if (response.ok) {
          const reader = response.body?.getReader();
          if (reader) {
            let assistantMessage = '';
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    if (data.type === 'content' || data.type === 'done') {
                      assistantMessage = data.content;
                    }
                  } catch (parseError) {
                    console.error('Error parsing initial SSE data:', parseError);
                  }
                }
              }
            }            setMessages(prev => [...prev, {
              type: 'assistant',
              content: assistantMessage,
              followUpQuestions: generateFollowUpQuestions(assistantMessage),
              isStreaming: false
            }]);
            
            // Clear selectedImage after sending initial message
            if (currentImage) {
              setSelectedImage(null);
            }
          }
        } else {          // Fallback response
          setMessages(prev => [...prev, {
            type: 'assistant',
            content: "Selamat datang! Saya adalah asisten keuangan AI Anda. Bagaimana saya bisa membantu Anda hari ini?",
            followUpQuestions: [
              "Cara membuat budget",
              "Tips menabung efektif", 
              "Analisis pengeluaran saya"
            ],
            isStreaming: false
          }]);
        }      } catch (error) {
        console.error('Error with initial query:', error);        
        setMessages([
          { type: 'user', content: query, image: selectedImage },
          {
            type: 'assistant',
            content: "Selamat datang! Saya adalah asisten keuangan AI Anda. Bagaimana saya bisa membantu Anda hari ini?",
            followUpQuestions: [
              "Cara membuat budget",
              "Tips menabung efektif",
              "Analisis pengeluaran saya"
            ],
            isStreaming: false
          }
        ]);
        
        // Clear selectedImage after error as well
        if (selectedImage) {
          setSelectedImage(null);
        }
      } finally {
        setIsTyping(false);
        setIsLoading(false);
      }
    };    simulateInitialResponse();
  }, [query, threadId, imageId, selectedImage]);
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    };
    
    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(scrollToBottom, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages, isTyping, streamingText]);
  // Simulate slower streaming effect by chunking the content
  const simulateStreaming = (fullText: string, callback: (text: string) => void) => {
    setIsStreaming(true);
    setStreamingText('');
    
    const words = fullText.split(' ');
    let currentText = '';
    let wordIndex = 0;
    
    const streamInterval = setInterval(() => {
      if (wordIndex < words.length) {
        currentText += (wordIndex > 0 ? ' ' : '') + words[wordIndex];
        setStreamingText(currentText);
        callback(currentText);
        wordIndex++;
      } else {
        clearInterval(streamInterval);
        setIsStreaming(false);
        setStreamingText('');
        // Update the final message state
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage?.type === 'assistant') {
            lastMessage.isStreaming = false;
          }
          return newMessages;
        });
      }
    }, 100); // Slightly slower for better effect (100ms per word)
    
    return () => clearInterval(streamInterval);
  };

  return (
    <div className="min-h-screen pt-20 pb-32">
      <div className="max-w-3xl mx-auto px-4">
        <Link 
          href="/"
          className="inline-flex items-center text-white/60 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>        <div className="space-y-6">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`glass-effect p-4 rounded-xl ${
                message.type === 'user' ? 'bg-primary/20 max-w-[80%]' : 'max-w-[95%]'
              }`}>
                {/* Display user image if present */}
                {message.image && message.type === 'user' && (
                  <div className="mb-3">
                    <div className="relative h-32 w-32 rounded-lg border border-white/20 overflow-hidden">
                      <Image 
                        src={message.image} 
                        alt="User uploaded image" 
                        fill
                        className="object-cover"
                        unoptimized={true}
                      />
                    </div>
                  </div>
                )}
                
                <p className="text-white/90 whitespace-pre-wrap">
                  {message.isStreaming && streamingText ? streamingText : message.content}
                </p>
                
                {/* Streaming indicator for assistant messages */}
                {message.isStreaming && message.type === 'assistant' && (
                  <div className="mt-2 flex items-center gap-1 text-white/50 text-sm">
                    <div className="w-1 h-1 bg-white/50 rounded-full animate-pulse" />
                    <span>AI sedang mengetik...</span>
                  </div>
                )}
                
                {message.followUpQuestions && message.followUpQuestions.length > 0 && !message.isStreaming && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.followUpQuestions.map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => setNewMessage(question)}
                        className="text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="glass-effect p-3 rounded-xl">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-6 left-4 right-4 max-w-3xl mx-auto"
          onSubmit={handleSendMessage}
        >
          {selectedImage && (
            <div className="mb-2 relative inline-block">
              <div className="relative h-20 w-20 rounded-lg border border-white/20 overflow-hidden">
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
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          )}
          
          <div className="relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Tanyakan tentang keuangan Anda atau upload struk..."
              className="pr-20 bg-[#1A1B1E]/80 backdrop-blur-lg border-white/10"
            />
            
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 w-8 bg-secondary hover:bg-secondary/90 rounded-full"
                disabled={isTyping}
              >
                <Upload className="w-4 h-4" />
              </Button>
              
              <Button
                type="submit"
                size="icon"
                className="h-8 w-8 bg-primary hover:bg-primary/90 rounded-full"
                disabled={!newMessage.trim() || isTyping}
              >
                {isTyping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </motion.form>        {/* Empty div for scrolling to bottom */}
        <div ref={messagesEndRef} className="h-20" />
      </div>
    </div>
  );
}