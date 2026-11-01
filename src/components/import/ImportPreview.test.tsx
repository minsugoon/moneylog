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
  isFixed: false,
  fixedType: '기타고정',
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
      '읽은 내용 확인',
      '5건을 읽었어요. 저장할 것만 남겨 주세요.',
      '중복',
      '중복 가능',
      '입금',
      '실패',
      '가상 원문 문자열',
      '금액을 확인해 주세요',
      '저장 1건 / 제외 3건 / 실패 1건',
      '선택 안 함',
      'inputMode="numeric"',
      '고정지출',
      'bg-red-600',
      'bg-amber-100',
      '이미 저장된 내역과 같아 보여요. 기본으로 빼 두었어요.',
    ])
      expect(html).toContain(text)
  })
  it('하단 고정 영역에 요약과 동작 버튼을 둔다', () => {
    const html = render([makeItem('new', 'new', true)])
    const sticky = html.slice(html.indexOf('sticky'))
    expect(sticky).toContain('저장 1건 / 제외 0건 / 실패 0건')
    expect(sticky).toContain('저장</button>')
    expect(sticky).toContain('다시 붙여넣기')
  })
  it('항목이 없으면 안내하고 저장 중 문구를 보인다', () => {
    expect(render([])).toContain('읽을 수 있는 문자가 없어요')
    expect(render([makeItem('new', 'new', true)], true)).toContain('저장하는 중…')
  })
})
