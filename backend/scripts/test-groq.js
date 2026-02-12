import { testGroq } from '../src/services/groq.service.js';

async function runTest() {
  try {
    console.log('='.repeat(60));
    console.log('Groq AI - Classification Test');
    console.log('='.repeat(60));
    console.log();

    await testGroq();

    console.log();
    console.log('='.repeat(60));
    console.log('✓ Groq test completed successfully!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('✗ Groq test failed');
    console.error('Error:', error.message);
    console.error('='.repeat(60));

    if (!process.env.GROQ_API_KEY) {
      console.error('\nPlease set GROQ_API_KEY in your .env file');
      console.error('Get your key at: https://console.groq.com/keys');
    }

    process.exit(1);
  }
}

runTest();
