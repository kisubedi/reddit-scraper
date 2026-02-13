import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Hierarchical categories for classification (subcategories only - these are what posts get assigned to)
const SUBCATEGORIES = [
  // Agent Development
  'Agent Architecture',
  'Agent Deployment',
  'Agent Management',

  // Knowledge Management
  'Knowledge Source Integration',
  'Knowledge Retrieval',
  'Knowledge Formatting',

  // Integration and Connectivity
  'Microsoft Teams Integration',
  'Power Automate and Power Apps',
  'Dataverse and SharePoint Connectivity',

  // Troubleshooting and Debugging
  'Agent Errors and Issues',
  'Debugging Techniques',
  'Error Messaging and Logging',

  // Best Practices and Optimization
  'Agent Performance Optimization',
  'Security and Governance',
  'User Experience and Adoption',

  // Technical Capabilities and Features
  'AI and Machine Learning',
  'Natural Language Processing',
  'Adaptive Cards and UI',

  // Community and Support
  'Community Forums and Discussions',
  'Microsoft Support and Resources',
  'User-Generated Content and Sharing',

  // Planning and Strategy
  'Solution Design and Planning',
  'Change Management and Adoption',
  'ROI and Value Measurement',

  // Education and Training
  'Official Microsoft Training',
  'Community-Generated Content and Tutorials',
  'Best Practices for Learning and Development',

  // Release and Updates
  'Release Notes and Updates',
  'New Feature Requests and Feedback',
  'Upgrade and Migration Strategies'
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

    const prompt = `You are a category classifier for r/CopilotStudio Reddit posts. Analyze the post and assign it to 1-3 most relevant SUBCATEGORIES (be specific, not generic).

**Available Subcategories:**
${SUBCATEGORIES.join(', ')}

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
      .filter(c => SUBCATEGORIES.includes(c.name) && c.confidence >= 0.25)
      .map(c => ({
        name: c.name,
        confidence: Math.min(c.confidence, 0.98)
      }));

    if (validClassifications.length === 0) {
      return [{ name: 'Community Forums and Discussions', confidence: 0.30 }]; // Fallback to most generic subcategory
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

// Product Areas for high-level classification (19 areas)
const PRODUCT_AREAS = [
  'Knowledge & Retrieval',
  'Actions & Tools',
  'Triggers & Autonomous Agents',
  'Channels',
  'Testing & Evaluation',
  'Models & Orchestration',
  'Code Interpreter / Execution',
  'Data & Connections',
  'Dialog / Topic Authoring',
  'Agent Flows (Workflow Engine)',
  'Admin, Security & Governance',
  'Publishing & Lifecycle',
  'Analytics & Monitoring',
  'Developer & Extensibility',
  'Voice & Multimodal',
  'UX / UI / Interaction',
  'Compliance & Risk',
  'Lifecycle / Operations',
  'Multi-persona / Multi-identity'
];

/**
 * Classify a Reddit post into product areas (max 2)
 * @param {string} title - Post title
 * @param {string} content - Post content
 * @returns {Promise<Array>} Array of {area, confidence} objects (max 2)
 */
export async function classifyProductArea(title, content) {
  try {
    const text = `${title}\n${content}`.substring(0, 1000);

    const prompt = `You are analyzing r/CopilotStudio posts to classify them into product areas. Assign the post to 1-2 most relevant product areas (prefer 1, use 2 only if truly spans multiple areas).

**Available Product Areas:**
${PRODUCT_AREAS.join(', ')}

**Product Area Descriptions:**
1. Knowledge & Retrieval - Knowledge sources, file upload, grounding, SharePoint, RAG, retrieval
2. Actions & Tools - Connectors, Power Automate, HTTP/REST, MCP, AI actions, integrations
3. Triggers & Autonomous Agents - Event triggers, webhooks, autonomous orchestration
4. Channels - Teams, M365 Copilot, Web Chat, Direct Line, mobile, embedding
5. Testing & Evaluation - Test pane, transcripts, automated testing, quality checks
6. Models & Orchestration - LLM selection, prompt templates, planning, orchestration
7. Code Interpreter / Execution - Python execution, sandboxed computing, file handling
8. Data & Connections - Connection management, OAuth, authentication, identity
9. Dialog / Topic Authoring - Topic builder, nodes, routing, slot filling
10. Agent Flows (Workflow Engine) - Flow designer, variables, long-running operations
11. Admin, Security & Governance - Roles, DLP, data residency, ALM, permissions
12. Publishing & Lifecycle - Publishing to channels, versions, rollback, packaging
13. Analytics & Monitoring - Usage analytics, metrics, error tracing, performance
14. Developer & Extensibility - SDK, Bot Framework, APIs, Git integration
15. Voice & Multimodal - Voice/IVR, speech-to-text, audio, multimodal input
16. UX / UI / Interaction - Conversation design, Adaptive Cards, UI responses
17. Compliance & Risk - Responsible AI, safety filters, PII handling
18. Lifecycle / Operations - Runtime, scaling, quotas, cost estimation
19. Multi-persona / Multi-identity - C1/C2 roles, user-auth vs maker-auth

**Post:**
Title: ${title}
Content: ${content.substring(0, 500)}

**Instructions:**
- Assign to 1-2 most relevant product areas (PREFER 1)
- Confidence score 0.0-1.0 for each
- Only include areas with confidence >= 0.30
- Respond ONLY with valid JSON (no markdown):

{"areas": [{"name": "Product Area Name", "confidence": 0.85}]}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2, // Lower temperature for more focused classification
      max_tokens: 300,
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
      console.error('Failed to parse product area response:', responseText);
      return [];
    }

    // Validate and filter results (max 2)
    const classifications = parsed.areas || [];
    const validClassifications = classifications
      .filter(c => PRODUCT_AREAS.includes(c.name) && c.confidence >= 0.30)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 2) // Max 2 product areas
      .map(c => ({
        name: c.name,
        confidence: Math.min(c.confidence, 0.98)
      }));

    return validClassifications;

  } catch (error) {
    console.error('Groq product area classification error:', error.message);

    if (error.message?.includes('rate limit')) {
      throw new Error('RATE_LIMIT');
    }

    return [];
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
