import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const API_BASE = 'https://yce-api-01.makeupar.com'

// ← Thêm CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // ← Xử lý preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('key_value')
      .eq('provider', 'virtual_makeup_ai')
      .eq('is_active', true)
      .single()

    if (keyError) {
      return new Response(
        JSON.stringify({ error: 'Key query failed', detail: keyError.message }),
        { status: 500, headers: corsHeaders }
      )
    }
    if (!keyData?.key_value) {
      return new Response(
        JSON.stringify({ error: 'No active key found for virtual_makeup_ai' }),
        { status: 500, headers: corsHeaders }
      )
    }

    const apiKey = keyData.key_value
    const { action, taskId, payload } = await req.json()

    if (action === 'start') {
      console.log('Calling makeup API with payload:', JSON.stringify(payload))

      const response = await fetch(`${API_BASE}/s2s/v2.0/task/makeup-vto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      })

      const text = await response.text()
      console.log('Makeup API response:', response.status, text)

      let data
      try {
        data = JSON.parse(text)
      } catch {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON from makeup API', raw: text }),
          { status: 500, headers: corsHeaders }
        )
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status,
      })
    }

    if (action === 'status' && taskId) {
      const response = await fetch(
        `${API_BASE}/s2s/v2.0/task/makeup-vto/${encodeURIComponent(taskId)}`,
        { headers: { 'Authorization': `Bearer ${apiKey}` } }
      )

      const text = await response.text()
      console.log('Status response:', response.status, text)

      let data
      try {
        data = JSON.parse(text)
      } catch {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON from status API', raw: text }),
          { status: 500, headers: corsHeaders }
        )
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status,
      })
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: corsHeaders }
    )

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Edge function error:', message)
    return new Response(
      JSON.stringify({ error: 'Internal error', detail: message }),
      { status: 500, headers: corsHeaders }
    )
  }
})