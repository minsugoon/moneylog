const messageMarker = /(?=\[(?:Web발신|국제발신|SMS)\])/g
const ignoredLine = /^(?:오전|오후)\s+\d{1,2}:\d{2}$|^\d{4}년\s+\d{1,2}월\s+\d{1,2}일\s+.+요일$/

export function splitMessages(text: string): string[] {
  const cleaned = text
    .split(/\r?\n/)
    .filter((line) => !ignoredLine.test(line.trim()))
    .join('\n')
    .trim()
  if (!cleaned) return []

  const messages = /\[(?:Web발신|국제발신|SMS)\]/.test(cleaned)
    ? cleaned.split(messageMarker)
    : cleaned.split(/\n\s*\n/)

  return messages.map((message) => message.trim()).filter(Boolean)
}
