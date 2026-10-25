// 결제수단을 등록할 때 고르는 은행·카드사 목록. 목록에 없으면 "직접 입력"을 쓴다.

export const BANKS = [
  '카카오뱅크',
  '토스뱅크',
  '케이뱅크',
  'KB국민은행',
  '신한은행',
  '우리은행',
  '하나은행',
  'NH농협은행',
  'IBK기업은행',
  'SC제일은행',
  '새마을금고',
  '우체국',
  '수협은행',
  '부산은행',
  '대구은행',
] as const

const CARD_COMPANIES = [
  '신한카드',
  '삼성카드',
  '현대카드',
  'KB국민카드',
  '롯데카드',
  '하나카드',
  '우리카드',
  'BC카드',
  'NH농협카드',
] as const

// 카드는 카드사 외에 체크카드를 발급한 은행도 고를 수 있다
export const CARD_ISSUERS: readonly string[] = [...CARD_COMPANIES, ...BANKS]
