const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
supabase.from('shop_items').select('id, name, created_at').in('name', ['Aurora Peaks', 'Frostbite']).then(x => console.log(JSON.stringify(x.data, null, 2)));
