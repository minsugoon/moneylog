import { useState } from 'react'

export const PREVIEW_COUNT = 5

export function previewItems<T>(items: T[], expanded: boolean, limit = PREVIEW_COUNT): T[] {
  return expanded ? items : items.slice(0, limit)
}

export function useExpandableList<T>(items: T[]): { visible: T[]; hiddenCount: number; expanded: boolean; toggle: () => void } {
  const [expanded, setExpanded] = useState(false)
  return {
    visible: previewItems(items, expanded),
    hiddenCount: Math.max(0, items.length - PREVIEW_COUNT),
    expanded,
    toggle: () => setExpanded((value) => !value),
  }
}
