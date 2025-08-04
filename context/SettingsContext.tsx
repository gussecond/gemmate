
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { GoogleGenAI } from "@google/genai";

const AVAILABLE_MODELS = ['gemini-2.5-flash'];

interface SettingsContextType {
  apiKey: string | null;
  saveApiKey: (key: string) => void;
  clearApiKey: () => void;
  model: string;
  saveModel: (model: string) => void;
  availableModels: string[];
  aiClient: GoogleGenAI | null;
  isConfigured: boolean;
  testApiKey: (key: string) => Promise<{ success: boolean; message: string }>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const API_KEY_STORAGE = 'google-ai-api-key';
const MODEL_STORAGE = 'google-ai-model';

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [model, setModel] = useState<string>(AVAILABLE_MODELS[0]);
  const [aiClient, setAiClient] = useState<GoogleGenAI | null>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem(API_KEY_STORAGE);
    // We only initialize a client if a valid, non-empty key is stored.
    // This is the single point of initialization on page load and guarantees
    // we don't use environment variables.
    if (storedKey && storedKey.trim()) {
      const key = storedKey.trim();
      setApiKey(key);
      try {
        setAiClient(new GoogleGenAI({ apiKey: key }));
      } catch (e) {
        console.error("Failed to initialize GoogleGenAI client from storage:", e);
        // If the stored key is bad, clear it out.
        localStorage.removeItem(API_KEY_STORAGE);
        setApiKey(null);
        setAiClient(null);
      }
    }
    
    const storedModel = localStorage.getItem(MODEL_STORAGE);
    if (storedModel && AVAILABLE_MODELS.includes(storedModel)) {
      setModel(storedModel);
    }
  }, []);

  const saveApiKey = (key: string) => {
    // This function ensures the API client is ONLY managed by user-provided keys.
    const trimmedKey = key ? key.trim() : '';
    if (trimmedKey) {
      localStorage.setItem(API_KEY_STORAGE, trimmedKey);
      setApiKey(trimmedKey);
      try {
        // Initialize the client ONLY if a key is provided. This prevents the SDK
        // from defaulting to an environment variable.
        setAiClient(new GoogleGenAI({ apiKey: trimmedKey }));
      } catch(e) {
          console.error("Failed to initialize GoogleGenAI client with new key:", e);
          setAiClient(null);
      }
    } else {
        // If the key is empty or null, clear everything.
        clearApiKey();
    }
  };
  
  const clearApiKey = () => {
      localStorage.removeItem(API_KEY_STORAGE);
      setApiKey(null);
      setAiClient(null);
  };
  
  const saveModel = (newModel: string) => {
      if (AVAILABLE_MODELS.includes(newModel)) {
          localStorage.setItem(MODEL_STORAGE, newModel);
          setModel(newModel);
      }
  };

  const testApiKey = async (key: string): Promise<{ success: boolean; message: string }> => {
    const trimmedKey = key.trim();
    if (!trimmedKey) {
      return { success: false, message: 'API Key cannot be empty.' };
    }

    try {
      const testClient = new GoogleGenAI({ apiKey: trimmedKey });
      // Use a simple, low-cost call to verify the key is functional.
      const response = await testClient.models.generateContent({
        model: model, // Use the currently selected model for the test
        contents: 'hello',
      });

      // An invalid key can sometimes result in a successful API call that returns an empty response.
      // We must explicitly check for this. A valid call with "hello" should always produce text.
      if (!response.text) {
        return { success: false, message: 'Validation failed. The API Key is likely invalid or the model did not respond.' };
      }

      return { success: true, message: 'Success! Your API Key is valid.' };
    } catch (e) {
      console.error("API Key validation failed:", e);
      if (e instanceof Error && (e.message.includes("API key not valid") || e.message.includes("API_KEY_INVALID"))) {
        return { success: false, message: 'This API Key is not valid.' };
      }
      return { success: false, message: 'An unexpected error occurred during validation.' };
    }
  };

  const isConfigured = !!apiKey && !!aiClient;

  return (
    <SettingsContext.Provider value={{ apiKey, saveApiKey, clearApiKey, model, saveModel, availableModels: AVAILABLE_MODELS, aiClient, isConfigured, testApiKey }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
