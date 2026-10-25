import { useCallback, useState } from 'react'
import type { ViewBasis } from '../utils/installment.ts'
import { readSetting, writeSetting } from '../utils/storage.ts'

const KEY = 'moneylog.viewBasis'

// "사용일 기준 / 월 납부액 기준" 선택을 이 기기에 기억한다. 처음에는 사용일 기준.
export function useViewBasis(): [ViewBasis, (basis: ViewBasis) => void] {
  const [basis, setBasis] = useState<ViewBasis>(() => (readSetting(KEY) === 'payment' ? 'payment' : 'usage'))

  const update = useCallback((next: ViewBasis) => {
    setBasis(next)
    writeSetting(KEY, next)
  }, [])

  return [basis, update]
}
