import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Load env from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Firecrawl Scraping ────────────────────────────────────────────────────────
async function scrapeUrl(url, retries = 2) {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['markdown'],
        }),
      });

      const data = await response.json();

      if (!data.success) {
        console.error(`Firecrawl error for ${url}:`, data);
        return { url, error: data.error || 'Failed to scrape', content: null };
      }

      return {
        url,
        content: data.data?.markdown?.substring(0, 8000) || '',
        metadata: data.data?.metadata || {},
        error: null,
      };
    } catch (err) {
      if (attempt <= retries) {
        console.log(`Scrape attempt ${attempt} failed for ${url} (${err.message}). Retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1500)); // wait 1.5s before retry
      } else {
        console.error(`Scrape error for ${url} after ${attempt} attempts:`, err.message);
        return { url, error: err.message, content: null };
      }
    }
  }
}

// ─── OpenAI Analysis ───────────────────────────────────────────────────────────
async function analyzeCompetitors(businessName, industry, scrapedData) {
  const competitorSummaries = scrapedData
    .filter((d) => d.content)
    .map((d, i) => `--- Competitor ${i + 1}: ${d.url} ---\n${d.content}`)
    .join('\n\n');

  if (!competitorSummaries) {
    throw new Error('No competitor data could be scraped successfully.');
  }

  const systemPrompt = `You are a world-class competitive intelligence analyst. Analyze the scraped website content of competitors and provide actionable business intelligence. Return your analysis as valid JSON only, with no markdown formatting or code blocks.`;

  const userPrompt = `
Business: "${businessName}"
Industry: "${industry}"

Here is the scraped content from their competitors' websites:

${competitorSummaries}

Analyze these competitors and return a JSON object with this exact structure:
{
  "executiveSummary": "A 2-3 sentence overview of the competitive landscape",
  "competitors": [
    {
      "url": "the competitor URL",
      "name": "Detected company name",
      "overview": "Brief description of what they do",
      "strengths": ["strength1", "strength2", "strength3"],
      "weaknesses": ["weakness1", "weakness2"],
      "products": ["product/service 1", "product/service 2"],
      "pricingStrategy": "Description of visible pricing approach",
      "contentStrategy": "How they use content/SEO",
      "technology": ["tech1", "tech2"],
      "socialProof": "Testimonials, case studies, trust signals"
    }
  ],
  "marketGaps": [
    {
      "gap": "Description of the gap",
      "opportunity": "How to exploit it",
      "priority": "high|medium|low"
    }
  ],
  "opportunities": [
    {
      "title": "Opportunity title",
      "description": "Detailed description",
      "actionItems": ["action1", "action2"]
    }
  ],
  "recommendations": [
    {
      "category": "Category name",
      "recommendation": "What to do",
      "impact": "high|medium|low"
    }
  ]
}

Be specific, actionable, and data-driven. Focus on real insights from the scraped content.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 4000,
  });

  const raw = response.choices[0].message.content.trim();

  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  try {
    return JSON.parse(cleaned);
  } catch {
    console.error('Failed to parse AI response:', raw);
    return { executiveSummary: raw, competitors: [], marketGaps: [], opportunities: [], recommendations: [] };
  }
}

// ─── API Routes ────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Analyze competitors
app.post('/api/analyze', async (req, res) => {
  try {
    const { businessName, industry, competitorUrls } = req.body;

    if (!businessName || !industry || !competitorUrls?.length) {
      return res.status(400).json({ error: 'Missing required fields: businessName, industry, competitorUrls' });
    }

    if (competitorUrls.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 competitor URLs allowed' });
    }

    console.log(`\n🔍 Analyzing ${competitorUrls.length} competitors for "${businessName}" in "${industry}"...`);

    // Step 1: Scrape all URLs in parallel
    console.log('📡 Scraping competitor websites...');
    const scrapedData = await Promise.all(competitorUrls.map(scrapeUrl));

    const successCount = scrapedData.filter((d) => d.content).length;
    console.log(`✅ Successfully scraped ${successCount}/${competitorUrls.length} websites`);

    if (successCount === 0) {
      return res.status(422).json({
        error: 'Could not scrape any of the provided URLs. Please check the URLs and try again.',
        scrapedData,
      });
    }

    // Step 2: AI Analysis
    console.log('🤖 Running AI competitive analysis...');
    const analysis = await analyzeCompetitors(businessName, industry, scrapedData);

    console.log('✨ Analysis complete!');

    res.json({
      success: true,
      scrapedData,
      analysis,
      summary: analysis.executiveSummary || 'Analysis complete',
    });
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 ScoutAI Backend running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
