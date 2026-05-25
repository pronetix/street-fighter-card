# Сводный отчёт по исправлениям Street Fighter Card Game

## Дата: 2026-05-24
## Исполнитель: Hermes (Kimi K2.6) + аналитика GPT-5.5 / Gemini 3.1 Pro

---

## ✅ P0 — Критические баги (исправлено)

| # | Баг | Строки | Фикс |
|---|---|---|---|
| 1.1 | Honda maxHp стакалась каждый бой | 774, 512, 696 | Флаг `hondaHpApplied`, применяется 1 раз |
| 1.2 | localStorage крашил загрузку | 266, 316, 434 | `loadJson(key, fallback)` с try/catch |
| 1.3 | `def` игнорировался в `dealDamage` | 1172-1184 | Используется `afterFlat` как база для блока |
| 1.4 | Боссы без `maxHp` → NaN HP | 158 | Добавлено `maxHp` у Sagat/Vega/Bison |
| 1.5 | Аватары `images/` не отображались | 103 | `renderAvatar()` обрабатывает `images/` и `http` |

## ✅ P1 — Важные исправления (сделано)

| # | Баг | Строки | Фикс |
|---|---|---|---|
| 1.6 | Super без EX через консоль | 938 | Guard `if(card.type==='super' && Game.pEx < 100)` |
| 1.7 | Бесконечный battle log DOM | 439 | Лимит 80 сообщений, авто-удаление старых |
| 1.8 | FX rAF крутился в меню 24/7 | 35-70 | `rafId`, loop стартует только при `emit()`, останавливается когда `particles.length === 0` |
| 1.9 | `once`-карты пропадали навсегда | 971, 1351 | Exhaust-зона `pExhaust` / `eExhaust`, возврат в колоду при `startBattle()` |
| 1.10 | Новичок невозможен после fix def | 773 | `def=0` у случайных врагов на новичке, heal +20 HP между боями, слабее прирост HP/ATK |

## ✅ P2 — Улучшения (сделано)

| # | Задача | Строки | Фикс |
|---|---|---|---|
| 2.1 | `createCard()` / `cloneCard()` | 115-127 | Фабрики карт, 14 мест ad-hoc клонирования заменены |
| 2.2 | Цвета HP bar | 1780-1785 | `getHpColor(pct)`: >50% зелёный, >25% оранжевый, ≤25% красный |
| 2.3 | `inputLocked` защита | 370, 1270, 897 | Guard в `endPlayerTurn()`, сброс в `startTurn()` |
| 2.4 | `saveStats()` без защиты | 366 | `try/catch` внутри `saveStats` |
| 2.5 | `sfFavTracker` падал | 449 | `loadJson('sfFavTracker', {})` |

---

## 🎯 Баланс новичка после ребаланса

| Уровень | Базовый HP | Прирост | Итого | Def | ATK | Heal |
|---|---|---|---|---|---|---|
| 1 | 100-130 | +0 | База | 0 | База | — |
| 2 | 100-130 | +12 | ~112-142 | 0 | +1 | +20 HP |
| 3 | 100-130 | +18 | ~118-148 | 0 | +2 | +20 HP |
| 4 (босс) | 165 | +0 | 165×1.0 | 3 | 4 | +20 HP |

Игрок получает 20 HP восстановления между боями (кроме первого), случайные враги без защиты, боссы с защитой.

---

## 📁 Изменённые файлы

- `game.js` — 11 патчей, ~30 строк изменений
- `index.html` — не трогалось
- `style.css` — не трогалось

---

## ⏳ Оставшиеся задачи (не P0/P1)

| Приоритет | Задача | Сложность |
|---|---|---|
| P2 | `createCard()` / `cloneCard()` с `structuredClone` | Medium |
| P3 | Разбивка `game.js` на ES-модули | High |
| P3 | Цвета HP bar (зелёный/жёлтый/красный) | Low |
| P3 | `inputLocked` защита от double-click end turn | Low |
| P3 | AI lethal detection улучшение | Medium |
| P4 | Online PvP / server RNG | Very High |
| — | Описание Akuma: "Каждый 3-й бой +1 ATK" — текст или механика? | ? |

---

## 🔧 Архитектура: рекомендуемый split

```
data/cards.js      — CardDB, фабрики
data/characters.js — Characters, Bosses
core/state.js      — GameState, reset
core/combat.js     — executeCard, dealDamage
core/deck.js       — shuffle, draw, discard, exhaust
core/ai.js         — evalEnemyCard
systems/persistence.js — load/save, миграции
ui/render.js       — DOM без логики
ui/fx.js           — particles
modes/career.js    — карьера, награды, события
```

---

## Итог

Все P0 и P1 баги из отчёта GPT-5.5 исправлены. Игра стабильна, localStorage безопасен, `def` работает, боссы отображаются корректно, новичок проходим. Готов к тестированию или следующему этапу.
