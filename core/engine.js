function openPauseMenu() {
    document.getElementById('pause-modal').classList.add('active');
}
function closePauseMenu() {
    document.getElementById('pause-modal').classList.remove('active');
}
function quitToMenu() {
    document.getElementById('pause-modal').classList.remove('active');
    nav('menu');
}
function toggleMute() {
    Audio.muted = !Audio.muted;
    document.getElementById('pause-mute-btn').innerText = Audio.muted ? '🔇 Звук: ВЫКЛ' : '🔊 Звук: ВКЛ';
}

function nav(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + screenId).classList.add('active');
    Audio.init();
    
    if(screenId === 'select') renderRoster();
    if(screenId === 'multi-select') renderMultiSelect();
    if(screenId === 'stats') renderStats();
}

function renderRoster() {
    const cont = document.getElementById('roster-container');
    cont.innerHTML = '';

    // Header with permanent gold balance
    let header = document.getElementById('select-gold-header');
    if(!header) {
        header = document.createElement('div');
        header.id = 'select-gold-header';
        header.className = 'gold-display';
        header.style.marginBottom = '10px';
        cont.parentNode.insertBefore(header, cont);
    }
    header.innerText = '💰 Кошелёк: ' + (Stats.gold || 0);

    Characters.forEach(c => {
        let card = document.createElement('div');
        let isUnlocked = Stats.unlockedChars.includes(c.id);
        card.className = 'char-card' + (isUnlocked ? '' : ' locked');
        
        if(isUnlocked) {
            card.innerHTML = `
                <div class="char-name">${c.name}</div>
                <div class="char-svg">${renderAvatar(c.svg)}</div>
                <div class="char-info">HP: ${c.hp}<br>ATK: ${c.atk} 🛡️: ${c.def}<br><br><span style="color:#0f0">${c.passiveDesc}</span></div>
            `;
            card.onclick = () => startCareer(c.id);
        } else {
            let req = UNLOCK_CONDITIONS[c.id];
            let canAfford = (Stats.gold || 0) >= req.cost;
            card.innerHTML = `
                <div class="char-name" style="color:#666">???</div>
                <div class="char-svg" style="filter:grayscale(100%);opacity:0.3">${renderAvatar(c.svg)}</div>
                <div class="char-info" style="color:#888;font-size:9px">${req.desc}<br><br>Цена: <span style="color:${canAfford ? '#ffd700' : '#f44'}">${req.cost}💰</span></div>
            `;
            card.onclick = () => unlockChar(c.id);
        }
        cont.appendChild(card);
    });
}

function renderStats() {
    let c = document.getElementById('stats-container');
    c.innerHTML = `
        💰 Кошелёк: <span style="color:#ffd700">${Stats.gold || 0}</span><br>
        Победы: <span style="color:#0f0">${Stats.wins}</span><br>
        Поражения: <span style="color:#f00">${Stats.losses}</span><br>
        Любимый боец: <span style="color:#ffbb00">${Stats.favChar || 'Нет'}</span><br>
        Лучшая серия: ${Stats.bestRun}/8<br>
        Рекорд бесконечного: <span style="color:#ff00ff">${Stats.recordEndless || 0}</span><br>
        Открыто бойцов: ${Stats.unlockedChars.length}/${Characters.length}<br>
        <br>
        <b>Достижения:</b><br>
        [${Stats.achZangief3 ? 'X' : ' '}] Победить Зангиева за 3 хода<br>
        [${Stats.achNoBlock ? 'X' : ' '}] Выиграть бой без блоков<br>
        [${Stats.achAllChars.length===8 ? 'X' : ' '}] Пройти всеми героями (${Stats.achAllChars.length}/8)<br>
    `;
}

function logMsg(msg, color="#aaa") {
    const l = document.getElementById('battle-log');
    const d = document.createElement('div');
    d.style.color = color;
    d.innerText = msg;
    l.prepend(d);
    // Ограничение: не более 80 сообщений
    while(l.children.length > 80) {
        l.removeChild(l.lastChild);
    }
}

function startCareer(charId) {
    let charBase = Characters.find(c => c.id === charId);
    Game.player = JSON.parse(JSON.stringify(charBase));
    Game.player.maxHp = Game.player.hp;
    Game.pEx = 0;
    Game.pDeck = generateStartingDeck(charId);
    Game.level = 1;
    Game.baseEnergy = 3;
    Game.energyBonus = 0;
    Game.dmgBonus = 0;
    Game.gold = 0;
    Game.arcadeMode = false;
    Game.endlessMode = false;
    
    let plays = JSON.parse(localStorage.getItem('sfFavTracker')||'{}');
    plays[charId] = (plays[charId]||0) + 1;
    localStorage.setItem('sfFavTracker', JSON.stringify(plays));
    let best = Object.keys(plays).reduce((a, b) => plays[a] > plays[b] ? a : b);
    Stats.favChar = Characters.find(c=>c.id===best).name;
    saveStats();

    prepareNextBattle();
}


// --- MULTIPLAYER HOTSEAT v3.9 ---
let MultiSelections = { p1: null, p2: null };

function renderMultiSelect() {
    const r1 = document.getElementById('multi-roster-container');
    const r2 = document.getElementById('multi-roster-container-p2');
    r1.innerHTML = ''; r2.innerHTML = '';
    
    Characters.forEach(c => {
        let card = document.createElement('div');
        card.className = 'char-card' + (MultiSelections.p1?.id === c.id ? ' arcade-char selected' : '');
        card.innerHTML = `<div class="char-name">${c.name}</div><div class="char-svg">${renderAvatar(c.svg)}</div><div class="char-info">HP: ${c.hp}<br>ATK: ${c.atk} 🛡️: ${c.def}</div>`;
        card.onclick = () => { MultiSelections.p1 = c; renderMultiSelect(); };
        r1.appendChild(card);
        
        let card2 = document.createElement('div');
        card2.className = 'char-card' + (MultiSelections.p2?.id === c.id ? ' arcade-char enemy-selected' : '');
        card2.innerHTML = `<div class="char-name">${c.name}</div><div class="char-svg">${renderAvatar(c.svg)}</div><div class="char-info">HP: ${c.hp}<br>ATK: ${c.atk} 🛡️: ${c.def}</div>`;
        card2.onclick = () => { MultiSelections.p2 = c; renderMultiSelect(); };
        r2.appendChild(card2);
    });
    
    document.getElementById('multi-p1-selected').innerText = MultiSelections.p1 ? 'Игрок 1: ' + MultiSelections.p1.name : 'Выберите Игрока 1';
    document.getElementById('multi-p2-selected').innerText = MultiSelections.p2 ? 'Игрок 2: ' + MultiSelections.p2.name : 'Выберите Игрока 2';
}

function startMultiplayer() {
    if(!MultiSelections.p1 || !MultiSelections.p2) { alert('Выберите обоих бойцов!'); return; }
    if(MultiSelections.p1.id === MultiSelections.p2.id) { alert('Выберите разных бойцов!'); return; }
    
    // Игрок 1
    Game.player = JSON.parse(JSON.stringify(MultiSelections.p1));
    Game.player.maxHp = Game.player.hp;
    Game.pEx = 0;
    Game.pDeck = generateStartingDeck(Game.player.id);
    
    // Игрок 2 (как p2)
    Game.p2 = JSON.parse(JSON.stringify(MultiSelections.p2));
    Game.p2.maxHp = Game.p2.hp;
    Game.p2Ex = 0;
    Game.p2Deck = generateStartingDeck(Game.p2.id);
    Game.p2Hand = [];
    Game.p2Discard = [];
    Game.p2Buffs = {};
    
    Game.pHand = []; Game.pDiscard = [];
    Game.enemy = Game.p2;
    Game.enemy.maxHp = Game.enemy.hp;
    Game.eBuffs = Game.p2Buffs;
    Game.eEx = Game.p2Ex || 0;
    Game.multiplayer = true;
    Game.activePlayer = 1;
    Game.level = 1;
    Game.maxLevel = 1;
    Game.baseEnergy = 3;
    Game.energyBonus = 0;
    Game.dmgBonus = 0;
    Game.gold = 0;
    Game.arcadeMode = false;
    Game.endlessMode = false;
    Game.turnCounter = 0;
    Game.noBlockUsed = true;
    
    resetBuffs(Game.pBuffs);
    resetBuffs(Game.p2Buffs);
    
    // Passives
    if(Game.player.id === 'honda' && !Game.player.hondaHpApplied) { 
        Game.player.maxHp+=15; 
        Game.player.hp+=15; 
        Game.player.hondaHpApplied = true;
    }
    if(Game.p2.id === 'honda' && !Game.p2.hondaHpApplied) { 
        Game.p2.maxHp+=15; 
        Game.p2.hp+=15; 
        Game.p2.hondaHpApplied = true;
    }
    
    document.getElementById('battle-log').innerHTML = '';
    logMsg(`⚔️ МУЛЬТИПЛЕЕР! ${Game.player.name} VS ${Game.p2.name}`, '#ff44ff');
    document.getElementById('round-info').innerText = '⚔️ Мультиплеер';
    document.getElementById('round-info').style.color = '#ff44ff';
    
    nav('battle');
    updateUI();
    startTurn();
}

function getPassivePlayer() {
    return Game.activePlayer === 1 ? Game.player : Game.p2;
}
function getPassiveDeck() {
    return Game.activePlayer === 1 ? Game.pDeck : Game.p2Deck;
}
function getPassiveHand() {
    return Game.activePlayer === 1 ? Game.pHand : Game.p2Hand;
}
function getPassiveDiscard() {
    return Game.activePlayer === 1 ? Game.pDiscard : Game.p2Discard;
}
function getPassiveBuffs() {
    return Game.activePlayer === 1 ? Game.pBuffs : Game.p2Buffs;
}
function getPassiveEx() {
    return Game.activePlayer === 1 ? Game.pEx : (Game.p2Ex || 0);
}

function passTurnTo(nextPlayer) {
    // Save current active player's state
    Game.activePlayer = nextPlayer;
    nav('pass-turn');
    document.getElementById('pass-turn-msg').innerHTML = `Ход Игрока ${nextPlayer === 1 ? 2 : 1}<br>завершён.<br><br>Передайте экран<br>Игроку ${nextPlayer}!`;
}

function resumeMultiTurn() {
    // SWAP player and p2
    let ab = Game.pBuffs;
    ab.blockPct = 0; ab.blockCharges = 0; ab.dodgeChance = 0; ab.counter = 0; ab.weakness = 0;
    if(ab.specCd >= 0) ab.specCd = 0;
    
    let tmp = Game.player;
    Game.player = Game.p2;
    Game.p2 = tmp;
    tmp = Game.pDeck; Game.pDeck = Game.p2Deck; Game.p2Deck = tmp;
    tmp = Game.pHand; Game.pHand = Game.p2Hand; Game.p2Hand = tmp;
    tmp = Game.pDiscard; Game.pDiscard = Game.p2Discard; Game.p2Discard = tmp;
    tmp = Game.pBuffs; Game.pBuffs = Game.p2Buffs; Game.p2Buffs = tmp;
    let etmp = Game.pEx; Game.pEx = Game.p2Ex || 0; Game.p2Ex = etmp || 0;
    
    Game.enemy = Game.p2;
    Game.turnCounter++;
    Game.cardsPlayedThisTurn = 0;
    Game.noBlockUsed = true;
    
    nav('battle');
    updateUI();
    startTurn();
}


// --- ARCADE MODE ---
let ArcadeSelections = { player: null, enemy: null };


function setDifficulty(level) {
    Game.difficulty = level;
    if(Game.pendingArcade) {
        Game.pendingArcade = false;
        nav('arcade-menu');
        renderArcadeRosters();
    } else {
        nav('select');
    }
}

// Difficulty table
const DIFFICULTY = {
    0: { name: 'Новичок', hp: 1.0, atk: 1.0, gold: 1.0, price: 1.0 },
    1: { name: 'Воин', hp: 1.3, atk: 1.5, gold: 0.7, price: 1.3 },
    2: { name: 'Мастер', hp: 1.6, atk: 2.0, gold: 0.4, price: 1.6 }
};
function diffHP()   { return DIFFICULTY[Game.difficulty || 0].hp; }
function diffATK()  { return DIFFICULTY[Game.difficulty || 0].atk; }
function diffGold() { return DIFFICULTY[Game.difficulty || 0].gold; }
function diffPrice(){ return DIFFICULTY[Game.difficulty || 0].price; }

function getEffectivePrice(base) { return Math.floor(base * diffPrice()); }
function getEffectiveGold(base) { return Math.floor(base * diffGold()); }

function applyDifficultyEnemy(e) {
    e.maxHp = Math.floor(e.maxHp * diffHP());
    e.atk = Math.floor((e.atk || 0) * diffATK());
}

function enterArcadeMode() {
    ArcadeSelections = { player: null, enemy: null };
    Game.pendingArcade = true;
    nav('difficulty');
}

function renderArcadeRosters() {
    var container = document.getElementById('arcade-player-roster');
    container.innerHTML = '';
    var allFighters = Characters.concat(Object.values(Bosses));

    if (!ArcadeSelections.player) {
        document.getElementById('arcade-step-hint').innerText = 'Шаг 1: выберите своего бойца';
        document.getElementById('arcade-enemy-section').style.display = 'none';
        for (var i = 0; i < allFighters.length; i++) {
            var c = allFighters[i];
            var card = document.createElement('div');
            var sel = (ArcadeSelections.player && ArcadeSelections.player.id === c.id) ? ' selected' : '';
            card.className = 'char-card arcade-char' + sel;
            card.innerHTML = '<div class="char-name">' + c.name + '</div><div class="char-svg">' + renderAvatar(c.svg || Avatars[c.id] || '') + '</div><div class="char-info">HP: ' + c.hp + '<br>ATK: ' + c.atk + ' 🛡️: ' + c.def + '</div>';
            card.onclick = (function(ch) { return function() { selectArcadePlayer(ch); }; })(c);
            container.appendChild(card);
        }
        document.getElementById('arcade-player-selected').innerText = '';
    } else if (!ArcadeSelections.enemy) {
        document.getElementById('arcade-step-hint').innerText = 'Шаг 2: выберите противника';
        document.getElementById('arcade-enemy-section').style.display = 'block';
        for (var i = 0; i < allFighters.length; i++) {
            var c = allFighters[i];
            var card = document.createElement('div');
            var sel = (ArcadeSelections.enemy && ArcadeSelections.enemy.id === c.id) ? ' enemy-selected' : '';
            card.className = 'char-card arcade-char' + sel;
            card.innerHTML = '<div class="char-name">' + c.name + '</div><div class="char-svg">' + renderAvatar(c.svg || Avatars[c.id] || '') + '</div><div class="char-info">HP: ' + c.hp + '<br>ATK: ' + c.atk + ' 🛡️: ' + c.def + '</div>';
            card.onclick = (function(ch) { return function() { selectArcadeEnemy(ch); }; })(c);
            container.appendChild(card);
        }
        document.getElementById('arcade-player-selected').innerText = 'Ваш боец: ' + ArcadeSelections.player.name;
    }

    document.getElementById('arcade-enemy-selected').innerText = ArcadeSelections.enemy
        ? 'Противник: ' + ArcadeSelections.enemy.name
        : '';
}

function selectArcadePlayer(charData) {
    ArcadeSelections.player = charData;
    renderArcadeRosters();
}

function selectArcadeEnemy(charData) {
    ArcadeSelections.enemy = charData;
    renderArcadeRosters();
}

function startArcadeBattle() {
    if(!ArcadeSelections.player || !ArcadeSelections.enemy) {
        alert('Выберите бойца и противника!');
        return;
    }
    
    Game.player = JSON.parse(JSON.stringify(ArcadeSelections.player));
    Game.player.maxHp = Game.player.hp;
    Game.pEx = 0;
    Game.pDeck = generateStartingDeck(Game.player.id);
    
    Game.enemy = JSON.parse(JSON.stringify(ArcadeSelections.enemy));
    Game.enemy.maxHp = Game.enemy.hp;
    Game.enemy.hp = Game.enemy.maxHp;
    
    Game.eDeck = generateEnemyDeck();
    
    Game.level = 1;
    Game.maxLevel = 1;
    Game.baseEnergy = 3;
    Game.energyBonus = 0;
    Game.dmgBonus = 0;
    Game.gold = 0;
    Game.arcadeMode = true;
    Game.turnCounter = 0;
    Game.noBlockUsed = true;
    
    resetBuffs(Game.pBuffs);
    resetBuffs(Game.eBuffs);
    
    // Passives start of battle
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
    
    document.getElementById('battle-log').innerHTML = '';
    logMsg(`СПАРИНГ: ${Game.player.name} VS ${Game.enemy.name}`, '#ffbb00');
    document.getElementById('round-info').innerText = 'Спаринг [' + DIFFICULTY[Game.difficulty||0].name + ']';
    
    nav('battle');
    updateUI();
    startTurn();
}

function getEnemyForLevel() {
    let e;
    if(Game.level === 4) e = JSON.parse(JSON.stringify(Bosses.sagat));
    else if(Game.level === 7) e = JSON.parse(JSON.stringify(Bosses.vega));
    else if(Game.level === 8) e = JSON.parse(JSON.stringify(Bosses.bison));
    if(e) {
        // Босс: только множители сложности
        applyDifficultyEnemy(e);
        e.hp = e.maxHp;
    } else {
        let pool = Characters.filter(c => c.id !== Game.player.id);
        let base = pool[Math.floor(Math.random() * pool.length)];
        e = JSON.parse(JSON.stringify(base));
        if(Game.endlessMode) {
            if(Math.random() < 0.35) {
                let bossPool = Object.values(Bosses).filter(b => b.id !== Game.player.id);
                let bossBase = bossPool[Math.floor(Math.random() * bossPool.length)];
                e = JSON.parse(JSON.stringify(bossBase));
            }
            let extraLevels = Game.level - 8;
            e.maxHp = e.hp + (extraLevels * 15);
            e.atk = (e.atk || 0) + Math.floor(extraLevels * 2.5);
        } else {
            // Карьера: случайный враг
            e.maxHp = e.hp + (Game.level * 6);
            e.atk = (e.atk || 0) + Math.floor(Game.level * 0.8);
            // Новичок: без пассивной защиты у случайных врагов (боссы сохраняют def)
            if(Game.difficulty === 0) e.def = 0;
        }
        applyDifficultyEnemy(e);
        e.hp = e.maxHp;
    }
    if(!e.maxHp && e.hp) e.maxHp = e.hp;
    return e;
}

function prepareNextBattle() {
    Game.enemy = getEnemyForLevel();
    Game.eDeck = generateEnemyDeck();
    
    nav('next-enemy');
    document.getElementById('next-enemy-info').innerHTML = `
        <h3>Бой ${Game.level}/8</h3>
        <div style="width:100px; height:100px; margin:0 auto;">${Game.enemy.svg}</div>
        <h2 style="color:#ffbb00; margin:10px 0;">${Game.enemy.name}</h2>
        <p style="margin:5px 0;">Макс HP: ${Game.enemy.maxHp} | Атака: ${Game.enemy.atk || 0}</p>
        <p style="color:#0f0; margin:5px 0;">${Game.enemy.passiveDesc || ''}</p>
    `;
}

function startBattle() {
    // Возвращаем карты из руки, сброса и exhaust в колоду перед новым боем
    if(Game.pHand && Game.pHand.length > 0) { Game.pDeck.push(...Game.pHand); Game.pHand = []; }
    if(Game.pDiscard && Game.pDiscard.length > 0) { Game.pDeck.push(...Game.pDiscard); Game.pDiscard = []; }
    if(Game.pExhaust && Game.pExhaust.length > 0) { Game.pDeck.push(...Game.pExhaust); Game.pExhaust = []; }
    if(Game.pDeck.length > 0) shuffle(Game.pDeck);
    
    if(Game.eHand && Game.eHand.length > 0) { Game.eDeck.push(...Game.eHand); Game.eHand = []; }
    if(Game.eDiscard && Game.eDiscard.length > 0) { Game.eDeck.push(...Game.eDiscard); Game.eDiscard = []; }
    if(Game.eExhaust && Game.eExhaust.length > 0) { Game.eDeck.push(...Game.eExhaust); Game.eExhaust = []; }
    if(Game.eDeck.length > 0) shuffle(Game.eDeck);
    
    Game.turnCounter = 0;
    Game.noBlockUsed = true;
    // EX игрока накапливается через карьеру, враг всегда новый — сбрасываем
    Game.eEx = 0;
    
    resetBuffs(Game.pBuffs);
    resetBuffs(Game.eBuffs);
    
    // Passives - Start of Battle (Honda: one-time +15 max HP)
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

    document.getElementById('battle-log').innerHTML = '';
    logMsg(`БОЙ ${Game.level} НАЧИНАЕТСЯ! ${Game.player.name} VS ${Game.enemy.name}`, '#ffbb00');
    // Новичок: восстановление 20 HP между боями (кроме первого)
    if(Game.difficulty === 0 && !Game.endlessMode && Game.level > 1) {
        const healAmt = 20;
        Game.player.hp = Math.min(Game.player.maxHp, Game.player.hp + healAmt);
        logMsg(`Новичок: +${healAmt} HP восстановления`, '#0f0');
    }
    if(Game.endlessMode) {
        document.getElementById('round-info').innerText = `Бесконечный режим — Бой ${Game.level}`;
        document.getElementById('round-info').style.color = '#ff00ff';
    } else {
        document.getElementById('round-info').innerText = `Бой ${Game.level}/8`;
        document.getElementById('round-info').style.color = '#888';
    }
    
    nav('battle');
    updateUI();
    startTurn();
}

function drawCards(deck, hand, discard, count) {
    count = Math.max(0, count);
    for(let i=0; i<count; i++) {
        if(hand.length >= 5) break;
        if(deck.length === 0) {
            if(discard.length === 0) break;
            deck.push(...discard);
            discard.length = 0;
            shuffle(deck);
        }
        hand.push(deck.pop());
    }
}

function startTurn() {
    Game.turnCounter++;
    Game.comboHistory = [];
    Game.cardsPlayedThisTurn = 0;
    Game.inputLocked = false; // разблокировка ввода в начале хода игрока
    
    if(Game.level === 4 && Game.turnCounter === 1 && Game.enemy.id === 'sagat') {
        Game.eBuffs.nextTurnEnergy += 1;
    }

    processStatus(Game.player, Game.pBuffs, 'player');
    processStatus(Game.enemy, Game.eBuffs, 'enemy');
    
    if(checkDeath()) return;

    Game.pBuffs.blockPct = 0; Game.pBuffs.blockCharges = 0; Game.pBuffs.dodgeChance = 0; Game.pBuffs.counter = 0;
    
    if(Game.pBuffs.specCd > 0) Game.pBuffs.specCd--;
    
    Game.pBuffs.weakness = 0;
    Game.eBuffs.weakness = 0;
    
    let energy = Game.baseEnergy + Game.energyBonus;
    if(Game.player.id === 'ryu') energy += 1;
    energy += Game.pBuffs.nextTurnEnergy;
    Game.pBuffs.nextTurnEnergy = 0;
    Game.pEnergy = energy;
    
    if(Game.player.id === 'chun' || Game.player.id === 'dhalsim') Game.pBuffs.freeCard = true;
    
    drawCards(Game.pDeck, Game.pHand, Game.pDiscard, 5 - Game.pHand.length);
    drawCards(Game.eDeck, Game.eHand, Game.eDiscard, 5 - Game.eHand.length);
    
    updateUI();
    
    if(Game.pBuffs.stun > 0) {
        logMsg(`${Game.player.name} ОГЛУШЁН! Пропуск хода.`, '#ffff00');
        Game.pBuffs.stun--;
        Game.cardsPlayedThisTurn = -1;
        setTimeout(endPlayerTurn, 1000);
    } else if(Game.pBuffs.freeze > 0) {
        logMsg(`${Game.player.name} ЗАМОРОЖЕН! Пропуск хода.`, '#00ffff');
        Game.pBuffs.freeze--;
        Game.cardsPlayedThisTurn = -1;
        setTimeout(endPlayerTurn, 1000);
    } else {
        logMsg(`--- ВАШ ХОД ---`, '#00ff00');
    }
}

function processStatus(char, buffs, side) {
    if(buffs.burn > 0) {
        char.hp -= 5;
        buffs.burn--;
        logMsg(`${char.name} горит! Получает 5 урона.`, '#ff4400');
        animFX(side, 'shake');
        spawnParticles(side, '#ff4400');
    }
    if(buffs.poison > 0) {
        char.hp -= buffs.poison;
        logMsg(`${char.name} отравлен! Получает ${buffs.poison} урона.`, '#0f0');
        animFX(side, 'shake');
    }
    if(buffs.waitTriggered) {
        let energyGain = 3;
        if(side === 'player') Game.pBuffs.nextTurnEnergy += energyGain;
        if(side === 'enemy') Game.eBuffs.nextTurnEnergy += energyGain;
        logMsg(`${char.name} выжидание даёт +${energyGain} энергии!`, '#0ff');
        buffs.waitTriggered = false;
    }
}

function getCardCost(card) {
    let cost = card.cost;
    if(Game.player.id === 'dhalsim' && !Game.pBuffs.freeCard) cost = Math.max(0, cost - 1);
    if(Game.pBuffs.freeCard) return 0;
    return cost;
}

function playCard(index) {
    if(Game.pBuffs.freeze > 0 || Game.pBuffs.stun > 0) return;
    let card = Game.pHand[index];
    let cost = card.cost;
    
    if(card.type === 'special' && Game.pBuffs.specCd > 0) {
        logMsg(`Спецприём в откате (${Game.pBuffs.specCd} х.)`, '#f00');
        return;
    }
    if(card.type === 'super' && Game.pEx < (card.reqEx || 100)) {
        logMsg(`Нужно ${card.reqEx || 100}% EX для супер-удара!`, '#f00');
        return;
    }
    
    let consumedFree = false;
    if(Game.pBuffs.freeCard) {
        consumedFree = true;
        cost = 0;
    } else if(Game.player.id === 'dhalsim') {
        cost = Math.max(0, cost - 1);
    }
    
    if(Game.pEnergy >= cost) {
        Game.pEnergy -= cost;
        if(consumedFree) Game.pBuffs.freeCard = false;
        
        Game.pHand.splice(index, 1);
        if(!card.once) Game.pDiscard.push(card);
        else Game.pExhaust.push(card);
        if(card.type === 'block' || card.mod === 'counter') Game.noBlockUsed = false;
        
        Game.comboHistory.push(card.type);
        if(checkCombo('player')) Game.pBuffs.nextAtkBoost = 1.5;
        
        executeCard(card, Game.player, Game.enemy, Game.pBuffs, Game.eBuffs, 'enemy');
        
        Game.cardsPlayedThisTurn++;
        
        updateUI();
        if(checkDeath()) return;
    }
}

function checkCombo(side) {
    let hist = Game.comboHistory;
    if(hist.length >= 3) {
        let last3 = hist.slice(-3);
        if(last3[0]==='attack' && last3[1]==='attack' && last3[2]==='special') {
            let char = side==='player'?Game.player:Game.enemy;
            logMsg(`>>> КОМБО: ${char.combo}! (+50% урон от Спецприёма) <<<`, '#ff00ff');
            Audio.combo();
            let el = document.getElementById('combo-text');
            el.innerText = char.combo + "!";
            el.classList.remove('anim-combo');
            void el.offsetWidth;
            el.classList.add('anim-combo');
            Game.comboHistory = [];
            return true;
        }
    }
    return false;
}

// ПРИМЕНЕНИЕ ПАССИВОК ПЕРСОНАЖЕЙ К АТАКЕ
// Модифицирует rawDmg и unblockable. Возвращает [rawDmg, unblockable]
function applyCharacterPassives(attacker, aBuffs, rawDmg, unblockable) {
    if(attacker.id === 'chun' && !aBuffs.firstStrikeDone) {
        aBuffs.firstStrikeDone = true;
        logMsg(`Чунь-Ли игнорирует блок первым ударом!`, '#0ff');
        return [rawDmg, true];
    }
    if(attacker.id === 'zangief' && attacker.hp < attacker.maxHp * 0.25) {
        logMsg(`Зангиев в ярости! (Урон x2 + Игнор блока)`, '#f00');
        return [rawDmg * 2, true];
    }
    if(attacker.id === 'ken' && Math.random() < 0.3) {
        logMsg(`КРИТ от Кена!`, '#ffbb00');
        return [rawDmg * 2.5, unblockable];
    }
    if(attacker.id === 'bison' && attacker.hp < attacker.maxHp * 0.4) {
        logMsg(`Байсон использует Психо Силу!`, '#f0f');
        return [rawDmg * 1.5, true];
    }
    if(attacker.id === 'akuma') {
        logMsg(`Акума: Демоническая сила! (Урон x1.5)`, '#f00');
        return [rawDmg * 1.5, unblockable];
    }
    return [rawDmg, unblockable];
}

function executeCard(card, attacker, defender, aBuffs, dBuffs, targetSide, isExtraAttack = false) {
    logMsg(`${attacker.name} использует [${card.name}]`);
    let goldMult = card.gold ? 1.3 : 1.0;
    
    if(card.type === 'skill') {
        if(card.mod === 'focus') { aBuffs.nextTurnEnergy += Math.ceil(2 * goldMult); logMsg(`${attacker.name} концентрируется (+${Math.ceil(2 * goldMult)} эн. в след. ходу)!`); }
        if(card.mod === 'heal15') { let h = Math.ceil(15 * goldMult); attacker.hp = Math.min(attacker.maxHp, attacker.hp + h); logMsg(`${attacker.name} лечит ${h} HP!`, '#0f0'); }
        if(card.mod === 'prep') { aBuffs.nextAtkBoost = 1.5 * goldMult; logMsg(`${attacker.name} готовится! (+${Math.floor(50 * goldMult)}% урон)`, '#0ff'); }
        if(card.mod === 'weakness') { dBuffs.weakness = 1; logMsg(`${defender.name} ослаблен! (${Math.floor(30 * goldMult)}% урон)`, '#888'); }
        if(card.mod === 'blood') { 
            let hpCost = Math.ceil(15 * goldMult);
            attacker.hp = Math.max(1, attacker.hp - hpCost); 
            aBuffs.nextTurnEnergy += Math.ceil(3 * goldMult); 
            let [d, h, disc] = attacker === Game.player ? [Game.pDeck, Game.pHand, Game.pDiscard] : [Game.eDeck, Game.eHand, Game.eDiscard];
            drawCards(d, h, disc, 1);
            logMsg(`${attacker.name} кровавый пакт! +${Math.ceil(3 * goldMult)} эн, -${hpCost} HP`, '#f00'); 
        }
        if(card.mod === 'wait') {
            aBuffs.wait = true;
            aBuffs.nextTurnEnergy += Math.ceil(3 * goldMult);
            logMsg(`${attacker.name} выжидает... (+${Math.ceil(3 * goldMult)} эн след. ход)`, '#888');
        }
        return;
    }
    
    if(card.type === 'block') {
        aBuffs.blockCharges = (aBuffs.blockCharges || 0) + 1;
        if(card.gold) {
            let heal = Math.ceil(5 * goldMult);
            attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
            logMsg(`${attacker.name} ВОССТАНАВЛИВАЕТ ${heal} HP! (Золотой Блок)`, '#ffd700');
        }
        if(card.mod === 'ice') aBuffs.iceBlock = true;
        if(card.mod === 'counter') aBuffs.counter = Math.ceil(15 * goldMult);
        
        animFX(targetSide==='enemy'?'player':'enemy', 'block');
        Audio.block();
        
        if(attacker.id === 'honda') {
            attacker.blockCount = (attacker.blockCount || 0) + 1;
            if(attacker.blockCount % 3 === 0) {
                attacker.hp = Math.min(attacker.maxHp, attacker.hp + 5);
                logMsg(`Хонда лечит 5 HP за блокирование!`, '#0f0');
            }
        }
        return;
    }
    
    if(card.type === 'dodge') {
        aBuffs.dodgeChance = Math.min(1.0, aBuffs.dodgeChance + (0.6 * goldMult));
        Audio.dodge();
        return;
    }

    if(card.type === 'attack' || card.type === 'special' || card.type === 'super') {
        if(!card.alwaysHit && card.accuracy && Math.random() > card.accuracy) {
            logMsg(`${attacker.name} ПРОМАХИВАЕТСЯ!`, '#888');
            return;
        }
        
        let hits = card.hits || 1;
        for(let i=0; i<hits; i++) {
            animFX(targetSide==='enemy'?'player':'enemy', targetSide==='enemy'?'lunge':'lunge-rev');
            
            let rawDmg = (card.min && card.max) ? (Math.floor(Math.random()*(card.max-card.min+1)) + card.min) : 10;
            rawDmg += (attacker.atk || 0) + (targetSide==='enemy' ? Game.dmgBonus : 0);
            
            if(aBuffs.weakness > 0) { rawDmg *= 0.7; logMsg(`${attacker.name} слаб! Урон -30%`, '#888'); }
            if(aBuffs.nextAtkBoost > 1) { rawDmg *= aBuffs.nextAtkBoost; }
            if(isExtraAttack) rawDmg *= 0.5;
            
            let unblockable = card.unblockable || false;
            if(card.alwaysHit) unblockable = true;
            
            let [d, ub] = applyCharacterPassives(attacker, aBuffs, rawDmg, unblockable);
            rawDmg = d;
            unblockable = ub;
            
            rawDmg = Math.floor(rawDmg);
            if(card.type === 'special') aBuffs.specCd = 3;
            
            let actualDmg = dealDamage(defender, rawDmg, dBuffs, targetSide, unblockable);
            
            if(actualDmg > 0) {
                if(card.mod && card.mod.startsWith('fire')) { 
                    dBuffs.burn += parseInt(card.mod.replace('fire', '')) || 2; 
                    logMsg(`${defender.name} подожжён!`, '#ffaa00'); 
                }
                if(card.mod && card.mod.startsWith('ice')) { 
                    let baseFreeze = parseInt(card.mod.replace('ice', '')) || 1;
                    let addFreeze = Math.max(1, baseFreeze - (dBuffs.freeze || 0));
                    dBuffs.freeze = (dBuffs.freeze || 0) + addFreeze;
                    logMsg(`${defender.name} заморожен! (${dBuffs.freeze} ходов)`, '#00ffff'); 
                }
                if(card.mod === 'vamp') { 
                    let heal = Math.floor((card.max || 10) * 0.5);
                    attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
                    logMsg(`${attacker.name} лечится на ${heal} HP`, '#0f0');
                }
                if(card.mod === 'poison') { 
                    dBuffs.poison = (dBuffs.poison || 0) + 2; 
                    logMsg(`${defender.name} отравлен! (-2 HP/ход)`, '#0f0'); 
                }
            }
            
            if(attacker.id === 'blanka' && Math.random() < 0.35) {
                logMsg(`Бланка: Удар молнией! (+8 урона и оглушение)`, '#ffff00');
                dealDamage(defender, 8, dBuffs, targetSide, true);
                dBuffs.stun = 1;
            }
            
            if(dBuffs.counter > 0) {
                logMsg(`${defender.name} проводит КОНТРАТАКУ!`, '#ff00ff');
                dealDamage(attacker, dBuffs.counter, aBuffs, targetSide==='enemy'?'player':'enemy', true);
                dBuffs.counter = 0;
            }
            
            if(defender.id === 'guile' && dBuffs.blockCharges > 0) {
                logMsg(`Гайл возвращает 3 урона за блок!`, '#ffaa00');
                dealDamage(attacker, 3, aBuffs, targetSide==='enemy'?'player':'enemy', true);
            }
            
            if(dBuffs.iceBlock) {
                aBuffs.freeze += 1;
                logMsg(`${attacker.name} заморожен об ледяной блок!`, '#00ffff');
                dBuffs.iceBlock = false;
            }
            if(aBuffs.nextAtkBoost > 1 && i === hits-1) { aBuffs.nextAtkBoost = 1.0; }
        }
        if(card.type === 'super') {
            let side = attacker === Game.player ? 'p' : 'e';
            if(side === 'p') Game.pEx = 0; else Game.eEx = 0;
            renderExBar(side);
            logMsg(`${attacker.name} СУПЕР АТАКА! EX сброшен!`, '#ff00ff');
        }
        
        if(dBuffs.wait) { dBuffs.waitTriggered = true; dBuffs.wait = false; }
    }
}

function dealDamage(target, amount, tBuffs, tSide, unblockable = false) {
    if(tBuffs.dodgeChance > 0 && Math.random() < tBuffs.dodgeChance) {
        logMsg(`${target.name} УКЛОНИЛСЯ от атаки!`, '#00ff00');
        animFX(tSide, 'shake');
        return 0;
    }
    
    let blocked = 0;
    let finalDmg = amount;
    if(!unblockable) {
        const flatBlock = target.def || 0;
        const afterFlat = Math.max(0, amount - flatBlock);
        if(flatBlock > 0 && amount > 0) {
            logMsg(`Пассивная защита поглотила ${Math.min(amount, flatBlock)} урона`);
        }
        
        // Заряды блока: каждый блок = 1 заблокированный удар на 50%
        if(tBuffs.blockCharges > 0) {
            tBuffs.blockCharges--;
            blocked = Math.floor(afterFlat * 0.5);
            logMsg(`🛡️ Заблокирован ${blocked} урона (зарядов осталось: ${tBuffs.blockCharges})`);
        }
        finalDmg = Math.max(0, afterFlat - blocked);
    }
    
    if(blocked > 0) {
        logMsg(`Заблокировано: ${blocked}`);
        Audio.block();
    }
    
    if(finalDmg > 0) {
        target.hp -= finalDmg;
        // Наноситель получает основной EX
        if(tSide === 'player') addEx('e', finalDmg);
        else addEx('p', finalDmg);
        // Цель получает rage EX (30% от урона)
        if(tSide === 'player') addEx('p', Math.floor(finalDmg * 0.3));
        else addEx('e', Math.floor(finalDmg * 0.3));
        logMsg(`${target.name} получает ${finalDmg} урона!`, '#ff0000');
        if(finalDmg > 20) Audio.heavyHit(); else Audio.hit();
        animFX(tSide, 'shake');
        spawnParticles(tSide, '#ff0000');
        
        if(target.hp <= 0) {
            document.body.classList.remove('anim-screen-shake');
            void document.body.offsetWidth;
            document.body.classList.add('anim-screen-shake');
        }
    }
    return finalDmg;
}

function animFX(side, animClass) {
    let el = document.getElementById(side=== 'player' ? 'p1-avatar' : 'p2-avatar');
    el.classList.remove('anim-' + animClass);
    void el.offsetWidth;
    el.classList.add('anim-' + animClass);
}

function spawnParticles(side, color) {
    let el = document.getElementById(side=== 'player' ? 'p1-avatar' : 'p2-avatar');
    let rect = el.getBoundingClientRect();
    FX.emit(rect.left + rect.width/2, rect.top + rect.height/2, color, 15);
}

function endPlayerTurn() {
    if(Game.inputLocked) return;
    Game.inputLocked = true;
    
    if(Game.cardsPlayedThisTurn === 0) {
        logMsg(`${Game.player.name} пропускает ход! (+1 энергия)`, '#00ff00');
        Game.pBuffs.nextTurnEnergy += 1;
    }
    updateUI();
    if(checkDeath()) { Game.inputLocked = false; return; }
    
    if(Game.multiplayer) {
        let next = Game.activePlayer === 1 ? 2 : 1;
        passTurnTo(next);
    } else {
        setTimeout(enemyTurn, 500);
    }
}

function evalEnemyCard(card) {
    let score = 10;
    if(card.type === 'special') score += 50; 
    
    let hpPct = Game.enemy.hp / Game.enemy.maxHp;
    if(hpPct < 0.3 && card.type === 'dodge') score += 40;
    if(hpPct < 0.5 && (card.type === 'block' || card.mod === 'counter')) score += 30;
    
    let playerHpPct = Game.player.hp / Game.player.maxHp;
    if(hpPct - playerHpPct > 0.2) {
        if(card.type === 'attack') score += 20;
        if(card.type === 'block' || card.type === 'dodge') score -= 20;
    }
    
    if(Game.eBuffs.burn > 0 && (card.type === 'block' || card.type === 'dodge')) score += 25;
    if(card.type === 'skill') score += 15;
    
    return score;
}

function enemyTurn() {
    if(checkDeath()) return;
    
    // Сброс защитных баффов врага в начале его хода
    Game.eBuffs.blockPct = 0; Game.eBuffs.blockCharges = 0; Game.eBuffs.dodgeChance = 0; Game.eBuffs.counter = 0;
    Game.eBuffs.weakness = 0;
    if(Game.eBuffs.specCd > 0) Game.eBuffs.specCd--;
    
    Game.comboHistory = [];
    Game.cardsPlayedThisTurn = 0;
    
    if(Game.eBuffs.stun > 0) {
        logMsg(`${Game.enemy.name} ОГЛУШЁН! Пропуск хода.`, '#ffff00');
        Game.eBuffs.stun--;
        setTimeout(startTurn, 1000);
        return;
    }
    if(Game.eBuffs.freeze > 0) {
        logMsg(`${Game.enemy.name} ЗАМОРОЖЕН! Пропуск хода.`, '#00ffff');
        Game.eBuffs.freeze--;
        setTimeout(startTurn, 1000);
        return;
    }

    logMsg(`--- ХОД ПРОТИВНИКА ---`, '#ff4444');
    let energy = Game.baseEnergy;
    if(Game.enemy.id === 'ryu') energy += 1;
    energy += Game.eBuffs.nextTurnEnergy;
    Game.eBuffs.nextTurnEnergy = 0;
    
    if(Game.enemy.id === 'chun' || Game.enemy.id === 'dhalsim') Game.eBuffs.freeCard = true;
    Game.eEnergy = energy;

    let playInterval = setInterval(() => {
        let playable = Game.eHand.filter(c => {
            let cost = c.cost;
            let canBeFree = Game.eBuffs.freeCard;
            if(!canBeFree && Game.enemy.id === 'dhalsim') cost = Math.max(0, cost-1);
            if(canBeFree) cost = 0;
            if(c.type === 'special' && Game.eBuffs.specCd > 0) return false;
            return Game.eEnergy >= cost;
        });
        
        let shouldPlay = playable.length > 0;
        
        if(shouldPlay && !checkDeath()) {
            playable.sort((a, b) => evalEnemyCard(b) - evalEnemyCard(a));
            if(playable.length > 1 && Math.random() < 0.2 && Game.cardsPlayedThisTurn > 0 && Game.eEnergy < 3) shouldPlay = false;
            
            if(shouldPlay) {
                let card = playable[0];
                if(playable.length > 1 && Math.random() < 0.3) card = playable[1];

                let idx = Game.eHand.indexOf(card);
                let cost = card.cost;
                
                let consumedFree = false;
                if(Game.eBuffs.freeCard) { consumedFree = true; cost = 0; } 
                else if(Game.enemy.id === 'dhalsim') { cost = Math.max(0, cost - 1); }
                
                if(consumedFree) Game.eBuffs.freeCard = false;
                else Game.eEnergy -= cost;
                
                Game.eHand.splice(idx, 1);
                if(!card.once) Game.eDiscard.push(card);
                else Game.eExhaust.push(card);
                
                Game.comboHistory.push(card.type);
                if(checkCombo('enemy')) Game.eBuffs.nextAtkBoost = 1.5;
                
                let isSecondVega = (Game.enemy.id === 'vega' && Game.cardsPlayedThisTurn === 1);
                
                executeCard(card, Game.enemy, Game.player, Game.eBuffs, Game.pBuffs, 'player', isSecondVega);
                
                Game.cardsPlayedThisTurn++;
                updateUI();
                
                if(Game.enemy.id === 'vega' && Game.cardsPlayedThisTurn >= 2) {
                    clearInterval(playInterval);
                    if(!checkDeath()) setTimeout(startTurn, 1000);
                    return;
                }
            }
        } 
        
        if(!shouldPlay || playable.length === 0 || checkDeath()) {
            clearInterval(playInterval);
            if(Game.cardsPlayedThisTurn === 0) {
                logMsg(`${Game.enemy.name} пропускает ход! (+1 энергия)`, '#ff4444');
                Game.eBuffs.nextTurnEnergy += 1;
            }
            if(!checkDeath()) setTimeout(startTurn, 1000);
        }
    }, 800);
}

function checkDeath() {
    if(Game.enemy.hp <= 0) {
        Game.enemy.hp = 0;
        updateUI();
        Audio.win();
        if(Game.multiplayer) {
            // В мультиплеере enemy = p2 (активный игрок победил)
            let activeNum = Game.activePlayer === 1 ? 1 : 2;
            let winner = activeNum === 1 ? Game.player.name : Game.p2.name;
            logMsg(`🏆 Игрок ${activeNum} — ${winner} побеждает!`, '#ff44ff');
            setTimeout(() => { nav('gameover'); showMultiGameOver(winner); }, 1500);
        } else {
            setTimeout(winBattle, 1500);
        }
        return true;
    }
    if(Game.player.hp <= 0) {
        Game.player.hp = 0;
        updateUI();
        Audio.lose();
        if(Game.multiplayer) {
            // В мультиплеере player = текущий активный проигравший
            let activeNum = Game.activePlayer === 1 ? 1 : 2;
            let loser = activeNum === 1 ? Game.player.name : Game.p2.name;
            let winner = activeNum === 1 ? Game.p2.name : Game.player.name;
            logMsg(`☠️ Игрок ${activeNum} — ${loser} повержен!`, '#f00');
            setTimeout(() => { nav('gameover'); showMultiGameOver(winner, loser); }, 1500);
        } else {
            setTimeout(loseGame, 1500);
        }
        return true;
    }
    return false;
}

function showMultiGameOver(winnerName, loserName) {
    document.getElementById('go-title').innerText = '⚔️ МУЛЬТИПЛЕЕР';
    document.getElementById('go-title').style.color = '#ff44ff';
    if(loserName) {
        document.getElementById('go-desc').innerHTML = `
            🏆 <b>${winnerName}</b> побеждает!<br>
            ☠️ <b>${loserName}</b> повержен.<br>
            <hr style="border-color:#555; margin:15px 0;">
            <button onclick="nav('menu')">В Главное Меню</button>
            <button onclick="nav('multi-select')">⚔️ Новая игра</button>
        `;
    } else {
        document.getElementById('go-desc').innerHTML = `
            🏆 <b>${winnerName}</b> побеждает!<br>
            <hr style="border-color:#555; margin:15px 0;">
            <button onclick="nav('menu')">В Главное Меню</button>
            <button onclick="nav('multi-select')">⚔️ Новая игра</button>
        `;
    }
}

function winBattle() {
    Stats.wins++;
    if(Game.level > Stats.bestRun) Stats.bestRun = Game.level;
    checkUnlockProgress();
    
    if(Game.enemy.id === 'zangief' && Game.turnCounter <= 3) Stats.achZangief3 = true;
    if(Game.noBlockUsed) Stats.achNoBlock = true;
    saveStats();
    
    if(Game.arcadeMode) {
        nav('gameover');
        document.getElementById('go-title').innerText = "🏆 ПОБЕДА В АРКАДЕ!";
        document.getElementById('go-title').style.color = "#00ff00";
        document.getElementById('go-desc').innerText = `${Game.player.name} победил ${Game.enemy.name} за ${Game.turnCounter} ходов!`;
        return;
    }
    
    // --- GOLD REWARD ---
    let goldReward = getEffectiveGold(10 + Game.level * 5);
    if(Game.turnCounter <= 5) goldReward += getEffectiveGold(10);
    if(Game.noBlockUsed) goldReward += getEffectiveGold(15);
    Game.gold += goldReward;
    // 30% от заработанного золота идёт в постоянный кошелёк
    let walletGain = Math.ceil(goldReward * 0.3);
    Stats.gold = (Stats.gold || 0) + walletGain;
    saveStats();
    logMsg(`+${walletGain} в кошелёк (${Stats.gold})`, '#ffd700');
    
    if(Game.level >= Game.maxLevel && !Game.endlessMode) {
        if(!Stats.achAllChars.includes(Game.player.id)) {
            Stats.achAllChars.push(Game.player.id);
            saveStats();
        }
        // Переход в бесконечный режим
        Game.endlessMode = true;
        Game.gold += getEffectiveGold(50); // Бонус за завершение карьеры
        logMsg('🏆 Байсон повержен! БЕСКОНЕЧНЫЙ РЕЖИМ АКТИВИРОВАН!', '#ff00ff');
        logMsg('Враги становятся сильнее с каждым уровнем. Как далеко вы зайдёте?', '#ffbb00');
    }
    
    Game.player.hp = Math.min(Game.player.maxHp, Game.player.hp + Math.floor(Game.player.maxHp * 0.2));
    Game.level++;
    
    // --- EVENTS v3.5 (30% шанс) ---
    if(Math.random() < 0.30) {
        triggerEvent();
    } else {
        showRewards();
    }
}

function loseGame() {
    Stats.losses++;
    if(Game.endlessMode && Game.level > Stats.recordEndless) {
        Stats.recordEndless = Game.level;
        logMsg(`🎖️ Новый рекорд бесконечного режима: уровень ${Game.level}!`, '#ffd700');
    }
    // Половина оставшегося забегового золота переходит в постоянный кошелёк
    if(Game.gold > 0 && !Game.arcadeMode && !Game.multiplayer) {
        let walletGain = Math.floor(Game.gold * 0.5);
        Stats.gold = (Stats.gold || 0) + walletGain;
        logMsg(`💰 +${walletGain} золота в кошелёк (${Stats.gold})`, '#ffd700');
    }
    saveStats();
    nav('gameover');
    document.getElementById('go-title').innerText = "ПОРАЖЕНИЕ";
    document.getElementById('go-title').style.color = "#ff0000";
    if(Game.endlessMode) {
        document.getElementById('go-desc').innerText = `Бесконечный режим пройден до уровня ${Game.level}.\nРекорд: ${Stats.recordEndless}.`;
    } else {
        document.getElementById('go-desc').innerText = `Ваш путь окончен на бою ${Game.level}.\nНе сдавайтесь, тренируйтесь!`;
    }
}

// --- EVENTS v3.5 ---
const EventDB = [
    {
        id: 'healer',
        desc: '🏥 Странствующий целитель предлагает свои услуги. Его лекарства известны на весь мир.',
        choices: [
            { title: 'Полное исцеление', desc: 'Восстановить 30 HP — 20 золота', cost: 20, action: (g) => { let heal = 30; g.player.hp = Math.min(g.player.maxHp, g.player.hp + heal); return `+${heal} HP!`; } },
            { title: 'Малое исцеление', desc: 'Восстановить 15 HP — 10 золота', cost: 10, action: (g) => { let heal = 15; g.player.hp = Math.min(g.player.maxHp, g.player.hp + heal); return `+${heal} HP!`; } },
            { title: 'Отказаться', desc: 'Сохранить золото', action: (g) => 'Вы прошли мимо.' }
        ]
    },
    {
        id: 'merchant',
        desc: '🧳 Торговец продаёт редкие карты из дальних земель. У него есть интересные товары.',
        choices: [
            { title: 'Купить редкую карту', desc: 'Случайная карта — 25 золота', cost: 25, action: (g) => { let pool = [CardDB.find(c=>c.id==='ice_spear'), CardDB.find(c=>c.id==='v_atk'), CardDB.find(c=>c.id==='counter'), CardDB.find(c=>c.id==='jump_atk'), CardDB.find(c=>c.id==='second_wind')].filter(Boolean); let card = pool[Math.floor(Math.random()*pool.length)]; if(card) { g.pDeck.push(cloneCard(card)); return `Получена: ${card.name}!`; } return 'Ничего не нашлось.'; } },
            { title: 'Купить золотую карту', desc: 'Улучшенная версия — 50 золота', cost: 50, action: (g) => { if(g.pDeck.length > 0) { let idx = Math.floor(Math.random() * g.pDeck.length); let oldCard = g.pDeck[idx]; if(oldCard.gold) return 'Эта карта уже золотая.'; g.pDeck[idx] = upgradeToGold(oldCard); return `Улучшена: ${g.pDeck[idx].name}!`; } return 'Колода пуста.'; } },
            { title: 'Уйти', desc: 'Сохранить золото', action: (g) => 'Вы решили не рисковать.' }
        ]
    },
    {
        id: 'shrine',
        desc: '⛩️ Древняя святыня излучает мистическую энергию. Что вы сделаете?',
        choices: [
            { title: 'Молиться за силу', desc: '+5 Макс HP, -10 текущего HP', action: (g) => { g.player.maxHp += 5; g.player.hp = Math.max(1, g.player.hp - 10); return '+5 Макс HP, но цена — боль.'; } },
            { title: 'Молиться за энергию', desc: '+1 энергия/ход, -15 HP', action: (g) => { g.energyBonus += 1; g.player.hp = Math.max(1, g.player.hp - 15); return '+1 энергия/ход, но вы истощены.'; } },
            { title: 'Пройти мимо', desc: 'Ничего не произойдёт', action: (g) => 'Святыня осталась позади.' }
        ]
    },
    {
        id: 'ambush',
        desc: '⚔️ Бродячий воин бросает вам вызов! Победа даст награду, поражение — штраф.',
        choices: [
            { title: 'Принять вызов', desc: 'Сразиться (+10 золота при победе, -15 HP при поражении)', action: (g) => { if(Math.random() < 0.6) { let bonus = getEffectiveGold(10); g.gold += bonus; return 'Победа! +' + bonus + ' золота.'; } else { g.player.hp = Math.max(1, g.player.hp - 15); return 'Поражение... -15 HP.'; } } },
            { title: 'Откупиться', desc: 'Заплатить 15 золота и уйти', cost: 15, action: (g) => { return 'Вы заплатили и ушли целым.'; } },
            { title: 'Бежать', desc: 'Попытаться сбежать (50% шанс)', action: (g) => { if(Math.random() < 0.5) return 'Удалось сбежать!'; g.player.hp = Math.max(1, g.player.hp - 8); return 'Не удалось... -8 HP.'; } }
        ]
    },
    {
        id: 'treasure',
        desc: '💰 Вы нашли брошенный сундук! Внутри может быть что угодно.',
        choices: [
            { title: 'Открыть осторожно', desc: '80% шанс: +20 золота, 20%: ловушка -10 HP', action: (g) => { if(Math.random() < 0.8) { let bonus = getEffectiveGold(20); g.gold += bonus; return '+' + bonus + ' золота!'; } g.player.hp = Math.max(1, g.player.hp - 10); return 'Ловушка! -10 HP.'; } },
            { title: 'Выломать', desc: '50% шанс: +30 золота, 50%: ловушка -20 HP', action: (g) => { if(Math.random() < 0.5) { let bonus = getEffectiveGold(30); g.gold += bonus; return '+' + bonus + ' золота!'; } g.player.hp = Math.max(1, g.player.hp - 20); return 'Ловушка! -20 HP.'; } },
            { title: '⭐ Искать редкость', desc: '50% шанс найти золотую карту в сундуке', action: (g) => { if(Math.random() < 0.5) { let pool = g.pDeck.filter(c=>!c.gold); if(pool.length>0){ let idx = Math.floor(Math.random()*g.pDeck.length); while(g.pDeck[idx].gold) idx = Math.floor(Math.random()*g.pDeck.length); g.pDeck[idx] = upgradeToGold(g.pDeck[idx]); return `Найдена ${g.pDeck[idx].name}!`; } return 'Сундук пуст...'; } g.player.hp = Math.max(1, g.player.hp - 5); return 'Ловушка! -5 HP.'; } },
            { title: 'Пройти мимо', desc: 'Не рисковать', action: (g) => 'Сундук остался позади.' }
        ]
    },
    {
        id: 'master',
        desc: '🥋 Таинственный мастер предлагает обучение. Урок стоит недёшево, но знания бесценны.',
        choices: [
            { title: 'Обучение силы', desc: '+3 урона — 30 золота', cost: 30, action: (g) => { g.dmgBonus += 3; return '+3 к урону!'; } },
            { title: 'Обучение защиты', desc: '+1 блок/ход — 30 золота', cost: 30, action: (g) => { return 'Пока недоступно.'; } },
            { title: 'Отказаться', desc: 'Уйти', action: (g) => 'Мастер кивнул и растворился в тени.' }
        ]
    }
];

function triggerEvent() {
    let evt = EventDB[Math.floor(Math.random() * EventDB.length)];
    Game.currentEvent = evt;
    
    nav('events');
    document.getElementById('event-desc').innerText = evt.desc;
    
    const container = document.getElementById('event-choices');
    container.innerHTML = '';
    document.getElementById('event-continue-btn').style.display = 'none';
    
    evt.choices.forEach((choice, idx) => {
        let div = document.createElement('div');
        div.className = 'event-choice';
        div.innerHTML = `<h3>${choice.title}</h3><p>${choice.desc}</p><div class="event-result" id="event-res-${idx}"></div>`;
        div.onclick = () => makeEventChoice(idx);
        container.appendChild(div);
    });
}

function makeEventChoice(choiceIdx) {
    let evt = Game.currentEvent;
    let choice = evt.choices[choiceIdx];
    
    let effectiveCost = choice.cost ? getEffectivePrice(choice.cost) : 0;
    if(effectiveCost && Game.gold < effectiveCost) {
        document.getElementById(`event-res-${choiceIdx}`).innerText = 'Недостаточно золота!';
        document.getElementById(`event-res-${choiceIdx}`).style.color = '#ff4444';
        document.getElementById(`event-res-${choiceIdx}`).style.display = 'block';
        return;
    }
    
    if(effectiveCost) Game.gold -= effectiveCost;
    
    let result = choice.action(Game);
    
    // Show result
    document.getElementById(`event-res-${choiceIdx}`).innerText = result;
    document.getElementById(`event-res-${choiceIdx}`).style.display = 'block';
    
    // Mark chosen, disable others
    let allChoices = document.querySelectorAll('.event-choice');
    allChoices.forEach((el, i) => {
        if(i === choiceIdx) el.classList.add('chosen');
        else el.classList.add('disabled');
    });
    
    document.getElementById('event-continue-btn').style.display = 'inline-block';
}

function finishEvent() {
    Game.currentEvent = null;
    showRewards();
}

function renderPlayerStatsPanel() {
    const el = document.getElementById('player-stats-panel');
    if(!el || !Game.player) return;
    let p = Game.player;
    let atk = (p.atk || 0) + (Game.dmgBonus || 0);
    let def = p.def || 0;
    let energy = Game.baseEnergy + (Game.energyBonus || 0);
    if(p.id === 'ryu') energy += 1;
    let goldCards = (Game.pDeck || []).filter(c => c.gold).length
        + (Game.pHand || []).filter(c => c.gold).length
        + (Game.pDiscard || []).filter(c => c.gold).length;
    let totalCards = (Game.pDeck || []).length + (Game.pHand || []).length + (Game.pDiscard || []).length + (Game.pExhaust || []).length;
    el.innerHTML = `
        <div class="psp-avatar">${renderAvatar(p.svg)}</div>
        <div class="psp-info">
            <div class="psp-name">${p.name}</div>
            <div class="psp-stats">
                <span class="s-hp">❤️ ${p.hp}/${p.maxHp}</span>
                <span class="s-atk">⚔️ ${atk}${Game.dmgBonus ? ' (+' + Game.dmgBonus + ')' : ''}</span>
                <span class="s-def">🛡️ ${def}</span>
                <span class="s-eng">⚡ ${energy}${Game.energyBonus ? ' (+' + Game.energyBonus + ')' : ''}</span>
                <span class="s-deck">🃏 ${totalCards}${goldCards ? ' (⭐' + goldCards + ')' : ''}</span>
            </div>
            <div class="psp-passive">${p.passiveDesc || ''}</div>
        </div>
    `;
}

// --- REWARDS ---
function showRewards() {
    nav('rewards');
    document.getElementById('gold-display').innerText = 'Золото: ' + Game.gold;
    document.getElementById('reward-subtitle').innerText = 'Выберите награду:';
    document.getElementById('reward-container').style.display = 'flex';
    document.getElementById('shop-container').classList.remove('active');
    document.getElementById('skip-reward-btn').style.display = 'inline-block';
    document.getElementById('next-battle-btn').style.display = 'none';
    let switchBtn = document.getElementById('switch-char-btn');
    if(switchBtn) switchBtn.style.display = 'none';
    renderPlayerStatsPanel();
    
    const rc = document.getElementById('reward-container');
    rc.innerHTML = '';
    
    let options = [
        { title: 'Здоровье', desc: '+10 Макс HP', img: CardArts.icon_health, action: () => { Game.player.maxHp += 10; Game.player.hp += 10; } },
        { title: 'Сила', desc: '+3 Урон', img: CardArts.icon_strength, action: () => { Game.dmgBonus += 3; } },
        { title: 'Энергия', desc: '+1 Энергия/ход', img: CardArts.icon_energy, action: () => { Game.energyBonus += 1; } },
        { title: 'Тяж. Удар', desc: 'Новая карта в колоду', img: CardArts.h_atk, action: () => { Game.pDeck.push(createCard('h_atk')); } },
        { title: 'Огн. Шар', desc: 'Новая карта в колоду', img: CardArts.fireball, action: () => { Game.pDeck.push(createCard('fireball')); } },
        { title: 'Вампиризм', desc: 'Новая карта в колоду', img: CardArts.v_atk, action: () => { Game.pDeck.push(createCard('v_atk')); } },
        { title: 'Лед. Блок', desc: 'Новая карта в колоду', img: CardArts.iceblock, action: () => { Game.pDeck.push(createCard('i_blk')); } },
        { title: 'Контратака', desc: 'Новая карта в колоду', img: CardArts.counter, action: () => { Game.pDeck.push(createCard('counter')); } },
        { title: 'Лед. Копьё', desc: 'Новая карта в колоду', img: CardArts.ice_spear, action: () => { Game.pDeck.push(createCard('ice_spear')); } },
        { title: '2-е Дыхание', desc: 'Новая карта в колоду', img: CardArts.second_wind, action: () => { Game.pDeck.push(createCard('second_wind')); } },
        { title: 'Удар в прыжке', desc: 'Новая карта в колоду', img: CardArts.jump_atk, action: () => { Game.pDeck.push(createCard('jump_atk')); } },
        { title: 'Подготовка', desc: 'Новая карта в колоду', img: CardArts.prepare, action: () => { Game.pDeck.push(createCard('prepare')); } },
        { title: 'Концентрация', desc: 'Новая карта в колоду', img: CardArts.focus, action: () => { Game.pDeck.push(createCard('focus')); } }
    ];
    
    options = shuffle(options).slice(0, 3);
    
    options.forEach(opt => {
        let d = document.createElement('div');
        d.className = 'reward-card';
        let imgHtml = '';
        if (opt.img) {
            imgHtml = '<img src="' + opt.img + '" class="reward-card-img" alt="">';
        }
        d.innerHTML = imgHtml + '<div class="reward-card-title">' + opt.title + '</div><div class="reward-card-desc">' + opt.desc + '</div>';
        d.onclick = () => { opt.action(); showShopAfterReward(); };
        rc.appendChild(d);
    });
}

function skipReward() {
    Game.gold += getEffectiveGold(5);
    showShopAfterReward();
}

function showShopAfterReward() {
    document.getElementById('reward-container').style.display = 'none';
    document.getElementById('reward-subtitle').innerText = 'Магазин — купите улучшения:';
    document.getElementById('skip-reward-btn').style.display = 'none';
    document.getElementById('next-battle-btn').style.display = 'inline-block';
    let switchBtn = document.getElementById('switch-char-btn');
    if(switchBtn && !Game.arcadeMode && !Game.multiplayer) switchBtn.style.display = 'inline-block';
    renderPlayerStatsPanel();
    renderShop();
}

function renderShop() {
    const sc = document.getElementById('shop-container');
    sc.innerHTML = '';
    sc.classList.add('active');
    document.getElementById('gold-display').innerText = 'Золото: ' + Game.gold;
    
    let allItems = [
        { title: 'Лечение +20', desc: 'Восстановить 20 HP', price: 15, action: () => { Game.player.hp = Math.min(Game.player.maxHp, Game.player.hp + 20); } },
        { title: 'Лечение +40', desc: 'Восстановить 40 HP', price: 25, action: () => { Game.player.hp = Math.min(Game.player.maxHp, Game.player.hp + 40); } },
        { title: '+5 Макс HP', desc: 'Увеличить макс HP на 5', price: 20, action: () => { Game.player.maxHp += 5; } },
        { title: '+2 Урон', desc: 'Постоянный бонус урона', price: 20, action: () => { Game.dmgBonus += 2; } },
        { title: '+1 Энергия', desc: '+1 энергия каждый ход', price: 30, action: () => { Game.energyBonus += 1; } },
        { title: 'Удалить атаку', desc: 'Убрать слабую атаку из колоды', price: 20, action: () => { removeWeakCard('l_atk'); } },
        { title: 'Удалить блок', desc: 'Убрать слабый блок из колоды', price: 20, action: () => { removeWeakCard('block'); } },
        { title: '⭐ Золотая Карта', desc: 'Улучшить случайную карту до золотой (+30%)', price: 50, action: () => { upgradeRandomCardToGold(); } },
        { title: 'Дубликат карты', desc: 'Копия случайной карты из колоды', price: 15, action: () => { duplicateRandomCard(); } }
    ];
    
    let items = shuffle(allItems).slice(0, 4);
    
    items.forEach(item => {
        let d = document.createElement('div');
    const effectivePrice = getEffectivePrice(item.price);
    let affordable = Game.gold >= effectivePrice;
    d.className = 'shop-item ' + (affordable ? 'affordable' : 'unaffordable');
    d.innerHTML = '<div class="shop-item-title">' + item.title + '</div><div class="shop-item-desc">' + item.desc + '</div><div class="shop-item-price">' + effectivePrice + ' золота</div>';
    if (affordable) {
        d.onclick = () => {
            Game.gold -= effectivePrice;
                item.action();
                document.getElementById('gold-display').innerText = 'Золото: ' + Game.gold;
                logMsg('Куплено: ' + item.title, '#ffd700');
                d.remove();
                renderPlayerStatsPanel();
                renderShop();
            };
        }
        sc.appendChild(d);
    });
}

function removeWeakCard(cardId) {
    let idx = Game.pDeck.findIndex(c => c.id === cardId);
    if (idx >= 0) {
        let removed = Game.pDeck.splice(idx, 1)[0];
        logMsg('Удалена карта: ' + removed.name, '#aaa');
    } else {
        idx = Game.pDiscard.findIndex(c => c.id === cardId);
        if (idx >= 0) {
            let removed = Game.pDiscard.splice(idx, 1)[0];
            logMsg('Удалена карта из сброса: ' + removed.name, '#aaa');
        }
    }
}

// --- CHARACTER SWITCH (Career) ---
function openCharSwitch() {
    nav('char-switch');
    renderCharSwitchRoster();
}

function backToRewards() {
    nav('rewards');
    renderPlayerStatsPanel();
}

function renderCharSwitchRoster() {
    const cont = document.getElementById('switch-roster-container');
    cont.innerHTML = '';
    document.getElementById('switch-gold-display').innerText = '💰 Кошелёк: ' + (Stats.gold || 0) + ' | В забеге: ' + Game.gold;

    Characters.forEach(c => {
        let card = document.createElement('div');
        let isUnlocked = Stats.unlockedChars.includes(c.id);
        let isCurrent = Game.player && Game.player.id === c.id;
        card.className = 'char-card' + (isUnlocked ? '' : ' locked') + (isCurrent ? ' selected arcade-char' : '');

        if(isCurrent) {
            card.innerHTML = `
                <div class="char-name" style="color:#0f0">${c.name} (текущий)</div>
                <div class="char-svg">${renderAvatar(c.svg)}</div>
                <div class="char-info">HP: ${c.hp}<br>ATK: ${c.atk} 🛡️: ${c.def}<br><br><span style="color:#0f0">${c.passiveDesc}</span></div>
            `;
        } else if(isUnlocked) {
            card.innerHTML = `
                <div class="char-name">${c.name}</div>
                <div class="char-svg">${renderAvatar(c.svg)}</div>
                <div class="char-info">HP: ${c.hp}<br>ATK: ${c.atk} 🛡️: ${c.def}<br><br><span style="color:#0f0">${c.passiveDesc}</span></div>
            `;
            card.onclick = () => switchCharacter(c.id);
        } else {
            let req = UNLOCK_CONDITIONS[c.id];
            let canAfford = (Stats.gold || 0) >= req.cost;
            card.innerHTML = `
                <div class="char-name" style="color:#666">???</div>
                <div class="char-svg" style="filter:grayscale(100%);opacity:0.3">${renderAvatar(c.svg)}</div>
                <div class="char-info" style="color:#888;font-size:9px">${req.desc}<br><br>Цена: <span style="color:${canAfford ? '#ffd700' : '#f44'}">${req.cost}💰</span></div>
            `;
            card.onclick = () => { unlockChar(c.id); renderCharSwitchRoster(); };
        }
        cont.appendChild(card);
    });
}

function switchCharacter(charId) {
    if(!Stats.unlockedChars.includes(charId)) return;
    if(Game.player && Game.player.id === charId) return;
    let charBase = Characters.find(c => c.id === charId);
    if(!charBase) return;

    if(!confirm(`Сменить бойца на ${charBase.name}?\nКолода будет пересоздана. Улучшения (золото, бонусы) сохранятся.`)) return;

    // Сохраняем улучшения (dmgBonus, energyBonus, gold, level, maxLevel, difficulty, endlessMode)
    let prevMaxHpBonus = Math.max(0, (Game.player.maxHp || 0) - (Characters.find(c=>c.id===Game.player.id)?.hp || 0));

    Game.player = JSON.parse(JSON.stringify(charBase));
    Game.player.maxHp = Game.player.hp + prevMaxHpBonus;
    Game.player.hp = Game.player.maxHp; // Полное восстановление HP при смене
    Game.pEx = 0;
    Game.pDeck = generateStartingDeck(charId);
    Game.pHand = [];
    Game.pDiscard = [];
    Game.pExhaust = [];
    resetBuffs(Game.pBuffs);

    logMsg(`🔄 Боец сменён на ${Game.player.name}!`, '#ffbb00');
    backToRewards();
}

function duplicateRandomCard() {
    if (Game.pDeck.length > 0) {
        let src = Game.pDeck[Math.floor(Math.random() * Game.pDeck.length)];
        Game.pDeck.push(cloneCard(src));
        logMsg('Добавлена копия: ' + src.name, '#0f0');
    }
}

// --- UI UPDATE ---
function renderFighterStats(elId, fighter, isPlayer) {
    let el = document.getElementById(elId);
    if(!el) return;
    let atk = (fighter.atk || 0) + (isPlayer ? (Game.dmgBonus || 0) : 0);
    let def = fighter.def || 0;
    let energy = Game.baseEnergy + (isPlayer ? (Game.energyBonus || 0) : 0);
    if(isPlayer && fighter.id === 'ryu') energy += 1;
    if(!isPlayer && fighter.id === 'ryu') energy += 1;
    let parts = [];
    parts.push(`<span class="stat-chip atk">⚔️${atk}</span>`);
    parts.push(`<span class="stat-chip def">🛡️${def}</span>`);
    parts.push(`<span class="stat-chip eng">⚡${energy}</span>`);
    if(fighter.passiveDesc) {
        parts.push(`<span class="stat-chip passive" title="${fighter.passiveDesc}">${fighter.passiveDesc}</span>`);
    }
    el.innerHTML = parts.join('');
}

function updateUI() {
    // Top Info
    document.getElementById('p1-avatar').innerHTML = renderAvatar(Game.player.svg);
    document.getElementById('p1-name').innerText = Game.player.name;
    renderFighterStats('p1-stats', Game.player, true);
    let p1HpPct = (Game.player.hp / Game.player.maxHp) * 100;
    let p1HpFill = document.getElementById('p1-hp-fill');
    p1HpFill.style.width = Math.max(0, p1HpPct) + '%';
    p1HpFill.style.background = getHpColor(p1HpPct);
    document.getElementById('p1-hp-text').innerText = `${Game.player.hp}/${Game.player.maxHp}`;
    document.getElementById('p1-deck').innerText = `Колода: ${Game.pDeck.length} | Сброс: ${Game.pDiscard.length} | Золото: ${Game.gold}`;
    
    document.getElementById('p2-avatar').innerHTML = renderAvatar(Game.enemy.svg);
    document.getElementById('p2-name').innerText = Game.enemy.name;
    renderFighterStats('p2-stats', Game.enemy, false);
    let p2HpPct = (Game.enemy.hp / Game.enemy.maxHp) * 100;
    let p2HpFill = document.getElementById('p2-hp-fill');
    p2HpFill.style.width = Math.max(0, p2HpPct) + '%';
    p2HpFill.style.background = getHpColor(p2HpPct);
    document.getElementById('p2-hp-text').innerText = `${Game.enemy.hp}/${Game.enemy.maxHp}`;
    document.getElementById('p2-deck').innerText = `Колода: ${Game.eDeck.length} | Сброс: ${Game.eDiscard.length}`;

    // Status
    function renderStatus(buffs, elId, avatarId) {
        let html = '';
        let avatarEl = document.getElementById(avatarId);
        avatarEl.className = 'fighter-avatar';
        
        if(buffs.blockCharges > 0) html += `<div class="status" style="background:#00f; color:#fff;">🛡️BLOCK:${buffs.blockCharges}</div>`;
        if(buffs.counter > 0) html += `<div class="status" style="background:#808; color:#fff;">Контрудар</div>`;
        
        if(buffs.burn > 0) { html += `<div class="status" style="background:#f00; color:#fff;">🔥${buffs.burn}</div>`; avatarEl.classList.add('status-burn'); }
        if(buffs.freeze > 0) { html += `<div class="status" style="background:#0ff; color:#000;">❄️${buffs.freeze}</div>`; avatarEl.classList.add('status-freeze'); }
        if(buffs.stun > 0) { html += `<div class="status" style="background:#ff0; color:#000;">⚡${buffs.stun}</div>`; avatarEl.classList.add('status-stun'); }
        if(buffs.poison > 0) { html += `<div class="status" style="background:#0f0; color:#000;">☠️${buffs.poison}</div>`; avatarEl.classList.add('status-poison'); }
        if(buffs.weakness > 0) { html += `<div class="status" style="background:#888; color:#fff;">💀Слаб</div>`; }
        if(buffs.dodgeChance > 0) html += `<div class="status" style="background:#0f0; color:#000;">Уклонение</div>`;
        if(buffs.nextAtkBoost > 1 || buffs.nextTurnEnergy > 0) { avatarEl.classList.add('status-buff'); html += `<div class="status" style="background:#0f0; color:#000;">⬆️ Бафф</div>`; }
        
        document.getElementById(elId).innerHTML = html;
    }
    renderStatus(Game.pBuffs, 'p1-status', 'p1-avatar');
    renderStatus(Game.eBuffs, 'p2-status', 'p2-avatar');

    // Energy
    let engStr = '';
    for(let i=0; i<Game.pEnergy; i++) engStr += '<div class="energy-orb"></div>';
    document.getElementById('energy-container').innerHTML = `Энергия: ${engStr}`;

    // EX Bars
    let pExPct = Math.max(0, Math.min(100, Game.pEx));
    let eExPct = Math.max(0, Math.min(100, Game.eEx));
    let p1ExFill = document.getElementById('p1-ex-fill');
    let p1ExText = document.getElementById('p1-ex-text');
    let p2ExFill = document.getElementById('p2-ex-fill');
    let p2ExText = document.getElementById('p2-ex-text');
    if(p1ExFill) { p1ExFill.style.width = pExPct + '%'; p1ExFill.className = 'ex-bar-fill ' + (pExPct < 50 ? 'ex-bar-green' : pExPct < 80 ? 'ex-bar-yellow' : 'ex-bar-red'); }
    if(p1ExText) p1ExText.innerText = 'EX: ' + pExPct + '%';
    if(p2ExFill) { p2ExFill.style.width = eExPct + '%'; p2ExFill.className = 'ex-bar-fill ' + (eExPct < 50 ? 'ex-bar-green' : eExPct < 80 ? 'ex-bar-yellow' : 'ex-bar-red'); }
    if(p2ExText) p2ExText.innerText = 'EX: ' + eExPct + '%';

    // Hand
    const hc = document.getElementById('player-hand');
    hc.innerHTML = '';
    Game.pHand.forEach((card, i) => {
        let cost = card.cost;
        if(Game.player.id === 'dhalsim' && !Game.pBuffs.freeCard) cost = Math.max(0, cost - 1);
        if(Game.pBuffs.freeCard) cost = 0;
        
        let canPlay = Game.pEnergy >= cost && Game.pBuffs.freeze === 0 && Game.pBuffs.stun === 0 && !(card.type==='special' && Game.pBuffs.specCd>0) && !(card.type==='super' && Game.pEx < 100);
        
        let c = document.createElement('div');
        c.className = 'card' + (canPlay ? '' : ' disabled') + (card.gold ? ' gold' : '');
        let goldLabel = card.gold ? '<div class="gold-label">⭐</div>' : '';
        c.innerHTML = `
            ${goldLabel}
            <div class="card-cost">${cost}</div>
            <div class="card-title">${card.name}</div>
            <img src="${card.svg}" style="width:100%;height:100%;object-fit:cover;border-radius:2px;" alt="">
            <div class="card-desc">${card.desc}</div>
        `;
        if(canPlay) c.onclick = () => playCard(i);
        hc.appendChild(c);
    });
}

// Init
function addEx(who, amount) {
    const char = who === 'p' ? Game.player : Game.enemy;
    const rate = char && char.exRate ? char.exRate : 5.0;
    let gain = Math.ceil(amount * rate);
    if (gain < 1) gain = 1;
    if (who === 'p') Game.pEx = Math.min(100, Game.pEx + gain);
    else Game.eEx = Math.min(100, Game.eEx + gain);
}
function renderExBar(who) {
    const ex = who === 'p' ? Game.pEx : Game.eEx;
    const fill = document.querySelector('#' + who + '-ex-fill');
    const text = document.querySelector('#' + who + '-ex-text');
    if (!fill || !text) return;
    fill.style.width = ex + '%';
    fill.className = 'ex-bar-fill ' + (ex < 50 ? 'ex-bar-green' : ex < 80 ? 'ex-bar-yellow' : 'ex-bar-red');
    text.innerText = 'EX: ' + ex + '%';
}

window.onload = () => nav('menu');