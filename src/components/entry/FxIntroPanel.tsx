function FxIntroPanel() {
  return (
    <div className="flex min-h-[13rem] flex-col justify-center gap-2 px-1">
      <p className="text-sm font-bold text-gray-800">해외에서 쓴 금액, 현지 통화로 바로 입력해요</p>
      <p className="text-sm text-gray-700">위에서 통화를 밀어서 고르면 지금 환율로 원화로 바꿔 저장해요.</p>
      <p className="text-xs text-gray-600">카드 명세서가 나오면 원화 금액을 청구액으로 고쳐서 확정할 수 있어요.</p>
      <p className="text-xs text-gray-600">환율은 입력하는 순간의 값이 내역에 함께 저장돼요.</p>
    </div>
  )
}

export default FxIntroPanel
