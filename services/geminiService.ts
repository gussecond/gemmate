

import { GoogleGenAI, Type } from "@google/genai";
import { Agent } from '../types';

const taskSchema = {
    type: Type.OBJECT,
    properties: {
        name: {
            type: Type.STRING,
            description: "A short, descriptive name for the task. e.g., 'Analyze Competitors'."
        },
        description: {
            type: Type.STRING,
            description: "A detailed description of the task, explaining what needs to be done.",
        },
    },
    required: ["name", "description"]
};

export const agentSchema = {
    type: Type.OBJECT,
    properties: {
        role: {
            type: Type.STRING,
            description: "The specific role of the agent. e.g., 'Senior Research Analyst'.",
        },
        goal: {
            type: Type.STRING,
            description: "The primary objective or goal for this agent.",
        },
        backstory: {
            type: Type.STRING,
            description: "A brief backstory for the agent to provide context and personality.",
        },
        tasks: {
            type: Type.ARRAY,
            description: "A list of tasks assigned to this agent.",
            items: taskSchema
        },
        tools: {
            type: Type.ARRAY,
            description: "A list of tools the agent can use. If the agent's role involves searching for real-time information, news, or recent events, grant it the 'googleSearch' tool. Otherwise, this should be empty.",
            items: {
                type: Type.STRING,
                enum: ['googleSearch']
            }
        }
    },
    required: ["role", "goal", "backstory", "tasks"]
};

export const generateSingleAgent = async (
    aiClient: GoogleGenAI,
    model: string,
    prompt: string,
    existingAgents: Agent[]
): Promise<Omit<Agent, 'id' | 'history'>> => {
     try {
        const response = await aiClient.models.generateContent({
            model: model,
            contents: `You are an expert AI crew designer. Based on the user's request, design a single new AI agent that will complement the existing team. Do not repeat roles that already exist. The generated agent JSON object should not include a 'history' property.

If the agent's role involves searching for real-time information, news, or recent events, grant it the 'googleSearch' tool. Otherwise, do not assign any tools.

Existing Team Members:
${existingAgents.map(a => `- ${a.role}: ${a.goal}`).join('\n')}

User request for new agent: "${prompt}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: agentSchema,
            }
        });

        const jsonText = response.text.trim();
        const agentData = JSON.parse(jsonText);

        if (!agentData || !agentData.role || !agentData.goal) {
             throw new Error("Invalid response structure from AI for the new agent.");
        }

        return agentData as Omit<Agent, 'id' | 'history'>;
    } catch (error) {
        console.error("Error generating single agent:", error);
        if (error instanceof Error && (error.message.includes("API key not valid") || error.message.includes("API_KEY_INVALID"))) {
            throw new Error("Your API Key is not valid. Please check it in Settings.");
        }
        throw new Error("Failed to generate the new AI agent. The model may be unavailable or there was an issue with the request.");
    }
};


export const generateAgentAvatar = async (
    aiClient: GoogleGenAI,
    role: string,
    backstory: string,
): Promise<string> => {
    try {
        const prompt = `Generate a professional and modern digital avatar for an AI assistant.
        - Role: ${role}
        - Backstory: ${backstory}
        - Style: Clean, vector illustration, minimalist, suitable for a professional application profile picture. Avoid realistic photos.
        - Color Palette: Tech-friendly colors, like blues, purples, and grays, with a single accent color.
        - Composition: Head and shoulders shot, centered.`;

        const response = await aiClient.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            },
        });

        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error("Image generation failed to produce an image.");
        }

        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;

    } catch (error) {
        console.error("Error generating agent avatar:", error);
         if (error instanceof Error && (error.message.includes("API key not valid") || error.message.includes("API_KEY_INVALID"))) {
            throw new Error("Your API Key is not valid. Please check it in Settings.");
        }
        throw new Error("Failed to generate the agent avatar. The image model may be unavailable or the prompt was rejected.");
    }
};