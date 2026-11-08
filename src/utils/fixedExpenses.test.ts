import { describe, expect, it } from 'vitest'
import { FALLBACK_FIXED_TYPE, type FixedExpense } from '../lib/types.ts'
import { checkFixedExpense, checkFixedTypeName, draftFromFixedExpense, emptyFixedExpenseDraft, fixedExpenseKey, monthlyFixedTotal, newRegistrations, normalizeForMatch, payDayLabel, registrationFromTransaction, sortFixedExpenses, toLoadOptions } from './fixedExpenses.ts'

const valid = { merchant: ' 결제처 ', account_id: 'account-a', amount: 12000, pay_day: 5, fixed_type: '통신' }

describe('고정지출 입력 검사', () => {
  it('기본값과 저장 항목 변환에서 빈 결제수단과 기본 분류를 처리한다', () => {
    expect(emptyFixedExpenseDraft('')).toEqual({ merchant: '', account_id: '', amount: null, pay_day: 1, fixed_type: FALLBACK_FIXED_TYPE })
    expect(draftFromFixedExpense({ id: 'f1', merchant: '결제처', account_id: null, amount: 10, pay_day: 1, fixed_type: '통신', created_at: '' }).account_id).toBe('')
  })

  it.each([
    [{ ...valid, merchant: '  ' }, '결제명을 입력해 주세요.'],
    [{ ...valid, merchant: 'x'.repeat(101) }, '결제명을 입력해 주세요.'],
    [{ ...valid, account_id: '' }, '결제수단을 골라 주세요.'],
    [{ ...valid, amount: null }, '금액을 1원 이상 입력해 주세요.'],
    [{ ...valid, amount: 0 }, '금액을 1원 이상 입력해 주세요.'],
    [{ ...valid, amount: 1.5 }, '금액을 1원 이상 입력해 주세요.'],
    [{ ...valid, amount: 2000000001 }, '금액을 1원 이상 입력해 주세요.'],
    [{ ...valid, pay_day: 32 }, '결제일을 1일부터 31일 사이로 골라 주세요.'],
    [{ ...valid, pay_day: 1.5 }, '결제일을 1일부터 31일 사이로 골라 주세요.'],
    [{ ...valid, fixed_type: ' ' }, '분류를 골라 주세요.'],
  ])('잘못된 입력을 안내한다', (draft, message) => {
    expect(checkFixedExpense(draft)).toEqual({ ok: false, message })
  })

  it('결제명을 공백 정리해 저장한다', () => {
    expect(checkFixedExpense(valid)).toEqual({ ok: true, value: { ...valid, merchant: '결제처' } })
  })

  it('분류 이름 길이와 대소문자 및 공백 중복을 검사한다', () => {
    expect(checkFixedTypeName(' ', [])).toEqual({ ok: false, message: '분류 이름을 1~20자로 입력해 주세요.' })
    expect(checkFixedTypeName('x'.repeat(21), [])).toEqual({ ok: false, message: '분류 이름을 1~20자로 입력해 주세요.' })
    expect(checkFixedTypeName(' Foo ', ['foo'])).toEqual({ ok: false, message: '이미 있는 분류예요.' })
    expect(checkFixedTypeName(' foo ', ['Foo'], 'Foo')).toEqual({ ok: true, value: 'foo' })
  })
})

describe('고정지출 변환과 정렬', () => {
  const transaction = { is_fixed: true, fixed_type: '통신', merchant: ' 통신료 ', account_id: null, amount: 12000, discount: 2000, used_at: '2026-10-07' }

  it.each([
    [{ is_fixed: false }, '고정지출 아님'],
    [{ is_cancel: true }, '취소'],
    [{ installment_months: 2 }, '할부'],
    [{ fixed_type: null }, '분류 없음'],
    [{ merchant: '  ' }, '결제명 없음'],
    [{ amount: 100, discount: 100 }, '실결제액 없음'],
  ])('등록 제외 조건: %s', (override, _reason) => {
    expect(registrationFromTransaction({ ...transaction, ...override })).toBeNull()
  })

  it('할인 후 실결제액과 사용일의 일자를 저장한다', () => {
    expect(registrationFromTransaction(transaction)).toEqual({ merchant: '통신료', account_id: null, amount: 10000, pay_day: 7, fixed_type: '통신' })
  })

  it('공백과 대소문자만 다른 항목은 건너뛰고 금액 차이는 등록한다', () => {
    const existing = [{ merchant: ' Foo Bar ', account_id: 'a', amount: 100, pay_day: 7, fixed_type: '통신' }]
    const candidates = [
      { merchant: 'foobar', account_id: 'a', amount: 100, pay_day: 9, fixed_type: '구독' },
      { merchant: 'FOO BAR', account_id: 'a', amount: 200, pay_day: 8, fixed_type: '구독' },
      { merchant: 'foo bar', account_id: 'a', amount: 200, pay_day: 11, fixed_type: '보험' },
    ]
    expect(fixedExpenseKey(existing[0])).toBe('foobar|a|100')
    expect(newRegistrations(existing, candidates)).toEqual([candidates[1]])
    expect(normalizeForMatch(' Foo Bar ')).toBe('foobar')
  })

  it('선택지와 항목을 결제일 및 한글 결제명 순으로 정렬한다', () => {
    const items: FixedExpense[] = [
      { id: 'b', merchant: '나', account_id: null, amount: 20, pay_day: 5, fixed_type: '통신', created_at: '' },
      { id: 'a', merchant: '가', account_id: 'a', amount: 10, pay_day: 5, fixed_type: '구독', created_at: '' },
      { id: 'c', merchant: '다', account_id: null, amount: 30, pay_day: 1, fixed_type: '보험', created_at: '' },
    ]
    expect(sortFixedExpenses(items).map((item) => item.id)).toEqual(['c', 'a', 'b'])
    expect(toLoadOptions(items).map((item) => item.key)).toEqual(['c', 'a', 'b'])
    expect(monthlyFixedTotal(items)).toBe(60)
    expect(payDayLabel(8)).toBe('매월 8일')
  })
})
