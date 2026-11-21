export interface Box { top: number; left: number; width: number; height: number }

// 강조 상자를 사방으로 넓힌다.
export function spotlightBox(rect: Box, padding = 6): Box {
  return { top: rect.top - padding, left: rect.left - padding, width: rect.width + padding * 2, height: rect.height + padding * 2 }
}

// 대상과 화면 크기에 맞춰 말풍선 위치를 계산한다.
export function placeTooltip(
  target: Box | null,
  viewport: { width: number; height: number },
  size: { width: number; height: number },
  gap = 12,
  margin = 16,
): { top: number; left: number; side: 'below' | 'above' | 'center' } {
  if (!target) return { top: Math.max(margin, (viewport.height - size.height) / 2), left: Math.max(margin, (viewport.width - size.width) / 2), side: 'center' }
  const bottomSpace = viewport.height - (target.top + target.height) - gap - margin
  const topSpace = target.top - gap - margin
  let side: 'below' | 'above' = 'below'
  let top: number
  if (bottomSpace >= size.height) top = target.top + target.height + gap
  else if (topSpace >= size.height) { side = 'above'; top = target.top - gap - size.height }
  else top = Math.min(Math.max(target.top + target.height + gap, margin), Math.max(margin, viewport.height - size.height - margin))
  const desiredLeft = target.left + (target.width - size.width) / 2
  const left = size.width + margin * 2 > viewport.width ? margin : Math.min(Math.max(desiredLeft, margin), viewport.width - size.width - margin)
  return { top, left, side }
}
