
import React from 'react';
import { Tool } from '../types';
import { WrenchIcon } from './icons/WrenchIcon';

interface ToolChipProps {
  tool: Tool;
}

export default function ToolChip({ tool }: ToolChipProps): React.ReactNode {
  return (
    <div 
        className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full"
        title={tool.description}
    >
      <WrenchIcon className="h-3 w-3" />
      <span>{tool.name}</span>
    </div>
  );
}
