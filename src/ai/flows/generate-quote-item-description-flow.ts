'use server';
/**
 * @fileOverview A Genkit flow for generating detailed and professional descriptions for quote items or sections.
 *
 * - generateQuoteItemDescription - A function that handles the AI-powered description generation process.
 * - GenerateQuoteItemDescriptionInput - The input type for the generateQuoteItemDescription function.
 * - GenerateQuoteItemDescriptionOutput - The return type for the generateQuoteItemDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  language: z.string().describe('The language for the output description (e.g., "Spanish", "English").')
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
  return generateQuoteItemDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuoteItemDescriptionPrompt',
  input: {schema: GenerateQuoteItemDescriptionInputSchema},
  output: {schema: GenerateQuoteItemDescriptionOutputSchema},
  prompt: `You are an expert copywriter specialized in creating professional and concise descriptions for business quotes.

Generate a detailed description for a quote item or section based on the following information.
Ensure the description is professional, clear, and relevant to the specified industry.
The output language must be {{{language}}}.

Concept Keywords: {{{conceptKeywords}}}
Industry: {{{industry}}}
Detail Level: {{{detailLevel}}}

Craft the description to be suitable for a professional quote. Adjust the length and complexity based on the 'Detail Level'.

For 'brief', provide a short, single-sentence summary.
For 'standard', provide a clear and concise paragraph.
For 'detailed', provide a comprehensive description with multiple sentences, possibly listing key aspects or steps.`,
});

const generateQuoteItemDescriptionFlow = ai.defineFlow(
  {
    name: 'generateQuoteItemDescriptionFlow',
    inputSchema: GenerateQuoteItemDescriptionInputSchema,
    outputSchema: GenerateQuoteItemDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
