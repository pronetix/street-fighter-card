import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Restore startCareer
start_career_code = r'''
function startCareer(charId) {
    let charBase = Characters.find(c => c.id === charId);
    Game.player = JSON.parse(JSON.stringify(charBase));
    Game.player.maxHp = Game.player.hp;
    Game.pDeck = generateStartingDeck(charId);
    Game.level = 1;
    Game.baseEnergy = 3;
    Game.energyBonus = 0;
    Game.dmgBonus = 0;
    Game.pEx = 0;
    Game.eEx = 0;
    
    let plays = JSON.parse(localStorage.getItem('sfFavTracker')||'{}');
    plays[charId] = (plays[charId]||0) + 1;
    localStorage.setItem('sfFavTracker', JSON.stringify(plays));
    let best = Object.keys(plays).reduce((a, b) => plays[a] > plays[b] ? a : b);
    Stats.favChar = Characters.find(c=>c.id===best).name;
    saveStats();

    prepareNextBattle();
}
'''

# 2. Fix selectCharacter to ensure proper state reset
select_character_code = r'''
function selectCharacter(charId) {
    if (!Game.isPvP) {
        startCareer(charId);
    } else {
        if (Game.pvpStep === 1) {
            let charBase = Characters.find(c => c.id === charId);
            Game.player = JSON.parse(JSON.stringify(charBase));
            Game.player.maxHp = Game.player.hp;
            Game.pDeck = generateStartingDeck(charId);
            Game.pHand = [];
            Game.pDiscard = [];
            
            Game.pvpStep = 2;
            document.getElementById('select-title').innerText = "Игрок 2: Выберите Бойца";
            logMsg("Игрок 1 выбрал: " + Game.player.name);
        } else if (Game.pvpStep === 2) {
            let charBase = Characters.find(c => c.id === charId);
            Game.enemy = JSON.parse(JSON.stringify(charBase));
            Game.enemy.maxHp = Game.enemy.hp;
            Game.eDeck = generateStartingDeck(charId);
            Game.eHand = [];
            Game.eDiscard = [];
            
            Game.level = 1;
            Game.baseEnergy = 3;
            Game.energyBonus = 0;
            Game.dmgBonus = 0;
            Game.pEx = 0;
            Game.eEx = 0;
            
            startBattle();
        }
    }
}
'''

# Replace the existing selectCharacter (which I'll find by name)
html = re.sub(r'function selectCharacter\(charId\) \{.*?\}', select_character_code.strip(), html, flags=re.DOTALL)

# Add startCareer before selectCharacter
html = html.replace('function selectCharacter(charId) {', start_career_code + '\n\nfunction selectCharacter(charId) {')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
