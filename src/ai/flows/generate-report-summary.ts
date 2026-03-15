
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a summary of health report changes.
 *
 * - generateReportSummary - A function that takes current and previous report data and returns a summary of the changes.
 * - ReportSummaryInput - The input type for the generateReportSummary function.
 * - ReportSummaryOutput - The return type for the generateReportSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ReportDataSchema = z.object({
  parameter: z.string().describe('The name of the health parameter (e.g., Cholesterol, Blood Sugar).'),
  currentValue: z.number().describe('The current value of the health parameter.'),
  previousValue: z.number().describe('The previous value of the health parameter.'),
  unit: z.string().describe('The unit of measurement for the health parameter (e.g., mg/dL, mmol/L).'),
});

export type ReportData = z.infer<typeof ReportDataSchema>;

const ReportSummaryInputSchema = z.object({
  reportName: z.string().describe('The name of the lab report.'),
  currentReportDate: z.string().describe('The date of the current lab report.'),
  previousReportDate: z.string().describe('The date of the previous lab report.'),
  reportData: z.array(ReportDataSchema).describe('An array of health parameter data from the current and previous reports.'),
});
export type ReportSummaryInput = z.infer<typeof ReportSummaryInputSchema>;

const ReportSummaryOutputSchema = z.object({
  summary: z.string().describe('A summary of the changes in the health parameters, including percentage changes and color-coded indicators.'),
});
export type ReportSummaryOutput = z.infer<typeof ReportSummaryOutputSchema>;

export async function generateReportSummary(input: ReportSummaryInput): Promise<ReportSummaryOutput> {
  return generateReportSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateReportSummaryPrompt',
  input: { schema: ReportSummaryInputSchema },
  output: { schema: ReportSummaryOutputSchema },
  prompt: `You are a health report summarization expert. You will analyze the provided lab report data and generate an easy-to-read summary of the changes in health parameters between the current and previous reports. The summary should include the percentage change, a color-coded indicator (🟢 Stable, 🟡 Caution, 🔴 Alert), and be concise. Use the report name and dates to create the summary.

Report Name: {{{reportName}}}
Current Report Date: {{{currentReportDate}}}
Previous Report Date: {{{previousReportDate}}}

Report Data:
{{#each reportData}}
- Parameter: {{parameter}}, Current Value: {{currentValue}} {{unit}}, Previous Value: {{previousValue}} {{unit}}
{{/each}}

Summary:
`,
});

const generateReportSummaryFlow = ai.defineFlow(
  {
    name: 'generateReportSummaryFlow',
    inputSchema: ReportSummaryInputSchema,
    outputSchema: ReportSummaryOutputSchema,
  },
  async (input) => {
    let retries = 2;
    let lastError;

    while (retries >= 0) {
      try {
        const { output } = await prompt(input);
        return output!;
      } catch (e: any) {
        lastError = e;
        const errorMessage = String(e.message || e);

        // If it's a 503 (Service Unavailable) or 429 (Rate Limit), retry after a delay
        if ((errorMessage.includes('503') || errorMessage.includes('429')) && retries > 0) {
          console.warn(`⚠️ AI Service busy or unavailable. Retrying in 2s... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          retries--;
          continue;
        }

        console.error("❌ Report Summary Flow Error:", e);
        throw new Error(`Report Summary Generation Failed: ${errorMessage}`);
      }
    }
    throw new Error(`Report Summary Generation Failed after retries: ${lastError?.message || lastError}`);
  }
);
