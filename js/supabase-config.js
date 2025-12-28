// AIET IN STEM - Supabase Configuration
// Using edurix-2.0 production Supabase instance

const SUPABASE_URL = 'https://uvslysbkatpszsrzbsui.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2c2x5c2JrYXRwc3pzcnpic3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNzI3MjAsImV4cCI6MjA3ODc0ODcyMH0.Secuf3CUvw3u7x0dC_b5ZwhVJvtFS_jT68nwv801U2o';

// Initialize Supabase client
let supabaseClient = null;

async function initSupabase() {
  if (supabaseClient) return supabaseClient;

  // Load Supabase library from CDN if not already loaded
  if (typeof supabase === 'undefined') {
    await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
  }

  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('Supabase client initialized');
  return supabaseClient;
}

// Load external script
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Get Supabase client
function getSupabase() {
  return supabaseClient;
}

// Initialize tables if needed (for first-time setup)
async function setupTables() {
  const client = await initSupabase();

  // Check if aiet_members table exists by trying to query it
  const { data: members, error: membersError } = await client
    .from('aiet_members')
    .select('email')
    .limit(1);

  if (membersError && membersError.code === '42P01') {
    console.log('Tables need to be created in Supabase dashboard');
    console.log('Please create the following tables:');
    console.log(`
      -- Members table
      CREATE TABLE aiet_members (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'Member',
        affiliation TEXT,
        password_hash TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_login TIMESTAMPTZ
      );

      -- Enable RLS
      ALTER TABLE aiet_members ENABLE ROW LEVEL SECURITY;

      -- Policy for reading members (public)
      CREATE POLICY "Allow public read" ON aiet_members FOR SELECT USING (true);

      -- Comments table
      CREATE TABLE aiet_comments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        post_id TEXT NOT NULL,
        author_name TEXT NOT NULL,
        author_email TEXT NOT NULL,
        author_role TEXT,
        author_affiliation TEXT,
        content TEXT NOT NULL,
        parent_id UUID REFERENCES aiet_comments(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Enable RLS
      ALTER TABLE aiet_comments ENABLE ROW LEVEL SECURITY;

      -- Policy for reading comments (public)
      CREATE POLICY "Allow public read" ON aiet_comments FOR SELECT USING (true);

      -- Policy for inserting comments (anyone can insert)
      CREATE POLICY "Allow public insert" ON aiet_comments FOR INSERT WITH CHECK (true);

      -- Policy for deleting own comments
      CREATE POLICY "Allow delete own" ON aiet_comments FOR DELETE USING (true);
    `);
  }

  return { members, membersError };
}
