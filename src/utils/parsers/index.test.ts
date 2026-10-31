import { describe, expect, it } from 'vitest'
import { parseMessages } from './index.ts'

const samples = [
  '[Web발신]\n[삼성카드]1234\n자동결제 10/20접수\n샘플통신 유선상품 자동(7777)\n6,130원',
  '[Web발신]\n삼성1234승인 홍*동\n31,800원 일시불\n10/18 02:40 SampleApp\n누적184,350원',
  '[Web발신]\n삼성1234승인 홍*동\n7,300원 일시불\n10/07 15:07 샘플택시(\n누적480,111원',
  '[Web발신]\n하나56승인 홍*동 61,500원 일시불 10/15\n20:51 샘플식당직영 누적820,061\n원',
  '[Web발신]\n하나56취소 홍*동 23,500원 일시불 10/14\n19:27 (주)샘플배달_네 누적760,561\n원',
  '[Web발신]\n하나56취소 홍*동 23,500원 일시불 10/14\n19:23 (주)샘플배달_네 누적784,061\n원',
  '[Web발신]\n우리(5678)승인\n홍*동님\n46,900원 일시불\n10/12 10:52\n샘플전자 구독료',
  '[Web발신]\n우리(5678)승인\n홍*동님\n62,670원 일시불\n10/12 10:39\n샘플통신요금 자동납부_7777',
  '[Web발신]\n우리(5678)승인\n홍*동님\n151,000원 일시불\n10/07 15:18\n샘플레스토랑 여의도점',
  '[Web발신]\n하나,10/26 15:01\n123******45678\n출금21,900원\n샘플페이',
  '[Web발신]\n하나,10/27 10:17\n123******45678\n입금11,003원\n샘플보험환급',
  '[Web발신]\n신한1234승인 홍*동\n120,000원 3개월\n10/05 14:20 샘플가전\n누적300,000원',
  '[Web발신]\n신한1234승인 홍*동\n120,000원 3개월(무이자)\n10/05 14:20 샘플가전\n누적300,000원',
  '[Web발신]\n[샘플은행] 인증번호를 입력해 주세요',
]

describe('parseMessages', () => {
  it('14개 문자를 순서대로 읽고 알 수 없는 원문을 보존한다', () => {
    const rows = parseMessages(samples.join('\n\n'), { now: new Date(2026, 9, 31) })
    expect(rows).toHaveLength(14)
    expect(rows.map(({ amount, date, direction, isCancel }) => [amount, date, direction, isCancel])).toEqual([
      [6130, '2026-10-20', 'expense', false], [31800, '2026-10-18', 'expense', false],
      [7300, '2026-10-07', 'expense', false], [61500, '2026-10-15', 'expense', false],
      [23500, '2026-10-14', 'expense', true], [23500, '2026-10-14', 'expense', true],
      [46900, '2026-10-12', 'expense', false], [62670, '2026-10-12', 'expense', false],
      [151000, '2026-10-07', 'expense', false], [21900, '2026-10-26', 'expense', false],
      [11003, '2026-10-27', 'income', false], [120000, '2026-10-05', 'expense', false],
      [120000, '2026-10-05', 'expense', false], [null, null, 'expense', false],
    ])
    expect(rows[0].time).toBeNull()
    expect(rows[12].installment).toBe(3)
    expect(rows[12].interestFree).toBe(true)
    expect(rows[13].status).toBe('failed')
    expect(rows[13].raw).toBe(samples[13])
  })
})
