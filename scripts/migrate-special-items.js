const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim().replace(/"/g, '').replace(/\r/g, '');
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim().replace(/"/g, '').replace(/\r/g, '');
});

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log("Fetching special items from shop_items...");
  const { data: items, error: fetchErr } = await supabase.from('shop_items').select('*').in('type', ['Challenge Title', 'Streak Title']);
  if (fetchErr) {
    console.error("Fetch error:", fetchErr);
    return;
  }
  
  console.log(`Found ${items.length} items to migrate.`);
  
  for (const item of items) {
    const table = item.type === 'Challenge Title' ? 'challenge_items' : 'streak_items';
    
    console.log(`Inserting ${item.name} into ${table}...`);
    const { data: newRow, error: insertErr } = await supabase.from(table).insert([{
      name: item.name,
      title: item.type,
      description: item.description || '',
      balance: item.price || 0,
      icon_name: item.icon_name,
      image_url: item.image_url,
      rarity: item.rarity,
      rarity_color: item.rarity_color
    }]).select().single();
    
    if (insertErr) {
      console.error(`Failed to insert ${item.name}:`, insertErr);
      continue;
    }
    
    console.log(`Updating user_inventory for ${item.name} (old id: ${item.id}, new id: ${newRow.id})...`);
    const fkColumn = item.type === 'Challenge Title' ? 'challenge_item_id' : 'streak_item_id';
    
    const { error: invErr } = await supabase.from('user_inventory')
      .update({ [fkColumn]: newRow.id, shop_item_id: null })
      .eq('shop_item_id', item.id);
      
    if (invErr) {
      console.error(`Failed to update inventory for ${item.name}:`, invErr);
    }
    
    console.log(`Deleting ${item.name} from shop_items...`);
    const { error: delErr } = await supabase.from('shop_items').delete().eq('id', item.id);
    if (delErr) {
      console.error(`Failed to delete ${item.name} from shop_items:`, delErr);
    }
  }
  
  console.log("Migration complete!");
}

migrate();
