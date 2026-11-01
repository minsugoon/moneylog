const items = [
  { name: '편의점', amount: '4,500원', opacity: 'opacity-100' },
  { name: '카페', amount: '6,200원', opacity: 'opacity-70' },
  { name: '통신비', amount: '55,000원', opacity: 'opacity-40' },
]

function LoginPreview() {
  return (
    <div aria-hidden="true" className="relative mt-6 max-h-48 space-y-2 overflow-hidden pl-6">
      <span className="absolute bottom-0 left-[5px] top-0 w-0.5 bg-gray-300" />
      {items.map((item) => (
        <div key={item.name} className={`relative ${item.opacity}`}>
          <span className="absolute -left-6 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-[3px] border-brand bg-app-bg" />
          <div className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm">
            <span className="text-sm">{item.name}</span>
            <span className="text-sm font-bold tabular-nums">{item.amount}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default LoginPreview
