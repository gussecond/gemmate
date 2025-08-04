

import React, { useState } from 'react';
import { Agent, Task } from '../types';
import TaskCard from './TaskCard';
import { BotIcon } from './icons/BotIcon';
import { TaskIcon } from './icons/TaskIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PencilIcon } from './icons/PencilIcon';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { PlusIcon } from './icons/PlusIcon';
import { SearchIcon } from './icons/SearchIcon';


interface AgentCardProps {
  agent: Agent;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updatedAgent: Agent) => void;
  onStartChat: (id: string) => void;
  onGenerateAvatar: (id: string) => void;
  isGeneratingAvatar: boolean;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onDelete, onUpdate, onStartChat, onGenerateAvatar, isGeneratingAvatar }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAgent, setEditedAgent] = useState<Agent>(agent);

  const handleEdit = () => {
    setEditedAgent(agent); // Reset changes if user edits again
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    onUpdate(agent.id, editedAgent);
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedAgent(prev => ({ ...prev, [name]: value }));
  };

  const handleTaskChange = (index: number, field: 'name' | 'description', value: string) => {
    setEditedAgent(prev => {
        const newTasks = [...(prev.tasks || [])];
        const taskToUpdate = { ...newTasks[index], [field]: value };
        newTasks[index] = taskToUpdate;
        return { ...prev, tasks: newTasks };
    });
  };

  const handleAddTask = () => {
      setEditedAgent(prev => ({
          ...prev,
          tasks: [...(prev.tasks || []), { name: '', description: '' }]
      }));
  };

  const handleDeleteTask = (index: number) => {
      setEditedAgent(prev => ({
          ...prev,
          tasks: prev.tasks.filter((_, i) => i !== index)
      }));
  };
  
  const handleToolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { checked } = e.target;
      setEditedAgent(prev => {
          const currentTools = prev.tools || [];
          if (checked) {
              // Add 'googleSearch' if not already present
              return { ...prev, tools: [...new Set([...currentTools, 'googleSearch'])] };
          } else {
              // Remove 'googleSearch'
              return { ...prev, tools: currentTools.filter(t => t !== 'googleSearch') };
          }
      });
  };

  const commonInputStyles = "w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-primary-500 focus:outline-none";

  const AgentAvatar = () => (
    <div className="relative group flex-shrink-0">
        <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 overflow-hidden border-2 border-white dark:border-slate-700">
            {agent.avatarUrl ? (
                <img src={agent.avatarUrl} alt={`${agent.role} avatar`} className="w-full h-full object-cover" />
            ) : (
                <BotIcon className="h-8 w-8"/>
            )}
        </div>
        {!isGeneratingAvatar && (
            <button
                onClick={() => onGenerateAvatar(agent.id)}
                title="Generate Avatar"
                aria-label="Generate Avatar"
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={isEditing}
            >
                <SparklesIcon />
            </button>
        )}
        {isGeneratingAvatar && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white">
                <LoadingSpinner />
            </div>
        )}
    </div>
  );

  return (
    <div className="relative bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700/50 transition-all hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-700">
      
      <div className="absolute top-3 right-3 flex items-center gap-1">
        {isEditing ? (
            <>
                <button onClick={handleSave} className="p-1.5 rounded-full text-gray-400 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/50 dark:hover:text-green-400 transition-colors" aria-label="Save changes" title="Save">
                    <CheckIcon className="h-5 w-5" />
                </button>
                <button onClick={handleCancel} className="p-1.5 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 transition-colors" aria-label="Cancel editing" title="Cancel">
                    <XIcon className="h-5 w-5" />
                </button>
            </>
        ) : (
            <>
                <button onClick={() => onStartChat(agent.id)} className="p-1.5 rounded-full text-gray-400 hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/50 dark:hover:text-purple-400 transition-colors" aria-label="Chat with agent" title="Chat">
                    <ChatBubbleIcon className="h-5 w-5" />
                </button>
                <button onClick={handleEdit} className="p-1.5 rounded-full text-gray-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/50 dark:hover:text-blue-400 transition-colors" aria-label="Edit agent" title="Edit">
                    <PencilIcon className="h-5 w-5" />
                </button>
                <button onClick={() => onDelete(agent.id)} className="p-1.5 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 transition-colors" aria-label="Delete agent" title="Delete">
                    <TrashIcon className="h-5 w-5" />
                </button>
            </>
        )}
      </div>

      <div className="flex items-start gap-4">
        <AgentAvatar />
        <div className="w-full pt-1">
            {isEditing ? (
              <div className="space-y-2">
                <input type="text" name="role" value={editedAgent.role} onChange={handleChange} className={`${commonInputStyles} text-xl font-bold`} placeholder="Agent Role"/>
                <textarea name="goal" value={editedAgent.goal} onChange={handleChange} className={`${commonInputStyles} text-sm font-medium`} placeholder="Agent Goal" rows={2}/>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white pr-24">{agent.role}</h3>
                <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">{agent.goal}</p>
              </div>
            )}
        </div>
      </div>
      
      <div className="mt-4">
        {isEditing ? (
            <textarea name="backstory" value={editedAgent.backstory} onChange={handleChange} className={`${commonInputStyles} text-sm italic`} placeholder="Agent Backstory" rows={3}/>
        ) : (
           <p className="text-gray-600 dark:text-gray-300 text-sm italic border-l-4 border-gray-200 dark:border-gray-600 pl-4">
            {agent.backstory}
          </p>
        )}
      </div>
       
      <div className="mt-4">
          {isEditing ? (
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900/70 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <input
                        type="checkbox"
                        id={`google-search-${agent.id}`}
                        checked={editedAgent.tools?.includes('googleSearch') ?? false}
                        onChange={handleToolChange}
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 bg-white dark:bg-slate-800"
                    />
                    <div className="flex-grow">
                         <label htmlFor={`google-search-${agent.id}`} className="text-sm font-medium text-gray-800 dark:text-gray-200 block">
                            Enable Google Search
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Allows agent to search for real-time information.</p>
                    </div>
                </div>
          ) : agent.tools?.includes('googleSearch') && (
            <div className="mt-2 flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full w-fit">
                <SearchIcon className="h-3.5 w-3.5" />
                <span>Google Search Enabled</span>
            </div>
          )}
      </div>

      <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="flex items-center gap-2 text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">
            <TaskIcon className="h-5 w-5"/>
            Tasks
        </h4>
        {isEditing ? (
            <div className="space-y-4">
                {editedAgent.tasks?.map((task, index) => (
                    <div key={index} className="relative bg-gray-50 dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <button 
                            onClick={() => handleDeleteTask(index)} 
                            className="absolute top-2 right-2 p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:text-gray-500" 
                            aria-label="Delete task"
                            title="Delete Task"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={task.name}
                                onChange={(e) => handleTaskChange(index, 'name', e.target.value)}
                                placeholder="Task Name"
                                className={`${commonInputStyles} font-semibold`}
                            />
                            <textarea
                                value={task.description}
                                onChange={(e) => handleTaskChange(index, 'description', e.target.value)}
                                placeholder="Task Description"
                                className={`${commonInputStyles} text-sm`}
                                rows={2}
                            />
                        </div>
                    </div>
                ))}
                <button
                    onClick={handleAddTask}
                    className="w-full flex items-center justify-center gap-2 mt-3 px-4 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
                >
                    <PlusIcon className="h-4 w-4" />
                    Add Task
                </button>
            </div>
        ) : (
            <div className="space-y-3">
                {agent.tasks && agent.tasks.length > 0 ? (
                    agent.tasks.map((task, taskIndex) => <TaskCard key={taskIndex} task={task} />)
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No tasks assigned to this agent.</p>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default AgentCard;