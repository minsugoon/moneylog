const messageMarker = /(?=\[(?:Web발신|국제발신|SMS)\])/g
const ignoredLine = /^(?:오전|오후)\s+\d{1,2}:\d{2}$|^\d{4}년\s+\d{1,2}월\s+\d{1,2}일\s+.+요일$/

// 카톡에서 복사할 때 붙는 "[민수_IOS]", "[오전 10:52]" 같은 보낸 사람·시각 표시.
// 줄 앞·뒤·가운데 어디에 붙어 있어도 지운다. ([Web발신] 같은 문자 표시는 남긴다)
const chatMeta = new RegExp(
  [
    String.raw`\[(?!Web발신|국제발신|SMS)[^\[\]\n]+\]\s*\[\s*(?:오전|오후)\s*\d{1,2}:\d{2}\s*\]`, // [민수_IOS][오전 10:52]
    String.raw`\[\s*(?:오전|오후)\s*\d{1,2}:\d{2}\s*\]`, // [오전 10:52]
    String.raw`\[[^\[\]\n]*_(?:IOS|Android|AOS|PC|MAC)\]`, // [민수_IOS]
  ].join('|'),
  'gi',
)

// 메타 표시를 지운다. 지워서 빈 줄이 된 줄은 null (빈 줄이 문자 구분으로 오해되지 않게 버린다)
function stripChatMeta(line: string): string | null {
  const stripped = line.replace(chatMeta, ' ').trim()
  return stripped === '' && line.trim() !== '' ? null : stripped
}

export function splitMessages(text: string): string[] {
  const cleaned = text
    .split(/\r?\n/)
    .map(stripChatMeta)
    .filter((line): line is string => line !== null && !ignoredLine.test(line))
    .join('\n')
    .trim()
  if (!cleaned) return []

  const messages = /\[(?:Web발신|국제발신|SMS)\]/.test(cleaned)
    ? cleaned.split(messageMarker)
    : cleaned.split(/\n\s*\n/)

  return messages.map((message) => message.trim()).filter(Boolean)
}
