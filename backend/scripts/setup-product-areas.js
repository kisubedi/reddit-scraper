import { supabase } from '../src/config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupProductAreas() {
  console.log('Setting up product areas...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../database/product-areas-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split into individual statements (basic approach)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

    console.log(`Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length > 10) {
        console.log(`\n[${i + 1}/${statements.length}] Executing...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          console.error(`Error: ${error.message}`);
        } else {
          console.log('✓ Success');
        }
      }
    }

    console.log('\n✅ Product areas setup complete!');
    console.log('\nVerifying...');

    // Verify the setup
    const { data: productAreas, error: verifyError } = await supabase
      .from('product_areas')
      .select('name')
      .eq('is_active', true);

    if (verifyError) {
      console.error('Verification failed:', verifyError.message);
    } else {
      console.log(`\n✓ Found ${productAreas.length} product areas:`);
      productAreas.forEach((pa, i) => {
        console.log(`  ${i + 1}. ${pa.name}`);
      });
    }

  } catch (error) {
    console.error('Setup failed:', error.message);
    process.exit(1);
  }
}

setupProductAreas();
