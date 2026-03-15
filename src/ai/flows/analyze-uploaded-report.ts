
'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing uploaded lab reports.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeUploadedReportInputSchema = z.object({
  reportDataUri: z.string().describe("The lab report as a data URI (Base64)."),
  pastReports: z.array(z.object({
    id: z.string(),
    title: z.string(),
    date: z.string(),
    fileDataUri: z.string().optional(),
  })).optional().describe('Past lab reports for comparison.'),
  language: z.string().optional().describe('Output language.'),
});

export type AnalyzeUploadedReportInput = z.infer<typeof AnalyzeUploadedReportInputSchema>;

const HealthParameterSchema = z.object({
  name: z.string(),
  value: z.string(),
  unit: z.string(),
  change: z.string().describe('Change status: 🟢, 🟡, 🔴'),
  trendGraph: z.string().optional(),
});

const AnalyzeUploadedReportOutputSchema = z.object({
  reportSummary: z.string(),
  documentType: z.string(),
  executiveSummary: z.string(),
  keyFindings: z.array(z.string()),
  importantData: z.array(z.string()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  insights: z.string(),
  recommendations: z.array(z.string()),
  conclusion: z.string(),
  healthParameters: z.array(HealthParameterSchema),
  extractedMetadata: z.object({
    title: z.string(),
    date: z.string(),
    type: z.string(),
    clinic: z.string(),
  }),
});

export type AnalyzeUploadedReportOutput = z.infer<typeof AnalyzeUploadedReportOutputSchema>;

const analyzeReportPrompt = ai.definePrompt({
  name: 'analyzeReportPrompt',
  input: { schema: AnalyzeUploadedReportInputSchema },
  output: { schema: AnalyzeUploadedReportOutputSchema },
  prompt: `You are Dr. Yuktah, an expert medical diagnostician.
  
  Analyze the following lab report:
  {{media url=reportDataUri}}

  {{#if pastReports}}
  Compare with these past reports:
  {{#each pastReports}}
  - {{this.date}}: {{this.title}} ({{media url=this.fileDataUri}})
  {{/each}}
  {{/if}}

  Output Language: {{#if language}}{{language}}{{else}}English{{/if}}

  Provide a structured JSON analysis including:
  - Document Type
  - Executive Summary
  - Key Findings (bullet points)
  - Health Parameters (name, value, unit, change status)
  - Metadata (Title, Date, Type, Clinic)
    End the analysis with this disclaimer:
    "This AI-generated report is for informational purposes only. Please do not rely on it alone—always consult a qualified doctor for medical advice."
  `,
  config: { temperature: 0.2 },
});

export const analyzeUploadedReport = ai.defineFlow(
  {
    name: 'analyzeUploadedReportFlow',
    inputSchema: AnalyzeUploadedReportInputSchema,
    outputSchema: AnalyzeUploadedReportOutputSchema,
  },
  async (input) => {
    let retries = 2;
    let lastError;

    while (retries >= 0) {
      try {
        const { output } = await analyzeReportPrompt(input);
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

        console.error("❌ AI Flow Error:", e);
        throw new Error(`AI Analysis Failed: ${errorMessage}`);
      }
    }
    throw new Error(`AI Analysis Failed after retries: ${lastError?.message || lastError}`);
  }
);
