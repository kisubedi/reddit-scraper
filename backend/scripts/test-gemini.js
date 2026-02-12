import { testGemini } from '../src/services/gemini.service.js';

async function runTest() {
  try {
    console.log('='.repeat(60));
    console.log('Google Gemini AI - Classification Test');
    console.log('='.repeat(60));
    console.log();

    await testGemini();

    console.log();
    console.log('='.repeat(60));
    console.log('✓ Gemini test completed successfully!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('✗ Gemini test failed');
    console.error('Error:', error.message);
    console.error('='.repeat(60));

    if (error.message?.includes('API_KEY_INVALID') || !process.env.GEMINI_API_KEY) {
      console.error('\nPlease set GEMINI_API_KEY in your .env file');
      console.error('Get your key at: https://makersuite.google.com/app/apikey');
    }

    process.exit(1);
  }
}

runTest();
