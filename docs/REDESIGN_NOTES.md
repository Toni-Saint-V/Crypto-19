# Redesign Notes - Принятые дефолты

## Дефолты (где деталей не хватало)

1. **Right Panel ширина**: 380px (фикс, не адаптивная)
2. **Bottom Drawer**: collapsed 48px, expanded max 40vh (не 45vh для безопасности)
3. **TopBar высота**: 56px (14 * 4px grid)
4. **KPI Row высота**: 80px (20 * 4px grid)
5. **Chart min-height**: не задан явно, полагается на flex-1 + min-h-0
6. **Toast уведомления**: пока console.log (можно заменить на toast library позже)
7. **Градиенты режимов**: мягкие (opacity 0.15-0.1), не доминирующие
8. **Анимации**: 150-220ms ease-out (стандарт)
9. **Tabular numbers**: применены только к KPI значениям (не везде)
10. **Empty states**: простой текст "—" или "No data", без иконок (можно добавить позже)

## Технические решения

- **Race guards**: modeVersionRef + AbortController для всех async операций
- **Изоляция режимов**: полный сброс стейта при переключении (кроме базовых настроек)
- **100vh layout**: строго через h-screen + overflow-hidden на корне
- **CSS variables**: все цвета/отступы через токены, никаких хардкод hex (кроме редких случаев в графике)

## Что не реализовано (но заложено)

- Skeleton states для всех компонентов (только в KPIRow)
- Tooltip-card для графика (нужна интеграция с lightweight-charts)
- Legend pills для графика (нужна интеграция с lightweight-charts)
- Multi-curve overlays (нужна интеграция с lightweight-charts)
- Виртуализация таблиц (для больших списков trades)

## Следующие шаги

1. Интеграция tooltip/legend с TradingChart
2. Добавление Skeleton states везде
3. Замена console.log на toast library
4. Оптимизация таблиц (виртуализация)

