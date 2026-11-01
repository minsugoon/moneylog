import { afterEach, describe, expect, it, vi } from 'vitest'
import AccountSection from './components/accounts/AccountSection.tsx'
import AiSettingsSection from './components/settings/AiSettingsSection.tsx'
import FixedRuleSection from './components/settings/FixedRuleSection.tsx'
import FixedExpenseFields from './components/entry/FixedExpenseFields.tsx'
import FixedLoadPanel from './components/entry/FixedLoadPanel.tsx'
import EntryPanel from './components/entry/EntryPanel.tsx'
import PasteImport from './components/entry/PasteImport.tsx'
import AiConsentDialog from './components/entry/AiConsentDialog.tsx'
import CaptureImport from './components/entry/CaptureImport.tsx'
import FixedView from './components/views/FixedView.tsx'
import HistoryPage from './pages/HistoryPage.tsx'
import EntryPage from './pages/EntryPage.tsx'
import ViewsPage from './pages/ViewsPage.tsx'
import { useAiCapture } from './hooks/useAiCapture.ts'
import { fakeLedger, renderWithLedger as render, thisMonth } from './testing/ledgerFixtures.tsx'

vi.mock('./hooks/useAiCapture.ts', () => ({
  useAiCapture: vi.fn(() => ({ loading: true, error: '', consented: false, monthlyLimit: 20, used: 0, reload: async () => {}, acceptConsent: async () => ({ ok: true as const }), withdrawConsent: async () => ({ ok: true as const }), parseCapture: async () => ({ ok: true as const, rows: [] }) })),
}))

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
    expect(html).toContain('사진 입력')
  })

  it('AI 캡처 동의 안내와 시작 버튼을 보여준다', () => {
    const html = render(<AiConsentDialog onAgree={() => {}} onCancel={() => {}} busy={false} error="" />)
    expect(html).toContain('저장하지 않아요')
    expect(html).toContain('철회')
    expect(html).toContain('20장')
    expect(html).toContain('틀릴 수 있어요')
    expect(html).toContain('동의하고 시작')
    expect(html).toContain('영수증 사진')
  })

  it('캡처 가져오기가 오류 없이 로딩 안내를 보여준다', () => {
    vi.mocked(useAiCapture).mockReturnValue({ loading: true, error: '', consented: false, monthlyLimit: 20, used: 0, reload: async () => {}, acceptConsent: async () => ({ ok: true }), withdrawConsent: async () => ({ ok: true }), parseCapture: async () => ({ ok: true, rows: [] }) })
    const html = render(<CaptureImport />)
    expect(html).toContain('불러오는 중이에요')
  })

  it('동의한 화면에 종류 선택이 나오고 영수증 선택 시 사진 입력을 보여준다', () => {
    vi.mocked(useAiCapture).mockReturnValue({ loading: false, error: '', consented: true, monthlyLimit: 20, used: 0, reload: async () => {}, acceptConsent: async () => ({ ok: true }), withdrawConsent: async () => ({ ok: true }), parseCapture: async () => ({ ok: true, rows: [] }) })
    const html = render(<CaptureImport />)
    expect(html).toContain('카드사 앱 캡처')
    expect(html).toContain('영수증')
    expect(html).toContain('어느 결제수단의 캡처인가요?')
    expect(html).toContain('이미지 고르기')
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
    expect(html).toContain('aria-label="결제수단"')
    expect(html).toContain('🔽 펼치기')
    expect(html).toContain('신한카드 · 생활카드 (5678)')
    expect(html).toContain('카카오뱅크 · 월급통장 (1234)')
    expect(html).toContain('결제명')
    expect(html).toContain('일시불')
    expect(html).toContain('고정지출')
    expect(html).toContain('하루 정리')
    // 금액 칸은 숫자 키패드가 뜨는 설정이어야 한다
    expect(html).toContain('inputMode="numeric"')
  })

  it('고정지출 내역이 있으면 불러오기 버튼을, 없으면 안내를 보여준다', () => {
    expect(render(<EntryPanel />)).toContain('고정지출 불러오기')
    const empty = fakeLedger()
    empty.transactions = { ...empty.transactions, items: [] }
    expect(render(<EntryPanel />, empty)).toContain('아직 고정지출로 저장한 내역이 없어요')
  })

  it('같은 결제명의 서로 다른 금액과 날짜를 고정지출 목록에 보여준다', () => {
    const options = [
      { key: 'sample:20000', merchant: '샘플기부', amount: 20000, discount: 0, accountId: 'a1', fixedType: '기부' as const, usedAt: '2026-10-20', count: 1 },
      { key: 'sample:31000', merchant: '샘플기부', amount: 31000, discount: 0, accountId: 'a1', fixedType: '기부' as const, usedAt: '2026-10-21', count: 1 },
    ]
    const html = render(<FixedLoadPanel options={options} onPick={() => {}} defaultOpen />)
    expect(html).toContain('샘플기부')
    expect(html).toContain('20,000원')
    expect(html).toContain('31,000원')
    expect(html).toContain('2026-10-20')
    expect(html).toContain('2026-10-21')
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
    // 처음 화면은 기간별: 기간 합계와 월별 지출이 보인다
    expect(html).toContain('월별 지출')
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
    expect(html).toContain('카드 · 사용 중')
    expect(html).toContain('수정')
    expect(html).toContain('위로 옮기기')
    expect(html).toContain('아래로 옮기기')
  })

  it('하나도 없으면 안내 문구', () => {
    const none = fakeLedger()
    none.accounts = { ...none.accounts, accounts: [] }
    expect(render(<AccountSection />, none)).toContain('아직 등록한 결제수단이 없어요')
  })
})

describe('고정지출 규칙', () => {
  it('규칙에 걸리지 않는 고정지출 후보를 보여준다', () => {
    const html = render(<FixedRuleSection />)
    expect(html).toContain('이미 입력한 고정지출에서 고르기')
    expect(html).toContain('통신비샘플')
  })

  it('후보가 없으면 고정지출 선택 영역을 숨긴다', () => {
    const matched = fakeLedger({ fixedRules: { ...fakeLedger().fixedRules, items: [{ id: 'r1', merchant_keyword: '통신비샘플', fixed_type: '통신', created_at: '2026-01-01T00:00:00Z' }] } })
    expect(render(<FixedRuleSection />, matched)).not.toContain('이미 입력한 고정지출에서 고르기')
    const empty = fakeLedger()
    empty.transactions = { ...empty.transactions, items: [] }
    expect(render(<FixedRuleSection />, empty)).not.toContain('이미 입력한 고정지출에서 고르기')
  })

  it('규칙이 있으면 제목과 키워드를 보여준다', () => {
    const ledger = fakeLedger({ fixedRules: { ...fakeLedger().fixedRules, items: [{ id: 'r1', merchant_keyword: '샘플통신', fixed_type: '통신', created_at: '2026-01-01T00:00:00Z' }] } })
    const html = render(<FixedRuleSection />, ledger)
    expect(html).toContain('고정지출 규칙')
    expect(html).toContain('샘플통신')
  })

  it('규칙이 없으면 빈 화면 안내를 보여준다', () => {
    expect(render(<FixedRuleSection />)).toContain('아직 등록한 규칙이 없어요.')
  })

  it('자동 적용 안내와 규칙 저장 선택을 보여준다', () => {
    const html = render(<FixedExpenseFields idPrefix="test" isFixed onIsFixedChange={() => {}} fixedType="통신" onFixedTypeChange={() => {}} matchedKeyword="샘플통신" canSaveRule saveRule={false} onSaveRuleChange={() => {}} ruleKeyword="샘플" onRuleKeywordChange={() => {}} />)
    expect(html).toContain('규칙에 따라 고정지출로 잡았어요')
    expect(html).toContain('고정 지출 이름 설정하기')
  })
})
