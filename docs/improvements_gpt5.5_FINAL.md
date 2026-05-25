# Анализ Street Fighter Card Game

Проект представляет собой рабочий браузерный card battler с карьерой, спарингом, hotseat-мультиплеером, событиями, магазином и достижениями. Основной риск сейчас не в идее игры, а в том, что почти вся логика, данные, UI и persistence находятся в одном `game.js` на 1755 строк. Это затрудняет проверку инвариантов состояния: где живет колода, когда сбрасываются пассивки, какие эффекты должны длиться бой, а какие всю карьеру.

Ниже приведены найденные проблемы с точными строками, воспроизведением и конкретными исправлениями.

## 1. 🛑 CRITICAL BUGS

### 1.1. Honda получает +15 Max HP каждый бой карьеры

**Строки:** `game.js:773-775`, также похожие места `game.js:511-513` и `game.js:695-697`.

**Серьезность:** Critical для баланса и состояния карьеры.

**Описание:** в `startBattle()` пассивка Honda каждый раз делает `Game.player.maxHp+=15; Game.player.hp+=15;`. В карьере `Game.player` живет между боями, поэтому Max HP растет на 15 перед каждым боем. Это не временный бонус, а постоянная мутация персонажа. В `startArcadeBattle()` и `startMultiplayer()` объект клонируется при старте матча, поэтому там эффект не накапливается между отдельными матчами. У врага в карьере объект тоже новый, поэтому основной критический баг именно у игрока-Honda.

**Воспроизведение:** разблокировать или временно выбрать Honda, начать карьеру, открыть первый бой: HP станет 130 вместо 115. Победить, перейти ко второму бою: Max HP станет 145. После восьми боев Honda получает +120 Max HP только от повторного старта боя.

**Before (`game.js:773-775`):**

```js
// Passives - Start of Battle
if(Game.player.id === 'honda') { Game.player.maxHp+=15; Game.player.hp+=15; }
if(Game.enemy.id === 'honda') { Game.enemy.maxHp+=15; Game.enemy.hp+=15; }
```

**After:**

```js
// Passives - Start of Battle. Apply Honda's max HP bonus once per fighter object.
if(Game.player.id === 'honda' && !Game.player.hondaHpApplied) {
    Game.player.maxHp += 15;
    Game.player.hp += 15;
    Game.player.hondaHpApplied = true;
}
if(Game.enemy.id === 'honda' && !Game.enemy.hondaHpApplied) {
    Game.enemy.maxHp += 15;
    Game.enemy.hp += 15;
    Game.enemy.hondaHpApplied = true;
}
```

Лучше еще чище: перенести постоянную пассивку Honda в `startCareer()` сразу после клонирования персонажа (`game.js:420-424`), а в `startBattle()` оставить только сброс боевых баффов.

### 1.2. Поврежденный `localStorage` ломает загрузку игры

**Строки:** `game.js:266`, `game.js:316`, `game.js:434-436`.

**Серьезность:** Critical для надежности запуска.

**Описание:** `JSON.parse(localStorage.getItem('sfStats'))` выполняется на верхнем уровне файла без `try/catch`. Если в `sfStats` лежит некорректный JSON, весь `game.js` падает до инициализации меню. Аналогичный риск есть для `sfFavTracker` в `startCareer()`. `saveStats()` также не защищен от `QuotaExceededError` и приватных режимов браузера.

**Воспроизведение:** открыть DevTools и выполнить `localStorage.setItem('sfStats', '{bad json')`, затем перезагрузить страницу. Игра не отрисует меню, потому что скрипт завершится ошибкой на строке 266.

**Before (`game.js:266-271`, `316`):**

```js
let Stats = JSON.parse(localStorage.getItem('sfStats')) || {
    wins: 0, losses: 0, favChar: '', bestRun: 0,
    achZangief3: false, achNoBlock: false, achAllChars: [],
    unlockedChars: ['ryu'],
    recordEndless: 0
};
function saveStats() { localStorage.setItem('sfStats', JSON.stringify(Stats)); }
```

**After:**

```js
const DEFAULT_STATS = {
    wins: 0, losses: 0, favChar: '', bestRun: 0,
    achZangief3: false, achNoBlock: false, achAllChars: [],
    unlockedChars: ['ryu'],
    recordEndless: 0
};

function loadJson(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? { ...fallback, ...JSON.parse(raw) } : { ...fallback };
    } catch (err) {
        console.warn('Bad save data:', key, err);
        return { ...fallback };
    }
}

let Stats = loadJson('sfStats', DEFAULT_STATS);

function saveStats() {
    try {
        localStorage.setItem('sfStats', JSON.stringify(Stats));
    } catch (err) {
        console.warn('Stats were not saved:', err);
    }
}
```

Для `sfFavTracker` на `game.js:434` нужно использовать тот же `loadJson('sfFavTracker', {})`.

### 1.3. Пассивная защита персонажей фактически не применяется

**Строки:** `game.js:1118-1130`.

**Серьезность:** High.

**Описание:** в `dealDamage()` вычисляется `dmgAfterFlat = Math.max(0, amount - flatBlock)`, но дальше переменная не используется. Итоговый урон считается как `amount - blocked`, то есть `target.def` только пишет лог, но не уменьшает урон. Это ломает баланс Guile, Zangief, Honda, Bison и всех врагов с `def`.

**Воспроизведение:** выбрать Guile (`def: 5`), получить слабый удар на 10 урона. Лог скажет, что защита поглотила 5, но HP уменьшится на 10, если нет активного блока.

**Before (`game.js:1118-1130`):**

```js
let flatBlock = target.def || 0;
let dmgAfterFlat = Math.max(0, amount - flatBlock);
if(flatBlock > 0 && amount > 0) logMsg(`Пассивная защита поглотила ${Math.min(amount, flatBlock)} урона`);

if(tBuffs.blockCharges > 0) {
    tBuffs.blockCharges--;
    blocked = Math.floor(amount * 0.5);
    logMsg(`🛡️ Заблокирован ${blocked} урона (зарядов осталось: ${tBuffs.blockCharges})`);
}
let finalDmg = amount - blocked;
```

**After:**

```js
let baseAmount = amount;
if(!unblockable) {
    const flatBlock = target.def || 0;
    amount = Math.max(0, amount - flatBlock);
    if(flatBlock > 0 && baseAmount > 0) {
        logMsg(`Пассивная защита поглотила ${Math.min(baseAmount, flatBlock)} урона`);
    }

    if(tBuffs.blockCharges > 0) {
        tBuffs.blockCharges--;
        blocked = Math.floor(amount * 0.5);
        logMsg(`Заблокирован ${blocked} урона (зарядов осталось: ${tBuffs.blockCharges})`);
    }
}
let finalDmg = Math.max(0, amount - blocked);
```

### 1.4. Super-карты можно сыграть без EX через прямой вызов

**Строки:** `game.js:884-920`, UI-проверка только на `game.js:1719`, сброс EX на `game.js:1098-1102`.

**Серьезность:** High.

**Описание:** `updateUI()` отключает карту, если `card.type==='super' && Game.pEx < 100`, но `playCard(index)` не проверяет `reqEx`. Любой вызов из консоли `playCard(i)` сыграет super за 0 энергии, если карта находится в руке. Это не только cheat issue: двойные события, ручной вызов или будущий hotkey также обойдут UI-инвариант.

**Воспроизведение:** начать бой, дождаться super-карты в руке, выполнить в консоли `playCard(index)`, где `index` - позиция super-карты. Урон пройдет даже при `Game.pEx < 100`.

**Before (`game.js:884-892`):**

```js
function playCard(index) {
    if(Game.pBuffs.freeze > 0 || Game.pBuffs.stun > 0) return;
    let card = Game.pHand[index];
    let cost = card.cost;
    
    if(card.type === 'special' && Game.pBuffs.specCd > 0) {
        logMsg(`Спецприём в откате (${Game.pBuffs.specCd} х.)`, '#f00');
        return;
    }
```

**After:**

```js
function playCard(index) {
    if(Game.pBuffs.freeze > 0 || Game.pBuffs.stun > 0) return;
    let card = Game.pHand[index];
    if(!card) return;
    let cost = card.cost;

    if(card.type === 'super' && Game.pEx < (card.reqEx || 100)) {
        logMsg(`Нужно ${card.reqEx || 100}% EX для суперприёма`, '#f00');
        return;
    }
    if(card.type === 'special' && Game.pBuffs.specCd > 0) {
        logMsg(`Спецприём в откате (${Game.pBuffs.specCd} х.)`, '#f00');
        return;
    }
```

### 1.5. Карта `once` удаляется из всей карьеры, а не из текущего боя

**Строки:** `game.js:175`, `game.js:906-907`, `game.js:1271-1272`.

**Серьезность:** Medium/High, зависит от дизайна.

**Описание:** `second_wind` описана как `+15 HP (1 раз за бой)`, но при розыгрыше `if(!card.once) Game.pDiscard.push(card);` не кладет карту в сброс. Карта исчезает из колоды навсегда до конца забега. Если дизайн именно “одноразовая расходуемая карта”, описание неверное. Если “один раз за бой”, нужна отдельная зона `exhaust` и возврат при `startBattle()`.

**Воспроизведение:** получить `second_wind`, сыграть ее в бою, победить. На следующем бою карта отсутствует в колоде, руке и сбросе.

**Suggested fix:** добавить `Game.pExhaust` и `Game.eExhaust`; при `card.once` складывать туда, а в `startBattle()` возвращать `pExhaust` в `pDeck`.

### 1.6. Проверка bloating deck: прямого раздутия между боями не найдено

**Строки:** `game.js:197-219`, `game.js:420-425`, `game.js:755-759`, `game.js:792-803`.

**Серьезность:** Low для указанного паттерна.

`generateStartingDeck(charId)` действительно возвращает новый массив. В карьере он вызывается один раз при `startCareer()` (`game.js:425`). Перед новым боем `startBattle()` возвращает карты из руки и сброса в текущую карьерную колоду (`game.js:757-758`). Это не bloat, а нормальная сборка зоны draw pile перед новым боем. Внутри боя `drawCards()` переносит сброс обратно в колоду только когда draw pile пуст (`game.js:796-800`). Дубликаты могут появляться только от наград, магазина и событий (`game.js:1437`, `1553-1562`, `1650`), что является ожидаемой экономикой.

## 2. 🔧 CODE ARCHITECTURE

`game.js` совмещает аудио, canvas FX, контент, персонажей, карты, persistence, роутинг экранов, боевую систему, AI, награды, события, магазин и DOM-rendering. Главная проблема монолита не размер сам по себе, а отсутствие границ ответственности. Например, `executeCard()` одновременно считает эффекты карты, вызывает анимации, пишет лог, начисляет EX и меняет HP. Из-за этого сложно тестировать чистую механику без DOM.

`Game` (`game.js:318-333`) является глобальным mutable singleton. Он содержит runtime-состояние боя, прогресс карьеры, настройки режима, transient UI-состояние и mirror-state мультиплеера. Это делает ошибки вроде Honda-stacking вероятными: непонятно, какие поля сохраняются между боями, а какие должны сбрасываться.

Рекомендуемый ES module breakdown:

| Модуль | Ответственность |
|---|---|
| `data/cards.js` | `CardDB`, фабрики карт, immutable card definitions |
| `data/characters.js` | персонажи, боссы, пассивки как данные |
| `core/state.js` | создание `GameState`, reset между режимами |
| `core/combat.js` | `executeCard`, `dealDamage`, status effects без DOM |
| `core/deck.js` | shuffle, draw, discard, exhaust, clone card |
| `core/ai.js` | `evalEnemyCard`, выбор карт врага |
| `systems/persistence.js` | `loadStats`, `saveStats`, миграции |
| `ui/render.js` | render экранов, безопасное создание DOM |
| `ui/fx.js` | particles, animation lifecycle |
| `modes/career.js` | переходы карьеры, награды, события |

Card data immutability: сейчас карты создаются shallow-copy через `{...CardDB.find(...), uid: Math.random()}` (`game.js:200`, `224`, `1553-1562`, `1650`). В текущих данных почти все поля примитивные, поэтому баг не проявляется остро. Но при добавлении nested-эффектов (`effects: []`, `scaling: {}`) копии начнут разделять ссылки. Нужно ввести `createCard(id)` и `cloneCard(card)` с `structuredClone` или явным копированием.

Функциональная сложность высока в `executeCard()` (`game.js:969-1107`), `enemyTurn()` (`game.js:1208-1301`) и `updateUI()` (`game.js:1656-1734`). Они имеют много ветвлений, побочных эффектов и неявных зависимостей от `Game`. Их стоит разбить после фикса критичных багов, не до: сначала стабилизировать инварианты.

## 3. ⚖️ GAME BALANCE & MECHANICS

Honda после фикса stacking станет заметно слабее, но честнее. Его текущий kit: `hp 115`, `def 3`, +15 HP, лечение за каждый третий блок. При исправленной пассивной защите он станет очень живучим, поэтому лечение за блок стоит оставить 5 HP, но сбрасывать `blockCount` именно как бойцовское состояние и показывать счетчик в UI.

Akuma имеет `atk 4`, урон x1.5 (`game.js:962-965`), super 65-75 (`game.js:193`) и низкий `exRate 0.30`. Он выглядит как high-risk burst, но HP 100 не очень низкий относительно Chun 105 и Dhalsim 85. Если Akuma должен быть стеклянной пушкой, HP можно снизить до 90 или добавить self-damage/EX penalty. Фраза “Каждый 3-й бой +1 к атаке” в описании (`game.js:153`) не реализована. Это либо недостающая механика, либо неверный текст.

Zangief получает x2 и unblockable при HP < 25% (`game.js:950-953`). После исправления пассивной защиты его `def 4` начнет реально работать, что усилит comeback-окно. Рекомендация: оставить x2 только для attack/special, но не для super, или ограничить до x1.75.

DIFFICULTY (`game.js:593-597`) одновременно увеличивает HP/ATK врагов, режет золото и увеличивает цены. На “Мастер” враги получают HP x1.6, ATK x2, gold x0.4, price x1.6. Это мультипликативно давит экономику: игрок слабее, меньше лечится, хуже покупает улучшения. Более мягкая модель: сложность должна менять либо боевую угрозу, либо экономику, но не оба рычага так сильно.

Card economy: стартовые колоды очень большие, потому что базовый набор (`game.js:204-205`) добавляется всем, а затем персонаж получает еще почти такой же набор (`game.js:207-215`). Это делает deck-building медленным: одна новая карта редко заметна. Можно уменьшить стартовые колоды до 18-24 карт или увеличить частоту удаления слабых карт.

События (`game.js:1422-1479`) дают хорошие risk/reward моменты, но часть выбора доминирует. `treasure` с “Открыть осторожно” имеет EV около +14 золота минус небольшой HP-risk, а “Искать редкость” может быть сильнее любой покупки. `master` содержит выбор “Обучение защиты”, который возвращает “Пока недоступно” за 30 золота, если cost будет списан до action (`game.js:1513-1515`). Сейчас это ловушка для игрока.

Shop pricing: при “Мастер” `+1 Энергия` стоит 48 золота, а награды сильно урезаны. При этом энергия - самый сильный scaling. Лучше делать shop pool зависящим от уровня и сложности: на высокой сложности чаще предлагать лечение/удаление карт, а не только повышать цены.

## 4. 🎮 UX/UI ISSUES

Input handling: `playCard()` не защищает от повторного клика во время DOM-обновления и анимаций. Сейчас карта удаляется синхронно, поэтому большинство double-click не пройдет, но `endPlayerTurn()` (`game.js:1172`) можно нажать несколько раз и поставить несколько `setTimeout(enemyTurn, 500)` до фактического хода врага. Нужен `Game.inputLocked` или disable кнопки конца хода после первого нажатия.

HP bar: CSS использует один зеленый `--hp-fill` (`style.css:8-10`, `91-92`). При низком HP нет состояния тревоги. Достаточно менять цвет в `updateUI()` по процентам: >50 green, 25-50 yellow, <25 red. Это особенно важно для пассивок Zangief/Bison, которые включаются на низком HP.

Battle log: `logMsg()` бесконечно делает `prepend` (`game.js:412-418`). В длинном endless run DOM будет расти. Ограничить до 80-100 сообщений.

Mobile/touch: `.screen` фиксирован на `100vh`, `body` имеет `overflow: hidden` (`style.css:19`), карты 140x200 (`style.css:120-124`), hover-анимация поднимает карту (`style.css:125`). На мобильных экранах рука может быть неудобной, а hover не работает предсказуемо. Нужны media queries для уменьшения карт и явный tap feedback.

Visual feedback: combo есть (`game.js:922-940`), но баффы вроде `nextAtkBoost`, `weakness`, `freeCard` и `specCd` отображаются слабо. `renderStatus()` (`game.js:1673-1690`) стоит расширить понятными иконками и tooltips.

## 5. 🚀 PERFORMANCE

Canvas particles: `FX.init()` запускает rAF на `game.js:42`, а `loop()` всегда планирует следующий кадр на `game.js:67`, даже когда `particles.length === 0` и игрок в меню. Исправление: запускать loop только при `emit()`, хранить `rafId`, останавливать когда частиц нет.

**Before (`game.js:42`, `56-68`):**

```js
requestAnimationFrame(() => this.loop());
loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // ...
    requestAnimationFrame(() => this.loop());
}
```

**After:**

```js
emit(x, y, color, count, speed=5) {
    // push particles
    if(!this.rafId) this.rafId = requestAnimationFrame(() => this.loop());
},
loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // update particles
    if(this.particles.length > 0) {
        this.rafId = requestAnimationFrame(() => this.loop());
    } else {
        this.rafId = null;
    }
}
```

DOM efficiency: `updateUI()` каждый раз перезаписывает аватары (`game.js:1658`, `1665`), статусы, энергию и всю руку (`game.js:1713-1733`). Это нормально для маленькой игры, но при частых эффектах будет дергать layout. Минимальный шаг: не перерисовывать аватары, если `id` бойца не изменился; руку обновлять только после draw/play, не после каждого HP change.

Event handlers: обработчики присваиваются напрямую через `onclick` при каждом render. Старые DOM-узлы удаляются, поэтому крупной утечки нет, но код сложно контролировать. Для руки можно использовать event delegation по `data-index`.

`renderStatus()` строит HTML строкой каждый `updateUI()`. Это дешево сейчас, но вместе с avatar class reset (`game.js:1675-1677`) может сбрасывать анимации. Лучше разделить status render и animation classes.

## 6. 🔒 SECURITY

XSS via avatar: `renderAvatar()` (`game.js:103-106`) возвращает строку HTML. Если `avatar` начинается с `data:image`, оно вставляется в `<img src="...">` без экранирования. Для встроенных данных риск ограничен, но любое будущее пользовательское изображение или импорт сохранений может привести к HTML injection через кавычки. Безопаснее создавать DOM через `document.createElement('img')` или валидировать строго `data:image/png;base64,`, `data:image/jpeg;base64,`, `images/...`.

`drawAvatar()` (`game.js:77-85`) собирает SVG строкой с raw `colors[char]`. Сейчас `C` константный, но если цвета станут пользовательскими, `fill="..."` станет injection surface. Нужна whitelist-валидация hex colors.

Client-side randomness: `Math.random()` используется для shuffle (`game.js:231-236`), урона (`game.js:1033`), AI (`game.js:1255`, `1259`), событий (`game.js:1398`, `1482`) и наград. В офлайн-игре это приемлемо, но игрок может выполнить `Math.random = () => 0` и гарантировать выгодные исходы. Для single-player это не критическая security-угроза, но для достижений/будущего online PvP неприемлемо. Ввести `rng()` wrapper сейчас, а для online - серверный seed/authoritative simulation.

localStorage validation отсутствует не только на JSON parse: даже валидный JSON может иметь неправильные типы (`achAllChars: null`, `unlockedChars: 'all'`). После загрузки нужны schema defaults и нормализация массивов.

`evalEnemyCard()` (`game.js:1188-1206`) легко предсказуем. Это не security bug, но exploitable AI: игрок может держать HP-порог и вынуждать AI блокировать или атаковать. Улучшение: добавить контекстные оценки lethal, blockCharges игрока, стоимость карты, ожидаемый урон.

## 7. 💡 ENHANCEMENTS & FEATURE IDEAS

Short-term easy wins: исправить Honda stacking, `localStorage`, passive defense, super EX guard; ограничить battle log; добавить цвета HP bar; добавить `inputLocked` для конца хода; поправить описание Akuma или реализовать +1 ATK каждый третий бой.

Mid-term: добавить `exhaust` зону для once-per-battle карт; сделать `createCard()` и убрать ad-hoc `{...card, uid: Math.random()}`; вынести `dealDamage()` и `executeCard()` в testable pure-ish модуль; улучшить AI lethal detection; сделать экран просмотра текущей колоды.

Long-term: полноценный deck builder перед карьерой; unlockable relics; online PvP с authoritative сервером; seeded daily run; модульная кампания с разными биомами/событиями; replay log для отладки боев; accessibility режим без миганий/с screen-reader labels.

## Priority Table: Impact × Effort

| Задача | Impact | Effort | Приоритет |
|---|---:|---:|---:|
| Исправить Honda stacking (`game.js:773-775`) | High | Low | P0 |
| Защитить `localStorage` load/save (`game.js:266`, `316`, `434`) | High | Low | P0 |
| Применить passive defense в `dealDamage()` (`game.js:1118-1130`) | High | Low | P0 |
| Проверять EX в `playCard()` (`game.js:884-920`) | Medium/High | Low | P1 |
| Ограничить battle log (`game.js:412-418`) | Medium | Low | P1 |
| Остановить idle rAF в FX (`game.js:42`, `67`) | Medium | Low | P1 |
| Добавить `exhaust` для once-per-battle | Medium | Medium | P2 |
| Ввести `createCard()` / `cloneCard()` | Medium | Medium | P2 |
| Разбить `game.js` на ES modules | High | High | P3 |
| Online PvP/server RNG | High | Very High | P4 |

## Итог

Самые срочные исправления маленькие и локальные: Honda, сохранения, passive defense и guard для super-карт. Эти изменения дадут максимальный прирост качества без переписывания архитектуры. После них стоит стабилизировать зоны колоды (`deck/hand/discard/exhaust`) и только потом дробить монолит на модули. Игра уже содержит хороший объем контента; основная задача следующего этапа - сделать состояние боя предсказуемым, валидируемым и тестируемым.
