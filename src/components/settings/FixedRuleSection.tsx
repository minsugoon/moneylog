import { useMemo, useState } from 'react'
import { useLedger } from '../../hooks/useLedger.ts'
import { FIXED_TYPES, type FixedRule, type FixedType } from '../../lib/types.ts'
import { listFixedRuleCandidates } from '../../utils/fixedRuleCandidates.ts'
import ConfirmDialog from '../ConfirmDialog.tsx'
import { cardClass, chipClass, errorBoxClass, inputClass, primaryButtonClass, secondaryButtonClass } from '../ui.ts'

function FixedRuleSection() {
  const { fixedRules, transactions } = useLedger()
  const candidates = useMemo(
    () => fixedRules.loading || transactions.loading ? [] : listFixedRuleCandidates(transactions.items, fixedRules.items),
    [fixedRules.items, fixedRules.loading, transactions.items, transactions.loading],
  )
  const [keyword, setKeyword] = useState('')
  const [fixedType, setFixedType] = useState<FixedType>('기타고정')
  const [deleting, setDeleting] = useState<FixedRule | null>(null)
  const [busyId, setBusyId] = useState('')
  const [adding, setAdding] = useState(false)
  const [actionError, setActionError] = useState('')
  const [deleteError, setDeleteError] = useState('')

  async function handleAdd() {
    setAdding(true)
    setActionError('')
    const result = await fixedRules.add(keyword, fixedType)
    if (result.ok) setKeyword('')
    else setActionError(result.message)
    setAdding(false)
  }

  async function handleUpdate(rule: FixedRule, value: FixedType) {
    setBusyId(rule.id)
    setActionError('')
    const result = await fixedRules.update(rule.id, value)
    if (!result.ok) setActionError(result.message)
    setBusyId('')
  }

  async function handleDelete() {
    if (!deleting) return
    setBusyId(deleting.id)
    setDeleteError('')
    const result = await fixedRules.remove(deleting.id)
    setBusyId('')
    if (result.ok) setDeleting(null)
    else setDeleteError(result.message)
  }

  return (
    <section className={cardClass} aria-labelledby="fixed-rules-title">
      <h3 id="fixed-rules-title" className="text-sm font-bold text-gray-500">고정지출 규칙</h3>
      <p className="mt-1 text-xs text-gray-500">결제명에 이 키워드가 들어 있으면 입력할 때 고정지출로 자동으로 잡아 줘요. 규칙을 지워도 이미 저장한 내역은 바뀌지 않아요.</p>
      {actionError && <p className={`mt-3 ${errorBoxClass}`} role="alert">{actionError}</p>}
      <div className="mt-4">
        {fixedRules.loading ? (
          <p className="text-sm text-gray-500">규칙을 불러오고 있어요…</p>
        ) : fixedRules.error ? (
          <div className="flex flex-col items-start gap-2"><p className={errorBoxClass} role="alert">{fixedRules.error}</p><button type="button" onClick={() => void fixedRules.reload()} className={secondaryButtonClass}>다시 불러오기</button></div>
        ) : fixedRules.items.length === 0 ? (
          <p className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">아직 등록한 규칙이 없어요. 아래에서 추가하거나, 직접 입력할 때 ‘앞으로 자동으로’를 체크해 보세요.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {fixedRules.items.map((rule) => (
              <li key={rule.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-gray-50 p-3">
                <span className="min-w-0 flex-1 break-all text-sm text-gray-800">{rule.merchant_keyword}</span>
                <select aria-label={`${rule.merchant_keyword} 고정지출 종류`} value={rule.fixed_type} disabled={busyId !== '' || adding} onChange={(e) => void handleUpdate(rule, e.target.value as FixedType)} className={`${inputClass} w-auto min-w-28 flex-1`}>
                  {FIXED_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <button type="button" disabled={busyId !== '' || adding} onClick={() => { setDeleteError(''); setDeleting(rule) }} className={secondaryButtonClass}>삭제</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {candidates.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-bold text-gray-600">이미 입력한 고정지출에서 고르기</h4>
          <div className="mt-2 max-h-48 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {candidates.map((candidate) => (
                <button key={candidate.merchant} type="button" onClick={() => { setKeyword(candidate.merchant); setFixedType(candidate.fixedType) }} className={`${chipClass(false)} flex items-center gap-2`}>
                  <span>{candidate.merchant}</span>
                  <span className="text-xs">{candidate.fixedType} · {candidate.count}건</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} className={inputClass} lang="ko" maxLength={50} aria-label="키워드 추가" placeholder="키워드" />
        <select value={fixedType} onChange={(e) => setFixedType(e.target.value as FixedType)} disabled={adding || busyId !== ''} className={`${inputClass} sm:w-auto`} aria-label="추가할 고정지출 종류">
          {FIXED_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <button type="button" onClick={() => void handleAdd()} disabled={adding || busyId !== ''} className={primaryButtonClass}>{adding ? '추가하는 중…' : '추가'}</button>
      </div>
      {deleting && <ConfirmDialog title="규칙을 지울까요?" message={`‘${deleting.merchant_keyword}’ 규칙을 지워도 이미 저장한 내역은 그대로예요. 앞으로 입력하는 내역에만 자동으로 잡히지 않아요.`} confirmLabel="지우기" danger busy={busyId !== ''} error={deleteError} onConfirm={() => void handleDelete()} onCancel={() => setDeleting(null)} />}
    </section>
  )
}

export default FixedRuleSection
