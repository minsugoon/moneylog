import type { TabKey } from '../components/layout/navItems.ts'
import { readSetting, writeSetting } from './storage.ts'

export interface TourStep { target: string | null; title: string; body: string }

// 탭별 안내 내용을 정의한다.
export const TOURS: Record<TabKey, TourStep[]> = {
  list: [
    { target: null, title: 'Moneylog에 오신 걸 환영해요', body: '카드·통장·현금 지출을 적고, 어디에 얼마 썼는지 한눈에 보는 가계부예요. 화면을 하나씩 짧게 안내할게요.' },
    { target: 'nav-settings', title: '먼저 결제수단을 등록하세요', body: '설정에서 쓰는 카드·통장·현금을 등록하면 지출을 입력할 때 버튼으로 고를 수 있어요.' },
    { target: 'nav-entry', title: '지출은 입력 탭에서', body: '직접 입력, 문자 붙여넣기, 사진 입력(영수증·카드사 앱 캡처) 중 편한 방법으로 넣어요.' },
    { target: 'history-month', title: '달 이동과 보기 기준', body: '달을 옮기고, 할부를 쓴 달에 전액으로 볼지(사용일 기준) 매달 나눠 볼지(월 납부액 기준) 골라요.' },
    { target: 'history-summary', title: '이번 달 합계', body: '선택한 달에 쓴 금액과 건수예요. 외화로 적은 내역은 환율로 계산한 값이라 ≈가 붙어요.' },
    { target: 'history-performance', title: '카드 실적 알림', body: '목표가 가까운 카드 실적이 있으면 여기에 보여요. 누르면 자세히 볼 수 있어요.' },
    { target: 'history-list', title: '날짜별 내역', body: '내역을 누르면 고치거나 지울 수 있어요. 날짜 아래에는 그날의 하루 정리가 보여요.' },
    { target: null, title: '언제든 다시 볼 수 있어요', body: '설정 → 도움말에서 이 안내를 다시 보거나 기능별 사용법을 찾아볼 수 있어요.' },
  ],
  entry: [
    { target: 'entry-methods', title: '입력 방법 3가지', body: '✍️ 직접 입력, 💬 문자 붙여넣기(카드·은행 문자 여러 건), 📷 사진 입력(영수증·카드사 앱 캡처를 AI가 읽어요) 중에서 골라요.' },
    { target: 'entry-fixed-load', title: '고정지출 불러오기', body: '등록한 고정지출을 누르면 결제명·금액·결제수단이 한 번에 채워져요.' },
    { target: 'entry-amount', title: '금액과 외화', body: '금액을 넣어요. 해외에서 쓴 돈은 아래 ‘통화 변경’을 펼쳐 현지 통화로 넣으면 원화로 바꿔 저장해요.' },
    { target: 'entry-account', title: '결제수단', body: '어떤 카드·통장·현금으로 냈는지 골라요. 마지막에 쓴 결제수단을 기억해요.' },
    { target: 'entry-fixed', title: '고정지출로 저장', body: '매달 나가는 돈이면 켜 두세요. 저장하면 고정지출 목록에도 자동으로 들어가요.' },
    { target: 'entry-save', title: '저장', body: '저장하면 칸이 비워져서 이어서 입력할 수 있어요. 할부·할인·취소·메모도 함께 적을 수 있어요.' },
  ],
  view: [
    { target: 'views-tabs', title: '4가지 보기', body: '기간별(달마다 쓴 돈), 결제수단별, 고정지출, 카드 실적을 골라 봐요.' },
    { target: 'views-basis', title: '사용일 / 월 납부액 기준', body: '할부를 쓴 달에 전액으로 볼지, 매달 나눠 낸 금액으로 볼지 바꿔요.' },
    { target: 'views-content', title: '결과 보기', body: '카드 실적에서는 목표까지 남은 금액과 받을 혜택, 아직 결제되지 않은 고정지출(주황 막대)을 함께 보여 줘요. 내 입력 기준 참고용이에요.' },
  ],
  settings: [
    { target: 'settings-accounts', title: '1. 결제수단 등록', body: '‘+ 추가’를 눌러 종류(카드·통장·현금), 카드사·은행, 별칭, 끝 4자리를 넣어요. 끝 4자리만 저장하고 전체 번호는 저장하지 않아요. 순서 바꾸기와 사용 중지도 여기서 해요.' },
    { target: 'settings-card-programs', title: '2. 카드 실적 조건', body: '‘+ 실적 조건 추가’에서 대상 카드, 월 목표 금액, 전월/당월 실적, 측정 시작일, 할부 인정 방식, 무이자 할부 처리를 정해요. 카드사 앱의 실적 조건을 그대로 옮겨 적으면 돼요.' },
    { target: 'settings-card-programs', title: '3. 실적 혜택', body: '각 조건의 ‘혜택 관리 🔽’에서 실적을 채우면 받는 할인(예: 30만원 이상 → 렌탈비 1만원)을 적어요. 연결 결제명을 적으면 고정지출 보기에 ‘실적 달성 시 -○원’이 나와요.' },
    { target: 'settings-fixed', title: '4. 고정지출', body: '결제명·결제수단·금액·결제일·분류를 등록해요. 지출을 고정지출로 저장하면 자동으로 들어오고, 카드 실적의 결제 예정 금액도 이 목록으로 계산해요.' },
    { target: 'settings-fixed-types', title: '5. 고정지출 분류', body: '통신·보험 말고도 대출이자처럼 분류를 직접 추가하고 이름을 바꿀 수 있어요.' },
    { target: 'settings-currency', title: '6. 통화', body: '외화로 입력할 때 보여 줄 통화에 체크해요. 현재 환율도 여기서 봐요.' },
    { target: 'settings-ai', title: '7. 사진 입력(AI)', body: '영수증·캡처를 AI가 읽어요. 처음 쓸 때 동의가 필요하고, 한 달에 20장까지 쓸 수 있어요.' },
    { target: 'settings-help', title: '도움말', body: '기능별 사용법과 자주 묻는 질문을 모아 뒀어요. 각 화면의 안내도 여기서 다시 볼 수 있어요.' },
  ],
}

// ---- 이 기기에 저장하는 "안내 봤음" 기록 ----
export const TOUR_SEEN_KEY = 'moneylog.tourSeen'
const TAB_KEYS: TabKey[] = ['list', 'entry', 'view', 'settings']

// 저장된 본 기록에서 유효한 탭만 골라낸다.
export function parseSeen(raw: string | null): TabKey[] {
  if (raw === null) return []
  try {
    const value: unknown = JSON.parse(raw)
    return Array.isArray(value) ? value.filter((item): item is TabKey => TAB_KEYS.includes(item as TabKey)) : []
  } catch {
    return []
  }
}

// 현재 기기에서 탭 안내를 본 기록이 있는지 확인한다.
export function isTourSeen(tab: TabKey): boolean {
  return parseSeen(readSetting(TOUR_SEEN_KEY)).includes(tab)
}

// 현재 탭 안내를 본 것으로 저장한다.
export function markTourSeen(tab: TabKey): void {
  const seen = parseSeen(readSetting(TOUR_SEEN_KEY))
  if (!seen.includes(tab)) writeSetting(TOUR_SEEN_KEY, JSON.stringify([...seen, tab]))
}

// 현재 탭 안내 기록을 지운다.
export function resetTour(tab: TabKey): void {
  writeSetting(TOUR_SEEN_KEY, JSON.stringify(parseSeen(readSetting(TOUR_SEEN_KEY)).filter((item) => item !== tab)))
}
