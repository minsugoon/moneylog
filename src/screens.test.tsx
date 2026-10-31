import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AccountSection from './components/accounts/AccountSection.tsx'
import AiSettingsSection from './components/settings/AiSettingsSection.tsx'
import EntryPanel from './components/entry/EntryPanel.tsx'
import PasteImport from './components/entry/PasteImport.tsx'
import AiConsentDialog from './components/entry/AiConsentDialog.tsx'
import CaptureImport from './components/entry/CaptureImport.tsx'
import { LedgerContext, type LedgerValue } from './hooks/ledgerContext.ts'
import type { Account, DailyNote, Transaction } from './lib/types.ts'
import FixedView from './components/views/FixedView.tsx'
import HistoryPage from './pages/HistoryPage.tsx'
import EntryPage from './pages/EntryPage.tsx'
import ViewsPage from './pages/ViewsPage.tsx'
import { addMonths, currentMonthKey, todayString } from './utils/format.ts'

// 화면 점검 테스트: 가짜 데이터를 넣고 화면을 한 번 그려서, 오류 없이 그려지고 핵심 글자가 보이는지 확인한다.
// 샘플은 모두 임의로 만든 값이다 (실제 카드·내역 아님).

const ok = async () => ({ ok: true as const })
const today = todayString()
const thisMonth = currentMonthKey()

const accountList: Account[] = [
  { id: 'a1', name: '생활카드', kind: 'card', issuer: '신한카드', last4: '5678', sort_order: 0, is_active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'a2', name: '월급통장', kind: 'account', issuer: '카카오뱅크', last4: '1234', sort_order: 1, is_active: true, created_at: '2026-01-02T00:00:00Z' },
  { id: 'a3', name: '현금', kind: 'cash', issuer: null, last4: null, sort_order: 2, is_active: true, created_at: '2026-01-03T00:00:00Z' },
]

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: 't', account_id: 'a1', used_at: today, merchant: '샘플 가게', amount: 10000, discount: 0,
    installment_months: 1, is_fixed: false, fixed_type: null, source: 'manual', import_hash: null,
    memo: null, is_cancel: false, interest_free: false, performance_override: null,
    created_at: '2026-01-01T00:00:00Z', ...overrides,
  }
}

const txList: Transaction[] = [
  tx({ id: '1', merchant: '편의점샘플', amount: 12000, memo: '야식 메모' }),
  tx({ id: '2', merchant: '통신비샘플', amount: 55000, is_fixed: true, fixed_type: '통신', account_id: 'a2' }),
  tx({ id: '3', merchant: '환불샘플', amount: 3000, is_cancel: true, account_id: 'a3' }),
  tx({ id: '4', merchant: '노트북샘플', amount: 1200000, installment_months: 12, interest_free: true, used_at: `${addMonths(thisMonth, -2)}-05` }),
]

const noteList: DailyNote[] = [{ id: 'n1', note_date: today, body: '샘플 하루 정리 글', updated_at: '2026-01-01T00:00:00Z' }]

function fakeLedger(overrides: Partial<LedgerValue> = {}): LedgerValue {
  return {
    accounts: { accounts: accountList, loading: false, error: '', reload: async () => {}, add: ok, update: ok, setActive: ok, remove: ok, move: ok },
    transactions: { items: txList, loading: false, error: '', reload: async () => {}, add: ok, addMany: async () => ({ ok: true as const, saved: 0, skipped: 0 }), update: ok, remove: ok },
    notes: { items: noteList, byDate: new Map(noteList.map((n) => [n.note_date, n])), loading: false, error: '', reload: async () => {}, save: ok, remove: ok },
    ...overrides,
  }
}

// React가 글자 사이에 끼워 넣는 구분 표시(<!-- -->)는 눈에 안 보이므로 지우고 비교한다
function render(node: React.ReactNode, ledger: LedgerValue = fakeLedger()): string {
  return renderToString(<LedgerContext.Provider value={ledger}>{node}</LedgerContext.Provider>).replaceAll(
    '<!-- -->',
    '',
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('AI 입력 설정', () => {
  it('AI 입력 카드와 사용량 또는 불러오기 상태를 보여준다', () => {
    const html = render(<AiSettingsSection />)
    expect(html).toContain('AI 입력')
    expect(html.includes('불러오는 중이에요') || html.includes('이번 달')).toBe(true)
  })
})

describe('내역 화면', () => {
  it('이번 달 합계, 날짜별 내역, 메모, 하루 정리를 보여준다', () => {
    const html = render(<HistoryPage />)
    expect(html).toContain('편의점샘플')
    expect(html).toContain('야식 메모')
    expect(html).toContain('샘플 하루 정리 글')
    expect(html).toContain('신한카드 · 생활카드 (5678)')
    expect(html).toContain('고정 · 통신')
    expect(html).toContain('취소')
    // 12,000 + 55,000 - 3,000 (사용일 기준이라 2달 전 할부는 안 들어온다)
    expect(html).toContain('64,000원')
    expect(html).not.toContain('노트북샘플')
  })

  it('월 납부액 기준이면 이전 달에서 이어진 할부가 회차·잔액과 함께 나온다', () => {
    vi.stubGlobal('localStorage', { getItem: () => 'payment', setItem: () => {} })
    const html = render(<HistoryPage />)
    expect(html).toContain('이전 달에서 이어진 할부')
    expect(html).toContain('노트북샘플')
    expect(html).toContain('12개월 할부')
    expect(html).toContain('3/12회차')
    // 1,200,000 / 12 = 100,000, 3회차 잔액 900,000
    expect(html).toContain('잔액 900,000원')
  })

  it('불러오는 중과 오류 상태에 친절한 문구를 보여준다', () => {
    const loading = fakeLedger()
    loading.transactions = { ...loading.transactions, items: [], loading: true }
    expect(render(<HistoryPage />, loading)).toContain('내역을 불러오고 있어요')

    const failed = fakeLedger()
    failed.transactions = { ...failed.transactions, items: [], error: '인터넷 연결을 확인한 뒤 다시 시도해 주세요.' }
    const html = render(<HistoryPage />, failed)
    expect(html).toContain('인터넷 연결을 확인')
    expect(html).toContain('다시 불러오기')
  })

  it('내역이 없으면 안내 문구', () => {
    const empty = fakeLedger()
    empty.transactions = { ...empty.transactions, items: [] }
    empty.notes = { ...empty.notes, items: [], byDate: new Map() }
    expect(render(<HistoryPage />, empty)).toContain('입력한 지출이 없어요')
  })
})

describe('입력 화면', () => {
  it('직접 입력과 문자 붙여넣기 탭을 보여준다', () => {
    const html = render(<EntryPage />)
    expect(html).toContain('직접 입력')
    expect(html).toContain('문자 붙여넣기')
    expect(html).toContain('캡처(AI)')
  })

  it('AI 캡처 동의 안내와 시작 버튼을 보여준다', () => {
    const html = render(<AiConsentDialog onAgree={() => {}} onCancel={() => {}} busy={false} error="" />)
    expect(html).toContain('저장하지 않아요')
    expect(html).toContain('철회')
    expect(html).toContain('20장')
    expect(html).toContain('틀릴 수 있어요')
    expect(html).toContain('동의하고 시작')
  })

  it('캡처 가져오기가 오류 없이 로딩 안내를 보여준다', () => {
    const html = render(<CaptureImport />)
    expect(html).toContain('불러오는 중이에요')
  })

  it('문자 붙여넣기 안내와 한글 글상자, 읽기 버튼을 보여준다', () => {
    const html = render(<PasteImport />)
    expect(html).toContain('카드·통장 문자를 복사해서 붙여넣으세요.')
    expect(html).toContain('lang="ko"')
    expect(html).toContain('읽기')
  })

  it('결제수단이 없으면 등록 안내를 보여준다', () => {
    const empty = fakeLedger()
    empty.accounts = { ...empty.accounts, accounts: [] }
    expect(render(<PasteImport />, empty)).toContain('설정 탭에서 결제수단을 먼저 등록')
  })

  it('결제수단 칩과 입력칸, 할부·고정지출 선택, 하루 정리 카드가 나온다', () => {
    const html = render(<EntryPanel />)
    expect(html).toContain('신한카드 · 생활카드 (5678)')
    expect(html).toContain('카카오뱅크 · 월급통장 (1234)')
    expect(html).toContain('결제명')
    expect(html).toContain('일시불')
    expect(html).toContain('고정지출')
    expect(html).toContain('오늘 하루 정리')
    // 금액 칸은 숫자 키패드가 뜨는 설정이어야 한다
    expect(html).toContain('inputMode="numeric"')
  })

  it('글을 쓰는 칸(결제명·메모·하루 정리)은 한글로 지정돼 있다', () => {
    const html = render(<EntryPanel />)
    // 결제명, 메모, 하루 정리 세 칸
    expect(html.match(/lang="ko"/g)).toHaveLength(3)
  })

  it('결제수단이 없으면 설정에서 등록하라고 안내한다', () => {
    const none = fakeLedger()
    none.accounts = { ...none.accounts, accounts: [] }
    expect(render(<EntryPanel />, none)).toContain('먼저 등록하면')
  })
})

describe('보기 화면', () => {
  it('탭 순서는 기간별 → 결제수단별 → 고정지출이고, 처음에는 기간별이 열린다', () => {
    const html = render(<ViewsPage />)
    const period = html.indexOf('>기간별<')
    const account = html.indexOf('>결제수단별<')
    const fixed = html.indexOf('>고정지출<')
    expect(period).toBeGreaterThan(-1)
    expect(period).toBeLessThan(account)
    expect(account).toBeLessThan(fixed)
    // 처음 화면은 기간별: 기간 합계와 월별 합계가 보인다
    expect(html).toContain('월별 합계')
    expect(html).not.toContain('고정지출 총합')
  })

  it('고정지출: 종류별 소계와 총합', () => {
    const html = render(<FixedView month={thisMonth} basis="usage" />)
    expect(html).toContain('고정지출 총합')
    expect(html).toContain('통신')
    expect(html).toContain('통신비샘플')
    expect(html).toContain('55,000원')
  })
})

describe('설정 화면의 결제수단', () => {
  it('등록된 결제수단을 표시 형식대로 보여주고 관리 버튼이 있다', () => {
    const html = render(<AccountSection />)
    expect(html).toContain('카카오뱅크 · 월급통장 (1234)')
    expect(html).toContain('현금')
    expect(html).toContain('사용중지')
    expect(html).toContain('삭제')
  })

  it('하나도 없으면 안내 문구', () => {
    const none = fakeLedger()
    none.accounts = { ...none.accounts, accounts: [] }
    expect(render(<AccountSection />, none)).toContain('아직 등록한 결제수단이 없어요')
  })
})
