import dotenv from 'dotenv';
import { supabase } from '../src/config/database.js';
import fs from 'fs';

dotenv.config();

// Load the AI-discovered category structure
const categoryStructure = JSON.parse(
  fs.readFileSync('category-analysis.json', 'utf-8')
);

async function implementHierarchy() {
  console.log('='.repeat(60));
  console.log('Implementing Hierarchical Category Structure');
  console.log('='.repeat(60));

  try {
    // Step 1: Deactivate old categories
    console.log('\n[1/5] Deactivating old categories...');
    const { error: deactivateError } = await supabase
      .from('categories')
      .update({ is_active: false })
      .eq('is_active', true);

    if (deactivateError) throw deactivateError;
    console.log('✓ Old categories deactivated');

    // Step 2: Clear old categorizations
    console.log('\n[2/5] Clearing old categorizations...');
    const { error: clearError } = await supabase
      .from('post_categories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (clearError) throw clearError;
    console.log('✓ Old categorizations cleared');

    // Step 3: Insert parent categories
    console.log('\n[3/5] Creating parent categories...');
    const parentCategories = [];

    for (let i = 0; i < categoryStructure.categories.length; i++) {
      const cat = categoryStructure.categories[i];

      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: cat.name,
          description: cat.description,
          is_active: true,
          post_count: 0,
          parent_id: null,
          level: 0,
          sort_order: i
        })
        .select()
        .single();

      if (error) {
        console.error(`✗ Error creating ${cat.name}:`, error.message);
        continue;
      }

      parentCategories.push({ ...cat, id: data.id });
      console.log(`✓ ${cat.name}`);
    }

    // Step 4: Insert subcategories
    console.log('\n[4/5] Creating subcategories...');
    let totalSubs = 0;

    for (const parent of parentCategories) {
      for (let i = 0; i < parent.subcategories.length; i++) {
        const sub = parent.subcategories[i];

        const { error } = await supabase
          .from('categories')
          .insert({
            name: sub.name,
            description: sub.description,
            is_active: true,
            post_count: 0,
            parent_id: parent.id,
            level: 1,
            sort_order: i
          });

        if (error) {
          console.error(`✗ Error creating ${sub.name}:`, error.message);
        } else {
          console.log(`  ✓ ${parent.name} → ${sub.name}`);
          totalSubs++;
        }
      }
    }

    // Step 5: Summary
    console.log('\n[5/5] Hierarchy created successfully!');
    console.log('\n' + '='.repeat(60));
    console.log('HIERARCHY SUMMARY');
    console.log('='.repeat(60));
    console.log(`Parent categories: ${parentCategories.length}`);
    console.log(`Subcategories: ${totalSubs}`);
    console.log(`Total categories: ${parentCategories.length + totalSubs}`);
    console.log('='.repeat(60));
    console.log('\nNext step: Run npm run reclassify to categorize all posts');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('Implementation Failed');
    console.error('Error:', error.message);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

implementHierarchy();
