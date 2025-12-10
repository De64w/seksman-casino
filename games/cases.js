/* games/cases.js - COMPLETE VERSIE MET VERTICALE LAYOUT */

/* games/cases.js - CONFIGURATIE UPDATE */

const CASE_TYPES = [
    {
        id: 'beginner',
        name: 'Noob Box',
        price: 2.00,
        icon: '📦',
        // Oude situatie: Gemiddeld 0.67 SC terug (DRAMA)
        // Nieuwe situatie: Gemiddeld 1.95 SC terug (EERLIJK)
        items: [
            { name: 'Oude Sok', val: 0.50, prob: 40, icon: '🧦' }, // Verlies (maar minder pijnlijk)
            { name: 'Stenen', val: 2.00, prob: 40, icon: '🪨' },   // Break-even
            { name: 'Hout', val: 4.00, prob: 15, icon: '🪵' },     // Winst
            { name: 'Goudstaaf', val: 15.00, prob: 5, icon: '🌟' } // Jackpot
        ]
    },
    {
        id: 'advanced',
        name: 'Lucky Box',
        price: 10.00,
        icon: '💼',
        // Hoge variantie: Je verliest vaak, maar als je wint, win je veel.
        items: [
            { name: 'Kolen', val: 2.00, prob: 50, icon: '⚫' },    // Flink verlies
            { name: 'IJzer', val: 12.00, prob: 30, icon: '🔩' },   // Kleine winst
            { name: 'Goud', val: 30.00, prob: 15, icon: '🥇' },    // Goede winst
            { name: 'Diamant', val: 150.00, prob: 5, icon: '💎' }  // Jackpot
        ]
    },
    {
        id: 'crazy',
        name: 'High Roller',
        price: 50.00,
        icon: '👑',
        // Alles of niets
        items: [
            { name: 'Lucht', val: 0.00, prob: 20, icon: '💨' },     // Pijnlijk
            { name: 'Kruimels', val: 25.00, prob: 40, icon: '🍪' }, // Verlies
            { name: 'Robijn', val: 100.00, prob: 30, icon: '🔻' },  // x2
            { name: 'Kroon', val: 500.00, prob: 10, icon: '👑' }    // x10
        ]
    },
    {
        id: 'meme',
        name: 'Meme Case',
        price: 5.00,
        icon: '🐸',
        // Evenwichtig
        items: [
            { name: 'Sad Frog', val: 1.00, prob: 40, icon: '🐸' },
            { name: 'Doge', val: 5.00, prob: 40, icon: '🐶' },
            { name: 'Rocket', val: 15.00, prob: 15, icon: '🚀' },
            { name: 'Moon', val: 100.00, prob: 5, icon: '🌕' }
        ]
    }
];

// ... De rest van de code blijft hetzelfde ...

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
        thumb.innerText = c.icon;
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
    
    // Render Vertical Layout
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
            playerObj.drops.push(item);
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

// --- RENDER & ANIMATION (VERTICAL FIX) ---

function renderBattleArena(players) {
    // We gebruiken nu .cb-battle-columns als container voor de RIJEN
    const container = document.getElementById('cb-battle-columns');
    container.innerHTML = '';
    
    // Pas de class van de container aan naar een stack (via JS of CSS, hier via CSS 'battle-stack')
    container.className = 'battle-stack';

    players.forEach((p, pIndex) => {
        const row = document.createElement('div');
        row.className = 'battle-player-row'; // Nieuwe class
        row.id = `player-row-${pIndex}`;
        
        // Linkerkant: Info
        let html = `
            <div class="row-info">
                <span class="player-avatar">${p.avatar}</span>
                <div class="player-name">${p.name}</div>
                <div class="player-total" id="p-total-${pIndex}">0.00 SC</div>
            </div>
        `;

        // Midden: De Reel Container (Hierin injecteren we later de strip)
        // We geven dit element een uniek ID voor de animatie functie
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
            
            // Verwijder oude classes (finished) en inhoud
            container.classList.remove('finished');
            container.innerHTML = ''; 
            
            // Maak nieuwe strip
            const reelObj = createReelStrip(caseInfo, winningItem);
            container.appendChild(reelObj.element);
            
            // Resultaat tekst toevoegen (onzichtbaar)
            const valLabel = document.createElement('div');
            valLabel.className = 'slot-result-value';
            valLabel.innerText = winningItem.val.toFixed(2) + ' SC';
            container.appendChild(valLabel);

            activeReels.push({
                element: reelObj.strip,
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

        // 4. Afronden
        players.forEach((p, pIndex) => {
            const container = document.getElementById(`reel-container-${pIndex}`);
            container.classList.add('finished'); // Toont tekst
            
            let currentTotal = 0;
            for(let i=0; i<=r; i++) currentTotal += p.drops[i].val;
            document.getElementById(`p-total-${pIndex}`).innerText = currentTotal.toFixed(2) + " SC";
        });

        await new Promise(res => setTimeout(res, 1000)); // Iets langere pauze tussen rondes
    }
    finishBattle(players);
}

function createReelStrip(caseType, winningItem) {
    const strip = document.createElement('div');
    strip.className = 'reel-strip';
    
    const CARD_WIDTH = 80; // Match met CSS .reel-card width
    const GAP = 6;         // Match met CSS .reel-card margin-right
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

        card.className = 'reel-card';
        card.innerText = itemToShow.icon;
        
        if(itemToShow.prob < 5) card.classList.add('legendary');
        else if(itemToShow.prob < 20) card.classList.add('rare');
        else if(itemToShow.prob < 40) card.classList.add('uncommon');
        else card.classList.add('common');

        strip.appendChild(card);
    }

    const widthPerCard = CARD_WIDTH + GAP;
    const basePosition = (WIN_INDEX * widthPerCard) + (CARD_WIDTH / 2);
    const randomOffset = (Math.random() * 50) - 25; 
    const finalPosition = basePosition + randomOffset;

    return {
        element: strip,
        strip: strip,
        targetPos: finalPosition
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
    players.forEach(p => totalPot += p.totalValue);

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