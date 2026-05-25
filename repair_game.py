import re

# Полный список данных и логики
script_content = r'''
// --- DATA ---
const C = { R: '#cc0000', B: '#0066cc', Y: '#ffcc00', S: '#ffcc99', K: '#111', W: '#fff', G: '#009900', O: '#ff8800', P: '#880088', L: '#00ccff', D: '#8b4513' };
function drawAvatar(colors, layout) {
    let svg = '<svg viewBox="0 0 8 8" width="100%" height="100%">';
    for(let y=0; y<8; y++) { for(let x=0; x<8; x++) { let char = layout[y][x]; if(char !== ' ') svg += `<rect x="${x}" y="${y}" width="1" height="1" fill="${colors[char]}"/>`; } }
    return svg + '</svg>';
}
const Avatars = {
    ryu: drawAvatar(C, ["  R R   ", " K K K  ", "KS S S K", " S K S  ", "  S S   ", " W W W  ", " W K W  ", " K   K  "]),
    ken: drawAvatar(C, ["  Y Y   ", " Y Y Y  ", "YS S S Y", " S K S  ", "  S S   ", " R R R  ", " R K R  ", " K   K  "]),
    chun: drawAvatar(C, [" W S W  ", " KS S K ", "  S S   ", " B Y B  ", " B B B  ", " K   K  ", " W   W  ", " K   K  "]),
    guile: drawAvatar(C, ["YYYYYYYY", " Y Y Y  ", " S S S  ", " S K S  ", " G G G  ", " G K G  ", " G K G  ", " K   K  "]),
    zangief: drawAvatar(C, ["  K K   ", " K S K  ", " S S S  ", "  K K   ", " S S S  ", " S R S  ", " R R R  ", " K   K  "]),
    dhalsim: drawAvatar(C, ["  O O   ", " D D D  ", " D S D  ", "  D D   ", " Y Y Y  ", " Y Y Y  ", " Y   Y  ", " K   K  "]),
    blanka: drawAvatar(C, ["  O O   ", " O G O  ", " G R G  ", "  G G   ", " G G G  ", " G Y G  ", " G   G  ", " K   K  "]),
    honda: drawAvatar(C, ["  K K   ", " KS SK  ", " S S S  ", " B R B  ", " S S S  ", " S S S  ", " B   B  ", " K   K  "]),
    sagat: drawAvatar(C, ["  S S   ", "  S S   ", "  S S   ", " K S S  ", "  S S   ", " B B B  ", " B K B  ", " K   K  "]),
    vega: drawAvatar(C, ["  Y Y   ", " Y W Y  ", " W S W  ", "  S S   ", " P P P  ", " P Y P  ", " P K P  ", " K   K  "]),
    bison: drawAvatar(C, ["  R R   ", " R R R  ", " R S R  ", "  S S   ", " R R R  ", " R K R  ", " R K R  ", " K   K  "])
};
const CardArts = {
    attack: drawAvatar(C, ["        ", "   R    ", "  RRR   ", " RRRRR  ", "  RRR   ", "   R    ", "        ", "        "]),
    block: drawAvatar(C, ["        ", "  BBB   ", "  BBB   ", "  BBB   ", "  BBB   ", "  BBB   ", "        ", "        "]),
    dodge: drawAvatar(C, ["        ", "   W    ", "  W W   ", " W   W  ", "  W W   ", "   W    ", "        ", "        "]),
    special: drawAvatar(C, [" Y Y Y  ", "  Y Y   ", " Y Y Y  ", "  Y Y   ", " Y Y Y  ", "  Y Y   ", " Y Y Y  ", "        "]),
};
const Characters = [
    { id: 'ryu', name: 'Рю', hp: 110, atk: 2, def: 0, passiveDesc: 'Баз. урон +2. +1 энергия/ход', combo: 'Супер Хадокен', svg: Avatars.ryu },
    { id: 'ken', name: 'Кен', hp: 95, atk: 3, def: 0, passiveDesc: 'Баз. урон +3. 30% шанс крита (x2.5)', combo: 'Сёрюкен Комбо', svg: Avatars.ken },
    { id: 'chun', name: 'Чунь-Ли', hp: 90, atk: 0, def: 0, passiveDesc: '1 беспл. карта/ход. Игнор. блок первым ударом', combo: 'Хоёку-сэнь', svg: Avatars.chun },
    { id: 'guile', name: 'Гайл', hp: 120, atk: 0, def: 5, passiveDesc: '+5 защиты. Блок возвращает 3 урона', combo: 'Соник Бум Блиц', svg: Avatars.guile },
    { id: 'zangief', name: 'Зангиев', hp: 130, atk: 0, def: 0, passiveDesc: 'Урон x2 и игнор. блока при HP < 25%', combo: 'Финальный Атомик Бастер', svg: Avatars.zangief },
    { id: 'dhalsim', name: 'Дхалсим', hp: 85, atk: 0, def: 0, passiveDesc: 'Карты на 1 эн. дешевле. 1 карта за 0 эн.', combo: 'Йога Инферно', svg: Avatars.dhalsim },
    { id: 'blanka', name: 'Бланка', hp: 105, atk: 0, def: 0, passiveDesc: '35% шанс молнии (+8 урона и оглушение)', combo: 'Гранд Шейв Ролл', svg: Avatars.blanka },
    { id: 'honda', name: 'Э.Хонда', hp: 115, atk: 0, def: 0, passiveDesc: '+15 HP. Каждый 3-й блок лечит 5 HP', combo: 'Супер Хякурэцу Харитэ', svg: Avatars.honda }
];
const Bosses = {
    sagat: { id: 'sagat', name: 'Сагат (Босс)', hp: 165, atk: 4, def: 0, passiveDesc: '+2 эн/ход, начинает с +1 эн.', combo: 'Тайгер Дистракшн', svg: Avatars.sagat },
    vega: { id: 'vega', name: 'Вега (Босс)', hp: 117, atk: 5, def: 0, passiveDesc: 'Скорость +1 (играет 2 карты за ход)', combo: 'Роллинг Кристал Флэш', svg: Avatars.vega },
    bison: { id: 'bison', name: 'М. Байсон (Босс)', hp: 168, atk: 6, def: 0, passiveDesc: 'При HP < 40%: урон x1.5 и игнор. блока', combo: 'Психо Крашер', svg: Avatars.bison }
};
const CardDB = [
    { id: 'l_atk', name: 'Слабый Удар', type: 'attack', cost: 1, min: 8, max: 12, desc: 'Урон 8-12', svg: CardArts.attack },
    { id: 'm_atk', name: 'Средний Удар', type: 'attack', cost: 2, min: 15, max: 22, desc: 'Урон 15-22', svg: CardArts.attack },
    { id: 'h_atk', name: 'Тяжёлый Удар', type: 'attack', cost: 3, min: 25, max: 35, desc: 'Урон 25-35', svg: CardArts.attack },
    { id: 'block', name: 'Блок', type: 'block', cost: 1, desc: 'Блокирует 50% урона', svg: CardArts.block },
    { id: 'dodge', name: 'Уклонение', type: 'dodge', cost: 2, desc: '60% шанс избежать урона', svg: CardArts.dodge },
    { id: 'spec', name: 'Спецприём', type: 'special', cost: 3, min: 30, max: 45, desc: 'Урон 30-45. КД 3 хода', svg: CardArts.special },
    { id: 'fireball', name: 'Огненный Шар', type: 'attack', cost: 2, min: 12, max: 12, mod: 'fire3', desc: 'Урон 12. Горение 3 хода', svg: CardArts.attack },
    { id: 'i_blk', name: 'Ледяной Блок', type: 'block', cost: 2, mod: 'ice', desc: 'Блок 50%. Заморозка 1 ход', svg: CardArts.block },
    { id: 'v_atk', name: 'Вампир. Удар', type: 'attack', cost: 2, min: 10, max: 15, mod: 'vamp', desc: 'Урон 10-15. Лечит на 50%', svg: CardArts.attack },
    { id: 'counter', name: 'Контратака', type: 'block', cost: 2, mod: 'counter', desc: 'Блок 50% + 15 урона в ответ', svg: CardArts.block },
    { id: 'focus', name: 'Концентрация', type: 'skill', cost: 1, mod: 'focus', desc: '+2 энергии в след. ходу', svg: CardArts.special },
    { id: 'second_wind', name: 'Второе Дыхание', type: 'skill', cost: 2, mod: 'heal15', once: true, desc: '+15 HP (1 раз за бой)', svg: CardArts.special },
    { id: 'ice_spear', name: 'Ледяное Копьё', type: 'attack', cost: 3, min: 20, max: 20, mod: 'ice2', desc: 'Урон 20. Заморозка 2 хода', svg: CardArts.attack },
    { id: 'jump_atk', name: 'Удар в прыжке', type: 'attack', cost: 2, min: 18, max: 18, unblockable: true, accuracy: 0.5, desc: 'Урон 18. Игнор. блока. 50% попасть', svg: CardArts.attack },
    { id: 'prepare', name: 'Подготовка', type: 'skill', cost: 1, mod: 'prep', desc: 'След. атака +50% урона', svg: CardArts.special },
    { id: 'double_atk', name: 'Двойной Удар', type: 'attack', cost: 3, min: 10, max: 10, hits: 2, desc: 'Два удара по 10 урона', svg: CardArts.attack },
    { id: 'armor_break', name: 'Пробитие защиты', type: 'attack', cost: 2, min: 12, max: 12, mod: 'armor_break', desc: 'Урон 12. Снимает блок с врага', svg: CardArts.attack },
    { id: 'chi_steal', name: 'Похищение Ци', type: 'attack', cost: 2, min: 8, max: 8, mod: 'chi_steal', desc: 'Урон 8. Враг -1 эн след. ход, вы +1 эн', svg: CardArts.attack },
    { id: 'berserk', name: 'Берсерк', type: 'skill', cost: 2, mod: 'berserk', desc: 'Урон х2 в этом ходу. Входящий урон х1.5 в след.', svg: CardArts.special },
    { id: 'parry', name: 'Парирование', type: 'block', cost: 1, mod: 'parry', desc: '100% блок 1 удара. Штраф 5 HP если не атакован', svg: CardArts.block },
    { id: 'rushdown', name: 'Шквал', type: 'attack', cost: 3, min: 6, max: 6, hits: 4, mod: 'rushdown_stun', desc: '4 удара по 6. Каждый 15% шанс оглушения', svg: CardArts.attack },
    { id: 'aura_burst', name: 'Всплеск Ауры', type: 'special', cost: 4, min: 20, max: 20, mod: 'aura_burst', desc: 'Урон 20. Стоимость -1 за сыгранную карту', svg: CardArts.special },
    { id: 'roll', name: 'Перекат', type: 'dodge', cost: 1, mod: 'roll', desc: '30% уклонение + сброс 1 карты -> добор 1 новой', svg: CardArts.dodge },
    { id: 'ultra_combo', name: 'УЛЬТРА-КОМБО', type: 'special', cost: 0, min: 40, max: 60, unblockable: true, once: true, desc: 'Урон 40-60. Игнорирует блок.', svg: CardArts.special },
    { id: 'sweep', name: 'Подсечка', type: 'attack', cost: 1, min: 5, max: 5, alwaysHit: true, desc: 'Урон 5. Не промахивается', svg: CardArts.attack },
    { id: 'poison_kunai', name: 'Отравл. Кунай', type: 'attack', cost: 1, min: 3, max: 3, mod: 'poison', desc: 'Урон 3. Отравление -2 HP/ход', svg: CardArts.attack },
    { id: 'dirty_trick', name: 'Грязный Трюк', type: 'skill', cost: 1, mod: 'weakness', desc: 'Враг: -30% урон след. ход', svg: CardArts.special },
    { id: 'blood_pact', name: 'Кровавый Пакт', type: 'skill', cost: 0, mod: 'blood', desc: '-15 HP -> +3 эн + добор 1 карты', svg: CardArts.special },
    { id: 'wait', name: 'Выжидание', type: 'block', cost: 0, mod: 'wait', desc: 'Нет защиты. Урон -> +3 эн след. ход', svg: CardArts.block }
];

// --- STATE ---
let Stats = JSON.parse(localStorage.getItem('sfStats')) || { wins: 0, losses: 0, favChar: '', bestRun: 0, achZangief3: false, achNoBlock: false, achAllChars: [] };
function saveStats() { localStorage.setItem('sfStats', JSON.stringify(Stats)); }
let Game = { player: null, enemy: null, level: 1, maxLevel: 8, pDeck: [], pHand: [], pDiscard: [], eDeck: [], eHand: [], eDiscard: [], turnCounter: 0, comboHistory: [], cardsPlayedThisTurn: 0, pBuffs: {}, eBuffs: {}, baseEnergy: 3, energyBonus: 0, pEnergy: 0, eEnergy: 0, dmgBonus: 0, pEx: 0, eEx: 0, noBlockUsed: true, isPvP: false, pvpStep: 0, activePlayer: 1 };
function resetBuffs(b) { b.burn=0; b.freeze=0; b.stun=0; b.dodgeChance=0; b.blockPct=0; b.blockFlat=0; b.freeCard=false; b.specCd=0; b.nextTurnEnergy=0; b.nextAtkBoost=1.0; b.counter=0; b.firstStrikeDone=false; b.iceBlock=false; b.vulnerability=0; b.berserk=false; b.parry=false; b.poison=0; b.weakness=0; b.wait=false; b.waitTriggered=false; }

// --- AUDIO & FX ---
const Audio = {
    ctx: null, init() { if (!this.ctx) { const AC = window.AudioContext || window.webkitAudioContext; this.ctx = new AC(); } },
    playTone(freq, type, duration, vol=0.1) { if(!this.ctx) return; const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain(); osc.type = type; osc.frequency.setValueAtTime(freq, this.ctx.currentTime); gain.gain.setValueAtTime(vol, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration); osc.connect(gain); gain.connect(this.ctx.destination); osc.start(); osc.stop(this.ctx.currentTime + duration); },
    hit() { this.playTone(150, 'square', 0.2, 0.2); setTimeout(()=>this.playTone(100, 'sawtooth', 0.3, 0.2), 50); },
    heavyHit() { this.playTone(100, 'square', 0.4, 0.3); setTimeout(()=>this.playTone(50, 'sawtooth', 0.5, 0.4), 100); },
    block() { this.playTone(400, 'triangle', 0.1, 0.1); },
    dodge() { this.playTone(600, 'sine', 0.2, 0.1); },
    special() { this.playTone(800, 'square', 0.1); setTimeout(()=>this.playTone(1200, 'square', 0.2), 100); setTimeout(()=>this.playTone(600, 'sawtooth', 0.4), 200); },
    win() { [523, 659, 783, 1046].forEach((f,i) => setTimeout(()=>this.playTone(f, 'square', 0.3, 0.1), i*150)); },
    lose() { [300, 250, 200, 150].forEach((f,i) => setTimeout(()=>this.playTone(f, 'sawtooth', 0.4, 0.2), i*200)); },
    combo() { [400, 500, 600, 800, 1200].forEach((f,i) => setTimeout(()=>this.playTone(f, 'square', 0.2, 0.2), i*100)); }
};
const FX = {
    canvas: document.getElementById('fx-canvas'), ctx: null, particles: [],
    init() { this.ctx = this.canvas.getContext('2d'); this.resize(); window.addEventListener('resize', () => this.resize()); requestAnimationFrame(() => this.loop()); },
    resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; },
    emit(x, y, color, count, speed=5) { for(let i=0; i<count; i++) { this.particles.push({ x, y, vx: (Math.random()-0.5)*speed*2, vy: (Math.random()-0.5)*speed*2, life: 1.0, color, size: Math.random()*4 + 2 }); } },
    loop() { this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); for(let i=this.particles.length-1; i>=0; i--) { let p = this.particles[i]; p.x += p.vx; p.y += p.vy; p.life -= 0.02; this.ctx.globalAlpha = Math.max(0, p.life); this.ctx.fillStyle = p.color; this.ctx.fillRect(p.x, p.y, p.size, p.size); if(p.life <= 0) this.particles.splice(i, 1); } this.ctx.globalAlpha = 1; requestAnimationFrame(() => this.loop()); }
};
FX.init();

// --- UI ---
function nav(id) { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); document.getElementById('screen-' + id).classList.add('active'); Audio.init(); if(id === 'select') renderRoster(); if(id === 'stats') renderStats(); }
function logMsg(msg, col="#aaa") { const l = document.getElementById('battle-log'); if(!l) return; const d = document.createElement('div'); d.style.color = col; d.innerText = msg; l.prepend(d); }
function renderRoster() {
    const cont = document.getElementById('roster-container'); if (!cont) return; cont.innerHTML = '';
    Characters.forEach(c => {
        let card = document.createElement('div'); card.className = 'char-card';
        card.innerHTML = `<div class="char-name">${c.name}</div><div class="char-svg">${c.svg}</div><div class="char-info">HP: ${c.hp}<br>ATK: ${c.atk} DEF: ${c.def}<br><br><span style="color:#0f0">${c.passiveDesc}</span></div>`;
        card.onclick = () => selectCharacter(c.id); cont.appendChild(card);
    });
}
function updateUI() {
    if (!Game.player || !Game.enemy) return;
    document.getElementById('p1-avatar').innerHTML = Game.player.svg; document.getElementById('p1-name').innerText = Game.player.name;
    document.getElementById('p1-hp-fill').style.width = Math.max(0, (Game.player.hp / Game.player.maxHp) * 100) + '%';
    document.getElementById('p1-hp-text').innerText = Math.floor(Game.player.hp) + "/" + Game.player.maxHp;
    document.getElementById('p1-deck').innerText = "Колода: " + Game.pDeck.length + " | Сброс: " + Game.pDiscard.length;
    document.getElementById('p2-avatar').innerHTML = Game.enemy.svg; document.getElementById('p2-name').innerText = Game.enemy.name;
    document.getElementById('p2-hp-fill').style.width = Math.max(0, (Game.enemy.hp / Game.enemy.maxHp) * 100) + '%';
    document.getElementById('p2-hp-text').innerText = Math.floor(Game.enemy.hp) + "/" + Game.enemy.maxHp;
    document.getElementById('p2-deck').innerText = "Колода: " + Game.eDeck.length + " | Сброс: " + Game.eDiscard.length;
    document.getElementById('p1-ex-fill').style.width = Game.pEx + '%'; document.getElementById('p1-ex-text').innerText = "EX: " + Game.pEx + "%";
    document.getElementById('p2-ex-fill').style.width = Game.eEx + '%'; document.getElementById('p2-ex-text').innerText = "EX: " + Game.eEx + "%";
    const renderStatus = (buffs, elId, avatarId) => {
        let html = ''; let avatarEl = document.getElementById(avatarId); if (!avatarEl) return; avatarEl.className = 'fighter-avatar';
        if(buffs.blockPct > 0) html += `<div class="status" style="background:#00f; color:#fff;">Блок</div>`;
        if(buffs.counter > 0) html += `<div class="status" style="background:#808; color:#fff;">Контр</div>`;
        if(buffs.burn > 0) { html += `<div class="status" style="background:#f00; color:#fff;">🔥${buffs.burn}</div>`; avatarEl.classList.add('status-burn'); }
        if(buffs.freeze > 0) { html += `<div class="status" style="background:#0ff; color:#000;">❄️${buffs.freeze}</div>`; avatarEl.classList.add('status-freeze'); }
        if(buffs.stun > 0) { html += `<div class="status" style="background:#ff0; color:#000;">⚡${buffs.stun}</div>`; avatarEl.classList.add('status-stun'); }
        if(buffs.dodgeChance > 0) html += `<div class="status" style="background:#0f0; color:#000;">Уклон</div>`;
        if(buffs.nextAtkBoost > 1 || buffs.nextTurnEnergy > 0) { avatarEl.classList.add('status-buff'); html += `<div class="status" style="background:#0f0; color:#000;">⬆️</div>`; }
        document.getElementById(elId).innerHTML = html;
    };
    renderStatus(Game.pBuffs, 'p1-status', 'p1-avatar'); renderStatus(Game.eBuffs, 'p2-status', 'p2-avatar');
    let energy = (Game.activePlayer === 1) ? Game.pEnergy : Game.eEnergy;
    let engStr = ''; for(let i=0; i<energy; i++) engStr += '<div class="energy-orb"></div>';
    document.getElementById('energy-container').innerHTML = "Энергия: " + engStr;
    const hc = document.getElementById('player-hand'); hc.innerHTML = '';
    let hand = (Game.activePlayer === 1) ? Game.pHand : Game.eHand;
    let buffs = (Game.activePlayer === 1) ? Game.pBuffs : Game.eBuffs;
    hand.forEach((card, i) => {
        let cost = getCardCost(card);
        let canPlay = energy >= cost && buffs.freeze === 0 && buffs.stun === 0 && !(card.type==='special' && buffs.specCd>0 && card.id!=='ultra_combo');
        let c = document.createElement('div'); c.className = 'card' + (canPlay ? '' : ' disabled');
        c.innerHTML = `<div class="card-cost">${cost}</div><div class="card-title">${card.name}${card.upgraded ? '+' : ''}</div><div class="card-pic">${card.svg}</div><div class="card-desc">${card.desc}</div>`;
        if(canPlay) c.onclick = () => playCard(i); hc.appendChild(c);
    });
}
function showRewards() {
    nav('rewards'); const rc = document.getElementById('reward-container'); rc.innerHTML = '';
    let options = [
        { title: 'УЛУЧШЕНИЕ', desc: 'Усилить одну карту', icon: CardArts.special, action: () => showUpgradeScreen() },
        { title: 'ЧИСТКА', desc: 'Удалить карту из колоды', icon: CardArts.dodge, action: () => showThinningScreen() },
        { title: 'ЗДОРОВЬЕ', desc: '+15 HP', icon: '<svg viewBox="0 0 8 8"><rect x="3" y="1" width="2" height="6" fill="#f00"/><rect x="1" y="3" width="6" height="2" fill="#f00"/></svg>', action: () => { Game.player.maxHp += 15; Game.player.hp += 15; prepareNextBattle(); } },
        { title: 'АТАКА', desc: '+3 к урону', icon: CardArts.attack, action: () => { Game.dmgBonus += 3; prepareNextBattle(); } }
    ];
    shuffle([...CardDB]).slice(0, 2).forEach(c => { options.push({ title: 'НОВАЯ КАРТА', desc: `Взять [${c.name}]`, icon: c.svg, action: () => { Game.pDeck.push({...c, uid: Math.random()}); prepareNextBattle(); } }); });
    shuffle(options).slice(0, 3).forEach(opt => {
        let d = document.createElement('div'); d.className = 'reward-card';
        d.innerHTML = `<div style="font-size:10px; color:#ffbb00; margin-bottom:10px;">${opt.title}</div><div class="reward-icon">${opt.icon}</div><div class="reward-desc">${opt.desc}</div>`;
        d.onclick = opt.action; rc.appendChild(d);
    });
}
function showThinningScreen() {
    nav('thinning'); document.getElementById('thinning-title').innerText = "Чистка Колоды"; document.getElementById('thinning-desc').innerText = "Выберите 1 карту, чтобы УДАЛИТЬ её.";
    const tc = document.getElementById('thinning-container'); tc.innerHTML = '';
    [...Game.pDeck, ...Game.pHand, ...Game.pDiscard].forEach(card => {
        let c = document.createElement('div'); c.className = 'card'; c.style.transform = 'scale(0.8)';
        c.innerHTML = `<div class="card-cost">${card.cost}</div><div class="card-title">${card.name}</div><div class="card-pic">${card.svg}</div><div class="card-desc">${card.desc}</div>`;
        c.onclick = () => { let removed = false; [Game.pDeck, Game.pHand, Game.pDiscard].forEach(arr => { let idx = arr.findIndex(x => x.uid === card.uid); if(idx > -1 && !removed) { arr.splice(idx, 1); removed = true; } }); prepareNextBattle(); };
        tc.appendChild(c);
    });
}
function showUpgradeScreen() {
    nav('thinning'); document.getElementById('thinning-title').innerText = "Улучшение Карт"; document.getElementById('thinning-desc').innerText = "Выберите 1 карту для УСИЛЕНИЯ.";
    const tc = document.getElementById('thinning-container'); tc.innerHTML = '';
    [...Game.pDeck, ...Game.pHand, ...Game.pDiscard].forEach(card => {
        if (card.id === 'ultra_combo') return;
        let c = document.createElement('div'); c.className = 'card'; c.style.transform = 'scale(0.8)';
        c.innerHTML = `<div class="card-cost">${card.cost}</div><div class="card-title">${card.name}${card.upgraded ? '+' : ''}</div><div class="card-pic">${card.svg}</div><div class="card-desc">${card.desc}</div>`;
        c.onclick = () => {
            card.upgraded = true;
            if (card.min !== undefined) { card.min += 5; card.max += 5; } else if (card.cost > 0) card.cost -= 1; else { card.min = 5; card.max = 10; }
            card.name += "+"; logMsg("Улучшено: " + card.name, '#0f0'); prepareNextBattle();
        };
        tc.appendChild(c);
    });
}

// --- ENGINE ---
function startCareerMode() { Game.isPvP = false; document.getElementById('select-title').innerText = "Выберите Бойца"; nav('select'); }
function startPvPMode() { Game.isPvP = true; Game.pvpStep = 1; document.getElementById('select-title').innerText = "Игрок 1: Выберите Бойца"; nav('select'); }
function selectCharacter(charId) {
    if (!Game.isPvP) { startCareer(charId); }
    else {
        if (Game.pvpStep === 1) {
            let cb = Characters.find(c => c.id === charId); Game.player = JSON.parse(JSON.stringify(cb)); Game.player.maxHp = Game.player.hp;
            Game.pDeck = generateStartingDeck(charId); Game.pHand = []; Game.pDiscard = [];
            Game.pvpStep = 2; document.getElementById('select-title').innerText = "Игрок 2: Выберите Бойца"; logMsg("P1 выбрал: " + Game.player.name);
        } else {
            let cb = Characters.find(c => c.id === charId); Game.enemy = JSON.parse(JSON.stringify(cb)); Game.enemy.maxHp = Game.enemy.hp;
            Game.eDeck = generateStartingDeck(charId); Game.eHand = []; Game.eDiscard = [];
            Game.level = 1; Game.baseEnergy = 3; Game.pEx = 0; Game.eEx = 0; startBattle();
        }
    }
}
function startCareer(charId) {
    let cb = Characters.find(c => c.id === charId); Game.player = JSON.parse(JSON.stringify(cb)); Game.player.maxHp = Game.player.hp;
    Game.pDeck = generateStartingDeck(charId); Game.level = 1; Game.baseEnergy = 3; Game.dmgBonus = 0; Game.pEx = 0; Game.eEx = 0;
    let plays = JSON.parse(localStorage.getItem('sfFavTracker')||'{}'); plays[charId] = (plays[charId]||0) + 1;
    localStorage.setItem('sfFavTracker', JSON.stringify(plays));
    let best = Object.keys(plays).reduce((a, b) => plays[a] > plays[b] ? a : b); Stats.favChar = Characters.find(c=>c.id===best).name; saveStats();
    prepareNextBattle();
}
function getEnemyForLevel(lvl) {
    if(lvl === 8) return JSON.parse(JSON.stringify(Bosses.bison)); if(lvl === 6) return JSON.parse(JSON.stringify(Bosses.vega)); if(lvl === 4) return JSON.parse(JSON.stringify(Bosses.sagat));
    let pool = Characters.filter(c => c.id !== Game.player.id); let char = pool[Math.floor(Math.random() * pool.length)];
    let enemy = JSON.parse(JSON.stringify(char)); enemy.hp = enemy.maxHp = char.hp + (lvl * 10); enemy.atk = char.atk + Math.floor(lvl / 2); return enemy;
}
function prepareNextBattle() {
    if(Game.level > Game.maxLevel) return;
    Game.enemy = getEnemyForLevel(Game.level); Game.eDeck = generateEnemyDeck(); Game.eHand = []; Game.eDiscard = [];
    document.getElementById('next-enemy-info').innerHTML = `<div style="font-size:18px; color:#ffbb00; margin-bottom:10px;">${Game.enemy.name}</div><div style="width:100px; height:100px; margin:0 auto 10px;">${Game.enemy.svg}</div><div>HP: ${Game.enemy.hp}</div><div style="font-size:10px; color:#0f0; margin-top:10px;">${Game.enemy.passiveDesc}</div>`;
    nav('next-enemy');
}
function startBattle() {
    [Game.pHand, Game.pDiscard].forEach(a => Game.pDeck.push(...a)); Game.pHand = []; Game.pDiscard = []; shuffle(Game.pDeck);
    [Game.eHand, Game.eDiscard].forEach(a => Game.eDeck.push(...a)); Game.eHand = []; Game.eDiscard = []; shuffle(Game.eDeck);
    Game.turnCounter = 0; Game.noBlockUsed = true; Game.activePlayer = 1;
    resetBuffs(Game.pBuffs); resetBuffs(Game.eBuffs);
    if(Game.player.id === 'honda') { Game.player.maxHp += 15; Game.player.hp += 15; }
    if(Game.enemy.id === 'honda') { Game.enemy.maxHp += 15; Game.enemy.hp += 15; }
    document.getElementById('battle-log').innerHTML = ''; logMsg("БОЙ НАЧИНАЕТСЯ!", '#ffbb00'); document.getElementById('round-info').innerText = Game.isPvP ? "PvP Режим" : `Бой ${Game.level}/8`;
    nav('battle'); updateUI(); startTurn();
}
function startTurn() {
    let char = (Game.activePlayer === 1) ? Game.player : Game.enemy; let buffs = (Game.activePlayer === 1) ? Game.pBuffs : Game.eBuffs; let side = (Game.activePlayer === 1) ? 'player' : 'enemy';
    if (Game.activePlayer === 1) Game.turnCounter++;
    processStatus(char, buffs, side); if(checkDeath()) return;
    if(buffs.parry) { char.hp -= 5; logMsg(char.name + " оштрафован (-5 HP)", '#f00'); buffs.parry = false; if(checkDeath()) return; }
    if(buffs.berserk) { buffs.vulnerability = 1.5; buffs.berserk = false; } else { buffs.vulnerability = 0; }
    buffs.blockPct = 0; buffs.dodgeChance = 0; buffs.counter = 0; buffs.weakness = 0; if(buffs.specCd > 0) buffs.specCd--;
    let energy = (Game.activePlayer === 1) ? (Game.baseEnergy + Game.energyBonus) : Game.baseEnergy;
    if(char.id === 'ryu') energy += 1; if(char.id === 'sagat' && Game.level === 4) energy += 2;
    energy += buffs.nextTurnEnergy; buffs.nextTurnEnergy = 0;
    if (Game.activePlayer === 1) Game.pEnergy = energy; else Game.eEnergy = energy;
    if(buffs.waitTriggered) { if (Game.activePlayer === 1) Game.pEnergy += 3; else Game.eEnergy += 3; buffs.waitTriggered = false; logMsg("+3 энергии (Выживание)", '#0ff'); }
    if(char.id === 'chun' || char.id === 'dhalsim') buffs.freeCard = true;
    Game.comboHistory = []; Game.cardsPlayedThisTurn = 0;
    let deck = (Game.activePlayer === 1) ? Game.pDeck : Game.eDeck; let hand = (Game.activePlayer === 1) ? Game.pHand : Game.eHand; let discard = (Game.activePlayer === 1) ? Game.pDiscard : Game.eDiscard;
    drawCards(deck, hand, discard, 5 - hand.length);
    if (buffs.poison > 0) { char.hp -= buffs.poison; logMsg("Яд: -" + buffs.poison, '#f00'); if(checkDeath()) return; }
    updateUI();
    if(buffs.stun > 0 || buffs.freeze > 0) { logMsg(char.name + " пропускает ход", '#ff0'); if(buffs.stun>0) buffs.stun--; else buffs.freeze--; setTimeout(endActiveTurn, 1000); }
    else if(!Game.isPvP && Game.activePlayer === 2) enemyTurn();
    else logMsg("--- ХОД: " + char.name + " ---", (Game.activePlayer===1?'#00ff00':'#ff4444'));
}
function playCard(idx) {
    let b = (Game.activePlayer === 1) ? Game.pBuffs : Game.eBuffs; if(b.freeze > 0 || b.stun > 0) return;
    let hand = (Game.activePlayer === 1) ? Game.pHand : Game.eHand; let c = hand[idx]; let cost = getCardCost(c);
    let energy = (Game.activePlayer === 1) ? Game.pEnergy : Game.eEnergy;
    if(c.type === 'special' && b.specCd > 0 && c.id !== 'ultra_combo') return;
    if(energy >= cost) {
        if (Game.activePlayer === 1) Game.pEnergy -= cost; else Game.eEnergy -= cost; if(b.freeCard) b.freeCard = false;
        hand.splice(idx, 1); let disc = (Game.activePlayer === 1) ? Game.pDiscard : Game.eDiscard; if(!c.once) disc.push(c);
        Game.comboHistory.push(c.type); if(checkCombo(Game.activePlayer===1?'player':'enemy')) b.nextAtkBoost = 1.5;
        let attacker = (Game.activePlayer === 1) ? Game.player : Game.enemy; let defender = (Game.activePlayer === 1) ? Game.enemy : Game.player;
        let dB = (Game.activePlayer === 1) ? Game.eBuffs : Game.pBuffs;
        executeCard(c, attacker, defender, b, dB, (Game.activePlayer===1?'enemy':'player'));
        if(c.mod === 'roll' && hand.length > 0) { let drop = Math.floor(Math.random() * hand.length); disc.push(hand.splice(drop, 1)[0]); drawCards((Game.activePlayer===1?Game.pDeck:Game.eDeck), hand, disc, 1); }
        Game.cardsPlayedThisTurn++; updateUI(); checkDeath();
    }
}
function endActiveTurn() {
    if(Game.cardsPlayedThisTurn === 0) { let buffs = (Game.activePlayer === 1) ? Game.pBuffs : Game.eBuffs; buffs.nextTurnEnergy += 1; }
    if(checkDeath()) return;
    if (Game.isPvP) { Game.activePlayer = (Game.activePlayer === 1) ? 2 : 1; let next = (Game.activePlayer === 1) ? Game.player : Game.enemy; document.getElementById('handover-msg').innerText = `Очередь: ${next.name}`; nav('handover'); }
    else { if (Game.activePlayer === 1) { Game.activePlayer = 2; enemyTurn(); } else { Game.activePlayer = 1; startTurn(); } }
}
function executeCard(card, attacker, defender, aBuffs, dBuffs, targetSide, isExtraAttack = false) {
    logMsg(`${attacker.name}: [${card.name}]`);
    if(card.type === 'skill') {
        if(card.mod === 'focus') aBuffs.nextTurnEnergy += 2; if(card.mod === 'heal15') attacker.hp = Math.min(attacker.maxHp, attacker.hp + 15);
        if(card.mod === 'prep') aBuffs.nextAtkBoost = 1.5; if(card.mod === 'blood') { attacker.hp = Math.max(1, attacker.hp - 15); aBuffs.nextTurnEnergy += 3; }
        if(card.mod === 'berserk') { aBuffs.berserk = true; aBuffs.nextAtkBoost = 2.0; } return;
    }
    if(card.type === 'block') {
        aBuffs.blockPct += 0.5; if(card.mod === 'ice') aBuffs.iceBlock = true; if(card.mod === 'counter') aBuffs.counter = 15; if(card.mod === 'wait') aBuffs.wait = true; if(card.mod === 'parry') aBuffs.parry = true;
        animFX(targetSide==='enemy'?'player':'enemy', 'block'); Audio.block();
        if(attacker.id === 'honda') { attacker.bc = (attacker.bc || 0) + 1; if(attacker.bc % 3 === 0) attacker.hp = Math.min(attacker.maxHp, attacker.hp + 5); } return;
    }
    if(card.type === 'dodge') { aBuffs.dodgeChance = Math.min(1.0, aBuffs.dodgeChance + (card.mod==='roll'?0.3:0.6)); Audio.dodge(); return; }
    if(card.type === 'attack' || card.type === 'special') {
        if(card.accuracy && Math.random() > card.accuracy) { logMsg("ПРОМАХ!"); return; }
        let hits = card.hits || 1;
        for(let i=0; i<hits; i++) {
            animFX(targetSide==='enemy'?'player':'enemy', targetSide==='enemy'?'lunge':'lunge-rev');
            let rawDmg = (card.min && card.max) ? (Math.floor(Math.random()*(card.max-card.min+1)) + card.min) : 10;
            if(aBuffs.weakness > 0) rawDmg *= 0.7; rawDmg += (attacker.atk || 0) + (targetSide==='enemy' ? Game.dmgBonus : 0);
            if(aBuffs.nextAtkBoost > 1) rawDmg *= aBuffs.nextAtkBoost; if(isExtraAttack) rawDmg *= 0.5;
            let unblockable = card.unblockable || card.alwaysHit || false;
            if(attacker.id === 'chun' && !aBuffs.firstStrikeDone) { unblockable = true; aBuffs.firstStrikeDone = true; }
            if(attacker.id === 'zangief' && attacker.hp < attacker.maxHp * 0.25) { rawDmg *= 2; unblockable = true; }
            if(attacker.id === 'ken' && Math.random() < 0.3) rawDmg *= 2.5;
            if(attacker.id === 'bison' && attacker.hp < attacker.maxHp * 0.4) { rawDmg *= 1.5; unblockable = true; }
            rawDmg = Math.floor(rawDmg); if(card.type === 'special' && card.id !== 'ultra_combo') aBuffs.specCd = 3;
            let actualDmg = dealDamage(defender, rawDmg, dBuffs, targetSide, unblockable, card.alwaysHit);
            if(actualDmg > 0) {
                if(card.mod === 'armor_break') { dBuffs.blockPct = 0; dBuffs.counter = 0; dBuffs.parry = false; }
                if(card.mod === 'chi_steal') { dBuffs.nextTurnEnergy = Math.max(0, dBuffs.nextTurnEnergy - 1); aBuffs.nextTurnEnergy += 1; }
                if(card.mod === 'rushdown_stun' && Math.random() < 0.15) dBuffs.stun = 1;
                if(card.mod === 'poison') dBuffs.poison = (dBuffs.poison || 0) + 2; if(card.mod === 'weakness') dBuffs.weakness = 1;
                if(card.mod && card.mod.startsWith('fire')) dBuffs.burn += parseInt(card.mod.replace('fire', '')) || 2;
                if(card.mod && card.mod.startsWith('ice')) { let bF = parseInt(card.mod.replace('ice', '')) || 1; dBuffs.freeze = (dBuffs.freeze || 0) + Math.max(1, bF - (dBuffs.freeze || 0)); }
                if(card.mod === 'vamp') { let h = Math.floor((card.max || 10) * 0.5); attacker.hp = Math.min(attacker.maxHp, attacker.hp + h); }
            }
            if(attacker.id === 'blanka' && Math.random() < 0.35) { dealDamage(defender, 8, dBuffs, targetSide, true); dBuffs.stun = 1; }
            if(dBuffs.counter > 0) { dealDamage(attacker, dBuffs.counter, aBuffs, (targetSide==='enemy'?'player':'enemy'), true); dBuffs.counter = 0; }
            if(defender.id === 'guile' && dBuffs.blockPct > 0) dealDamage(attacker, 3, aBuffs, (targetSide==='enemy'?'player':'enemy'), true);
            if(dBuffs.iceBlock) { aBuffs.freeze += 1; dBuffs.iceBlock = false; }
        }
        aBuffs.nextAtkBoost = 1.0;
    }
}
function dealDamage(target, amount, tBuffs, tSide, unblockable = false, ignoreDodge = false) {
    if(!ignoreDodge && tBuffs.dodgeChance > 0 && Math.random() < tBuffs.dodgeChance) { logMsg("УКЛОНЕНИЕ!", '#0f0'); animFX(tSide, 'shake'); return 0; }
    if(tBuffs.parry) { logMsg("ПАРИРОВАНИЕ!", '#0ff'); tBuffs.parry = false; animFX(tSide, 'block'); Audio.block(); return 0; }
    if(tBuffs.vulnerability > 0) amount = Math.floor(amount * tBuffs.vulnerability);
    let blocked = 0; if(!unblockable) { let flat = target.def || 0; let dmgAfterFlat = Math.max(0, amount - flat); let blockReduc = Math.floor(dmgAfterFlat * Math.min(1.0, tBuffs.blockPct)); blocked = (amount - dmgAfterFlat) + blockReduc; }
    let finalDmg = amount - blocked;
    if(blocked > 0) { logMsg("БЛОК!", '#aaa'); Audio.block(); }
    if(finalDmg > 0) {
        target.hp -= finalDmg; if(tBuffs.wait) tBuffs.waitTriggered = true; logMsg("-" + finalDmg + " HP", '#f00');
        if(finalDmg > 20) Audio.heavyHit(); else Audio.hit(); animFX(tSide, 'shake'); spawnParticles(tSide, '#f00');
        if(tSide === 'player') { Game.pEx = Math.min(100, Game.pEx + Math.floor(finalDmg * 1.5)); Game.eEx = Math.min(100, Game.eEx + Math.floor(finalDmg * 0.5)); }
        else { Game.eEx = Math.min(100, Game.eEx + Math.floor(finalDmg * 1.5)); Game.pEx = Math.min(100, Game.pEx + Math.floor(finalDmg * 0.5)); }
        checkEX();
    }
    return finalDmg;
}
function checkEX() {
    if(Game.pEx >= 100) { Game.pEx = 0; logMsg("EX ГОТОВ!", '#ffbb00'); Game.pHand.push({...CardDB.find(c=>c.id==='ultra_combo'), uid: Math.random()}); }
    if(Game.eEx >= 100) { Game.eEx = 0; logMsg("EX ГОТОВ!", '#ffbb00'); Game.eHand.push({...CardDB.find(c=>c.id==='ultra_combo'), uid: Math.random()}); }
}
function enemyTurn() {
    if(checkDeath()) return;
    let playIv = setInterval(() => {
        let ultra = Game.eHand.findIndex(c => c.id === 'ultra_combo');
        if (ultra !== -1) { let c = Game.eHand.splice(ultra, 1)[0]; executeCard(c, Game.enemy, Game.player, Game.eBuffs, Game.pBuffs, 'player'); updateUI(); if(checkDeath()){clearInterval(playIv); return;} return; }
        let playable = Game.eHand.filter(c => { let cost = getCardCost(c); if(c.type === 'special' && Game.eBuffs.specCd > 0) return false; return Game.eEnergy >= cost; });
        if(playable.length > 0 && !checkDeath()) {
            let card = playable[Math.floor(Math.random()*playable.length)]; let cost = getCardCost(card); if(Game.eBuffs.freeCard) Game.eBuffs.freeCard = false; else Game.eEnergy -= cost;
            Game.eHand.splice(Game.eHand.indexOf(card), 1); if(!card.once) Game.eDiscard.push(card);
            executeCard(card, Game.enemy, Game.player, Game.eBuffs, Game.pBuffs, 'player'); Game.cardsPlayedThisTurn++; updateUI(); if(checkDeath()){clearInterval(playIv); return;}
        } else { clearInterval(playIv); setTimeout(endActiveTurn, 500); }
    }, 800);
}
function checkDeath() { if(Game.enemy.hp <= 0) { Game.enemy.hp = 0; updateUI(); Audio.win(); setTimeout(winBattle, 1000); return true; } if(Game.player.hp <= 0) { Game.player.hp = 0; updateUI(); Audio.lose(); setTimeout(loseGame, 1000); return true; } return false; }
function winBattle() { Stats.wins++; if(Game.level > Stats.bestRun) Stats.bestRun = Game.level; saveStats(); if(Game.isPvP) { nav('gameover'); document.getElementById('go-title').innerText = "ПОБЕДА ИГРОКА " + (Game.player.hp > 0 ? "1" : "2"); return; } if(Game.level >= Game.maxLevel) { nav('gameover'); document.getElementById('go-title').innerText = "ЧЕМПИОН!"; return; } Game.player.hp = Math.min(Game.player.maxHp, Game.player.hp + Math.floor(Game.player.maxHp * 0.2)); Game.level++; showRewards(); }
function loseGame() { Stats.losses++; saveStats(); nav('gameover'); document.getElementById('go-title').innerText = "ПОРАЖЕНИЕ"; }
function renderStats() { let c = document.getElementById('stats-container'); if(!c) return; c.innerHTML = `Победы: ${Stats.wins}<br>Поражения: ${Stats.losses}<br>Лучшая серия: ${Stats.bestRun}/8`; }
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
function generateStartingDeck(id) { let d = []; let add = (cid, n) => { for(let i=0; i<n; i++) d.push({...CardDB.find(c=>c.id===cid), uid: Math.random()}); }; add('l_atk', 6); add('m_atk', 4); add('block', 4); add('h_atk', 2); add('dodge', 1); add('spec', 1); if(id==='ryu') add('focus', 2); else if(id==='ken') add('prepare', 2); return shuffle(d); }
function generateEnemyDeck() { let d = []; let add = (cid, n) => { for(let i=0; i<n; i++) d.push({...CardDB.find(c=>c.id===cid), uid: Math.random()}); }; add('l_atk', 5); add('m_atk', 3); add('block', 3); add('h_atk', 2); add('dodge', 1); add('spec', 1); return shuffle(d); }
function confirmHandover() { nav('battle'); startTurn(); }
function endPlayerTurn() { endActiveTurn(); }
function animFX(side, cls) { let el = document.getElementById(side==='player'?'p1-avatar':'p2-avatar'); if(!el) return; el.classList.remove('anim-'+cls); void el.offsetWidth; el.classList.add('anim-'+cls); }
function spawnParticles(side, col) { let el = document.getElementById(side==='player'?'p1-avatar':'p2-avatar'); if(!el) return; let r = el.getBoundingClientRect(); FX.emit(r.left + r.width/2, r.top + r.height/2, col, 15); }
function drawCards(deck, hand, discard, count) { for(let i=0; i<count; i++) { if(hand.length >= 5) break; if(deck.length === 0) { if(discard.length === 0) break; deck.push(...discard); discard.length = 0; shuffle(deck); } hand.push(deck.pop()); } }
window.onload = () => nav('menu');
'''

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Очищаем всё внутри <script>
html = re.sub(r'<script>.*?</script>', f'<script>\n{script_content}\n</script>', html, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
