// --- DATA & CONTENT ---
const C = {
    R: '#cc0000', B: '#0066cc', Y: '#ffcc00', S: '#ffcc99', K: '#111', 
    W: '#fff', G: '#009900', O: '#ff8800', P: '#880088', L: '#00ccff', D: '#8b4513'
};
function drawAvatar(colors, layout) {
    let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" width="100%" height="100%">';
    for(let y=0; y<8; y++) {
        for(let x=0; x<8; x++) {
            let char = layout[y][x];
            if(char !== ' ') svg += `<rect x="${x}" y="${y}" width="1" height="1" fill="${colors[char]}"/>`;
        }
    }
    return svg + '</svg>';
}

const Avatars = {
    akuma: 'images/card_1.png',
    ken: drawAvatar(C, ["  Y Y   ", " Y Y Y  ", "YS S S Y", " S K S  ", "  S S   ", " R R R  ", " R K R  ", " K   K  "]),
    chun: drawAvatar(C, [" W S W  ", " KS S K ", "  S S   ", " B Y B  ", " B B B  ", " K   K  ", " W   W  ", " K   K  "]),
    guile: drawAvatar(C, ["YYYYYYYY", " Y Y Y  ", " S S S  ", " S K S  ", " G G G  ", " G K G  ", " G K G  ", " K   K  "]),
    zangief: drawAvatar(C, ["  K K   ", " K S K  ", " S S S  ", "  K K   ", " S S S  ", " S R S  ", " R R R  ", " K   K  "]),
    dhalsim: drawAvatar(C, ["  O O   ", " D D D  ", " D S D  ", "  D D   ", " Y Y Y  ", " Y Y Y  ", " Y   Y  ", " K   K  "]),
    blanka: drawAvatar(C, ["  O O   ", " O G O  ", " G R G  ", "  G G   ", " G G G  ", " G Y G  ", " G   G  ", " K   K  "]),
    honda: drawAvatar(C, ["  K K   ", " KS SK  ", " S S S  ", " B R B  ", " S S S  ", " S S S  ", " B   B  ", " K   K  "]),
    sagat: 'images/card_2.png',
    vega: drawAvatar(C, ["  Y Y   ", " Y W Y  ", " W S W  ", "  S S   ", " P P P  ", " P Y P  ", " P K P  ", " K   K  "]),
    bison: drawAvatar(C, ["  R R   ", " R R R  ", " R S R  ", "  S S   ", " R R R  ", " R K R  ", " R K R  ", " K   K  "])
};

// Helper: render avatar (handles both SVG and base64 data URIs)
function renderAvatar(avatar) {
    if (!avatar) return '';
    if (avatar.startsWith('data:image')) return '<img src="' + avatar + '" width="100" height="100" style="image-rendering:pixelated;">';
    if (avatar.startsWith('images/') || avatar.startsWith('http')) return '<img src="' + avatar + '" width="100" height="100" style="image-rendering:pixelated;">';
    return avatar;
}

// --- Card Factory ---
function createCard(id) {
    const def = CardDB.find(c => c.id === id);
    if(!def) { console.warn('Card not found:', id); return null; }
    return { ...def, uid: Math.random() };
}
function cloneCard(card, overrides = {}) {
    if(!card) return null;
    return { ...card, uid: Math.random(), ...overrides };
}

function getHpColor(pct) {
    if(pct > 50) return '#00cc00';   // зелёный
    if(pct > 25) return '#ffaa00';   // оранжевый
    return '#ff0000';                 // красный
}

const CardArts = {
    attack: 'images/card_3.jpeg',
    block: 'images/card_4.jpeg',
    dodge: 'images/card_5.jpeg',
    special: 'images/card_6.jpeg',
    l_atk: 'images/card_3.jpeg',
    m_atk: 'images/card_7.jpeg',
    h_atk: 'images/card_8.jpeg',
    v_atk: 'images/card_9.jpeg',
    fireball: 'images/card_10.jpeg',
    iceblock: 'images/card_11.jpeg',
    ice_spear: 'images/card_12.jpeg',
    counter: 'images/card_13.jpeg',
    double_atk: 'images/card_14.jpeg',
    jump_atk: 'images/card_15.jpeg',
    prepare: 'images/card_16.jpeg',
    focus: 'images/card_17.jpeg',
    second_wind: 'images/card_18.jpeg',
    poison_kunai: 'images/card_19.jpeg',
    reward_chest: 'images/card_20.jpeg',
    icon_health: 'images/avatar_1.jpeg',
    icon_strength: 'images/avatar_2.jpeg',
    icon_energy: 'images/avatar_3.jpeg',
    super_ryu: 'images/card_21.jpeg',
    super_ken: 'images/card_22.jpeg',
    super_chun: 'images/card_23.jpeg',
    super_guile: 'images/card_24.jpeg',
    super_zangief: 'images/card_25.jpeg',
    super_dhalsim: 'images/card_26.jpeg',
    super_blanka: 'images/card_27.jpeg',
    super_akuma: 'images/card_1.png',
    super_honda: 'images/card_28.jpeg',
    super_boss: 'images/card_29.jpeg',
    title_banner: 'images/card_30.jpeg'
};

const Characters = [
    { id: 'ryu', name: 'Рю', hp: 125, atk: 2, def: 2, exRate: 0.40, passiveDesc: 'Баз. урон +2. +1 энергия/ход', combo: 'Супер Хадокен', svg: '<img src="images/extra_0.jpeg" style="width:100%;height:100%;object-fit:cover;border-radius:4px;image-rendering:auto;" alt="Рю">' },
    { id: 'ken', name: 'Кен', hp: 115, atk: 2, def: 1, exRate: 0.38, passiveDesc: 'Баз. урон +2. 35% шанс крита (урон x2)', combo: 'Сёрюкен Комбо', svg: '<img src="images/extra_1.jpeg" style="width:100%;height:100%;object-fit:cover;border-radius:4px;image-rendering:auto;" alt="Кен">' },
    { id: 'chun', name: 'Чунь-Ли', hp: 95, atk: 0, def: 0, exRate: 0.34, passiveDesc: '1 беспл. карта/ход. 50% игнор блока 1-м ударом', combo: 'Хоёку-сэнь', svg: '<img src="images/extra_2.jpeg" style="width:100%;height:100%;object-fit:cover;border-radius:4px;image-rendering:auto;" alt="Чунь-Ли">' },
    { id: 'guile', name: 'Гайл', hp: 135, atk: 1, def: 5, exRate: 0.42, passiveDesc: 'Баз. урон +1. Отражает 4 урона при блоке', combo: 'Соник Бум Блиц', svg: '<img src="images/extra_3.jpeg" style="width:100%;height:100%;object-fit:cover;border-radius:4px;image-rendering:auto;" alt="Гайл">' },
    { id: 'zangief', name: 'Зангиев', hp: 135, atk: 1, def: 4, exRate: 0.35, passiveDesc: 'Урон x1.8 и игнор. блока при HP < 30%', combo: 'Финальный Атомик Бастер', svg: '<img src="images/extra_4.jpeg" style="width:100%;height:100%;object-fit:cover;border-radius:4px;image-rendering:auto;" alt="Зангиев">' },
    { id: 'dhalsim', name: 'Дхалсим', hp: 95, atk: 0, def: 1, exRate: 0.40, passiveDesc: 'Все карты на 1 эн. дешевле', combo: 'Йога Инферно', svg: '<img src="images/extra_5.jpeg" style="width:100%;height:100%;object-fit:cover;border-radius:4px;image-rendering:auto;" alt="Дхалсим">' },
    { id: 'blanka', name: 'Бланка', hp: 110, atk: 1, def: 3, exRate: 0.38, passiveDesc: 'Баз. урон +1. 30% шанс молнии (+10 урона и оглушение)', combo: 'Гранд Шейв Ролл', svg: '<img src="images/extra_6.jpeg" style="width:100%;height:100%;object-fit:cover;border-radius:4px;image-rendering:auto;" alt="Бланка">' },
    { id: 'akuma', name: 'Акума', hp: 105, atk: 4, def: 1, exRate: 0.30, passiveDesc: 'Урон x1.4. Каждый 3-й бой +1 к атаке', combo: 'Сюн Гоку Сацу', svg: '<img src="images/card_1.png" style="width:100px;height:100px;image-rendering:pixelated;" alt="Акума">' },
    { id: 'honda', name: 'Э.Хонда', hp: 120, atk: 1, def: 4, exRate: 0.35, passiveDesc: '+20 HP. Баз. урон +1. Каждый 3-й блок лечит 8 HP', combo: 'Супер Хякурэцу Харитэ', svg: '<img src="images/extra_7.jpeg" style="width:100%;height:100%;object-fit:cover;border-radius:4px;image-rendering:auto;" alt="Э.Хонда">' }
];

const Bosses = {
    sagat: { id: 'sagat', name: 'Сагат (Босс)', hp: 165, maxHp: 165, atk: 4, def: 3, exRate: 0.30, passiveDesc: '+2 эн/ход, начинает с +1 эн.', combo: 'Тайгер Дистракшн', svg: Avatars.sagat },
    vega: { id: 'vega', name: 'Вега (Босс)', hp: 117, maxHp: 117, atk: 5, def: 0, exRate: 0.32, passiveDesc: 'Скорость +1 (играет 2 карты за ход)', combo: 'Роллинг Кристал Флэш', svg: Avatars.vega },
    bison: { id: 'bison', name: 'М. Байсон (Босс)', hp: 168, maxHp: 168, atk: 6, def: 2, exRate: 0.28, passiveDesc: 'При HP < 40%: урон x1.5 и игнор. блока', combo: 'Психо Крашер', svg: Avatars.bison }
};

const CardDB = [
    { id: 'l_atk', name: 'Слабый Удар', type: 'attack', cost: 1, min: 8, max: 12, desc: 'Урон 8-12', svg: CardArts.l_atk },
    { id: 'm_atk', name: 'Средний Удар', type: 'attack', cost: 2, min: 15, max: 22, desc: 'Урон 15-22', svg: CardArts.m_atk },
    { id: 'h_atk', name: 'Тяжёлый Удар', type: 'attack', cost: 3, min: 25, max: 35, desc: 'Урон 25-35', svg: CardArts.h_atk },
    { id: 'block', name: 'Блок', type: 'block', cost: 1, desc: 'Блокирует 50% урона', svg: CardArts.block },
    { id: 'dodge', name: 'Уклонение', type: 'dodge', cost: 2, desc: '60% шанс избежать урона', svg: CardArts.dodge },
    { id: 'spec', name: 'Спецприём', type: 'special', cost: 3, min: 30, max: 45, desc: 'Урон 30-45. КД 3 хода', svg: CardArts.special },
    { id: 'fireball', name: 'Огненный Шар', type: 'attack', cost: 2, min: 12, max: 12, mod: 'fire3', desc: 'Урон 12. Горение 3 хода', svg: CardArts.fireball },
    { id: 'i_blk', name: 'Ледяной Блок', type: 'block', cost: 2, mod: 'ice', desc: 'Блок 50%. Заморозка 1 ход', svg: CardArts.iceblock },
    { id: 'v_atk', name: 'Вампир. Удар', type: 'attack', cost: 2, min: 10, max: 15, mod: 'vamp', desc: 'Урон 10-15. Лечит на 50%', svg: CardArts.v_atk },
    { id: 'counter', name: 'Контратака', type: 'block', cost: 2, mod: 'counter', desc: 'Блок 50% + 15 урона в ответ', svg: CardArts.counter },
    { id: 'focus', name: 'Концентрация', type: 'skill', cost: 1, mod: 'focus', desc: '+2 энергии в след. ходу', svg: CardArts.special },
    { id: 'second_wind', name: 'Второе Дыхание', type: 'skill', cost: 2, mod: 'heal15', once: true, desc: '+15 HP (1 раз за бой)', svg: CardArts.special },
    { id: 'ice_spear', name: 'Ледяное Копьё', type: 'attack', cost: 3, min: 20, max: 20, mod: 'ice2', desc: 'Урон 20. Заморозка 2 хода', svg: CardArts.ice_spear },
    { id: 'jump_atk', name: 'Удар в прыжке', type: 'attack', cost: 2, min: 18, max: 18, unblockable: true, accuracy: 0.5, desc: 'Урон 18. Игнор. блока. 50% попасть', svg: CardArts.jump_atk },
    { id: 'prepare', name: 'Подготовка', type: 'skill', cost: 1, mod: 'prep', desc: 'След. атака +50% урона', svg: CardArts.special },
    { id: 'double_atk', name: 'Двойной Удар', type: 'attack', cost: 3, min: 10, max: 10, hits: 2, desc: 'Два удара по 10 урона', svg: CardArts.double_atk },
    { id: 'sweep', name: 'Подсечка', type: 'attack', cost: 1, min: 5, max: 5, alwaysHit: true, desc: 'Урон 5. Не промахивается', svg: CardArts.attack },
    { id: 'poison_kunai', name: 'Отравл. Кунай', type: 'attack', cost: 1, min: 3, max: 3, mod: 'poison', desc: 'Урон 3. Отравление -2 HP/ход', svg: CardArts.poison_kunai },
    { id: 'dirty_trick', name: 'Грязный Трюк', type: 'skill', cost: 1, mod: 'weakness', desc: 'Враг: -30% урон след. ход', svg: CardArts.special },
    { id: 'blood_pact', name: 'Кровавый Пакт', type: 'skill', cost: 0, mod: 'blood', desc: '-15 HP → +3 эн + добор 1 карты', svg: CardArts.special },
    { id: 'wait', name: 'Выжидание', type: 'block', cost: 0, mod: 'wait', desc: 'Нет защиты. Урон → +3 эн след. ход', svg: CardArts.block },
    { id: 'super_ryu', name: 'Супер Хадокен', type: 'super', cost: 0, min: 40, max: 50, reqEx: 100, desc: 'Урон 40-50. Требует 100% EX', svg: CardArts.super_ryu },
    { id: 'super_ken', name: 'Сёрюкен Комбо', type: 'super', cost: 0, min: 45, max: 55, reqEx: 100, desc: 'Урон 45-55. Требует 100% EX', svg: CardArts.super_ken },
    { id: 'super_chun', name: 'Хоёку-сэнь', type: 'super', cost: 0, min: 35, max: 45, reqEx: 100, desc: 'Урон 35-45. Требует 100% EX', svg: CardArts.super_chun },
    { id: 'super_guile', name: 'Соник Бум Блиц', type: 'super', cost: 0, min: 38, max: 48, reqEx: 100, desc: 'Урон 38-48. Требует 100% EX', svg: CardArts.super_guile },
    { id: 'super_zangief', name: 'Финальный Атомик', type: 'super', cost: 0, min: 50, max: 60, reqEx: 100, desc: 'Урон 50-60. Требует 100% EX', svg: CardArts.super_zangief },
    { id: 'super_dhalsim', name: 'Йога Инферно', type: 'super', cost: 0, min: 35, max: 45, reqEx: 100, desc: 'Урон 35-45. Требует 100% EX', svg: CardArts.super_dhalsim },
    { id: 'super_blanka', name: 'Гранд Шейв Ролл', type: 'super', cost: 0, min: 40, max: 50, reqEx: 100, desc: 'Урон 40-50. Требует 100% EX', svg: CardArts.super_blanka },
    { id: 'super_honda', name: 'Супер Хякурэцу', type: 'super', cost: 0, min: 42, max: 52, reqEx: 100, desc: 'Урон 42-52. Требует 100% EX', svg: CardArts.super_honda },
    { id: 'super_akuma', name: 'Сюн Гоку Сацу', type: 'super', cost: 0, min: 65, max: 75, reqEx: 100, desc: 'Урон 65-75. Требует 100% EX', svg: CardArts.super_akuma },
    { id: 'super_boss', name: 'Тайгер Дистракшн', type: 'super', cost: 0, min: 45, max: 55, reqEx: 100, desc: 'Урон 45-55. Требует 100% EX', svg: CardArts.super_boss }
];

function generateStartingDeck(charId) {
    let deck = [];
    let addCards = (id, count) => {
        for(let i=0; i<count; i++) deck.push(createCard(id));
    };
    addCards('super_' + charId, 1);
    
    addCards('l_atk', 8); addCards('m_atk', 4); addCards('block', 4); addCards('h_atk', 2);
    addCards('dodge', 1); addCards('spec', 1);
    
    if(charId === 'ryu') { addCards('l_atk', 5); addCards('m_atk', 4); addCards('block', 4); addCards('h_atk', 2); addCards('dodge', 1); addCards('spec', 1); addCards('sweep', 1); addCards('focus', 1); addCards('fireball', 1); }
    else if(charId === 'ken') { addCards('l_atk', 4); addCards('m_atk', 4); addCards('block', 4); addCards('h_atk', 2); addCards('dodge', 1); addCards('spec', 1); addCards('blood_pact', 1); addCards('prepare', 2); addCards('fireball', 1); }
    else if(charId === 'chun') { addCards('l_atk', 4); addCards('m_atk', 4); addCards('block', 4); addCards('h_atk', 2); addCards('dodge', 1); addCards('spec', 1); addCards('poison_kunai', 1); addCards('dirty_trick', 1); addCards('jump_atk', 1); addCards('double_atk', 1); }
    else if(charId === 'guile') { addCards('l_atk', 5); addCards('m_atk', 4); addCards('block', 4); addCards('h_atk', 2); addCards('dodge', 1); addCards('spec', 1); addCards('wait', 1); addCards('counter', 1); addCards('focus', 1); }
    else if(charId === 'zangief') { addCards('l_atk', 5); addCards('m_atk', 4); addCards('block', 4); addCards('h_atk', 3); addCards('dodge', 1); addCards('spec', 1); addCards('sweep', 1); addCards('blood_pact', 1); }
    else if(charId === 'dhalsim') { addCards('l_atk', 5); addCards('m_atk', 4); addCards('block', 4); addCards('h_atk', 2); addCards('dodge', 1); addCards('spec', 1); addCards('dirty_trick', 1); addCards('wait', 1); addCards('focus', 1); }
    else if(charId === 'blanka') { addCards('l_atk', 4); addCards('m_atk', 4); addCards('block', 4); addCards('h_atk', 2); addCards('dodge', 1); addCards('spec', 1); addCards('poison_kunai', 1); addCards('blood_pact', 1); addCards('fireball', 1); addCards('jump_atk', 1); }
    else if(charId === 'honda') { addCards('l_atk', 5); addCards('m_atk', 4); addCards('block', 4); addCards('h_atk', 2); addCards('dodge', 1); addCards('spec', 1); addCards('wait', 2); addCards('counter', 1); }
    else if(charId === 'akuma') { addCards('l_atk', 4); addCards('m_atk', 4); addCards('block', 3); addCards('h_atk', 3); addCards('dodge', 1); addCards('spec', 1); addCards('fireball', 1); addCards('blood_pact', 1); addCards('prepare', 2); }
    else { addCards('l_atk', 8); addCards('m_atk', 4); addCards('block', 4); addCards('h_atk', 2); addCards('dodge', 1); addCards('spec', 1); }
    
    return shuffle(deck);
}

function generateEnemyDeck() {
    let deck = [];
    let addCards = (id, count) => {
        for(let i=0; i<count; i++) deck.push(createCard(id));
    };
    addCards('l_atk', 5); addCards('m_atk', 3); addCards('block', 3); addCards('h_atk', 2);
    addCards('dodge', 1); addCards('spec', 1); addCards('sweep', 1); addCards('poison_kunai', 1);
    return shuffle(deck);
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function upgradeToGold(card) {
    let g = {...card, gold: true};
    if(g.min && g.max) {
        g.min = Math.ceil(g.min * 1.3);
        g.max = Math.ceil(g.max * 1.3);
    }
    if(g.mod === 'counter') g.counter = Math.ceil((g.counter || 15) * 1.3);
    if(g.mod === 'heal15') g.healAmt = Math.ceil(15 * 1.3);
    if(g.mod === 'focus') g.focusEnergy = Math.ceil(2 * 1.3);
    if(g.mod === 'prep') g.prepMult = 1.5 * 1.3;
    if(g.mod === 'weakness') g.weakMult = 0.7 * 0.7;
    if(g.mod === 'blood') g.bloodHpCost = Math.ceil(15 * 1.3);
    if(g.mod === 'wait') g.waitEnergy = Math.ceil(3 * 1.3);
    g.name = '⭐ ' + g.name;
    return g;
}

function upgradeRandomCardToGold() {
    if(Game.pDeck.length === 0) { logMsg('Колода пуста — нечего улучшать!', '#aaa'); return; }
    let idx = Math.floor(Math.random() * Game.pDeck.length);
    let oldCard = Game.pDeck[idx];
    if(oldCard.gold) { logMsg(oldCard.name + ' уже золотая!', '#ffd700'); return; }
    Game.pDeck[idx] = upgradeToGold(oldCard);
    logMsg(Game.pDeck[idx].name + ' стала ЗОЛОТОЙ! (+30%)', '#ffd700');
}

// --- STATE & PERSISTENCE ---
