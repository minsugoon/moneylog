// 여러 화면이 같이 쓰는 모양(Tailwind 클래스). 버튼은 44px 이상, 입력창 글자는 16px 이상으로 맞춘다.

export const cardClass = 'rounded-2xl bg-white p-5 shadow-sm'

export const inputClass =
  'min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-base text-gray-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30'

export const labelClass = 'mb-1 block text-sm font-bold text-gray-600'

export const primaryButtonClass =
  'min-h-11 rounded-lg bg-brand px-4 text-base font-bold text-white hover:opacity-90 disabled:opacity-50'

export const secondaryButtonClass =
  'min-h-11 rounded-lg border border-gray-300 bg-white px-4 text-base text-gray-700 hover:bg-gray-50 disabled:opacity-50'

export const dangerButtonClass =
  'min-h-11 rounded-lg bg-red-600 px-4 text-base font-bold text-white hover:bg-red-700 disabled:opacity-50'

export const errorBoxClass = 'rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700'

// 켜고 끄는 선택 버튼 (칩)
export function chipClass(selected: boolean): string {
  return `min-h-11 rounded-full border px-4 text-base ${
    selected ? 'border-brand bg-brand font-bold text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
  }`
}
