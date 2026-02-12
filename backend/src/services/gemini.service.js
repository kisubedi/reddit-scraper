import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Categories for classification
const CATEGORIES = [
  'Knowledge',
  'Triggers',
  'Flows',
  'Actions / Tools',
  'Topics',
  'CUA',
  'Licensing',
  'Quotas / Limits / Entitlements',
  'Evals',
  'GenAI Quality / Reliability / Hallucinations',
  'Data Sources & Grounding',
  'Integrations',
  'Publishing / Channels',
  'Authentication / Authorization / Identity',
  'Governance / Compliance / Admin Controls',
  'Performance / Latency / Timeouts / Throttling',
  'DevEx / ALM / Pro‑dev / Source Control',
  'UI / UX Bugs & Authoring Issues',
  'Templates / Samples / Best Practices',
  'Feature Requests / Ideas',
  'Announcements / Updates / Meta',
  'General'
];

/**
 * Classify a Reddit post into one or more categories using Google Gemini
 * @param {string} title - Post title
 * @param {string} content - Post content
 * @returns {Promise<Array>} Array of {category, confidence} objects
 */
export async function classifyPost(title, content) {
  try {
    // Use gemini-1.0-pro (stable, widely available)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.0-pro'
    });

    // Combine title and content, limit to 1000 chars to save tokens
    const text = `${title}\n${content}`.substring(0, 1000);

    const prompt = `You are a category classifier for r/CopilotStudio Reddit posts. Analyze the following post and assign it to one or more relevant categories.

**Available Categories:**
${CATEGORIES.map((c, i) => `${i + 1}. ${c}`).join('\n')}

**Post to classify:**
Title: ${title}
Content: ${content.substring(0, 500)}

**Instructions:**
- Assign the post to 1-3 most relevant categories
- For each category, provide a confidence score between 0.0 and 1.0
- Only include categories with confidence >= 0.25
- If the post doesn't fit any specific category well, assign it to "General"
- Respond ONLY with valid JSON in this exact format (no markdown, no extra text):

{"categories": [{"name": "Category Name", "confidence": 0.85}, {"name": "Another Category", "confidence": 0.65}]}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Parse JSON response
    let parsed;
    try {
      // Try to extract JSON if wrapped in markdown code blocks
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      // Fallback to General category
      return [{ name: 'General', confidence: 0.30 }];
    }

    // Validate and filter results
    const classifications = parsed.categories || [];
    const validClassifications = classifications
      .filter(c => CATEGORIES.includes(c.name) && c.confidence >= 0.25)
      .map(c => ({
        name: c.name,
        confidence: Math.min(c.confidence, 0.98) // Cap at 0.98
      }));

    // If no valid classifications, return General
    if (validClassifications.length === 0) {
      return [{ name: 'General', confidence: 0.30 }];
    }

    return validClassifications;

  } catch (error) {
    console.error('Gemini classification error:', error.message);

    // Check for rate limit errors
    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      console.warn('⚠️  Rate limit hit, will retry later');
      throw new Error('RATE_LIMIT');
    }

    // Fallback to General category on any error
    return [{ name: 'General', confidence: 0.30 }];
  }
}

/**
 * Test the Gemini service with a sample post
 */
export async function testGemini() {
  console.log('Testing Gemini AI classification...\n');

  const testPost = {
    title: 'How to connect SharePoint knowledge base to Copilot Studio?',
    content: 'I want to add my SharePoint documents as a knowledge source in Copilot Studio. Has anyone done this before? What are the steps?'
  };

  console.log('Test Post:');
  console.log(`Title: ${testPost.title}`);
  console.log(`Content: ${testPost.content}\n`);

  const results = await classifyPost(testPost.title, testPost.content);

  console.log('AI Classification Results:');
  results.forEach(r => {
    console.log(`  - ${r.name}: ${(r.confidence * 100).toFixed(0)}%`);
  });

  return results;
}
