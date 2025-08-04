
import React, { useState } from 'react';
import { PlusIcon } from './icons/PlusIcon';
import { LoadingSpinner } from './icons/LoadingSpinner';

interface AddAgentProps {
    onAdd: (prompt: string) => Promise<void>;
    isLoading: boolean;
    hasAgents: boolean;
}

export default function AddAgent({ onAdd, isLoading, hasAgents }: AddAgentProps): React.ReactNode {
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleAddClick = () => {
        setIsFormVisible(true);
    };

    const handleCancel = () => {
        setIsFormVisible(false);
        setPrompt('');
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        setError(null);
        try {
            await onAdd(prompt);
            setIsFormVisible(false);
            setPrompt('');
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred.");
        }
    };

    if (!isFormVisible) {
        return (
            <div className="flex justify-center">
                <button
                    onClick={handleAddClick}
                    className="w-full lg:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-200"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span className="font-semibold">{hasAgents ? 'Add New Agent' : 'Add Your First Agent'}</span>
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50">
            <h3 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-100">Add a New Agent</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Describe the role and goal of the new agent you want to add to the crew.</p>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A financial analyst to track stock performance."
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-shadow resize-none shadow-sm"
                    rows={2}
                    disabled={isLoading}
                />
                 {error && (
                    <div className="mt-3 text-sm text-red-600 dark:text-red-400">
                        <strong>Error:</strong> {error}
                    </div>
                )}
                <div className="mt-3 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || !prompt.trim()}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800 transition-colors"
                    >
                        {isLoading ? (
                            <>
                                <LoadingSpinner />
                                <span>Creating...</span>
                            </>
                        ) : (
                            <>
                                <PlusIcon className="h-5 w-5" />
                                <span>Create Agent</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
