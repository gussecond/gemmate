

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Agent, Message, TextPart, GroundingChunk } from '../types';
import { useTheme } from '../hooks/useTheme';
import { XIcon } from './icons/XIcon';
import { SendIcon } from './icons/SendIcon';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { BotIcon } from './icons/BotIcon';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { UserIcon } from './icons/UserIcon';
import { PencilIcon } from './icons/PencilIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { StopIcon } from './icons/StopIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SearchIcon } from './icons/SearchIcon';

interface ChatModalProps {
    agent: Agent;
    onClose: () => void;
    onSendMessage: (message: string) => Promise<void>;
    isResponding: boolean;
    message: string;
    onMessageChange: (value: string | ((prev: string) => string)) => void;
    onEditPrompt: (index: number) => void;
    attachmentFile: File | null;
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onClearAttachment: () => void;
    onClearHistory: () => void;
    onToggleManualRecording: () => void;
    isListening: boolean;
    interimTranscript: string;
    voiceError: string | null;
    permissionError: string | null;
    onClearPermissionError: () => void;
}

const GroundingCitations: React.FC<{ chunks: GroundingChunk[] }> = ({ chunks }) => {
    if (!chunks || chunks.length === 0) return null;

    const renderableChunks = chunks.filter(chunk => chunk.web?.uri);

    if (renderableChunks.length === 0) return null;

    return (
        <div className="mt-2 border-t border-gray-200 dark:border-slate-700/50 pt-2">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
                <SearchIcon className="h-3.5 w-3.5" />
                Sources
            </h4>
            <ul className="space-y-1 text-xs">
                {renderableChunks.map((chunk, index) => (
                    <li key={index} className="flex items-start gap-2">
                        <span className="text-gray-400 dark:text-gray-500 pt-0.5">{index + 1}.</span>
                        <a
                            href={chunk.web.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                            title={chunk.web.title || chunk.web.uri}
                        >
                            {chunk.web.title || chunk.web.uri}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
    const [copied, setCopied] = useState(false);

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy code: ", err);
        }
    };

    return (
        <div className="my-2 bg-slate-950/70 dark:bg-black/50 rounded-lg overflow-hidden border border-slate-700/50">
            <div className="flex justify-between items-center px-3 py-1 bg-slate-800/50 dark:bg-slate-900/40 text-xs text-gray-300 dark:text-gray-400">
                <span>{language || 'code'}</span>
                <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded text-gray-300 hover:bg-slate-700 transition-colors"
                >
                    {copied ? <CheckIcon className="h-3.5 w-3.5 text-green-400" /> : <CopyIcon className="h-3.5 w-3.5" />}
                    <span className="text-xs">{copied ? 'Copied!' : 'Copy'}</span>
                </button>
            </div>
            <pre className="p-3 text-sm text-white overflow-x-auto">
                <code className="font-mono">{code}</code>
            </pre>
        </div>
    );
};

const TextWithMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const boldRegex = /(\*\*.*?\*\*)/g;
    const parts = text.split(boldRegex).filter(part => part);

    return (
        <>
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={index}>{part.slice(2, -2)}</strong>;
                }
                return part;
            })}
        </>
    );
};

const MessageRenderer: React.FC<{ text: string }> = ({ text }) => {
    if (!text.includes('**') && !text.includes('* ') && !text.includes('```')) {
        return <p className="whitespace-pre-wrap break-words">{text}</p>;
    }

    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    const messageParts: {type: 'text' | 'code', content: string, language?: string}[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            messageParts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
        }
        messageParts.push({ type: 'code', language: match[1], content: match[2].trim() });
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        messageParts.push({ type: 'text', content: text.substring(lastIndex) });
    }

    const renderTextBlock = (textContent: string, keyPrefix: string) => {
        const blocks = textContent.split(/\n\s*\n/g).filter(b => b.trim().length > 0);

        return blocks.map((block, blockIndex) => {
            const lines = block.trim().split('\n');
            const isList = lines.every(line => line.trim().startsWith('*'));

            if (isList) {
                return (
                    <ul key={`${keyPrefix}-${blockIndex}`} className="list-disc list-inside space-y-1 my-2 pl-2">
                        {lines.map((line, lineIndex) => {
                            const itemContent = line.replace(/^\s*\*\s*/, '');
                            return <li key={lineIndex}><TextWithMarkdown text={itemContent} /></li>;
                        })}
                    </ul>
                );
            } else {
                 return (
                    <p key={`${keyPrefix}-${blockIndex}`} className="whitespace-pre-wrap break-words my-2">
                        <TextWithMarkdown text={block} />
                    </p>
                );
            }
        });
    };

    return (
        <div>
            {messageParts.map((part, i) => {
                if (part.type === 'code') {
                    return <CodeBlock key={i} language={part.language ?? ''} code={part.content} />;
                }
                return <React.Fragment key={i}>{renderTextBlock(part.content, `${i}`)}</React.Fragment>;
            })}
        </div>
    );
};

const AttachmentChip: React.FC<{ attachment: Message['attachment'] }> = ({ attachment }) => {
    if (!attachment) return null;
    const fileSize = attachment.size > 1024 * 1024
        ? `${(attachment.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.round(attachment.size / 1024)} KB`;

    return (
        <div className="mb-2 flex items-center gap-2 bg-primary-100 dark:bg-primary-900/40 p-2 rounded-lg border border-primary-200 dark:border-primary-800/60 max-w-xs">
            <DocumentIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 flex-shrink-0" />
            <div className="text-xs text-primary-800 dark:text-primary-200 truncate">
                <p className="font-semibold truncate" title={attachment.name}>{attachment.name}</p>
                <p className="opacity-80">{fileSize}</p>
            </div>
        </div>
    );
};


export default function ChatModal({
    agent,
    onClose,
    onSendMessage,
    isResponding,
    message,
    onMessageChange,
    onEditPrompt,
    attachmentFile,
    onFileChange,
    onClearAttachment,
    onClearHistory,
    onToggleManualRecording,
    isListening,
    interimTranscript,
    voiceError,
    permissionError,
    onClearPermissionError,
}: ChatModalProps): React.ReactNode {
    const { theme } = useTheme();
    const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [agent.history, isResponding]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [message]);

    const handleCopy = async (text: string, index: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedMessageIndex(index);
            setTimeout(() => setCopiedMessageIndex(null), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    const handleEditClick = (index: number) => {
        onEditPrompt(index);
        textareaRef.current?.focus();
    };

    const handleAttachmentClick = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((message.trim() || attachmentFile) && !isResponding) {
            onSendMessage(message);
        }
    };
    
    const onlineStatus = 'Online';
    const onlineStatusColor = 'bg-green-500';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10">
                            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center p-2 rounded-full text-primary-600 dark:text-primary-400">
                                {agent.avatarUrl ? <img src={agent.avatarUrl} alt={agent.role} className="w-full h-full object-cover rounded-full" /> : <BotIcon className="h-6 w-6" />}
                            </div>
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${onlineStatusColor}`}></div>
                        </div>
                        <div>
                           <h2 className="font-bold text-lg text-slate-900 dark:text-white">{agent.role}</h2>
                           <p className="text-xs text-gray-500 dark:text-gray-400">{onlineStatus}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={onClearHistory}
                            disabled={!agent.history || agent.history.length === 0 || isResponding}
                            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Clear chat history"
                            title="Clear History"
                        >
                            <TrashIcon className="h-5 w-5" />
                        </button>
                        <button onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Close chat"><XIcon className="h-6 w-6" /></button>
                    </div>
                </div>

                <div className="flex-grow p-6 overflow-y-auto space-y-6">
                    {(agent.history || []).map((msg, index) => {
                        const isUser = msg.role === 'user';
                        const textPart = msg.parts.find(p => 'text' in p) as TextPart | undefined;
                        const isStreaming = isResponding && index === (agent.history?.length ?? 0) - 1;

                        return (
                            <div key={index} className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                                {!isUser && (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden self-start">
                                        {agent.avatarUrl ? <img src={agent.avatarUrl} alt={agent.role} className="w-full h-full object-cover" /> : <BotIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />}
                                    </div>
                                )}
                                <div className={`flex flex-col max-w-xl ${isUser ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-4 py-3 rounded-2xl ${isUser ? 'bg-primary-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}>
                                        {msg.attachment && <AttachmentChip attachment={msg.attachment} />}
                                        {textPart?.text && <MessageRenderer text={textPart.text} />}
                                        {isStreaming && <span className="inline-block w-2 h-4 bg-slate-700 dark:bg-slate-300 animate-ping ml-1"></span>}
                                        {msg.groundingChunks && msg.groundingChunks.length > 0 && <GroundingCitations chunks={msg.groundingChunks} />}
                                    </div>
                                    
                                    {textPart?.text && !isStreaming && (
                                        <div className="mt-1.5">
                                            {isUser ? (
                                                <button onClick={() => handleEditClick(index)} className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Edit prompt">
                                                    <PencilIcon className="h-3.5 w-3.5" /><span>Edit</span>
                                                </button>
                                            ) : (
                                                <button onClick={() => handleCopy(textPart.text, index)} className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label={copiedMessageIndex === index ? "Copied" : "Copy message"}>
                                                    {copiedMessageIndex === index ? <CheckIcon className="h-3.5 w-3.5 text-green-500" /> : <CopyIcon className="h-3.5 w-3.5" />}
                                                    <span>{copiedMessageIndex === index ? 'Copied' : 'Copy'}</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {isUser && (
                                     <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center">
                                        <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 bg-white dark:bg-slate-900">
                    <>
                        {permissionError && (
                            <div className="mb-2 p-3 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-between text-sm border border-red-300 dark:border-red-600">
                                <div className="flex items-center gap-2">
                                    <AlertTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                                    <span className="font-medium text-red-800 dark:text-red-200">{permissionError}</span>
                                </div>
                                <button onClick={onClearPermissionError} className="p-1 rounded-full text-red-500 dark:text-red-400 hover:bg-red-200/50 dark:hover:bg-red-800/50" aria-label="Dismiss error"><XIcon className="h-4 w-4" /></button>
                            </div>
                        )}
                        {attachmentFile && (
                            <div className="mb-2 p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 truncate">
                                    <DocumentIcon className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                                    <span className="font-medium text-primary-800 dark:text-primary-200 truncate">{attachmentFile.name}</span>
                                </div>
                                <button onClick={onClearAttachment} disabled={isResponding} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-300/50 dark:hover:bg-gray-600/50" aria-label="Remove attachment"><XIcon className="h-4 w-4" /></button>
                            </div>
                        )}
                        {(isListening || interimTranscript || voiceError) && !permissionError && (
                            <div className="mb-2 text-center text-sm">
                                {voiceError ? (
                                    <p className="text-red-500 dark:text-red-400">{voiceError}</p>
                                ) : interimTranscript ? (
                                    <p className="text-gray-500 dark:text-gray-400 italic">{interimTranscript}</p>
                                ) : isListening ? (
                                    <p className="text-gray-500 dark:text-gray-400 animate-pulse">Listening...</p>                                    
                                ) : null}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="flex items-end gap-2">
                             <div className="flex items-center gap-1">
                                <button type="button" onClick={onToggleManualRecording} disabled={isResponding} className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-900 transition-colors disabled:opacity-50 ${isListening ? 'bg-red-100 dark:bg-red-900/50 text-red-500 dark:text-red-400' : ''}`} aria-label={isListening ? "Stop recording" : "Start recording"}>
                                    {isListening ? <StopIcon className="h-5 w-5"/> : <MicrophoneIcon className="h-5 w-5" />}
                                 </button>
                            </div>
                            <div className="flex-grow flex items-center p-1 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-primary-500 transition-shadow shadow-sm">
                                <textarea ref={textareaRef} value={message} onChange={(e) => onMessageChange(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }} placeholder={"Type your message..."} className="flex-grow p-2 bg-transparent border-none focus:ring-0 resize-none disabled:opacity-70 max-h-40" rows={1} disabled={isResponding} aria-label="Chat message input" />
                                <input type="file" ref={fileInputRef} onChange={onFileChange} className="hidden" accept="image/*,text/*,.pdf,.js,.py,.html,.css,.json,.csv" />
                                <button type="button" onClick={handleAttachmentClick} disabled={isResponding} className="flex-shrink-0 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50" aria-label="Attach file">
                                    <PaperclipIcon className="h-5 w-5" />
                                </button>
                                <button type="submit" disabled={isResponding || (!message.trim() && !attachmentFile)} className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed transition-all duration-200" aria-label="Send message">
                                    {isResponding ? <LoadingSpinner /> : <SendIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </form>
                    </>
                </div>
            </div>
        </div>
    );
}