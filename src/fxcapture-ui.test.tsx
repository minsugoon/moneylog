import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { Account } from './lib/types.ts'
import type { PreviewItem } from './utils/importRows.ts'
import type { RateChoice } from './utils/fxRates.ts'
import ImportPreview from './components/import/ImportPreview.tsx'

const accounts: Account[] = [
  {
    id: 'acct-test',
    name: '예시 카드',
    kind: 'card',
    issuer: '가상사',
    last4: '0001',
    sort_order: 0,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
]

function makeItem(currency = 'VND', amount: number | null = 208000): PreviewItem {
  return {
    id: 'row-test',
    row: {
      status: 'ok',
      date: '2026-10-31',
      time: null,
      merchant: '예시 상점',
      amount,
      installment: 1,
      isCancel: false,
      interestFree: false,
      direction: 'expense',
      accountHint: null,
      source: 'sms',
      raw: '가상 원문 문자열',
      failReason: null,
    },
    accountId: accounts[0].id,
    date: '2026-10-31',
    time: null,
    merchant: '예시 상점',
    amount,
    currency,
    installment: 1,
    isCancel: false,
    isFixed: false,
    fixedType: '기타고정',
    interestFree: false,
    direction: 'expense',
    status: 'new',
    hash: null,
    error: null,
    selected: true,
    userToggled: false,
  }
}

const liveRate: RateChoice = { status: 'live', rate: 0.054, at: '2026-11-21T00:00:00Z' }
const noRate: RateChoice = { status: 'none', rate: null, at: null }
const rateFor = (code: string): RateChoice => code === 'VND' ? liveRate : liveRate
const noop = vi.fn()

function render(item: PreviewItem, options: { withRate?: boolean; saveBlockedMessage?: string | null } = {}) {
  return renderToString(
    <ImportPreview
      items={[item]}
      accounts={accounts}
      rateFor={options.withRate ? rateFor : undefined}
      saveBlockedMessage={options.saveBlockedMessage}
      saving={false}
      error=""
      onEdit={noop}
      onToggle={noop}
      onApplyAccount={noop}
      onSave={noop}
      onCancel={noop}
    />,
  ).replaceAll('<!-- -->', '')
}

describe('사진 가져오기 통화 미리보기', () => {
  it('VND 금액과 환산액, 통화를 표시하고 할부를 숨긴다', () => {
    const html = render(makeItem(), { withRate: true })
    expect(html).toContain('통화')
    expect(html).toContain('<option value="VND" selected="">베트남 · VND</option>')
    expect(html).toContain('금액 (VND)')
    expect(html).toContain('value="208,000"')
    expect(html).toContain('≈ 11,232원')
    expect(html).toContain('1동 = ')
    expect(html).not.toContain('일시불')
  })

  it('지원하지 않는 THB 통화도 옵션과 환율로 표시한다', () => {
    const html = render(makeItem('THB', 100), { withRate: true })
    expect(html).toContain('<option value="THB" selected="">THB</option>')
    expect(html).toContain('1 THB = ')
  })

  it('환율이 없으면 환율 안내를 표시한다', () => {
    const html = renderToString(
      <ImportPreview
        items={[makeItem()]}
        accounts={accounts}
        rateFor={() => noRate}
        saving={false}
        error=""
        onEdit={noop}
        onToggle={noop}
        onApplyAccount={noop}
        onSave={noop}
        onCancel={noop}
      />,
    )
    expect(html).toContain('환율을 받지 못했어요')
  })

  it('KRW에는 통화를 선택하고 할부를 표시하며 환산 안내를 생략한다', () => {
    const html = render(makeItem('KRW', 1200), { withRate: true })
    expect(html).toContain('<option value="KRW" selected="">원 · KRW</option>')
    expect(html).toContain('일시불')
    expect(html).not.toContain('≈')
  })

  it('환율 기능을 넘기지 않은 미리보기에는 통화 선택이 없다', () => {
    expect(render(makeItem())).not.toContain('통화')
  })

  it('저장 차단 메시지를 표시하고 저장 버튼을 비활성화한다', () => {
    const html = render(makeItem(), { saveBlockedMessage: '외화 1건을 계산할 수 없어요.' })
    expect(html).toContain('외화 1건을 계산할 수 없어요.')
    expect(html).toContain('disabled=""')
  })
})
