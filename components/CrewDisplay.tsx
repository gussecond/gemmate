
import React from 'react';
import { Agent, Crew } from '../types';
import AgentCard from './AgentCard';
import AddAgent from './AddAgent';
import { BotIcon } from './icons/BotIcon';
import { KeyIcon } from './icons/KeyIcon';

interface CrewDisplayProps {
  crew: Crew | null;
  onDeleteAgent: (id: string) => void;
  onUpdateAgent: (id: string, updatedAgent: Agent) => void;
  onAddAgent: (prompt: string) => Promise<void>;
  isAddingAgent: boolean;
  onStartChat: (id: string) => void;
  isConfigured: boolean;
  onShowSettings: () => void;
  onGenerateAvatar: (id: string) => Promise<void>;
  isGeneratingAvatarFor: string | null;
}


export default function CrewDisplay({ 
    crew, 
    onDeleteAgent, 
    onUpdateAgent, 
    onAddAgent, 
    isAddingAgent, 
    onStartChat, 
    isConfigured, 
    onShowSettings,
    onGenerateAvatar,
    isGeneratingAvatarFor,
}: CrewDisplayProps): React.ReactNode {
  const hasAgents = crew && crew.agents.length > 0;

  if (!isConfigured) {
      return (
          <div className="text-center py-16 px-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-slate-800/20">
              <div className="mx-auto h-16 w-16 text-primary-500">
                  <KeyIcon />
              </div>
              <h3 className="mt-4 text-xl font-bold text-gray-800 dark:text-gray-200">Welcome to GemMate</h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">To get started, please configure your Google Gemini API key.</p>
              <button
                  onClick={onShowSettings}
                  className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                  Go to Settings
              </button>
          </div>
      );
  }

  return (
    <div>
        <div className="mb-8">
            <AddAgent onAdd={onAddAgent} isLoading={isAddingAgent} hasAgents={hasAgents} />
        </div>

        {hasAgents ? (
            <>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">Your AI Mate</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {crew.agents.map((agent) => (
                    <AgentCard 
                        key={agent.id} 
                        agent={agent} 
                        onDelete={onDeleteAgent} 
                        onUpdate={onUpdateAgent} 
                        onStartChat={onStartChat}
                        onGenerateAvatar={onGenerateAvatar}
                        isGeneratingAvatar={isGeneratingAvatarFor === agent.id}
                    />
                ))}
                </div>
            </>
        ) : !isAddingAgent && (
             <div className="text-center py-16 px-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                 <div className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500">
                    <BotIcon />
                 </div>
                 <h3 className="mt-4 text-lg font-semibold text-gray-800 dark:text-gray-200">Build Your AI Mate</h3>
                 <p className="mt-2 text-gray-500 dark:text-gray-400">Your AI Mate is currently empty. Add your first agent to get started.</p>
                 <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">e.g., "A senior research analyst to find market data."</p>
              </div>
        )}
    </div>
  );
}
