
import React from 'react';

export const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m12 3-1.9 3.8-3.8 1.9 3.8 1.9L12 14.4l1.9-3.8 3.8-1.9-3.8-1.9L12 3z" />
    <path d="M5 21v-2" />
    <path d="M5 13v-2" />
    <path d="M19 21v-2" />
    <path d="M19 13v-2" />
    <path d="M21 5h-2" />
    <path d="M13 5h-2" />
    <path d="M21 19h-2" />
    <path d="M13 19h-2" />
  </svg>
);
