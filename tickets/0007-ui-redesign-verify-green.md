# Ticket 0007: ui-redesign — довести `npm run -s verify` до PASS + PR auto-merge

## Status
- **State**: READY
- **Owner**: Cursor Agent
- **Branch**: `ui-redesign`
- **Target**: `main`

## Context
Нужно довести UI-редизайн до “зелёного” локального verify и влить в `main`, чтобы дашборд стал “как на днях”.

Есть симптом: `npm run -s verify` “обрывается/молчит”. Нужно собрать полный лог (через `tee`) и минимально починить причину падения.

## Scope (what to do)
1) **Locate**: выяснить, почему `npm run -s verify` обрывается/молчит, собрать полный лог через `tee`.
2) **Implement**: минимально починить причину падения (изменения **не более 5 файлов**).
3) **Verify**: `npm run -s verify` проходит (PASS).
4) **Delivery**: создать/обновить PR `ui-redesign -> main` и включить auto-merge (**squash**, **delete branch**).

## Non-goals
- Не делать рефакторинг “заодно”.
- Не менять версии зависимостей, если это не требуется для фикса verify.

## Acceptance criteria
- [ ] Сохранён полный лог `npm run -s verify` (через `tee`) и понятно, где/почему обрывалось.
- [ ] Причина падения устранена **минимальным** патчем (≤5 файлов).
- [ ] `npm run -s verify` завершается успешно (exit 0).
- [ ] PR `ui-redesign -> main` создан/обновлён; включён auto-merge: squash + delete branch.

## Verification commands
Запускать из корня репо:

```bash
set -o pipefail
npm run -s verify 2>&1 | tee verify.ui-redesign.log
```

Ожидаемое:
- Команда завершается с exit code 0
- В логе есть итоговый PASS/успешное завершение verify пайплайна

## Rollback plan
- Отключить auto-merge у PR (если включили).
- Revert squash-merge коммит в `main`.
- Перезапустить `npm run -s verify` на `main` и убедиться в стабильности.


