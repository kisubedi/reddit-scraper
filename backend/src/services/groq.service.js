import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

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
 * Classify a Reddit post using Groq's Llama model
 * @param {string} title - Post title
 * @param {string} content - Post content
 * @returns {Promise<Array>} Array of {category, confidence} objects
 */
export async function classifyPost(title, content) {
  try {
    const text = `${title}\n${content}`.substring(0, 1000);

    const prompt = `You are a category classifier for r/CopilotStudio Reddit posts. Analyze the post and assign it to 1-3 most relevant categories.

**Available Categories:**
${CATEGORIES.join(', ')}

**Post:**
Title: ${title}
Content: ${content.substring(0, 500)}

**Instructions:**
- Assign 1-3 most relevant categories
- Provide confidence score (0.0-1.0) for each
- Only include categories with confidence >= 0.25
- If no specific category fits well, use "General"
- Respond ONLY with valid JSON (no markdown):

{"categories": [{"name": "Category Name", "confidence": 0.85}]}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile', // Fast, free model
      temperature: 0.3,
      max_tokens: 500,
      top_p: 1
    });

    const responseText = completion.choices[0]?.message?.content || '';

    // Parse JSON response
    let parsed;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Failed to parse Groq response:', responseText);
      return [{ name: 'General', confidence: 0.30 }];
    }

    // Validate and filter results
    const classifications = parsed.categories || [];
    const validClassifications = classifications
      .filter(c => CATEGORIES.includes(c.name) && c.confidence >= 0.25)
      .map(c => ({
        name: c.name,
        confidence: Math.min(c.confidence, 0.98)
      }));

    if (validClassifications.length === 0) {
      return [{ name: 'General', confidence: 0.30 }];
    }

    return validClassifications;

  } catch (error) {
    console.error('Groq classification error:', error.message);

    if (error.message?.includes('rate limit')) {
      console.warn('⚠️  Rate limit hit');
      throw new Error('RATE_LIMIT');
    }

    return [{ name: 'General', confidence: 0.30 }];
  }
}

/**
 * Test the Groq service
 */
export async function testGroq() {
  console.log('Testing Groq AI classification...\n');

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
