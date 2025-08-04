

export interface Task {
  name: string;
  description: string;
}

export interface Tool {
  name:string;
  description: string;
}

// Represents a text part of a message
export interface TextPart {
  text: string;
}

// Represents a file data part of a message
export interface InlineDataPart {
  inlineData: {
    mimeType: string;
    data: string; // base64 encoded
  };
}

export type Part = TextPart | InlineDataPart;

// UI-specific metadata for a file attachment
export interface Attachment {
    name: string;
    type: string;
    size: number;
}

export interface GroundingChunkWeb {
    uri?: string;
    title?: string;
}

export interface GroundingChunk {
    web: GroundingChunkWeb;
}

export interface Message {
  role: 'user' | 'model';
  parts: Part[];
  attachment?: Attachment; // For displaying in the UI
  groundingChunks?: GroundingChunk[];
}

export interface Agent {
  id: string;
  role:string;
  goal: string;
  backstory: string;
  tasks: Task[];
  tools?: string[];
  history?: Message[];
  avatarUrl?: string;
}

export interface Crew {
  agents: Agent[];
}

export interface AgentCoPilotAction {
    thought: string;
    speak: string;
    action_to_display: string;
}

// ===================================================================
// Web Speech API type definitions for browsers that support it.
// ===================================================================

export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
}

export interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

export interface IWindow extends Window {
  SpeechRecognition: {
    prototype: SpeechRecognition;
    new (): SpeechRecognition;
  };
  webkitSpeechRecognition: {
    prototype: SpeechRecognition;
    new (): SpeechRecognition;
  };
}