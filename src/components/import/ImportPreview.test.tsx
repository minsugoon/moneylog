import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { Account } from '../../lib/types.ts'
import type { PreviewItem } from '../../utils/importRows.ts'
import ImportPreview from './ImportPreview.tsx'

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
const makeItem = (id: string, status: PreviewItem['status'], selected = false): PreviewItem => ({
  id,
  row: {
    status: status === 'failed' ? 'failed' : 'ok',
    date: '2026-10-31',
    time: null,
    merchant: '예시 상점',
    amount: 1200,
    installment: 1,
    isCancel: false,
    interestFree: false,
    direction: status === 'income' ? 'income' : 'expense',
    accountHint: null,
    source: 'sms',
    raw: '가상 원문 문자열',
    failReason: status === 'failed' ? '날짜를 확인해 주세요' : null,
  },
  accountId: accounts[0].id,
  date: '2026-10-31',
  time: null,
  merchant: '예시 상점',
  amount: 1200,
  installment: 1,
  isCancel: false,
  interestFree: false,
  direction: status === 'income' ? 'income' : 'expense',
  status,
  hash: null,
  error: status === 'failed' ? '금액을 확인해 주세요' : null,
  selected,
  userToggled: false,
})
const noop = vi.fn()
const render = (items: PreviewItem[], saving = false) =>
  renderToString(
    <ImportPreview
      items={items}
      accounts={accounts}
      saving={saving}
      error=""
      onEdit={noop}
      onToggle={noop}
      onApplyAccount={noop}
      onSave={noop}
      onCancel={noop}
    />,
  ).replaceAll('<!-- -->', '')

describe('가져오기 미리보기', () => {
  it('상태와 실패 원문, 요약 및 결제수단을 표시한다', () => {
    const html = render([
      makeItem('new', 'new', true),
      makeItem('duplicate', 'duplicate'),
      makeItem('possible', 'possible'),
      makeItem('income', 'income'),
      makeItem('failed', 'failed'),
    ])
    for (const text of [
      '중복',
      '중복 가능',
      '입금',
      '실패',
      '가상 원문 문자열',
      '금액을 확인해 주세요',
      '저장 1건 / 제외 3건 / 실패 1건',
      '선택 안 함',
      'inputMode="numeric"',
    ])
      expect(html).toContain(text)
  })
  it('항목이 없으면 안내하고 저장 중 문구를 보인다', () => {
    expect(render([])).toContain('읽을 수 있는 문자가 없어요')
    expect(render([makeItem('new', 'new', true)], true)).toContain('저장하는 중…')
  })
})
