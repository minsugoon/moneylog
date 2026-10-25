import { useId, useRef, useState, type FormEvent } from 'react'
import { useLedger } from '../../hooks/useLedger.ts'
import type { TransactionInput } from '../../hooks/useTransactions.ts'
import { FIXED_TYPES, type FixedType, type Transaction } from '../../lib/types.ts'
import { shiftDate, todayString } from '../../utils/format.ts'
import { describePayments } from '../../utils/installment.ts'
import { readSetting, writeSetting } from '../../utils/storage.ts'
import AmountInput from '../AmountInput.tsx'
import { chipClass, errorBoxClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from '../ui.ts'
import AccountChips from './AccountChips.tsx'

const LAST_ACCOUNT_KEY = 'moneylog.lastAccountId'

interface EntryFormProps {
  // 사용일은 부모가 쥐고 있다 (입력 화면에서 하루 정리 카드가 같은 날짜를 따라가도록)
  date: string
  onDateChange: (date: string) => void
  // 있으면 이 내역을 고치는 폼, 없으면 새로 입력하는 폼
  initial?: Transaction
  onDone?: () => void
  onCancel?: () => void
}

// 지출 입력 폼. 저장하면 폼을 비우고 이어서 입력할 수 있다.
function EntryForm({ date, onDateChange, initial, onDone, onCancel }: EntryFormProps) {
  const { accounts, transactions } = useLedger()
  const idPrefix = useId()
  const merchantRef = useRef<HTMLInputElement>(null)
  const isEdit = Boolean(initial)

  // 고를 수 있는 결제수단: 사용 중인 것 + (고치는 내역이 쓰던 것)
  const choices = accounts.accounts.filter((a) => a.is_active || a.id === initial?.account_id)
  const [remembered] = useState(() => readSetting(LAST_ACCOUNT_KEY))
  // 사용자가 아직 고르지 않았으면 "마지막에 쓴 결제수단", 없으면 첫 번째 결제수단
  const [accountChoice, setAccountChoice] = useState<string | null>(initial ? (initial.account_id ?? '') : null)
  const defaultId = choices.find((a) => a.id === remembered)?.id ?? choices[0]?.id ?? ''
  const accountId = accountChoice ?? defaultId

  const [merchant, setMerchant] = useState(initial?.merchant ?? '')
  const [amount, setAmount] = useState<number | null>(initial?.amount ?? null)
  const [discount, setDiscount] = useState<number | null>(initial && initial.discount > 0 ? initial.discount : null)
  const [isCancel, setIsCancel] = useState(initial?.is_cancel ?? false)
  const [months, setMonths] = useState(initial?.installment_months ?? 1)
  const [interestFree, setInterestFree] = useState(initial?.interest_free ?? false)
  const [isFixed, setIsFixed] = useState(initial?.is_fixed ?? false)
  const [fixedType, setFixedType] = useState<FixedType>(initial?.fixed_type ?? '기타고정')
  const [memo, setMemo] = useState(initial?.memo ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setNotice('')
    const trimmedMerchant = merchant.trim()
    if (!date) return setError('사용일을 선택해 주세요.')
    if (!trimmedMerchant) return setError('결제명을 입력해 주세요.')
    if (amount === null || amount <= 0) return setError('금액을 입력해 주세요.')
    if ((discount ?? 0) > amount) return setError('할인이 금액보다 커요. 다시 확인해 주세요.')

    const input: TransactionInput = {
      account_id: accountId || null,
      used_at: date,
      merchant: trimmedMerchant,
      amount,
      discount: discount ?? 0,
      installment_months: months,
      is_fixed: isFixed,
      fixed_type: isFixed ? fixedType : null,
      memo: memo.trim() || null,
      is_cancel: isCancel,
      // 일시불에는 무이자 표시가 의미 없으므로 함께 해제한다
      interest_free: months > 1 && interestFree,
    }

    setBusy(true)
    setError('')
    const result = initial ? await transactions.update(initial.id, input) : await transactions.add(input)
    setBusy(false)
    if (!result.ok) return setError(result.message)

    if (initial) {
      onDone?.()
      return
    }
    // 연속 입력: 사용일과 결제수단은 두고 나머지만 비운다
    if (accountId) writeSetting(LAST_ACCOUNT_KEY, accountId)
    setMerchant('')
    setAmount(null)
    setDiscount(null)
    setIsCancel(false)
    setMonths(1)
    setInterestFree(false)
    setIsFixed(false)
    setFixedType('기타고정')
    setMemo('')
    setNotice('저장했어요. 이어서 입력할 수 있어요.')
    merchantRef.current?.focus()
  }

  const today = todayString()
  const yesterday = shiftDate(today, -1)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div>
        <label htmlFor={`${idPrefix}-date`} className={labelClass}>
          사용일
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id={`${idPrefix}-date`}
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className={`${inputClass} w-auto min-w-0 flex-1`}
          />
          <button type="button" onClick={() => onDateChange(today)} className={chipClass(date === today)}>
            오늘
          </button>
          <button type="button" onClick={() => onDateChange(yesterday)} className={chipClass(date === yesterday)}>
            어제
          </button>
        </div>
      </div>

      <div>
        <span className={labelClass}>결제수단</span>
        {accounts.loading ? (
          <p className="text-sm text-gray-500">결제수단을 불러오고 있어요…</p>
        ) : (
          <>
            <AccountChips accounts={choices} selectedId={accountId} onSelect={setAccountChoice} />
            {choices.length === 0 && (
              <p className="mt-2 text-xs text-gray-500">
                설정 탭에서 카드·통장·현금을 먼저 등록하면 여기서 버튼으로 고를 수 있어요.
              </p>
            )}
          </>
        )}
      </div>

      <div>
        <label htmlFor={`${idPrefix}-merchant`} className={labelClass}>
          결제명
        </label>
        <input
          id={`${idPrefix}-merchant`}
          ref={merchantRef}
          type="text"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          maxLength={100}
          placeholder="예) 편의점"
          lang="ko"
          autoComplete="off"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${idPrefix}-amount`} className={labelClass}>
            금액 (원)
          </label>
          <AmountInput id={`${idPrefix}-amount`} value={amount} onChange={setAmount} placeholder="0" />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-discount`} className={labelClass}>
            할인 (선택)
          </label>
          <AmountInput id={`${idPrefix}-discount`} value={discount} onChange={setDiscount} placeholder="0" />
        </div>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-months`} className={labelClass}>
          할부
        </label>
        <select
          id={`${idPrefix}-months`}
          value={months}
          onChange={(e) => {
            const next = Number(e.target.value)
            setMonths(next)
            if (next === 1) setInterestFree(false)
          }}
          className={inputClass}
        >
          {Array.from({ length: 36 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {m === 1 ? '일시불' : `${m}개월`}
            </option>
          ))}
        </select>
        {months > 1 && amount !== null && amount > 0 && (
          <p className="mt-1 text-xs text-gray-500">{describePayments(amount, discount ?? 0, months)}</p>
        )}
      </div>

      <div className="flex flex-col">
        <label className="flex min-h-11 items-center gap-3 text-base text-gray-700">
          <input
            type="checkbox"
            checked={isCancel}
            onChange={(e) => setIsCancel(e.target.checked)}
            className="h-5 w-5 accent-brand"
          />
          취소 건 (환불·결제 취소)
        </label>
        {months > 1 && (
          <label className="flex min-h-11 items-center gap-3 text-base text-gray-700">
            <input
              type="checkbox"
              checked={interestFree}
              onChange={(e) => setInterestFree(e.target.checked)}
              className="h-5 w-5 accent-brand"
            />
            무이자 할부
          </label>
        )}
        <label className="flex min-h-11 items-center gap-3 text-base text-gray-700">
          <input
            type="checkbox"
            checked={isFixed}
            onChange={(e) => setIsFixed(e.target.checked)}
            className="h-5 w-5 accent-brand"
          />
          고정지출 (매달 나가는 돈)
        </label>
        {isFixed && (
          <div className="mt-1">
            <label htmlFor={`${idPrefix}-fixed`} className="sr-only">
              고정지출 종류
            </label>
            <select
              id={`${idPrefix}-fixed`}
              value={fixedType}
              onChange={(e) => setFixedType(e.target.value as FixedType)}
              className={inputClass}
            >
              {FIXED_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label htmlFor={`${idPrefix}-memo`} className={labelClass}>
          메모 (선택)
        </label>
        <input
          id={`${idPrefix}-memo`}
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          maxLength={200}
          placeholder="한 줄 메모"
          lang="ko"
          autoComplete="off"
          className={inputClass}
        />
        <p className="mt-1 text-right text-xs text-gray-400">{memo.length} / 200</p>
      </div>

      {error && (
        <p className={errorBoxClass} role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800" role="status">
          {notice}
        </p>
      )}

      <div className="flex gap-2">
        {isEdit && (
          <button type="button" onClick={onCancel} disabled={busy} className={`flex-1 ${secondaryButtonClass}`}>
            취소
          </button>
        )}
        <button type="submit" disabled={busy} className={`flex-1 ${primaryButtonClass}`}>
          {busy ? '저장하는 중…' : isEdit ? '수정 저장' : '저장'}
        </button>
      </div>
    </form>
  )
}

export default EntryForm
