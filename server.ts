import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());

  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // AI Savings Coach endpoint using Gemini Flash
  app.post('/api/savings-coach', async (req, res) => {
    try {
      const { items, monthlyBudget, totalMonthlySpend } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Please provide at least one expense or subscription item.' });
      }

      const prompt = `You are a financial savings coach specializing in personal expenses and subscriptions in India.
Analyze the user's current spending ledger and provide exactly 3 specific, realistic, and actionable recommendations to cut down their monthly spend in INR (₹).

User Context:
- Monthly Target Budget: ₹${monthlyBudget || 25000}
- Current Total Monthly Spend: ₹${Math.round(totalMonthlySpend || 0)}
- Current Expenses and Subscriptions:
${JSON.stringify(items, null, 2)}

Requirements:
1. Provide exactly 3 high-impact, specific tips tailored directly to their logged items.
2. If they have duplicate or overlapping entertainment streaming services (e.g. Netflix, Prime, Disney+ Hotstar, Spotify, YouTube Premium), suggest rotation, annual plan savings, family plan pooling, or telecom bundles (e.g. Jio/Airtel bundled plans).
3. If they have delivery subscriptions (e.g. Swiggy One, Zomato Gold), analyze if both are needed.
4. If they have SaaS/developer subscriptions (e.g. Copilot, ChatGPT Plus), suggest student/annual or usage audits.
5. Provide realistic potential savings in INR (e.g. "Save ~₹649/mo" or "Save ~₹1,200/yr").
6. Keep tone witty, encouraging, and constructive without being condescending.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              coachGreeting: {
                type: Type.STRING,
                description: 'A 1-sentence personalized financial health check or motivational observation based on their budget',
              },
              totalPotentialSavings: {
                type: Type.STRING,
                description: 'Estimated total potential monthly savings amount in INR, e.g. "₹1,450/month"',
              },
              tips: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: {
                      type: Type.STRING,
                      description: 'Short punchy headline for the tip',
                    },
                    potentialSavings: {
                      type: Type.STRING,
                      description: 'Estimated monthly or annual savings formatted in INR',
                    },
                    category: {
                      type: Type.STRING,
                      description: 'Relevant expense category name',
                    },
                    advice: {
                      type: Type.STRING,
                      description: '2-3 sentences explaining exactly what to do and actionable steps',
                    },
                    impact: {
                      type: Type.STRING,
                      enum: ['high', 'medium', 'quick-win'],
                      description: 'Impact level',
                    },
                  },
                  required: ['title', 'potentialSavings', 'category', 'advice', 'impact'],
                },
              },
            },
            required: ['coachGreeting', 'totalPotentialSavings', 'tips'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (error: any) {
      console.error('Gemini Savings Coach Error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate savings coach recommendations' });
    }
  });

  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
