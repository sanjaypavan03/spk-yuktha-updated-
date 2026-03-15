
import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-uploaded-report.ts';
import '@/ai/flows/generate-report-summary.ts';
import '@/ai/flows/extract-medications-flow.ts';
