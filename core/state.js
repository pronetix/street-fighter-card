const DEFAULT_STATS = {
    wins: 0, losses: 0, favChar: '', bestRun: 0,
    achZangief3: false, achNoBlock: false, achAllChars: [],
    unlockedChars: ['ryu'],
    recordEndless: 0,
    gold: 0
};

function loadJson(key, fallback) {
    let result = { ...fallback };
    try {
        const raw = localStorage.getItem(key);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (typeof parsed === 'object' && parsed !== null) {
                result = { ...fallback, ...parsed };
            }
        }
    } catch(e) {
        console.warn('Save data corrupted for key:', key, e);
    }
    return result;
}

let Stats = loadJson('sfStats', DEFAULT_STATS);
if(!Stats.unlockedChars) Stats.unlockedChars = ['ryu'];
if(typeof Stats.gold !== 'number') Stats.gold = 0;

function saveStats() {
    try {
        localStorage.setItem('sfStats', JSON.stringify(Stats));
    } catch(e) {
        console.warn('Failed to save stats:', e);
    }
}

const UNLOCK_CONDITIONS = {
    ken: { boss: 'sagat', cost: 50, desc: 'Победить Сагата' },
    chun: { boss: 'sagat', cost: 50, desc: 'Победить Сагата' },
    guile: { boss: 'vega', cost: 80, desc: 'Победить Вегу' },
    zangief: { level: 3, cost: 60, desc: 'Дойти до уровня 3' },
    dhalsim: { boss: 'vega', cost: 80, desc: 'Победить Вегу' },
    blanka: { level: 5, cost: 100, desc: 'Дойти до уровня 5' },
    honda: { boss: 'bison', cost: 150, desc: 'Победить Байсона' },
    akuma: { boss: 'bison', level: 10, cost: 200, desc: 'Дойти до 10 уровня (бесконечный)' }
};

function unlockChar(charId) {
    let req = UNLOCK_CONDITIONS[charId];
    if(!req) return;
    if(Stats.unlockedChars.includes(charId)) return;
    if((Stats.gold || 0) >= req.cost) {
        Stats.gold -= req.cost;
        Stats.unlockedChars.push(charId);
        saveStats();
        if(typeof logMsg === 'function') logMsg(`${Characters.find(c=>c.id===charId).name} разблокирован!`, '#ffd700');
        if(typeof Audio !== 'undefined' && Audio.win) Audio.win();
        if(typeof renderRoster === 'function') renderRoster();
    } else {
        if(typeof alert === 'function') {
            alert(`Нужно ${req.cost} золота для разблокировки!\nУ вас: ${Stats.gold || 0}`);
        }
    }
}

function checkUnlockProgress() {
    // Авто-разблокировка за прогресс (без золота)
    Object.entries(UNLOCK_CONDITIONS).forEach(([charId, req]) => {
        if(Stats.unlockedChars.includes(charId)) return;
        let pass = false;
        if(req.boss && Stats.bestRun >= 4 && req.boss === 'sagat') pass = true;
        if(req.boss && Stats.bestRun >= 7 && req.boss === 'vega') pass = true;
        if(req.boss && Stats.bestRun >= 8 && req.boss === 'bison') pass = true;
        if(req.level && Stats.bestRun >= req.level) pass = true;
        if(pass) {
            Stats.unlockedChars.push(charId);
            saveStats();
        }
    });
}
function saveStats() { localStorage.setItem('sfStats', JSON.stringify(Stats)); }

let Game = {
    player: null, enemy: null, level: 1, maxLevel: 8,
    pDeck: [], pHand: [], pDiscard: [], pExhaust: [],
    eDeck: [], eHand: [], eDiscard: [], eExhaust: [],
    turnCounter: 0, comboHistory: [], cardsPlayedThisTurn: 0,
    pBuffs: {}, eBuffs: {}, pEx: 0, eEx: 0,
    baseEnergy: 3, energyBonus: 0, pEnergy: 0, dmgBonus: 0,
    gold: 0, difficulty: 0, endlessMode: false,
    inputLocked: false,
    difficulty: 0,
    noBlockUsed: true,
    endlessMode: false,
    multiplayer: false,
    activePlayer: 1,
    // p2 state mirror for multiplayer
    p2: null, p2Deck: [], p2Hand: [], p2Discard: [], p2Buffs: {}, p2Ex: 0
};

function resetBuffs(b) {
    b.burn=0; b.freeze=0; b.stun=0; b.dodgeChance=0; b.blockPct=0; b.blockFlat=0; b.blockCharges=0; 
    b.freeCard=false; b.specCd=0; b.nextTurnEnergy=0; b.nextAtkBoost=1.0; 
    b.counter=0; b.firstStrikeDone=false; b.iceBlock=false;
    b.poison=0; b.weakness=0; b.wait=false; b.waitTriggered=false; b.blockCount=0;
}

// --- CORE LOGIC ---
