import { describe, expect, it } from 'vitest'
import {
  cleanMerchant,
  digitsFromMaskedAccount,
  makeFailedRow,
  normalizeMessage,
  normalizeTime,
  parseInstallment,
  resolveDate,
  toAmount,
} from './common.ts'

describe('문자 파서 공통 도구', () => {
  it('금액을 정수로 바꾼다', () => {
    expect(toAmount('31,800원')).toBe(31800)
    expect(toAmount('1 500 원')).toBe(1500)
    expect(toAmount('원')).toBeNull()
  })

  it('날짜는 오늘 기준 가장 가까운 과거로 해석한다', () => {
    expect(resolveDate('10/31', new Date(2026, 9, 31))).toBe('2026-10-31')
    expect(resolveDate('11/01', new Date(2026, 9, 31))).toBe('2025-11-01')
    expect(resolveDate('12/30', new Date(2027, 0, 5))).toBe('2026-12-30')
    expect(resolveDate('02/29', new Date(2026, 2, 1))).toBe('2024-02-29')
    expect(resolveDate('13/01', new Date(2026, 9, 31))).toBeNull()
    expect(resolveDate('02/30', new Date(2026, 9, 31))).toBeNull()
  })

  it('시각을 HH:mm으로 맞추고 범위를 벗어나면 null', () => {
    expect(normalizeTime('2:40')).toBe('02:40')
    expect(normalizeTime('15:07')).toBe('15:07')
    expect(normalizeTime('24:00')).toBeNull()
  })

  it('결제명 끝의 잘린 괄호만 지운다', () => {
    expect(cleanMerchant(' 샘플택시( ')).toBe('샘플택시')
    expect(cleanMerchant('(주)샘플배달_네')).toBe('(주)샘플배달_네')
    expect(cleanMerchant('샘플통신 유선상품 자동(7777)')).toBe('샘플통신 유선상품 자동(7777)')
  })

  it('할부 개월을 읽고 리볼빙 (1회차)는 할부로 보지 않는다', () => {
    expect(parseInstallment('일시불')).toEqual({ installment: 1, interestFree: false })
    expect(parseInstallment('3개월 무이자')).toEqual({ installment: 3, interestFree: true })
    expect(parseInstallment('(리볼빙)(1회차)')).toEqual({ installment: 1, interestFree: false })
    expect(parseInstallment('')).toEqual({ installment: 1, interestFree: false })
  })

  it('계좌번호는 끝 4자리만 남긴다', () => {
    expect(digitsFromMaskedAccount('123******45678')).toBe('5678')
    expect(digitsFromMaskedAccount('12-3')).toBe('123')
    expect(digitsFromMaskedAccount('***')).toBeNull()
  })

  it('발신 표시와 줄바꿈을 정리한다', () => {
    expect(normalizeMessage('[Web발신] 누적820,061\n원')).toBe('누적820,061 원')
    expect(normalizeMessage('[국제발신]  샘플 문자')).toBe('샘플 문자')
    expect(normalizeMessage('[SMS] 샘플 문자')).toBe('샘플 문자')
  })

  it('실패 행은 원문을 보존한다', () => {
    expect(makeFailedRow('원문', '읽을 수 없음')).toEqual({
      status: 'failed', date: null, time: null, merchant: '', amount: null,
      installment: 1, isCancel: false, interestFree: false, direction: 'expense',
      accountHint: null, source: 'sms', raw: '원문', failReason: '읽을 수 없음',
    })
    expect(makeFailedRow('원문', '실패', 'file').source).toBe('file')
  })
})
