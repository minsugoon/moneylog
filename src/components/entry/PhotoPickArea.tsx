import { useEffect, useState, type ChangeEvent } from 'react'

interface PhotoPickAreaProps {
  files: File[]
  kind: 'capture' | 'receipt'
  onSelect: (event: ChangeEvent<HTMLInputElement>) => void
  onRemove: (index: number) => void
  disabled?: boolean
}

function PhotoPickArea({ files, kind, onSelect, onRemove, disabled = false }: PhotoPickAreaProps) {
  const [urls, setUrls] = useState<string[]>([])

  useEffect(() => {
    if (!files.length || typeof URL.createObjectURL !== 'function') {
      setUrls([])
      return
    }
    const nextUrls = files.map((file) => URL.createObjectURL(file))
    setUrls(nextUrls)
    return () => nextUrls.forEach((url) => URL.revokeObjectURL(url))
  }, [files])

  const input = (label: string, multiple: boolean, capture?: 'environment') => (
    <label className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-3 text-center text-base text-gray-700 ${disabled ? 'opacity-50' : ''}`}>
      {label}
      <input type="file" accept="image/*" multiple={multiple} capture={capture} onChange={onSelect} className="sr-only" aria-label={label} disabled={disabled} />
    </label>
  )

  return (
    <div className="space-y-2">
      <div className="min-h-[168px] rounded-xl border-2 border-dashed border-gray-300 p-3">
        {files.length === 0 ? (
          <div className="flex min-h-[140px] flex-col items-center justify-center gap-2 text-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400" aria-hidden="true">
              <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
            <p className="text-sm text-gray-600">{kind === 'capture' ? '카드사 앱 캡처 화면을 골라 주세요 (최대 5장)' : '영수증 전체가 보이게 찍거나 골라 주세요 (최대 5장)'}</p>
          </div>
        ) : files.length === 1 ? (
          <div className="relative flex justify-center">
            {urls[0] && <img src={urls[0]} alt="선택한 사진 1" className="max-h-72 w-full object-contain" />}
            <button type="button" onClick={() => onRemove(0)} className="absolute right-1 top-1 min-h-11 min-w-11 rounded-lg bg-black/60 px-2 text-sm text-white" aria-label="사진 1 빼기">빼기</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="relative aspect-square overflow-hidden rounded-lg">
                {urls[index] && <img src={urls[index]} alt={`선택한 사진 ${index + 1}`} className="h-full w-full object-cover" />}
                <button type="button" onClick={() => onRemove(index)} className="absolute right-1 top-1 min-h-11 min-w-11 rounded-lg bg-black/60 px-2 text-sm text-white" aria-label={`사진 ${index + 1} 빼기`}>빼기</button>
              </div>
            ))}
          </div>
        )}
      </div>
      {kind === 'receipt' ? (
        <div className="grid grid-cols-2 gap-2">{input('영수증 사진 찍기', false, 'environment')}{input('사진 고르기', true)}</div>
      ) : (
        <div className="grid grid-cols-1">{input('이미지 고르기', true)}</div>
      )}
    </div>
  )
}

export default PhotoPickArea
