'use server';
/**
 * @fileOverview A Genkit flow for generating detailed and professional descriptions for quote items or sections.
 * This function takes a user-provided API key to initialize Genkit for a single call.
 *
 * - generateQuoteItemDescription - A function that handles the AI-powered description generation process.
 * - GenerateQuoteItemDescriptionInput - The input type for the generateQuoteItemDescription function.
 * - GenerateQuoteItemDescriptionOutput - The return type for the generateQuoteItemDescription function.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

const GenerateQuoteItemDescriptionInputSchema = z.object({
  conceptKeywords: z
    .string()
    .describe('Keywords or short phrases describing the item or section (e.g., "installation, pipes, fittings, water heater").'),
  industry: z
    .string()
    .describe('The industry the quote is for (e.g., "Plumbing services", "Web design", "Construction").'),
  detailLevel: z
    .enum(['brief', 'standard', 'detailed'])
    .describe('The desired level of detail for the description.'),
  language: z.string().describe('The language for the output description (e.g., "Spanish", "English").'),
  apiKey: z.string().min(1).describe('The user-provided Google Gemini API Key.'),
});
export type GenerateQuoteItemDescriptionInput = z.infer<
  typeof GenerateQuoteItemDescriptionInputSchema
>;

const GenerateQuoteItemDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated professional description for the quote item or section.'),
});
export type GenerateQuoteItemDescriptionOutput = z.infer<
  typeof GenerateQuoteItemDescriptionOutputSchema
>;

export async function generateQuoteItemDescription(
  input: GenerateQuoteItemDescriptionInput
): Promise<GenerateQuoteItemDescriptionOutput> {
  const { apiKey, ...promptData } = input;

  const ai = genkit({
    plugins: [googleAI({ apiKey })],
    model: 'googleai/gemini-2.5-flash',
  });

  const promptTemplate = `You are an expert copywriter specialized in creating professional and concise descriptions for business quotes.

Generate a detailed description for a quote item or section based on the following information.
Ensure the description is professional, clear, and relevant to the specified industry.
The output language must be ${promptData.language}.

Concept Keywords: ${promptData.conceptKeywords}
Industry: ${promptData.industry}
Detail Level: ${promptData.detailLevel}

Craft the description to be suitable for a professional quote. Adjust the length and complexity based on the 'Detail Level'.

For 'brief', provide a short, single-sentence summary.
For 'standard', provide a clear and concise paragraph.
For 'detailed', provide a comprehensive description with multiple sentences, possibly listing key aspects or steps.`;

  const { output } = await ai.generate({
    prompt: promptTemplate,
    output: { schema: GenerateQuoteItemDescriptionOutputSchema },
  });

  if (!output) {
    throw new Error('AI generation failed to produce an output.');
  }

  return output;
}
