// 카드앱 캡처 → 거래 내역 읽기 서버 함수 (단계 7-B).
// 흐름: 켜짐 확인 → 로그인 확인 → 요청 검사 → 동의·한도 확인과 차감(begin_ai_call) → Claude 호출 → 결과 검증 → 사용 기록(finish_ai_call)
// 지킬 것: service_role 키를 쓰지 않는다(이용자 로그인 권한으로만 DB를 부른다), 이미지·읽은 내용을 저장하거나 로그에 남기지 않는다.
import Anthropic from 'npm:@anthropic-ai/sdk@1.3.0'
import { createClient } from 'npm:@supabase/supabase-js@2.117.3'
import {
  DEFAULT_MODEL, ERROR_MESSAGES, HTTP_STATUS, buildSystemPrompt, errorCodeFromDb, parseModelOutput, validateRequest,
  type ErrorCode,
} from './logic.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

function fail(code: ErrorCode): Response {
  return json({ error: code, message: ERROR_MESSAGES[code] }, HTTP_STATUS[code])
}

// 한국 시간 기준 오늘 (YYYY-MM-DD)
function todayInSeoul(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return fail('bad_request')

  // 1) 비상 스위치
  if (Deno.env.get('AI_ENABLED') !== 'true') return fail('ai_disabled')

  // 2) 로그인 확인 (이용자의 로그인 정보로만 DB를 부른다)
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!token || !supabaseUrl || !anonKey) return fail('not_authenticated')
  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  if (userError || !userData.user) return fail('not_authenticated')

  // 3) 요청 검사
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return fail('bad_request')
  }
  const request = validateRequest(body)
  if (!request.ok) return json({ error: 'bad_request', message: request.message }, 400)

  // 4) 동의·한도 확인과 차감
  const { data: callId, error: beginError } = await supabase.rpc('begin_ai_call', { p_images: request.images.length })
  if (beginError || !callId) {
    const code = errorCodeFromDb(beginError?.message ?? '')
    return fail(code ?? 'ai_failed')
  }

  const model = Deno.env.get('AI_MODEL') || DEFAULT_MODEL
  const today = todayInSeoul()
  let inputTokens: number | null = null
  let outputTokens: number | null = null
  let ok = false
  let refund = true
  try {
    // 5) Claude 호출 (키는 서버 금고의 ANTHROPIC_API_KEY. 코드에 없다)
    const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })
    const response = await client.messages.create(
      {
        model,
        max_tokens: 4000,
        system: buildSystemPrompt(today),
        messages: [
          {
            role: 'user',
            content: [
              ...request.images.map((image) => ({
                type: 'image' as const,
                source: { type: 'base64' as const, media_type: image.mediaType, data: image.data },
              })),
              { type: 'text' as const, text: '위 캡처의 거래 내역을 읽어 JSON으로 출력하세요.' },
            ],
          },
        ],
      },
      { signal: AbortSignal.timeout(50_000) },
    )
    inputTokens = response.usage.input_tokens
    outputTokens = response.usage.output_tokens
    refund = false // AI를 실제로 불렀으면 비용이 났으므로 차감 유지

    // 6) 결과 검증
    const text = response.content.map((block) => (block.type === 'text' ? block.text : '')).join('')
    const rows = parseModelOutput(text, today)
    if (!rows) return await finish(supabase, callId, model, inputTokens, outputTokens, false, true, () => fail('ai_bad_output'))

    ok = true
    return await finish(supabase, callId, model, inputTokens, outputTokens, ok, false, () => json({ rows, model }))
  } catch (_error) {
    // 오류 내용(이미지·읽은 글)은 남기지 않는다. 호출 전에 실패했다면 횟수를 돌려준다.
    return await finish(supabase, callId, model, inputTokens, outputTokens, false, refund, () => fail('ai_failed'))
  }
})

// 사용 기록을 남긴 뒤 응답을 만든다. 기록이 실패해도 이용자 응답은 막지 않는다.
async function finish(
  supabase: ReturnType<typeof createClient>,
  callId: string,
  model: string,
  inputTokens: number | null,
  outputTokens: number | null,
  ok: boolean,
  refund: boolean,
  respond: () => Response,
): Promise<Response> {
  await supabase.rpc('finish_ai_call', {
    p_id: callId, p_model: model, p_in: inputTokens, p_out: outputTokens, p_ok: ok, p_refund: refund,
  })
  return respond()
}
