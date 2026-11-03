import { describe, expect, it } from 'vitest'
import { BENEFIT_KINDS, type CardProgram } from '../lib/types.ts'
import { checkBenefit, checkProgram, DEFAULT_EXCLUSION_MODES, draftFromProgram, emptyProgramDraft, normalizeProgram, parseKeywords } from './cardProgramInput.ts'

const validProgram = () => ({ ...emptyProgramDraft('card-test'), name: '  생활 실적  ', target_amount: 10000 })
const validBenefit = () => ({ name: '  할인  ', required_amount: null, benefit_amount: 0, benefit_kind: BENEFIT_KINDS[0], linked_keyword: ' ', memo: ' ' })

describe('카드 프로그램 입력 검사', () => {
  it('기본값과 프로그램 이름 정리를 확인한다', () => {
    expect(checkProgram(validProgram())).toMatchObject({ ok: true, value: { name: '생활 실적' } })
    expect(emptyProgramDraft('c').interest_free_mode).toBe('flag')
  })
  it('프로그램 오류 문구를 확인한다', () => {
    expect(checkProgram({ ...validProgram(), account_id: '' })).toEqual({ ok: false, message: '카드를 골라 주세요.' })
    expect(checkProgram({ ...validProgram(), name: ' ' })).toEqual({ ok: false, message: '프로그램 이름을 1~40자로 입력해 주세요.' })
    expect(checkProgram({ ...validProgram(), target_amount: null })).toEqual({ ok: false, message: '월 목표 금액을 1원 이상 입력해 주세요.' })
    expect(checkProgram({ ...validProgram(), period_start_day: 29 })).toEqual({ ok: false, message: '측정 시작일은 1일부터 28일 사이로 골라 주세요.' })
  })
  it('제외 설정을 병합하고 기존 설정을 보존한다', () => {
    const result = checkProgram(validProgram(), { loan: 'ignore' })
    expect(result.ok && result.value.exclusion_modes).toEqual({ ...DEFAULT_EXCLUSION_MODES, loan: 'ignore', interest_free: 'flag' })
  })
  it('저장할 키워드를 여러 개 그대로 나눠서 정리한다', () => {
    const result = checkProgram({ ...validProgram(), exclude_keywords: [' 상품권 ', '충전', '상품권'] })
    expect(result.ok && result.value.exclude_keywords).toEqual(['상품권', '충전'])
  })
  it('키워드를 나누고 중복과 개수 및 길이를 제한한다', () => {
    expect(parseKeywords(' Alpha, beta\nALPHA, , gamma ')).toEqual(['Alpha', 'beta', 'gamma'])
    expect(parseKeywords(Array.from({ length: 22 }, (_, i) => `keyword${i}`).join(',')).length).toBe(20)
    expect(parseKeywords('x'.repeat(35))[0]).toHaveLength(30)
  })
  it('혜택 입력을 정리하고 모든 오류 문구를 확인한다', () => {
    expect(checkBenefit(validBenefit())).toMatchObject({ ok: true, value: { name: '할인', linked_keyword: null, memo: null } })
    expect(checkBenefit({ ...validBenefit(), name: '' })).toEqual({ ok: false, message: '혜택 이름을 1~40자로 입력해 주세요.' })
    expect(checkBenefit({ ...validBenefit(), benefit_amount: null })).toEqual({ ok: false, message: '혜택 금액을 0원 이상 입력해 주세요.' })
    expect(checkBenefit({ ...validBenefit(), required_amount: 0 })).toEqual({ ok: false, message: '필요 실적은 비우거나 1원 이상으로 입력해 주세요.' })
    expect(checkBenefit({ ...validBenefit(), linked_keyword: 'x'.repeat(31) })).toEqual({ ok: false, message: '연결 결제명은 30자 이하로 입력해 주세요.' })
    expect(checkBenefit({ ...validBenefit(), memo: 'x'.repeat(201) })).toEqual({ ok: false, message: '메모는 200자 이하로 입력해 주세요.' })
  })
  it('잘못된 DB 설정을 기본값으로 복구한다', () => {
    const row = { id: 'p', account_id: 'c', name: 'test', target_amount: 1, measure_basis: 'previous_month', installment_mode: 'full', period_start_day: 1, exclude_keywords: null, exclusion_modes: { loan: 'bad' }, is_active: true, sort_order: 0, created_at: 'date' } as unknown as CardProgram
    expect(normalizeProgram(row).exclude_keywords).toEqual([])
    expect(normalizeProgram(row).exclusion_modes.loan).toBe('exclude')
    expect(draftFromProgram({ ...row, exclusion_modes: {} }).interest_free_mode).toBe('flag')
  })
})
