import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
    try {
        console.log('🧪 Vault Analyze Request received');
        const authUser = await getAuthenticatedUser(request);
        if (!authUser || authUser.role !== 'user') {
            console.log('❌ Vault Analyze: Unauthorized');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { rawText } = body;
        console.log('🧪 Vault Analyze: rawText length:', rawText?.length);

        if (!rawText) {
            return NextResponse.json({ error: 'Raw text is required' }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('❌ Vault Analyze: API Key missing');
            return NextResponse.json({ error: 'AI Service configuration error' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
You are a medical AI assistant. Extract the following from the raw lab report text below.
Format your response as a STRICT JSON object (no markdown tags, just pure JSON).
The JSON object must have three fields:
1. "reportTitle": A concise, clear title for the report (e.g., "Complete Blood Count", "MRI Scan").
2. "category": Must be exactly one of: "blood", "imaging", "prescription", or "other".
3. "analysisText": A simplified, patient-friendly summary of the report in 2-3 sentences. Do not provide medical advice.

Raw Text:
${rawText}
`;

        console.log('🧪 Vault Analyze: Starting Gemini Generation...');
        const result = await model.generateContent(prompt);
        const aiText = result.response.text();
        console.log('🧪 Vault Analyze: AI raw response:', aiText);

        // Try to parse the text as JSON
        let parsedData;
        try {
            // Strip potential markdown code blocks if the model ignores the instruction
            const cleanText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
            parsedData = JSON.parse(cleanText);
        } catch (e) {
            console.error('Failed to parse AI output as JSON:', aiText);
            return NextResponse.json({ error: 'Failed to process report structure correctly.' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            extracted: {
                reportTitle: parsedData.reportTitle,
                category: parsedData.category,
                analysisText: parsedData.analysisText,
                rawData: rawText
            }
        });

    } catch (error) {
        console.error('Vault Analyze Error:', error);
        return NextResponse.json({ error: 'Failed to analyze report' }, { status: 500 });
    }
}
