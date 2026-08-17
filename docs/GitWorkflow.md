# GitWorkflow — {{PROJECT_NAME}}

> 소유자: 사용자 | implementer는 이 규칙대로만 커밋한다.

## 금지

- main 브랜치 직접 커밋 금지.
- force push 금지 (사용자가 명시 요청한 경우만 예외).
- 사용자 요청 없는 커밋·푸시 금지.
- `--no-verify` 등 훅 우회 금지.

## 브랜치 전략

| 브랜치 | 용도 | 규칙 |
|---|---|---|
| main | 항상 동작하는 상태 | PR 병합으로만 갱신 |
| feat/{작업ID}-{설명} | 기능 구현 | Tasks.md의 ID 사용 (예: feat/T-01-login) |
| fix/{설명} | 버그 수정 | |

## 커밋 메시지 (Conventional Commits)

```
{type}: {한 줄 요약}
```

| type | 용도 |
|---|---|
| feat | 기능 추가 |
| fix | 버그 수정 |
| docs | 문서만 변경 |
| refactor | 동작 불변 구조 변경 |
| test | 테스트만 변경 |
| chore | 빌드·설정 등 그 외 |

## 병합 조건

- [ ] DefinitionOfDone.md 전부 통과
- [ ] 리뷰 보고서에 치명 결함 0건
