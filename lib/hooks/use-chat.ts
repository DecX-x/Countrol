'use client';

import { useState, useCallback } from 'react';
import { Message } from '@/lib/types';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newMessageIndicator, setNewMessageIndicator] = useState(false);

  const [streamingMessage, setStreamingMessage] = useState<string>('');

  const addMessage = useCallback((content: string, role: 'user' | 'assistant', image?: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      role,
      timestamp: new Date(),
      image,
    };
    
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  }, []);

  const updateLastMessage = useCallback((content: string) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
        newMessages[newMessages.length - 1] = {
          ...newMessages[newMessages.length - 1],
          content,
        };
      }
      return newMessages;
    });
  }, []);

  const sendMessage = useCallback(async (content: string, image?: string) => {
    if (!content.trim()) return;
    
    // Add user message
    addMessage(content, 'user', image);
    setIsLoading(true);
    setStreamingMessage('');
    
    // Add initial empty assistant message for streaming
    const assistantMessage = addMessage('', 'assistant');
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          image,
          threadId: 'default',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';
      let currentContent = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'status':
                  if (data.content) {
                    setStreamingMessage(data.content);
                    updateLastMessage(data.content);
                  }
                  break;
                  
                case 'content':
                  currentContent = data.content;
                  setStreamingMessage('');
                  updateLastMessage(currentContent);
                  break;
                  
                case 'done':
                  if (data.finalResponse) {
                    updateLastMessage(data.finalResponse);
                  }
                  setIsLoading(false);
                  setNewMessageIndicator(true);
                  break;
                  
                case 'error':
                  updateLastMessage(data.content || 'Sorry, there was an error processing your request.');
                  setIsLoading(false);
                  break;
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      updateLastMessage('Sorry, there was an error sending your message. Please try again.');
      setIsLoading(false);
    }
  }, [addMessage, updateLastMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const clearNewMessageIndicator = useCallback(() => {
    setNewMessageIndicator(false);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    newMessageIndicator,
    clearNewMessageIndicator,
    streamingMessage,
  };
}