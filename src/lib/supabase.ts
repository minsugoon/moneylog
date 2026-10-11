import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// .env 값이 비어 있으면 연결을 만들지 않는다. 화면에서 "설정이 필요해요"를 보여주기 위해서다.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Supabase 연결은 앱 전체에서 이것 하나만 쓴다. 직접 쓰는 곳은 hooks/ 뿐이다.
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          // 로그인 상태를 기기에 기억해서 앱을 닫았다 열어도 유지한다
          persistSession: true,
          autoRefreshToken: true,
          // 구글 로그인 후 돌아왔을 때 주소에 붙은 로그인 정보를 읽어 들인다
          detectSessionInUrl: true,
        },
      })
    : null
