import { classifyProductArea } from '../src/services/groq.service.js';
import dotenv from 'dotenv';

dotenv.config();

async function testProductAreas() {
  console.log('🧪 Testing Product Area Classification\n');
  console.log('='.repeat(60));

  const testPosts = [
    {
      title: 'How to connect SharePoint as knowledge source?',
      content: 'I want to add my SharePoint documents to Copilot Studio as a knowledge source. What are the steps to set this up?'
    },
    {
      title: 'Creating custom actions with Power Automate',
      content: 'I need to trigger a Power Automate flow from my agent. How do I set up connector-based actions?'
    },
    {
      title: 'Publishing agent to Teams channel',
      content: 'What is the process to publish my Copilot Studio agent to Microsoft Teams? Do I need app registration?'
    },
    {
      title: 'Testing conversation quality and hallucinations',
      content: 'How can I evaluate if my agent is hallucinating or providing accurate responses? Looking for testing tools.'
    },
    {
      title: 'C1 vs C2 authentication setup',
      content: 'Confused about maker auth vs user auth. How do I configure connections for end-user scenarios?'
    }
  ];

  for (let i = 0; i < testPosts.length; i++) {
    const post = testPosts[i];

    console.log(`\n[Test ${i + 1}/${testPosts.length}]`);
    console.log(`Title: ${post.title}`);
    console.log(`Content: ${post.content.substring(0, 100)}...`);

    try {
      const productAreas = await classifyProductArea(post.title, post.content);

      if (productAreas && productAreas.length > 0) {
        console.log(`\n✅ Product Areas (${productAreas.length}):`);
        productAreas.forEach((area, idx) => {
          console.log(`   ${idx + 1}. ${area.name} (${(area.confidence * 100).toFixed(0)}% confidence)`);
        });
      } else {
        console.log('\n⚠️  No product areas assigned');
      }

      // Delay to avoid rate limits
      if (i < testPosts.length - 1) {
        console.log('\n⏳ Waiting 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

    } catch (error) {
      console.error(`\n❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Testing Complete!\n');
}

testProductAreas().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
