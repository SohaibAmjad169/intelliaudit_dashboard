import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../button';
import { Input } from '../input';
import { Loader2, Send, X, Mic, MicOff } from 'lucide-react';
import { useToast } from '../use-toast';
import { sendCommand, CommandResponse as ApiCommandResponse } from '../../../services/ai/aiCommandService';
import ReactMarkdown from 'react-markdown';

// Equipment interfaces removed

// --- Add SpeechRecognition type definition (necessary for browsers like Firefox) ---
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: Event & { error: string }) => void; // Adjust onerror type
  onend: () => void;
  // Add other properties/methods if needed
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}
// --- End SpeechRecognition type definition ---

interface AiCommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

// Using the CommandResponse type from the API client

export function AiCommandBar({ 
  isOpen, 
  onClose,
  projectId
}: AiCommandBarProps) {
  const [command, setCommand] = useState('');
  const [response, setResponse] = useState<ApiCommandResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false); // State for listening status
  const recognitionRef = useRef<SpeechRecognition | null>(null); // Ref to store recognition instance
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();

  // --- Speech Recognition Setup --- 
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.warn('Speech Recognition API not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true; // Keep listening even after pauses
    recognition.interimResults = true; // Get results while speaking
    recognition.lang = 'en-US'; // Set language

    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      // Update input with the latest transcript (prioritize final)
      setCommand(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      toast({ title: 'Speech Error', description: `Recognition error: ${event.error}`, variant: 'destructive' });
      setIsListening(false); // Stop listening state on error
    };

    recognition.onend = () => {
      // Only set isListening false if it wasn't manually stopped
      // This handles cases where recognition stops automatically (e.g., long silence)
      // We might want finer control later if needed
      if (recognitionRef.current) { // Check if stop wasn't called manually
         setIsListening(false);
      } 
      console.log('Speech recognition ended.');
    };

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [toast]);
  // --- End Speech Recognition Setup ---

  const handleMicClick = useCallback(() => {
    if (!recognitionRef.current) {
      toast({ title: 'Speech Error', description: 'Speech recognition not available.', variant: 'destructive' });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      recognitionRef.current = null; // Clear ref on manual stop to prevent onend setting state
      setIsListening(false);
      console.log('Speech recognition stopped manually.');
    } else {
      try {
        // Need to recreate instance if stopped manually
        if (!recognitionRef.current) { 
            const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
            if(SpeechRecognitionAPI) {
                const recognition = new SpeechRecognitionAPI();
                // Re-apply settings and handlers
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';
                recognition.onresult = recognitionRef.current?.onresult; // Re-attach handlers if needed, but maybe cleaner to set them in useEffect only
                recognition.onerror = recognitionRef.current?.onerror;
                recognition.onend = recognitionRef.current?.onend; // Re-attach if needed
                recognitionRef.current = recognition;
            }
        }
        recognitionRef.current?.start();
        setIsListening(true);
        console.log('Speech recognition started.');
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        toast({ title: 'Speech Error', description: 'Could not start speech recognition.', variant: 'destructive' });
      }
    }
  }, [isListening, toast]);

  // Focus the input when the command bar opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    // Stop listening if component closes
    if (!isOpen && isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null; // Ensure ref is cleared
      setIsListening(false);
    }
  }, [isOpen, isListening]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on Escape
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      
      // Open on Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // This would be handled by the parent component
        } else {
          // Clear the input if already open
          setCommand('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!command.trim()) return;
    
    setIsLoading(true);
    setResponse(null);
    
    console.log('Submitting AI command with project ID:', projectId);
    
    try {
      // Pass the extracted projectId
      const data = await sendCommand(command, projectId);
      console.log('AI response received:', data);
      setResponse(data);
      
      // Check if the response indicates no project context
      if (data.text && (data.text.includes("need a project ID") || data.text.includes("need project context")) && projectId) {
        console.warn("AI service reported no project context despite sending projectId:", projectId);
      }
      
      // If there was an error, show a toast
      if (data.type === 'error') {
        toast({
          title: 'Error processing command',
          description: data.text,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending command:', error);
      setResponse({
        text: 'Sorry, I encountered an error processing your command.',
        type: 'error',
      });
      
      toast({
        title: 'Connection Error',
        description: 'Could not connect to the AI service.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Command Bar */}
      <div className="relative w-full max-w-2xl bg-card dark:bg-card rounded-lg shadow-xl overflow-hidden border border-border dark:border-border">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Input Area */}
          <div className="flex items-center px-4 py-2 border-b border-border dark:border-border">
            <Input
              ref={inputRef}
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Ask IntelliAudit anything..."
              className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-foreground dark:text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground"
              disabled={isLoading}
            />
            
            {/* Voice Dictation Button - Updated */} 
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleMicClick} // Use internal handler
              className={`ml-2 ${isListening ? 'text-red-500 dark:text-red-400' : 'text-muted-foreground dark:text-muted-foreground'}`}
              title={isListening ? "Stop listening" : "Start voice dictation"}
              disabled={!window.SpeechRecognition && !window.webkitSpeechRecognition} // Disable if API not supported
            >
              {isListening ? <MicOff /> : <Mic />} {/* Toggle icon */}
            </Button>
            
            {/* Send Button */}
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              disabled={isLoading || !command.trim()}
              className="ml-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
            
            {/* Close Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Response Area */}
          {(response || isLoading) && (
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500 dark:text-emerald-400" />
                  <span className="ml-2 text-sm text-muted-foreground dark:text-muted-foreground">Thinking...</span>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {response?.type === 'analysis' ? (
                    <div>
                      <h3 className="text-lg font-medium text-foreground dark:text-foreground">Analysis Results</h3>
                      <ReactMarkdown className="text-gray-700 dark:text-gray-300">
                        {response.text}
                      </ReactMarkdown>
                      
                      {/* Equipment details section removed */}
                    </div>
                  ) : (
                    <ReactMarkdown className="text-gray-700 dark:text-gray-300">
                      {response?.text || ''}
                    </ReactMarkdown>
                  )}
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
