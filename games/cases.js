/* games/cases.js - COMPLETE VERSIE MET RARITY & VERTICALE LAYOUT */

/* games/cases.js - BOVENAAN */

/* --- AANGEPASTE KANSEN (Minder vaak, dus minder lag) --- */
const RARITY_TIERS = [
    // Mythic: van 1% naar 0.2% (1 op de 500)
    { id: 'mythic', chance: 0.002, multiplier: 100 },   
    
    // Legendary: van 5% naar 1% (1 op de 100)
    { id: 'legendary', chance: 0.01, multiplier: 10 }, 
    
    // Epic: van 15% naar 5% (1 op de 20)
    { id: 'epic', chance: 0.05, multiplier: 5 },      
    
    // Rare: van 30% naar 12% (1 op de 8)
    { id: 'rare', chance: 0.12, multiplier: 2 }     
];

// De functie blijft hetzelfde:
function getDynamicTier() {
    const roll = Math.random();
    for (let tier of RARITY_TIERS) {
        if (roll < tier.chance) return tier;
    }
    return null;
}

/* --- CASE CONFIGURATIE --- */
const CASE_TYPES = [
    {
        id: 'beginner',
        name: 'Noob Box',
        price: 2.00,
        icon: '📦',
        items: [
            { name: 'Oude Sok', val: 0.50, prob: 40, icon: '🧦' },
            { name: 'Stenen', val: 2.00, prob: 40, icon: '🪨' },
            { name: 'Hout', val: 4.00, prob: 15, icon: '🪵' },
            { name: 'Goudstaaf', val: 15.00, prob: 5, icon: '🌟' }
        ]
    },
    {
        id: 'advanced',
        name: 'Lucky Box',
        price: 10.00,
        icon: '💼',
        items: [
            { name: 'Kolen', val: 2.00, prob: 50, icon: '⚫' },
            { name: 'IJzer', val: 12.00, prob: 30, icon: '🔩' },
            { name: 'Goud', val: 30.00, prob: 15, icon: '🥇' },
            { name: 'Diamant', val: 150.00, prob: 5, icon: '💎' }
        ]
    },
    {
        id: 'crazy',
        name: 'High Roller',
        price: 50.00,
        icon: '👑',
        items: [
            { name: 'Lucht', val: 0.00, prob: 20, icon: '💨' },
            { name: 'Kruimels', val: 25.00, prob: 40, icon: '🍪' },
            { name: 'Robijn', val: 100.00, prob: 30, icon: '🔻' },
            { name: 'Kroon', val: 500.00, prob: 10, icon: '👑' }
        ]
    },
    {
        id: 'meme',
        name: 'Brainrot Case',
        price: 5.00,
        icon: '<img src="images/reels/id-meme/meme-case.png" class="case-menu-icon">',
        items: [
            { name: 'Sad Frog', val: 1.00, prob: 40, icon: '<img src="images/reels/id-meme/crocro.png" class="case-item-img">' },
            { name: 'Doge', val: 5.00, prob: 40, icon: '<img src="images/reels/id-meme/brrbrr.png" class="case-item-img">' },
            { name: 'Rocket', val: 15.00, prob: 15, icon: '<img src="images/reels/id-meme/bcapu.png" class="case-item-img">' },
            { name: 'Moon', val: 25.00, prob: 10, icon: '<img src="images/reels/id-meme/lala.png" class="case-item-img">' },
            { name: 'Moon', val: 100.00, prob: 5, icon: '<img src="images/reels/id-meme/tuntuntun.png" class="case-item-img">' }
        ]
    }
];

// --- STATE ---
let casesGame = {
    selectedCases: [],
    playerCount: 2,
    active: false
};

// --- SETUP ---
function initCases() {
    casesReset();
    const grid = document.getElementById('cb-market-grid');
    if(!grid) return;
    grid.innerHTML = '';
    CASE_TYPES.forEach(c => {
        const el = document.createElement('div');
        el.className = 'market-case-card';
        el.onclick = () => casesAdd(c.id);
        el.innerHTML = `<span class="case-img">${c.icon}</span><h3>${c.name}</h3><span class="case-price">${c.price.toFixed(2)} SC</span>`;
        grid.appendChild(el);
    });
}

function casesAdd(id) {
    if(casesGame.selectedCases.length >= 20) { alert("Max 20 cases!"); return; }
    casesGame.selectedCases.push(CASE_TYPES.find(c => c.id === id));
    casesRenderSelection();
}

function casesRemove(index) {
    casesGame.selectedCases.splice(index, 1);
    casesRenderSelection();
}

function casesRenderSelection() {
    const bar = document.getElementById('cb-selection-bar');
    bar.innerHTML = '';
    if(casesGame.selectedCases.length === 0) bar.innerHTML = '<div class="empty-msg">Klik op cases om toe te voegen</div>';
    else casesGame.selectedCases.forEach((c, idx) => {
        const thumb = document.createElement('div');
        thumb.className = 'selected-case-thumb';
        thumb.innerHTML = c.icon;
        thumb.onclick = () => casesRemove(idx);
        bar.appendChild(thumb);
    });
    casesUpdateCost();
}

function casesUpdateCost() {
    casesGame.playerCount = parseInt(document.getElementById('cb-mode').value);
    let total = 0;
    casesGame.selectedCases.forEach(c => total += c.price);
    document.getElementById('cb-total-cost').innerText = total.toFixed(2) + " SC";
}

function casesReset() {
    document.getElementById('cases-setup').classList.remove('hidden');
    document.getElementById('cases-arena').classList.add('hidden');
    casesGame.selectedCases = [];
    casesRenderSelection();
}

// --- BATTLE LOGIC ---
function casesStartBattle() {
    if(casesGame.selectedCases.length === 0) { alert("Selecteer minstens 1 case!"); return; }
    
    let totalCost = 0;
    casesGame.selectedCases.forEach(c => totalCost += c.price);
    if(!deductBalance(totalCost)) return;

    document.getElementById('cases-setup').classList.add('hidden');
    document.getElementById('cases-arena').classList.remove('hidden');
    document.getElementById('cb-winner-banner').classList.add('hidden');
    
    const results = generateBattleResults(casesGame.playerCount, casesGame.selectedCases);
    
    renderBattleArena(results);
    runBattleAnimation(results);
}

function generateBattleResults(playerCount, cases) {
    let players = [];
    const botNames = ["Bot Simon", "Bot Anna", "Bot X", "Bot Chad"];
    for(let p=0; p<playerCount; p++) {
        let playerObj = {
            name: p === 0 ? "Jij" : botNames[p-1],
            isUser: p === 0,
            avatar: p === 0 ? "😎" : "🤖",
            drops: [],
            totalValue: 0
        };
        cases.forEach(caseType => {
            const item = openCase(caseType);
            playerObj.drops.push({ ...item }); // Kopie van item maken, belangrijk voor multipliers!
            playerObj.totalValue += item.val;
        });
        players.push(playerObj);
    }
    return players;
}

function openCase(caseType) {
    const totalWeight = caseType.items.reduce((sum, item) => sum + item.prob, 0);
    let random = Math.random() * totalWeight;
    for(let item of caseType.items) {
        if(random < item.prob) return item;
        random -= item.prob;
    }
    return caseType.items[0];
}

// --- RENDER & ANIMATION ---

function renderBattleArena(players) {
    const container = document.getElementById('cb-battle-columns');
    container.innerHTML = '';
    container.className = 'battle-stack';

    players.forEach((p, pIndex) => {
        const row = document.createElement('div');
        row.className = 'battle-player-row';
        row.id = `player-row-${pIndex}`;
        
        let html = `
            <div class="row-info">
                <span class="player-avatar">${p.avatar}</span>
                <div class="player-name">${p.name}</div>
                <div class="player-total" id="p-total-${pIndex}">0.00 SC</div>
            </div>
        `;

        html += `
            <div class="row-reel-container" id="reel-container-${pIndex}">
            </div>
        `;

        row.innerHTML = html;
        container.appendChild(row);
    });
}

async function runBattleAnimation(players) {
    const rounds = casesGame.selectedCases.length;
    
    for (let r = 0; r < rounds; r++) {
        document.getElementById('arena-status').innerText = `Ronde ${r + 1} / ${rounds}`;
        
        const activeReels = [];
        
        // 1. Voorbereiden
        players.forEach((p, pIndex) => {
            const container = document.getElementById(`reel-container-${pIndex}`);
            const winningItem = p.drops[r];
            const caseInfo = casesGame.selectedCases[r];
            
            container.classList.remove('finished');
            container.innerHTML = ''; 
            
            // Maak nieuwe strip (MET GLOW LOGICA)
            const reelObj = createReelStrip(caseInfo, winningItem);
            container.appendChild(reelObj.element);
            
            // Resultaat tekst toevoegen
            const valLabel = document.createElement('div');
            valLabel.className = 'slot-result-value';
            valLabel.innerText = winningItem.val.toFixed(2) + ' SC';
            container.appendChild(valLabel);

            activeReels.push({
                element: reelObj.element, // Let op: element was strip
                targetPos: reelObj.targetPos
            });
        });

        await new Promise(res => setTimeout(res, 50));

        // 2. Draaien maar!
        activeReels.forEach(item => {
            item.element.style.transform = `translateX(-${item.targetPos}px)`;
        });

        // 3. Wachten (4s)
        await new Promise(res => setTimeout(res, 4000));

        // 4. Afronden & Multipliers checken
        players.forEach((p, pIndex) => {
            const container = document.getElementById(`reel-container-${pIndex}`);
            container.classList.add('finished');
            
            // --- NIEUWE RARITY CHECK ---
            const strip = container.querySelector('.reel-strip');
            if (strip && strip.children[60]) {
                const winningCard = strip.children[60];
                if (winningCard.dataset.isSpecial === "true") {
                    const mult = parseFloat(winningCard.dataset.multiplier);
                    // Verhoog de waarde in het geheugen!
                    p.drops[r].val = p.drops[r].val * mult;
                    console.log(`BONUS! Speler ${pIndex} pakt x${mult}`);
                    
                    // Update label tekst met goud
                    const valLabel = container.querySelector('.slot-result-value');
                    if(valLabel) {
                        valLabel.innerText = p.drops[r].val.toFixed(2) + ' SC';
                        valLabel.style.color = '#ffd700';
                        valLabel.innerText += ` (${winningCard.dataset.tierName.toUpperCase()}!)`;
                    }
                }
            }
            // ---------------------------
            
            // Totaal berekenen
            let currentTotal = 0;
            for(let i=0; i<=r; i++) currentTotal += p.drops[i].val;
            
            // Totaal updaten op scherm
            const totalEl = document.getElementById(`p-total-${pIndex}`);
            totalEl.innerText = currentTotal.toFixed(2) + " SC";
            
            // Update totaal in speler object voor de eindstand
            p.totalValue = currentTotal;
        });

        await new Promise(res => setTimeout(res, 1000));
    }
    finishBattle(players);
}

function createReelStrip(caseType, winningItem) {
    const strip = document.createElement('div');
    strip.className = 'reel-strip';
    
    const CARD_WIDTH = 80;
    const GAP = 6;
    const TOTAL_CARDS = 80;
    const WIN_INDEX = 60; 
    
    for(let i=0; i < TOTAL_CARDS; i++) {
        const card = document.createElement('div');
        
        let itemToShow;
        if(i === WIN_INDEX) itemToShow = winningItem;
        else {
            const randomIdx = Math.floor(Math.random() * caseType.items.length);
            itemToShow = caseType.items[randomIdx];
        }

        card.className = 'reel-card'; // Let op: CSS moet .reel-card heten (of .case-card)
        // Check je CSS: heet het .case-card of .reel-card? Ik gebruik hier reel-card omdat dat in je vorige code stond.
        
        // --- RARITY DOBBELSTEEN ---
        const tier = getDynamicTier();
        if (tier) {
            card.classList.add(`rarity-${tier.id}`);
            card.dataset.multiplier = tier.multiplier;
            card.dataset.tierName = tier.id;
            card.dataset.isSpecial = "true";
        }
        // -------------------------

        card.innerHTML = itemToShow.icon;
        
        // Oude class logica voor achtergrondkleurtjes (mag blijven staan of weg)
        if(itemToShow.prob < 5) card.classList.add('legendary');
        else if(itemToShow.prob < 20) card.classList.add('rare');
        else if(itemToShow.prob < 40) card.classList.add('uncommon');
        else card.classList.add('common');

        strip.appendChild(card);
    }

    const widthPerCard = CARD_WIDTH + GAP;
    const basePosition = (WIN_INDEX * widthPerCard) + (CARD_WIDTH / 2);
    // Iets minder variatie in offset zodat we zeker weten dat de glow zichtbaar is
    const randomOffset = (Math.random() * 20) - 10; 
    const finalPosition = basePosition + randomOffset;

    return {
        element: strip, // Het HTML element
        strip: strip,   // Zelfde referentie
        targetPos: finalPosition // Waar moet hij stoppen
    };
}

function finishBattle(players) {
    document.getElementById('arena-status').innerText = "Battle Afgelopen";
    let highestTotal = -1;
    let winners = [];

    players.forEach(p => {
        if(p.totalValue > highestTotal) {
            highestTotal = p.totalValue;
            winners = [p];
        } else if (p.totalValue === highestTotal) winners.push(p);
    });

    let totalPot = 0;
    players.forEach(p => totalPot += p.totalValue); // Dit is nu inclusief multipliers!

    players.forEach((p, index) => {
        const row = document.getElementById(`player-row-${index}`);
        const isWinner = winners.includes(p);
        if(isWinner) row.classList.add('winner');
        else row.classList.add('loser');
    });

    const userWon = winners.some(w => w.isUser);
    const banner = document.getElementById('cb-winner-banner');
    banner.classList.remove('hidden');

    if(userWon) {
        const winShare = totalPot / winners.length;
        addBalance(winShare);
        banner.innerText = `JE WINT! +${winShare.toFixed(2)} SC`;
        banner.style.color = "#00e701";
    } else {
        banner.innerText = "VERLOREN...";
        banner.style.color = "#ff4444";
    }
}

// Start
initCases();