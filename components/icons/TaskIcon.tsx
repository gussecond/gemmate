
import React from 'react';

export const TaskIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        {...props}
    >
        <rect width="8" height="8" x="2" y="2" rx="2" />
        <path d="M8 12h8" />
        <path d="M8 18h8" />
        <path d="M16 12h.01" />
        <path d="M16 18h.01" />
        <path d="M12 2v8" />
    </svg>
);
