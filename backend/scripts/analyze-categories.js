import dotenv from 'dotenv';
import { supabase } from '../src/config/database.js';
import Groq from 'groq-sdk';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function analyzeCategories() {
  console.log('='.repeat(60));
  console.log('AI-Driven Category Discovery');
  console.log('Analyzing 451 posts to find optimal categories');
  console.log('='.repeat(60));

  try {
    // Fetch all posts
    console.log('\n[1/3] Fetching posts from database...');
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, title, content')
      .order('created_at', { ascending: false })
      .limit(100); // Sample 100 posts for analysis

    if (error) throw error;
    console.log(`Analyzing ${posts.length} posts\n`);

    // Create a summary of all post titles and topics
    const postSummaries = posts
      .map((p, i) => `${i + 1}. ${p.title}`)
      .join('\n');

    console.log('[2/3] Analyzing with AI to discover patterns...\n');

    const prompt = `You are a data analyst examining posts from r/CopilotStudio (Microsoft's AI chatbot builder platform).

Analyze these 100 post titles and identify the optimal category structure:

${postSummaries}

Based on these posts, recommend:
1. **Top-level categories** (8-12 broad themes)
2. **Subcategories** under each (3-6 specific topics per parent)

Consider:
- What topics appear most frequently?
- What natural groupings exist?
- What technical areas are covered?
- What user pain points emerge?

Respond with a structured JSON hierarchy:

{
  "categories": [
    {
      "name": "Parent Category Name",
      "description": "Brief description",
      "subcategories": [
        {"name": "Specific Topic", "description": "What it covers"},
        {"name": "Another Topic", "description": "What it covers"}
      ]
    }
  ],
  "reasoning": "Why this structure works for r/CopilotStudio"
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 3000
    });

    const responseText = completion.choices[0]?.message?.content || '';

    // Extract JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to parse AI response');
      console.log(responseText);
      return;
    }

    const analysis = JSON.parse(jsonMatch[0]);

    console.log('[3/3] AI Analysis Complete!\n');
    console.log('='.repeat(60));
    console.log('RECOMMENDED CATEGORY STRUCTURE');
    console.log('='.repeat(60));

    // Display results
    let totalSubcategories = 0;
    analysis.categories.forEach((cat, i) => {
      console.log(`\n${i + 1}. ${cat.name}`);
      console.log(`   ${cat.description}`);
      console.log(`   Subcategories (${cat.subcategories.length}):`);
      cat.subcategories.forEach((sub, j) => {
        console.log(`     ${i + 1}.${j + 1} ${sub.name} - ${sub.description}`);
        totalSubcategories++;
      });
    });

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Top-level categories: ${analysis.categories.length}`);
    console.log(`Total subcategories: ${totalSubcategories}`);
    console.log(`\nReasoning:\n${analysis.reasoning}`);
    console.log('='.repeat(60));

    // Save to file
    const fs = await import('fs');
    fs.writeFileSync(
      'category-analysis.json',
      JSON.stringify(analysis, null, 2)
    );
    console.log('\n✓ Full analysis saved to: category-analysis.json');

  } catch (error) {
    console.error('\nAnalysis failed:', error.message);
    process.exit(1);
  }
}

analyzeCategories();
