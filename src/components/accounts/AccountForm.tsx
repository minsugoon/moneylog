import { useState, type FormEvent } from 'react'
import type { AccountInput } from '../../hooks/useAccounts.ts'
import type { ActionResult } from '../../lib/errors.ts'
import type { Account, AccountKind } from '../../lib/types.ts'
import { ACCOUNT_KIND_LABEL } from '../../utils/format.ts'
import { BANKS, CARD_ISSUERS } from '../../utils/issuers.ts'
import { chipClass, errorBoxClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from '../ui.ts'

const CUSTOM = '__custom'
const KINDS: AccountKind[] = ['card', 'account', 'cash']

interface AccountFormProps {
  // 있으면 수정, 없으면 새로 추가
  initial?: Account
  onSubmit: (input: AccountInput) => Promise<ActionResult>
  onCancel: () => void
}

function issuerListFor(kind: AccountKind): readonly string[] {
  return kind === 'card' ? CARD_ISSUERS : BANKS
}

// 결제수단 추가·수정 폼. 전체 카드번호·계좌번호는 받지 않고 끝 4자리만 받는다.
function AccountForm({ initial, onSubmit, onCancel }: AccountFormProps) {
  const [kind, setKind] = useState<AccountKind>(initial?.kind ?? 'card')
  const [issuerChoice, setIssuerChoice] = useState(() => {
    if (!initial?.issuer) return ''
    return issuerListFor(initial.kind).includes(initial.issuer) ? initial.issuer : CUSTOM
  })
  const [customIssuer, setCustomIssuer] = useState(() =>
    initial?.issuer && !issuerListFor(initial.kind).includes(initial.issuer) ? initial.issuer : '',
  )
  const [name, setName] = useState(initial?.name ?? '')
  const [last4, setLast4] = useState(initial?.last4 ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function handleKindChange(next: AccountKind) {
    setKind(next)
    setIssuerChoice('')
    setCustomIssuer('')
    // 현금은 이름이 거의 정해져 있으므로 미리 채워 준다
    if (next === 'cash' && name.trim() === '') setName('현금')
    if (next !== 'cash' && name === '현금') setName('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('별칭을 입력해 주세요.')
      return
    }
    if (kind !== 'cash' && last4 !== '' && !/^\d{4}$/.test(last4)) {
      setError('끝 4자리는 숫자 4개로 입력해 주세요.')
      return
    }

    const issuer =
      kind === 'cash' ? null : issuerChoice === CUSTOM ? customIssuer.trim() || null : issuerChoice || null

    setBusy(true)
    setError('')
    const result = await onSubmit({
      name: trimmedName,
      kind,
      issuer,
      last4: kind === 'cash' || last4 === '' ? null : last4,
    })
    // 성공하면 부모가 이 창을 닫는다. 실패했을 때만 여기에 남아 안내한다.
    if (!result.ok) {
      setError(result.message)
      setBusy(false)
    }
  }

  const showIssuer = kind !== 'cash'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <fieldset>
        <legend className={labelClass}>종류</legend>
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => handleKindChange(k)}
              className={chipClass(kind === k)}
            >
              {ACCOUNT_KIND_LABEL[k]}
            </button>
          ))}
        </div>
      </fieldset>

      {showIssuer && (
        <div>
          <label htmlFor="account-issuer" className={labelClass}>
            {kind === 'card' ? '카드사 · 은행' : '은행'}
          </label>
          <select
            id="account-issuer"
            value={issuerChoice}
            onChange={(e) => setIssuerChoice(e.target.value)}
            className={inputClass}
          >
            <option value="">선택 안 함</option>
            {issuerListFor(kind).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
            <option value={CUSTOM}>직접 입력</option>
          </select>
          {issuerChoice === CUSTOM && (
            <input
              type="text"
              aria-label="직접 입력한 은행 또는 카드사 이름"
              value={customIssuer}
              onChange={(e) => setCustomIssuer(e.target.value)}
              maxLength={20}
              lang="ko"
              placeholder="예) 우리금융캐피탈"
              className={`mt-2 ${inputClass}`}
            />
          )}
        </div>
      )}

      <div>
        <label htmlFor="account-name" className={labelClass}>
          별칭
        </label>
        <input
          id="account-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          lang="ko"
          placeholder={kind === 'card' ? '예) 생활카드' : kind === 'account' ? '예) 월급통장' : '현금'}
          autoComplete="off"
          className={inputClass}
        />
      </div>

      {showIssuer && (
        <div>
          <label htmlFor="account-last4" className={labelClass}>
            끝 4자리 (선택)
          </label>
          <input
            id="account-last4"
            type="text"
            inputMode="numeric"
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
            maxLength={4}
            placeholder="1234"
            autoComplete="off"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-500">
            전체 카드번호·계좌번호는 입력하지 마세요. 구분용으로 끝 4자리만 저장해요.
          </p>
        </div>
      )}

      {error && (
        <p className={errorBoxClass} role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={onCancel} disabled={busy} className={`flex-1 ${secondaryButtonClass}`}>
          취소
        </button>
        <button type="submit" disabled={busy} className={`flex-1 ${primaryButtonClass}`}>
          {busy ? '저장하는 중…' : initial ? '수정 저장' : '추가'}
        </button>
      </div>
    </form>
  )
}

export default AccountForm
