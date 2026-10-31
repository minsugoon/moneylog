import { describe, expect, it } from 'vitest'
import { fitWithin, MAX_EDGE } from './imageResize.ts'

describe('fitWithin', () => {
  it('작은 이미지는 크기를 유지한다', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 })
  })

  it('가로로 긴 이미지의 비율을 유지한다', () => {
    expect(fitWithin(3000, 1000)).toEqual({ width: 1568, height: 523 })
  })

  it('세로로 긴 이미지의 비율을 유지한다', () => {
    expect(fitWithin(1000, 3000)).toEqual({ width: 523, height: 1568 })
  })

  it('경계값 크기는 유지한다', () => {
    expect(fitWithin(MAX_EDGE, 900)).toEqual({ width: MAX_EDGE, height: 900 })
  })

  it('0 이하 입력은 최소 크기를 반환한다', () => {
    expect(fitWithin(0, -1)).toEqual({ width: 1, height: 1 })
  })

  it('결과는 항상 1 이상 정수다', () => {
    const size = fitWithin(1, 10000)
    expect(Number.isInteger(size.width) && size.width >= 1).toBe(true)
    expect(Number.isInteger(size.height) && size.height >= 1).toBe(true)
  })
})
