// 기기에 작은 설정(마지막 결제수단, 보기 기준 등)을 기억한다.
// 사생활 보호 모드 등에서는 저장이 막힐 수 있으므로, 실패해도 앱이 멈추지 않게 감싼다.
// 내역·메모 같은 개인 기록은 여기에 저장하지 않는다.

export function readSetting(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeSetting(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // 저장이 막힌 환경에서는 기억을 못 할 뿐이라 그냥 넘어간다
  }
}
