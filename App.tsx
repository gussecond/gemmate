

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Agent, Crew, Message, Part, Attachment } from './types';
import { generateSingleAgent, generateAgentAvatar } from './services/geminiService';
import Header from './components/Header';
import CrewDisplay from './components/CrewDisplay';
import ChatModal from './components/ChatModal';
import SettingsModal from './components/SettingsModal';
import { Content, GoogleGenAI } from '@google/genai';
import { useSettings } from './context/SettingsContext';
import { IWindow, SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from './types';


const LOCAL_STORAGE_KEY = 'ai-crew-orchestrator';

export default function App(): React.ReactNode {
  const { isConfigured, aiClient, model } = useSettings();
  const [crew, setCrew] = useState<Crew | null>(null);
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [activeChatAgentId, setActiveChatAgentId] = useState<string | null>(null);
  const [isChatResponding, setIsChatResponding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isGeneratingAvatarFor, setIsGeneratingAvatarFor] = useState<string | null>(null);

  // State for controlled chat input
  const [chatInput, setChatInput] = useState('');
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  
  // State for voice features
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);


  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const stateRef = useRef({ isListening, handleSendMessage: (message: string) => {} });

  useEffect(() => {
    // Automatically open settings if not configured on first load.
    if (!isConfigured) {
        setShowSettings(true);
    }
  }, [isConfigured]);

  // Load crew from localStorage on initial render
  useEffect(() => {
    try {
      const storedCrewJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedCrewJSON) {
        const storedCrew = JSON.parse(storedCrewJSON);
        if (storedCrew.agents) {
            storedCrew.agents = storedCrew.agents.map((agent: Agent) => ({
                ...agent,
                id: agent.id || self.crypto.randomUUID(),
                history: (agent.history || []).map((message: Message & {content?: string}) => ({
                    ...message,
                    parts: message.parts || [{ text: message.content || '' }],
                })),
            }));
        }
        setCrew(storedCrew);
      }
    } catch (e) {
      console.error("Failed to load crew from localStorage", e);
      setCrew(null);
    }
  }, []);

  // Save crew to localStorage whenever it changes
  useEffect(() => {
    try {
      if (crew) {
          if (crew.agents.length > 0) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(crew));
          } else {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            setCrew(null);
          }
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (e) {
      console.error("Failed to save crew to localStorage", e);
    }
  }, [crew]);
  
  const stopListening = useCallback(() => {
      if (recognitionRef.current) {
          recognitionRef.current.stop();
      }
  }, []);

  const startListening = useCallback(() => {
      if (recognitionRef.current) {
        try {
            recognitionRef.current.start();
        } catch(e) {
            console.warn("Attempted to start recognition when it might already be running.", e);
        }
      }
  }, []);

  const handleSendMessage = useCallback(async (messageToSend: string) => {
      if (!activeChatAgentId || (!messageToSend.trim() && !attachmentFile) || !aiClient) return;
      
      setIsChatResponding(true);

      const originalAttachmentFile = attachmentFile;
      const wasEditing = editingMessageIndex !== null;
      const originalEditingIndex = editingMessageIndex;

      setChatInput('');
      setAttachmentFile(null);
      setEditingMessageIndex(null);

      const agent = crew?.agents.find(a => a.id === activeChatAgentId);
      if (!agent) {
          setIsChatResponding(false);
          return;
      }
      
      const baseHistory = wasEditing && originalEditingIndex !== null
        ? (agent.history || []).slice(0, originalEditingIndex)
        : (agent.history || []);
      
      const messageParts: Part[] = [];

      if (messageToSend.trim()) {
          messageParts.push({ text: messageToSend.trim() });
      }

      let attachmentForHistory: Attachment | undefined = undefined;
      if (originalAttachmentFile) {
          try {
            const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(originalAttachmentFile);
                reader.onload = () => {
                    const result = reader.result as string;
                    resolve(result.split(',')[1]);
                };
                reader.onerror = error => reject(error);
            });
            messageParts.push({
                inlineData: {
                    mimeType: originalAttachmentFile.type,
                    data: base64Data,
                }
            });
            attachmentForHistory = {
                name: originalAttachmentFile.name,
                size: originalAttachmentFile.size,
                type: originalAttachmentFile.type,
            };
          } catch (e) {
              console.error("Error reading file:", e);
              setIsChatResponding(false);
              return;
          }
      }

      const userMessage: Message = { 
        role: 'user', 
        parts: messageParts,
        ...(attachmentForHistory && { attachment: attachmentForHistory })
      };

      const historyWithUserMessage = [...baseHistory, userMessage];

      setCrew(prevCrew => {
          if (!prevCrew) return null;
          return {
              ...prevCrew,
              agents: prevCrew.agents.map(a => 
                  a.id === activeChatAgentId 
                      ? { ...a, history: historyWithUserMessage }
                      : a
              )
          };
      });

      let fullResponse = '';
      try {
          const tasksString = agent.tasks && agent.tasks.length > 0
            ? `Here are your assigned tasks. You should focus on these in your responses:\n${agent.tasks.map(t => `- ${t.name}: ${t.description}`).join('\n')}`
            : "You have no specific tasks assigned at the moment.";

          const systemInstruction = `You are an AI assistant. Your name is ${agent.role}.
          Your goal is: ${agent.goal}.
          Your backstory is: ${agent.backstory}
          
          ${tasksString}
          
          You must act and respond according to this persona and your assigned tasks. Be helpful and engage in character. When analyzing files or screen captures, be thorough.`;
          
          const contentsForAPI = historyWithUserMessage.map(msg => ({
              role: msg.role,
              parts: msg.parts
          })) as Content[];

          const hasSearch = agent?.tools?.includes('googleSearch');
          const config: any = { systemInstruction: systemInstruction };
          if (hasSearch) {
              config.tools = [{googleSearch: {}}];
          }

          const result = await aiClient.models.generateContentStream({
              model: model,
              contents: contentsForAPI,
              config: config,
          });
          
          setCrew(prevCrew => {
            if (!prevCrew) return null;
            const modelMessage: Message = { role: 'model', parts: [{ text: '' }], groundingChunks: [] };
            return {
              ...prevCrew,
              agents: prevCrew.agents.map(a =>
                a.id === activeChatAgentId
                  ? { ...a, history: [...(a.history || []), modelMessage] }
                  : a
              ),
            };
          });

          for await (const chunk of result) {
              fullResponse += chunk.text;
              const newChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;

              setCrew(prevCrew => {
                  if (!prevCrew) return null;
                  return {
                      ...prevCrew,
                      agents: prevCrew.agents.map(a => {
                          if (a.id === activeChatAgentId) {
                              const newHistory = [...(a.history || [])];
                              const lastMessage = newHistory[newHistory.length - 1];
                              if (lastMessage && lastMessage.role === 'model') {
                                  lastMessage.parts = [{ text: fullResponse }];
                                  if (newChunks) {
                                      const existingUris = new Set((lastMessage.groundingChunks || []).map(c => c.web.uri));
                                      const filteredNewChunks = newChunks.filter(c => !existingUris.has(c.web.uri));
                                      lastMessage.groundingChunks = [...(lastMessage.groundingChunks || []), ...filteredNewChunks];
                                  }
                              }
                              return { ...a, history: newHistory };
                          }
                          return a;
                      })
                  };
              });
          }

      } catch (e) {
          console.error("Error sending message:", e);
           fullResponse = e instanceof Error && (e.message.includes("API key not valid") || e.message.includes("API_KEY_INVALID"))
                ? "Your API Key is not valid. Please check it in Settings."
                : "Sorry, I encountered an error. Please try again.";
            
            setCrew(prevCrew => {
              if (!prevCrew) return null;
              return {
                  ...prevCrew,
                  agents: prevCrew.agents.map(agent => {
                      if (agent.id === activeChatAgentId) {
                          const newHistory = [...(agent.history || [])];
                          const lastMessage = newHistory[newHistory.length - 1];
                          const lastPart = lastMessage?.parts[0];
                          if (lastMessage && lastMessage.role === 'model' && lastPart && 'text' in lastPart && lastPart.text === '') {
                              lastMessage.parts = [{ text: fullResponse }];
                          } else {
                            newHistory.push({ role: 'model', parts: [{ text: fullResponse }] });
                          }
                          return { ...agent, history: newHistory };
                      }
                      return agent;
                  })
              };
          });
      } finally {
          setIsChatResponding(false);
      }
  }, [activeChatAgentId, crew, aiClient, model, editingMessageIndex, attachmentFile, startListening]);
  
  // Keep a ref to the latest state and functions to use in speech recognition handlers.
  useEffect(() => {
      stateRef.current = {
        isListening,
        handleSendMessage,
      };
  }, [isListening, handleSendMessage]);

  // Setup speech recognition instance and its handlers ONCE.
  useEffect(() => {
      const SpeechRecognitionImpl = (window as unknown as IWindow).SpeechRecognition || (window as unknown as IWindow).webkitSpeechRecognition;
      if (!SpeechRecognitionImpl) {
          console.warn("Speech Recognition API not supported in this browser.");
          return;
      }

      const recognition = new SpeechRecognitionImpl();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognitionRef.current = recognition;

      recognition.onstart = () => {
          setIsListening(true);
          setPermissionError(null);
          setVoiceError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                  final += event.results[i][0].transcript;
              } else {
                  interim += event.results[i][0].transcript;
              }
          }
          setInterimTranscript(interim);
          
          const finalTranscript = final.trim();
          if (finalTranscript) {
              setChatInput(prev => (prev ? prev.trim() + ' ' : '') + finalTranscript);
              setInterimTranscript('');
          }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          if (event.error === 'aborted' || event.error === 'no-speech') {
              return; // Not fatal errors.
          }
          console.error('Speech recognition error:', event.error);
          let errorMessage = `A speech recognition error occurred: ${event.error}`;
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
              errorMessage = "Microphone access was denied. Please allow it in your browser settings and try again.";
              setPermissionError(errorMessage);
          } else {
              setVoiceError(errorMessage);
          }
          setIsListening(false);
      };
      
      recognition.onend = () => {
          // This is the most reliable way to sync state.
          setIsListening(false);
          setInterimTranscript('');
      };

      return () => {
          recognition.abort();
      };
  }, []);
  
  const handleManualRecordToggle = useCallback(() => {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleStartChat = useCallback((agentId: string) => {
    setActiveChatAgentId(agentId);
  }, []);

  const handleCloseChat = useCallback(() => {
    setActiveChatAgentId(null);
    setChatInput('');
    setAttachmentFile(null);
    setEditingMessageIndex(null);
    if (isListening) {
        stopListening();
    }
  }, [isListening, stopListening]);

  const handleEditPrompt = useCallback((messageIndex: number) => {
      if (!activeChatAgentId) return;
      const agent = crew?.agents.find(a => a.id === activeChatAgentId);
      const messageToEdit = agent?.history?.[messageIndex];

      if (messageToEdit && messageToEdit.role === 'user') {
          const textPart = messageToEdit.parts.find(p => 'text' in p);
          setChatInput(textPart ? (textPart as any).text : '');
          setAttachmentFile(null);
          setEditingMessageIndex(messageIndex);
      }
  }, [crew, activeChatAgentId]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        setAttachmentFile(file);
    }
    event.target.value = '';
  };

  const handleClearAttachment = () => {
      setAttachmentFile(null);
  };
  
  const handleDeleteAgent = useCallback((agentId: string) => {
    setCrew(prevCrew => {
        if (!prevCrew) return null;
        const updatedAgents = prevCrew.agents.filter(agent => agent.id !== agentId);
        if (updatedAgents.length === 0) {
            return null;
        }
        return { ...prevCrew, agents: updatedAgents };
    });
  }, []);

  const handleUpdateAgent = useCallback((agentId: string, updatedAgent: Agent) => {
    setCrew(prevCrew => {
        if (!prevCrew) return null;
        const updatedAgents = prevCrew.agents.map((agent) =>
            agent.id === agentId ? updatedAgent : agent
        );
        return { ...prevCrew, agents: updatedAgents };
    });
  }, []);

  const handleAddAgent = useCallback(async (prompt: string) => {
    if (!prompt.trim() || !aiClient) {
        return;
    }
    setIsAddingAgent(true);
    try {
        const newAgentData = await generateSingleAgent(aiClient, model, prompt, crew?.agents ?? []);
        const newAgentWithId: Agent = { ...newAgentData, id: self.crypto.randomUUID(), history: [] };
        setCrew(prevCrew => {
            if (!prevCrew) {
                return { agents: [newAgentWithId] };
            }
            return {
                ...prevCrew,
                agents: [...prevCrew.agents, newAgentWithId]
            };
        });
    } catch (e) {
        console.error(e);
        throw e;
    } finally {
        setIsAddingAgent(false);
    }
  }, [crew, aiClient, model]);

  const handleGenerateAvatar = useCallback(async (agentId: string) => {
    if (!aiClient) return;

    const agent = crew?.agents.find(a => a.id === agentId);
    if (!agent) return;
    
    setIsGeneratingAvatarFor(agentId);
    try {
        const avatarUrl = await generateAgentAvatar(aiClient, agent.role, agent.backstory);
        const updatedAgent = { ...agent, avatarUrl };
        handleUpdateAgent(agentId, updatedAgent);
    } catch (e) {
        console.error("Failed to generate agent avatar:", e);
        alert(`Could not generate avatar: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
        setIsGeneratingAvatarFor(null);
    }
  }, [aiClient, crew, handleUpdateAgent]);
  
  const handleExportAgents = useCallback(() => {
    if (!crew || crew.agents.length === 0) return;

    const agentsToExport = {
        agents: crew.agents.map(({ history, ...agent }) => agent),
    };

    const jsonString = JSON.stringify(agentsToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'agents.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [crew]);

  const handleImportAgents = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') {
                throw new Error("File could not be read.");
            }
            const importedData = JSON.parse(text);

            if (!importedData || !Array.isArray(importedData.agents)) {
                throw new Error("Invalid file format. Must have an 'agents' array.");
            }

            const sanitizedAgents: Agent[] = importedData.agents.map((agent: any) => ({
                ...agent,
                id: agent.id || self.crypto.randomUUID(),
                history: [],
            }));

            setCrew({ agents: sanitizedAgents });
        } catch (error) {
            console.error("Failed to import agents:", error);
            alert(`Error importing file: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    };
    reader.onerror = () => {
        alert("Failed to read the file.");
    };
    reader.readAsText(file);
    
    event.target.value = '';
  }, []);

  const handleClearChatHistory = useCallback((agentId: string) => {
    setCrew(prevCrew => {
        if (!prevCrew) return null;
        return {
            ...prevCrew,
            agents: prevCrew.agents.map(agent =>
                agent.id === agentId
                    ? { ...agent, history: [] }
                    : agent
            )
        };
    });
  }, []);

  const activeChatAgent = crew?.agents.find(a => a.id === activeChatAgentId);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header 
        onImport={handleImportAgents}
        onExport={handleExportAgents}
        isCrewEmpty={!crew || crew.agents.length === 0}
        onShowSettings={() => setShowSettings(true)}
      />
      <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center">
        <div className="w-full max-w-4xl">
          <CrewDisplay 
              crew={crew} 
              onDeleteAgent={handleDeleteAgent} 
              onUpdateAgent={handleUpdateAgent}
              onAddAgent={handleAddAgent}
              isAddingAgent={isAddingAgent}
              onStartChat={handleStartChat}
              isConfigured={isConfigured}
              onShowSettings={() => setShowSettings(true)}
              onGenerateAvatar={handleGenerateAvatar}
              isGeneratingAvatarFor={isGeneratingAvatarFor}
          />
        </div>
      </main>
      {showSettings && (
          <SettingsModal onClose={() => setShowSettings(false)} />
      )}
      {activeChatAgent && (
        <ChatModal 
            agent={activeChatAgent} 
            onClose={handleCloseChat}
            onSendMessage={handleSendMessage}
            isResponding={isChatResponding}
            message={chatInput}
            onMessageChange={setChatInput}
            onEditPrompt={handleEditPrompt}
            attachmentFile={attachmentFile}
            onFileChange={handleFileChange}
            onClearAttachment={handleClearAttachment}
            onClearHistory={() => handleClearChatHistory(activeChatAgent.id)}
            onToggleManualRecording={handleManualRecordToggle}
            isListening={isListening}
            interimTranscript={interimTranscript}
            voiceError={voiceError}
            permissionError={permissionError}
            onClearPermissionError={() => setPermissionError(null)}
        />
      )}
      <footer className="text-center p-4 text-xs text-gray-400 dark:text-gray-600">
        <p>Powered by Gemini. Designed for intelligent task automation.</p>
      </footer>
    </div>
  );
}