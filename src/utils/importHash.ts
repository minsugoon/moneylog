export type ImportKeyInput = {
  date: string
  time: string | null
  merchant: string
  amount: number
  isCancel: boolean
}

export function normalizeMerchant(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\uAC00-\uD7A3]/g, '')
}

export function makeImportKey(input: ImportKeyInput, accountId: string): string {
  return [
    accountId,
    input.date,
    input.time ?? '',
    normalizeMerchant(input.merchant),
    String(input.amount),
    input.isCancel ? 'C' : 'P',
  ].join('|')
}

function hash53(text: string): string {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57

  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ code, 2654435761)
    h2 = Math.imul(h2 ^ code, 1597334677)
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  const value = (BigInt(h2 >>> 0) << 32n) | BigInt(h1 >>> 0)
  return (value & 0x1fffffffffffffn).toString(16).padStart(14, '0')
}

export function makeImportHash(key: string, ordinal = 1): string {
  // 같은 지문이 한 번에 여러 건이면 2번째부터 순번을 눈에 보이게 붙인다 (DB의 유일 규칙을 지키기 위해)
  const base = `v1:${hash53(key)}`
  return ordinal >= 2 ? `${base}#${ordinal}` : base
}
