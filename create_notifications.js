require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const sql = `
    create table if not exists public.notifications (
      id uuid default gen_random_uuid() primary key,
      receiver_id uuid references auth.users(id) on delete cascade not null,
      sender_id uuid references auth.users(id) on delete cascade,
      type text not null,
      title text not null,
      body text not null,
      metadata jsonb,
      read boolean default false,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );

    alter table public.notifications enable row level security;

    create policy "Users can view their own notifications"
      on public.notifications for select
      using (auth.uid() = receiver_id);

    create policy "Users can update their own notifications"
      on public.notifications for update
      using (auth.uid() = receiver_id);

    create policy "Users can insert notifications to others"
      on public.notifications for insert
      with check (auth.uid() = sender_id);
      
    create policy "Users can delete their own notifications"
      on public.notifications for delete
      using (auth.uid() = receiver_id);

    -- Enable realtime for notifications table
    alter publication supabase_realtime add table public.notifications;
  `;

  // Note: we can't run raw SQL from client by default, 
  // I need to use the REST API or RPC, but since I am writing this, I will just create a quick server-side script using pg
}

main();
