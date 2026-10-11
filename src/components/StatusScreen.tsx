interface StatusScreenProps {
  title: string
  message?: string
}

// 화면 전체를 쓰는 안내 문구 (로딩 중, 설정 필요 등)
function StatusScreen({ title, message }: StatusScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center" role="status">
      <p className="mb-4 text-2xl font-bold text-brand">Moneylog</p>
      <p className="text-base font-bold text-gray-700">{title}</p>
      {message && <p className="mt-2 max-w-sm text-sm text-gray-500">{message}</p>}
    </div>
  )
}

export default StatusScreen
