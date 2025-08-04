
import React, { useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { BotIcon } from './icons/BotIcon';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { SettingsIcon } from './icons/SettingsIcon';

interface HeaderProps {
    onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onExport: () => void;
    isCrewEmpty: boolean;
    onShowSettings: () => void;
}

export default function Header({ onImport, onExport, isCrewEmpty, onShowSettings }: HeaderProps): React.ReactNode {
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-lg sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="h-8 w-8 text-primary-500">
                <BotIcon />
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                GemMate
            </h1>
        </div>
        <div className="flex items-center gap-2">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={onImport}
            />
            <button
                onClick={handleImportClick}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-gray-50 dark:focus:ring-offset-slate-900 transition-colors"
                aria-label="Import Agents"
                title="Import Agents from JSON"
            >
                <UploadIcon className="h-5 w-5" />
            </button>
            <button
                onClick={onExport}
                disabled={isCrewEmpty}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-gray-50 dark:focus:ring-offset-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Export Agents"
                title="Export Agents to JSON"
            >
                <DownloadIcon className="h-5 w-5" />
            </button>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
            <button
                onClick={onShowSettings}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-gray-50 dark:focus:ring-offset-slate-900 transition-colors"
                aria-label="Open settings"
                title="Settings"
            >
                <SettingsIcon className="h-5 w-5" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-gray-50 dark:focus:ring-offset-slate-900 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
        </div>
      </div>
    </header>
  );
}
