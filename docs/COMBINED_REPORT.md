# Сводный отчёт по Street Fighter Card Game

## Источники
- **GPT-5.5 (Tokenator)** — основной анализ, 28KB, 337 строк
- **Gemini 3.1 Pro (Opencode)** — второе мнение, подтверждение
- **Kimi K2.6 (Ollama Cloud)** — текущий оркестратор

---

## 🛑 CRITICAL (P0) — Fix Immediate

### P0.1 Honda maxHp Stacking
**Строки:** `774` (`startBattle`), `512` (`startMultiplayer`), `696` (`startArcadeBattle`)
**Проблема:** `Game.player.maxHp += 15; Game.player.hp += 15;` применяется перед КАЖДЫМ боем в карьере. За 8 боёв +120 HP.
**Фикс:** Guard-флаг `hondaHpApplied` или перенос в `startCareer()`.
**ETA:** 5 мин

### P0.2 localStorage без try/catch
**Строки:** `266` (top-level JSON.parse), `316` (saveStats)
**Проблема:** Битый JSON = SyntaxError = белый экран. Без миграций/валидации.
**Фикс:** `loadJson(key, fallback)` с try/catch + `try/catch` в saveStats.
**ETA:** 10 мин

### P0.3 dmgAfterFlat не используется
**Строки:** `1118-1130` (`dealDamage()`)
**Проблема:** `let dmgAfterFlat = Math.max(0, amount - flatBlock)` вычисляется, но `finalDmg = amount - blocked`. Параметр `def` персонажей (Guile def:5, Zangief def:4, Honda def:3) ничего не уменьшает.
**Фикс:** Использовать `dmgAfterFlat` как базу для block.
**ETA:** 5 мин

---

## 🔴 HIGH (P1) — This Week

### P1.1 Super без EX через консоль
**Строки:** `884-920` (`playCard()`)
**Проблема:** UI блокирует super при `<100% EX`, но `playCard()` не проверяет `reqEx`. Чит через `playCard(i)`.
**Фикс:** Guard `if(card.type==='super' && Game.pEx < 100)` в `playCard()`.
**ETA:** 5 мин

### P1.2 second_wind исчезает навсегда
**Строки:** `175` (CardDB `once: true`), `906` (`!card.once` → discard skip)
**Проблема:** Карта с `once` не кладётся в discard → после боя не возвращается. Описание "1 раз за бой", но реальность "1 раз за карьеру".
**Фикс:** Зона `exhaust` + возврат в `startBattle()`.
**ETA:** 15 мин

---

## 🟡 MEDIUM (P2) — Next Sprint

| Задача | Строки | Описание | ETA |
|---|---|---|---|
| FX idle rAF | `42`, `67` | Canvas loop крутится вечно | 10 мин |
| Battle log limit | `412` | DOM рост без bound | 5 мин |
| Input lock | `1172` | Double-click end turn | 10 мин |
| HP bar colors | CSS | Всегда зелёный | 10 мин |
| XSS renderAvatar | `103` | Raw HTML insertion | 15 мин |

---

## 🎯 АРХИТЕКТУРА (Следующий этап)

1. **ES modules** — разбивка `game.js` на ~10 файлов
2. **`createCard()` / `cloneCard()`** — убрать adхок `{...card, uid: Math.random()}`
3. **State split** — `CareerState` vs `BattleState` vs `UIState`
4. **Testable combat** — `executeCard()` без DOM

---

## 📊 Priority Matrix

```
High Impact | Honda      | def fix    | ES modules
            | P0         | P1         | P3
------------|------------|------------|-------------
Low Effort  | localStorage| Super guard| Online PvP
            | P0         | P1         | P4
```

**Сейчас:** Honda + localStorage + def + Super guard (25 мин работы)

---

*Report compiled: 2024-05-24. Sources: GPT-5.5, Gemini 3.1 Pro, Kimi K2.6*
