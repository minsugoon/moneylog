# 작업 {{id}}: {{title}}

> 이 파일은 Codex에게 그대로 전달됩니다. 애매한 표현 없이 구체적으로 적습니다.

## 목표
(무엇을 만드는지 2~4줄. 사용자가 보게 될 동작과 결과 중심으로)

## 완료 기준 (모두 만족해야 끝)
- [ ] (예: `utils/parsers/shinhanCard.ts`가 샘플 5건을 모두 `{ date, merchant, amount, installment, isCancel, interestFree, accountHint, raw }` 모양으로 돌려준다)
- [ ] (예: 같은 폴더에 샘플 문자열을 넣은 테스트 파일이 있고 통과한다)
- [ ] `npx tsc -b`, `npm test`, `npm run build`가 모두 통과한다

## 수정해도 되는 경로 (이 밖은 수정 금지)
{{allow}}

## 건드리면 안 되는 것
- 보호 경로(`.agent/policy.json`의 protectedPaths)와 공유 파일은 수정하지 않는다
- 새 패키지를 설치하지 않는다 (필요하면 `blocked`로 보고)
- 명세에 없는 기능을 추가하지 않는다

## 참고할 문서·기존 코드
- (예: docs/PARSER_SPEC.md 3장, src/utils/format.ts)

## 예상 크기
파일 {{files}}개 이하, 변경 {{lines}}줄 이하
