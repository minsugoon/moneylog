import { describe, expect, it } from 'vitest'
import { splitMessages } from './splitMessages.ts'

describe('splitMessages', () => {
  it('시간 줄을 지우고 표시별로 나눈다', () => {
    const result = splitMessages('[Web발신]\n삼성1234승인\n\n오전 10:52\n[Web발신]\n삼성1234승인')
    expect(result).toHaveLength(2)
    expect(result.join('\n')).not.toContain('오전 10:52')
  })

  it('표시 없이 빈 줄로 구분하고 한 건과 빈 입력을 처리한다', () => {
    expect(splitMessages('첫 문자\n\n둘째 문자')).toEqual(['첫 문자', '둘째 문자'])
    expect(splitMessages('한 문자')).toEqual(['한 문자'])
    expect(splitMessages(' \n ')).toEqual([])
  })

  it('날짜 구분선을 지우고 국제발신 표시는 보존한다', () => {
    expect(splitMessages('2026년 10월 31일 토요일\n[국제발신]\n내용')).toEqual(['[국제발신]\n내용'])
  })
})
