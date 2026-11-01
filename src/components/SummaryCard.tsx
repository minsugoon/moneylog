interface SummaryCardProps {
  label: string
  amount: string
  sub?: string
  ariaLabel?: string
}

function SummaryCard({ label, amount, sub, ariaLabel }: SummaryCardProps) {
  return (
    <section aria-label={ariaLabel} className="rounded-2xl bg-brand p-5 text-white">
      <p className="text-sm font-bold text-white/90">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{amount}</p>
      {sub && <p className="mt-1 text-sm text-white/90">{sub}</p>}
    </section>
  )
}

export default SummaryCard
