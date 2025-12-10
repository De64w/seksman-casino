/* games/cases.js - DE "METEN IS WETEN" VERSIE (NOOIT MEER DESYNC) */

/* --- CONFIGURATIE --- */
const RARITY_TIERS = [
    { id: 'mythic', chance: 0.002, multiplier: 10 },
    { id: 'legendary', chance: 0.01, multiplier: 5 },
    { id: 'epic', chance: 0.05, multiplier: 2 },
    { id: 'rare', chance: 0.12, multiplier: 1.5 }
];

function getDynamicTier() {
    const roll = Math.random();
    for (let tier of RARITY_TIERS) {
        if (roll < tier.chance) return tier;
    }
    return null;
}

const CASE_TYPES = [
    {
        id: 'beginner', name: 'Noob Box', price: 2.00, icon: '📦',
        items: [
            { name: 'Oude Sok', val: 0.50, prob: 40, icon: '🧦' },
            { name: 'Stenen', val: 2.00, prob: 40, icon: '🪨' },
            { name: 'Hout', val: 4.00, prob: 15, icon: '🪵' },
            { name: 'Goudstaaf', val: 15.00, prob: 5, icon: '🌟' }
        ]
    },
    {
        id: 'advanced', name: 'Lucky Box', price: 10.00, icon: '💼',
        items: [
            { name: 'Kolen', val: 2.00, prob: 50, icon: '⚫' },
            { name: 'IJzer', val: 12.00, prob: 30, icon: '🔩' },
            { name: 'Goud', val: 30.00, prob: 15, icon: '🥇' },
            { name: 'Diamant', val: 150.00, prob: 5, icon: '💎' }
        ]
    },
    {
        id: 'crazy', name: 'High Roller', price: 50.00, icon: '👑',
        items: [
            { name: 'Lucht', val: 0.00, prob: 20, icon: '💨' },
            { name: 'Kruimels', val: 25.00, prob: 40, icon: '🍪' },
            { name: 'Robijn', val: 100.00, prob: 30, icon: '🔻' },
            { name: 'Kroon', val: 500.00, prob: 10, icon: '👑' }
        ]
    },
    {
        id: 'meme', name: 'Brainrot Case', price: 5.00, icon: '<img src="images/reels/id-meme/meme-case.png" class="case-menu-icon">',
        items: [
            { name: 'Sad Frog', val: 1.50, prob: 50, icon: '<img src="images/reels/id-meme/crocro.png" class="case-item-img">' },
            { name: 'Doge', val: 4.00, prob: 30, icon: '<img src="images/reels/id-meme/brrbrr.png" class="case-item-img">' },
            { name: 'Rocket', val: 12.00, prob: 15, icon: '<img src="images/reels/id-meme/bcapu.png" class="case-item-img">' },
            { name: 'Moon', val: 25.00, prob: 8, icon: '<img src="images/reels/id-meme/lala.png" class="case-item-img">' },
            { name: 'Moon', val: 100.00, prob: 3, icon: '<img src="images/reels/id-meme/tuntuntun.png" class="case-item-img">' }
        ]
    }
];

let casesGame = { selectedCases: [], playerCount: 2, active: false };

/* --- SETUP & UI --- */
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

/* --- BATTLE LOGIC --- */
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
            playerObj.drops.push({ ...item }); 
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

/* --- RENDER & ANIMATION --- */

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
            <div class="row-reel-container" id="reel-container-${pIndex}"></div>
            <div class="row-history" id="history-${pIndex}"></div>
        `;
        row.innerHTML = html;
        container.appendChild(row);
    });
}

function createReelStrip(caseType, winningItem) {
    const strip = document.createElement('div');
    strip.className = 'reel-strip';
    
    // Maten (voor het maken van elementen)
    const TOTAL_CARDS = 110; 
    const WIN_INDEX = 75;    
    let winningElement = null; // Hier slaan we het winnende HTML element in op

    for(let i=0; i < TOTAL_CARDS; i++) {
        const card = document.createElement('div');
        card.className = 'reel-card'; 

        let itemToShow;
        if(i === WIN_INDEX) {
            itemToShow = winningItem;
        } else {
            const randomIdx = Math.floor(Math.random() * caseType.items.length);
            itemToShow = caseType.items[randomIdx];
        }

        const tier = getDynamicTier();
        if (tier) {
            card.classList.add(`rarity-${tier.id}`);
            card.dataset.multiplier = tier.multiplier;
            card.dataset.tierName = tier.id;
            card.dataset.isSpecial = "true";
        }

        card.innerHTML = itemToShow.icon;
        strip.appendChild(card);
        
        // BEWAAR DIT ELEMENT!
        if(i === WIN_INDEX) {
            winningElement = card;
        }
    }

    // We hoeven hier GEEN positie meer te berekenen. Dat doen we in de animatie functie.
    // We geven alleen de strip en het winnende element terug.
    return { element: strip, winningElement: winningElement };
}

async function runBattleAnimation(players) {
    const rounds = casesGame.selectedCases.length;

    for (let r = 0; r < rounds; r++) {
        document.getElementById('arena-status').innerText = `Ronde ${r + 1} / ${rounds}`;
        const activeReels = [];

        // 1. SETUP & METEN
        players.forEach((p, pIndex) => {
            const container = document.getElementById(`reel-container-${pIndex}`);
            const winningItem = p.drops[r];
            const caseInfo = casesGame.selectedCases[r];
            
            container.classList.remove('finished');
            container.innerHTML = ''; 
            
            // Maak de strip en zet hem in de container
            const reelObj = createReelStrip(caseInfo, winningItem);
            container.appendChild(reelObj.element);
            
            // --- HET GROTE TRUCJE: METEN WAAR HIJ STAAT ---
            // Omdat de strip nu in de pagina staat (appendChild), kunnen we meten!
            const winCardLeft = reelObj.winningElement.offsetLeft;
            const containerWidth = container.offsetWidth; // Hoe breed is het venster?
            const cardWidth = 80; // Breedte van de kaart
            
            // Bereken het midden
            // Positie van kaart - (Helft van container) + (Helft van kaart)
            let targetPos = winCardLeft - (containerWidth / 2) + (cardWidth / 2);
            
            // Kleine veilige variatie (max 10px, zodat je nooit buiten de kaart valt)
            const randomOffset = (Math.random() * 20) - 10; 
            targetPos += randomOffset;
            // ---------------------------------------------

            // Voeg label toe
            const valLabel = document.createElement('div');
            valLabel.className = 'slot-result-value';
            valLabel.innerText = winningItem.val.toFixed(2) + ' SC';
            container.appendChild(valLabel);

            activeReels.push({ 
                element: reelObj.element, 
                targetPos: targetPos,
                winningElement: reelObj.winningElement // Bewaar voor later
            });
        });

        await new Promise(res => setTimeout(res, 50));

        // 2. DRAAIEN
        activeReels.forEach(item => {
            item.element.style.transform = `translateX(-${item.targetPos}px)`;
        });

        // 3. WACHTEN (4.5s)
        await new Promise(res => setTimeout(res, 4500));

        // 4. RESULTATEN VERWERKEN
        players.forEach((p, pIndex) => {
            const container = document.getElementById(`reel-container-${pIndex}`);
            container.classList.add('finished');
            
            // We gebruiken het opgeslagen winningElement, dus we weten 100% zeker dat dit de juiste is
            const reelItem = activeReels[pIndex]; // Pak de info uit stap 1
            const winningCard = reelItem.winningElement;
            
            let tierClass = ""; 

            if (winningCard) {
                // Check multipliers
                if (winningCard.dataset.isSpecial === "true") {
                    const mult = parseFloat(winningCard.dataset.multiplier);
                    p.drops[r].val = p.drops[r].val * mult;
                    tierClass = winningCard.dataset.tierName;
                    
                    const valLabel = container.querySelector('.slot-result-value');
                    if(valLabel) {
                        valLabel.innerText = p.drops[r].val.toFixed(2) + ' SC';
                        valLabel.style.color = '#ffd700';
                        valLabel.innerText += ` (${tierClass.toUpperCase()}!)`;
                    }
                }
            }
            
            // History Update
            const historyContainer = document.getElementById(`history-${pIndex}`);
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            if (tierClass) historyItem.classList.add(`rarity-${tierClass}`);
            historyItem.innerHTML = p.drops[r].icon;
            historyContainer.appendChild(historyItem);
            
            // Totaal Update
            let currentTotal = 0;
            for(let i=0; i<=r; i++) currentTotal += p.drops[i].val;
            
            const totalEl = document.getElementById(`p-total-${pIndex}`);
            totalEl.innerText = currentTotal.toFixed(2) + " SC";
            p.totalValue = currentTotal;
        });

        await new Promise(res => setTimeout(res, 1000));
    }
    finishBattle(players);
}

function finishBattle(players) {
    document.getElementById('arena-status').innerText = "Battle Afgelopen";
    let highestTotal = -1;
    let winners = [];

    players.forEach(p => {
        if(p.totalValue > highestTotal) { highestTotal = p.totalValue; winners = [p]; }
        else if (p.totalValue === highestTotal) winners.push(p);
    });

    let totalPot = 0;
    players.forEach(p => totalPot += p.totalValue);

    players.forEach((p, index) => {
        const row = document.getElementById(`player-row-${index}`);
        const isWinner = winners.includes(p);
        if(isWinner) row.classList.add('winner'); else row.classList.add('loser');
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