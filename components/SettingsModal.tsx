
import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { KeyIcon } from './icons/KeyIcon';
import { XIcon } from './icons/XIcon';
import { LoadingSpinner } from './icons/LoadingSpinner';

interface SettingsModalProps {
    onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps): React.ReactNode {
    const { saveApiKey, apiKey, model, saveModel, availableModels, testApiKey, clearApiKey, isConfigured } = useSettings();
    const [currentApiKey, setCurrentApiKey] = useState(apiKey || '');
    const [currentModel, setCurrentModel] = useState(model);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        saveApiKey(currentApiKey);
        saveModel(currentModel);
        onClose();
    };

    const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentApiKey(e.target.value);
        setTestResult(null); // Clear previous test result on change
    };

    const handleTestKey = async () => {
        setIsTesting(true);
        setTestResult(null);
        const result = await testApiKey(currentApiKey);
        setTestResult(result);
        setIsTesting(false);
    };
    
    const handleClearKey = () => {
        clearApiKey();
        onClose();
    };


    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            aria-modal="true"
            role="dialog"
        >
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    aria-label="Close settings"
                >
                    <XIcon className="h-6 w-6" />
                </button>
                
                <div className="text-center mb-6">
                    <div className="mx-auto h-12 w-12 text-primary-500 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
                        <KeyIcon />
                    </div>
                    <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Settings
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                        Configure your Gemini API Key and select a model.
                    </p>
                </div>
                
                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Gemini API Key
                        </label>
                        <input
                            id="apiKey"
                            type="password"
                            value={currentApiKey}
                            onChange={handleApiKeyChange}
                            placeholder="Enter your Google AI API Key"
                            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-shadow shadow-sm"
                            aria-label="API Key Input"
                        />
                         <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="mt-1.5 text-xs text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                            Get your API Key from Google AI Studio &rarr;
                        </a>
                        {testResult && (
                            <p className={`mt-2 text-sm font-medium ${testResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {testResult.message}
                            </p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            AI Model
                        </label>
                         <select
                            id="model"
                            value={currentModel}
                            onChange={(e) => setCurrentModel(e.target.value)}
                             className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-shadow shadow-sm appearance-none"
                             aria-label="Model Selection"
                        >
                            {availableModels.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">More models will be available in the future.</p>
                    </div>

                    <div className="flex justify-between items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-600 mt-6">
                        <div>
                            {isConfigured && (
                                <button
                                    type="button"
                                    onClick={handleClearKey}
                                    className="px-4 py-2 rounded-lg font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors border border-red-300 dark:border-red-700"
                                >
                                    Clear Key
                                </button>
                            )}
                        </div>
                         <div className="flex items-center gap-3">
                             <button
                                type="button"
                                onClick={handleTestKey}
                                disabled={isTesting || !currentApiKey.trim()}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 disabled:opacity-50 transition-colors border border-primary-300 dark:border-primary-600"
                            >
                                {isTesting ? (
                                    <>
                                        <LoadingSpinner />
                                        <span>Testing...</span>
                                    </>
                                ) : (
                                    'Test'
                                )}
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:bg-primary-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-900 transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}