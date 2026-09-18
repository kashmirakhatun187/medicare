import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Server configuration error' }, 500);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const accessToken = authorization.slice('Bearer '.length);
  const { data: { user: caller }, error: callerError } = await adminClient.auth.getUser(accessToken);
  if (callerError || !caller) return json({ error: 'Unauthorized' }, 401);

  const { data: callerProfile } = await adminClient
    .from('user_profiles')
    .select('role, status')
    .eq('id', caller.id)
    .maybeSingle();
  if (callerProfile?.role !== 'admin' || callerProfile.status?.toLowerCase() !== 'active') {
    return json({ error: 'Admin access required' }, 403);
  }

  let body: {
    email?: string;
    password?: string;
    fullName?: string;
    phone?: string;
    role?: string;
    department?: string;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const email = body.email?.trim().toLowerCase();
  const fullName = body.fullName?.trim();
  const password = body.password;
  const allowedRoles = ['doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_tech', 'accountant'];
  if (!email || !fullName || !password || !body.role || !allowedRoles.includes(body.role)) {
    return json({ error: 'Email, full name, password, and a valid staff role are required' }, 400);
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone: body.phone?.trim() || null },
  });
  if (createError || !created.user) return json({ error: createError?.message || 'Failed to create user' }, 400);

  const { error: profileError } = await adminClient.from('user_profiles').upsert({
    id: created.user.id,
    email,
    full_name: fullName,
    role: body.role,
    department: body.department || null,
    phone: body.phone?.trim() || null,
    status: 'Active',
  }, { onConflict: 'id' });

  if (profileError) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    return json({ error: profileError.message }, 400);
  }

  return json({ id: created.user.id });
});
