'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { Trash2, Pencil, RotateCcw, Send, Search, FileUp, ImageIcon, Mic, Paperclip, SpeechIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from 'next-themes';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Weather } from '@/components/ai/weather';
import { ProductRecommendation } from '@/components/ai/product_recommendation';

const pageTitle = process.env.MODEL ? process.env.MODEL : "ChatGPT 4o-mini";
const pageDescription = "ChatGPT 4.5 is a powerful AI model that can be used to generate text, images, and other content. ChatGPT 4.5 doesn't support model: openai.response() yet.";

export default function Page() {
  const { messages, setMessages, status, input, stop, reload, handleInputChange, handleSubmit, error } = useChat();
    const [attachmentType, setAttachmentType] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { setTheme } = useTheme();
    const [isMounted, setIsMounted] = useState(false);

    const isLoading = status === 'streaming' || status === 'submitted';

    useEffect(() => {
        setIsMounted(true);
        setTheme('dark');
    }, [setTheme]);

  const handleEdit = (id: string) => {
    setMessages(messages.map(message => message.id === id ? { ...message, content: input } : message));
    reload();
  }

  const handleDelete = (id: string) => {
    setMessages(messages.filter(message => message.id !== id))
  }

    const handleFeatureClick = (type: string) => {
        setAttachmentType(type === attachmentType ? null : type);
        console.log(`${type} feature clicked`);
    }

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, status]);

    if (!isMounted) {
        return null;
    }

  return (
        <div className="flex flex-col h-screen bg-background dark pt-16">
            <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-8 pb-6">
                <div className="space-y-4 max-w-4xl mx-auto">
                    {/* Initial Title/Description Bubble & Start Conversation Prompt */} 
                    {messages.length === 0 && (
                        <>
                            <div className="flex justify-center mb-10">
                                <div className="bg-card text-card-foreground shadow-sm rounded-2xl p-6 text-center max-w-md">
                                    <h1 className="text-2xl font-semibold mb-2">{pageTitle}</h1>
                                    <p className="text-muted-foreground text-sm">{pageDescription}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center h-[calc(100vh-30rem)] gap-5 text-center">
                                <div className="w-20 h-20 rounded-full bg-primary-background/10 flex items-center justify-center">
                                    <div className="w-10 h-10 text-primary-background/70">
                                        <SpeechIcon className="w-10 h-10" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-primary-background/90 text-xl font-medium mb-1.5">Start a conversation</p>
                                    <p className="text-primary-background/60 max-w-sm">Ask a question or start a conversation with {process.env.MODEL ? process.env.MODEL : 'ChatGPT 4.5'}</p>
                                </div>
          </div>
                        </>
                    )}

                    {error ? (
                        <div className="p-4 my-3 bg-destructive/10 text-destructive rounded-lg w-full max-w-[85%] mx-auto">
                            <p className="font-medium">Error</p>
                            <p>{error.message}</p>
                        </div>
                ) : null}

                    {messages.map((message) => (
                        <div key={message.id} className={`flex flex-col items-${message.role === "user" ? "end" : "start"} group`}>
                            {/* User Message Bubble or AI Text Message Bubble */} 
                            {(message.role === "user" || (message.role === "assistant" && message.content && message.content.trim() !== "")) && (
                                <div
                                    className={`prose dark:prose-invert max-w-[85%] w-fit rounded-2xl p-4 relative transition-shadow duration-200 hover:shadow-md mb-2 ${message.role === "user"
                                        ? "bg-gradient-to-r from-blue-600/90 to-blue-600 text-white prose-strong:text-white prose-em:text-white"
                                        : "bg-card text-card-foreground shadow-sm"
                                        }`}
                                >
                                    {message.role === "user" ? (
                                        <div className="whitespace-pre-wrap leading-relaxed items-end">
                                            {message.content}
                                        </div>
                                    ) : (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {message.content}
                                        </ReactMarkdown>
                                    )}
                                    {/* Streaming indicator for AI text */} 
                                    {message.role === "assistant" && status === "streaming" && messages[messages.length - 1].id === message.id && (!message.toolInvocations || message.toolInvocations.every(ti => ti.state !== 'result')) && (
                                        <span className="inline-block w-2 h-5 ml-0.5 align-middle bg-current animate-pulse"></span>
                                    )}
                                    {/* Action buttons */} 
                                    {(status === 'ready' || status === 'error') && (
                                        <div className={`absolute -bottom-7 ${message.role === 'user' ? 'right-1' : 'left-1'} flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                                            <Button size="icon" variant="ghost" onClick={() => handleEdit(message.id)} disabled={!(status === 'ready' || status === 'error')} className="h-6 w-6 rounded-full"><Pencil className="h-3 w-3" /></Button>
                                            <Button size="icon" variant="ghost" onClick={() => reload()} disabled={!(status === 'ready' || status === 'error')} className="h-6 w-6 rounded-full"><RotateCcw className="h-3 w-3" /></Button>
                                            <Button size="icon" variant="ghost" onClick={() => handleDelete(message.id)} disabled={!(status === 'ready')} className="h-6 w-6 rounded-full"><Trash2 className="h-3 w-3" /></Button>
                                        </div>
                                    )}
                </div>
                            )}

                            {/* Render Tool Invocation UIs below the bubble */} 
                            {message.role === "assistant" && message.toolInvocations?.map(toolInvocation => {
                                const { toolName, toolCallId, state } = toolInvocation;

                                if (state !== 'result' && (toolName === 'displayWeather' || toolName === 'recommendProduct')) {
                                    return (
                                        <div key={toolCallId} className="mt-2 max-w-[85%] w-full flex justify-start">
                                            <div className="bg-card text-card-foreground shadow-sm rounded-2xl p-4 animate-pulse">
                                                Loading {toolName === 'displayWeather' ? 'weather information' : 'product recommendation'}...
                                            </div>
                                        </div>
                                    );
                                }

                                if (state === 'result') {
                                    if (toolName === 'displayWeather') {
                                        const { result } = toolInvocation;
                                        return (
                                            <div key={toolCallId} className="mt-2 max-w-[85%] w-full flex justify-start">
                                                <Weather {...result} />
                                            </div>
                                        );
                                    }
                                    if (toolName === 'recommendProduct') {
                                        const { result } = toolInvocation;
                                        return (
                                            <div key={toolCallId} className="mt-2 max-w-[85%] w-full flex justify-start">
                                                <ProductRecommendation {...result} />
                                            </div>
                                        );
                                    }
                                }
                                return null;
                            })}
                            {/* Add margin below the entire message group (text + tools) */} 
                            {message.role === "assistant" && message.toolInvocations && message.toolInvocations.length > 0 && <div className="mb-4"></div>}
              </div>
            ))}

                    {isLoading && (
                        <div className="flex justify-start mb-4">
                            <div className="max-w-[80%] rounded-2xl p-4 bg-card text-card-foreground shadow-sm">
                                <div className="flex space-x-1.5">
                                    <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                    <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                    <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                                </div>
                            </div>
                        </div>
        )}
                    <div ref={messagesEndRef} />
                </div>
      </div>

            <div className="p-4 md:p-6 border-t border-border/30">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="flex items-center gap-3">
                            <Input
          value={input}
          onChange={handleInputChange}
                                placeholder="Type your message..."
                                className="bg-background border-border/50 shadow-sm rounded-xl focus-visible:ring-2 focus-visible:ring-offset-1 flex-1 h-12"
                                disabled={isLoading}
        />
                            <Button
                                type="submit"
                                size="icon"
                                variant="default"
                                className="rounded-xl h-12 w-12 bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                                disabled={isLoading || !input.trim()}
                            >
                                <Send className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center">
                            <Button type="button" variant="ghost" size="sm" onClick={() => handleFeatureClick("search")} className={`rounded-full px-4 transition-all duration-200 hover:bg-muted ${attachmentType === "search" ? "bg-blue-600/20 text-blue-500 dark:text-blue-300" : ""}`}><Search className="h-4 w-4 mr-2" />Web Search</Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => handleFeatureClick("file")} className={`rounded-full px-4 transition-all duration-200 hover:bg-muted ${attachmentType === "file" ? "bg-blue-600/20 text-blue-500 dark:text-blue-300" : ""}`}><FileUp className="h-4 w-4 mr-2" />Upload File</Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => handleFeatureClick("image")} className={`rounded-full px-4 transition-all duration-200 hover:bg-muted ${attachmentType === "image" ? "bg-blue-600/20 text-blue-500 dark:text-blue-300" : ""}`}><ImageIcon className="h-4 w-4 mr-2" />Generate Image</Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => handleFeatureClick("voice")} className={`rounded-full px-4 transition-all duration-200 hover:bg-muted ${attachmentType === "voice" ? "bg-blue-600/20 text-blue-500 dark:text-blue-300" : ""}`}><Mic className="h-4 w-4 mr-2" />Voice Input</Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => handleFeatureClick("attachment")} className={`rounded-full px-4 transition-all duration-200 hover:bg-muted ${attachmentType === "attachment" ? "bg-blue-600/20 text-blue-500 dark:text-blue-300" : ""}`}><Paperclip className="h-4 w-4 mr-2" />Attachments</Button>
                        </div>

                        {isLoading && (
                            <div className="flex justify-center">
                                <Button type="button" variant="outline" size="sm" onClick={stop} className="rounded-full border-0 bg-destructive/10 hover:bg-destructive/20 text-destructive px-4">Stop generating</Button>
        </div>
                        )}
      </form>
                </div>
            </div>
    </div>
  );
}