/* --- CONFIGURATIE --- */

// 1. De Symbolen & Uitbetalingen
// 'payout' is een lijstje: [niks, niks, niks, 3x, 4x, 5x]
// We gebruiken index 3, 4, en 5 voor het aantal matches.
/* --- CONFIGURATIE (MET PLAATJES) --- */

const SLOT_SYMBOLS = [
    // LAGE WAARDE (10, J, Q, K, A)
    { 
        id: '10', 
        icon: '<img src="images/slots/10.png" class="slot-img">', 
        payout: {3: 0.5, 4: 2, 5: 10} 
    }, 
    { 
        id: 'J',  
        icon: '<img src="images/slots/J.png" class="slot-img">', 
        payout: {3: 0.5, 4: 2, 5: 10} 
    },
    { 
        id: 'Q',  
        icon: '<img src="images/slots/Q.png" class="slot-img">', 
        payout: {3: 0.5, 4: 2, 5: 10} 
    },
    { 
        id: 'K',  
        icon: '<img src="images/slots/K.png" class="slot-img">', 
        payout: {3: 0.5, 4: 3, 5: 15} 
    },
    { 
        id: 'A',  
        icon: '<img src="images/slots/A.png" class="slot-img">', 
        payout: {3: 0.5, 4: 3, 5: 15} 
    },

    // HOGE WAARDE (Goden & Helden)
    { 
        id: 'H1', 
        icon: '<img src="images/slots/h1.png" class="slot-img">', // Horus
        payout: {2: 0.5, 3: 3, 4: 10, 5: 75} 
    }, 
    { 
        id: 'H2', 
        icon: '<img src="images/slots/h2.png" class="slot-img">', // Anubis
        payout: {2: 0.5, 3: 3, 4: 10, 5: 75} 
    }, 
    { 
        id: 'H3', 
        icon: '<img src="images/slots/h3.png" class="slot-img">', // Farao
        payout: {2: 0.5, 3: 4, 4: 40, 5: 200} 
    }, 
    { 
        id: 'H4', 
        icon: '<img src="images/slots/h4.png" class="slot-img">', // Rich Wilde (Jouw Seksman)
        payout: {2: 1, 3: 10, 4: 100, 5: 500} 
    }, 

    // SPECIAAL
    { 
        id: 'BOOK', 
        icon: '<img src="images/slots/book.png" class="slot-img">', 
        payout: {3: 2, 4: 20, 5: 200} 
    } 
];

// 2. De 10 Winlijnen (Book of Dead standaard)
// Elk getal is de rij-index (0=boven, 1=midden, 2=onder) voor rol 1 t/m 5.
const PAYLINES = [
    [1, 1, 1, 1, 1], // Lijn 1: Midden
    [0, 0, 0, 0, 0], // Lijn 2: Boven
    [2, 2, 2, 2, 2], // Lijn 3: Onder
    [0, 1, 2, 1, 0], // Lijn 4: V-vorm (Boven, Midden, Onder, Midden, Boven)
    [2, 1, 0, 1, 2], // Lijn 5: Omgekeerde V
    [1, 0, 0, 0, 1], // Lijn 6
    [1, 2, 2, 2, 1], // Lijn 7
    [0, 0, 1, 2, 2], // Lijn 8
    [2, 2, 1, 0, 0], // Lijn 9
    [1, 0, 1, 0, 1]  // Lijn 10
];

const REEL_COUNT = 5;
const ROW_COUNT = 3;
let currentBet = 0.50;
let isSpinning = false;
let gridData = []; // Hierin slaan we op welke symbolen er liggen (voor de wiskunde)

// --- INIT ---
function initSlots() {
    // 1. Maak het grid aan (5 kolommen)
    const grid = document.getElementById('slot-grid');
    if(!grid) return;
    grid.innerHTML = '';

    for(let i=0; i<REEL_COUNT; i++) {
        const reel = document.createElement('div');
        reel.className = 'slot-reel';
        reel.id = `reel-${i}`;
        
        // Vul elke rol met 3 willekeurige symbolen om te beginnen
        for(let j=0; j<ROW_COUNT; j++) {
            const symbol = getRandomSymbol();
            const el = document.createElement('div');
            el.className = 'slot-symbol';
            el.innerHTML = symbol.icon; // Hier wordt de Emoji of Plaatje getoond
            reel.appendChild(el);
        }
        grid.appendChild(reel);
    }
    updateSlotUI();
}

// --- CORE FUNCTIES ---

function adjustSlotBet(amount) {
    if(isSpinning) return;
    currentBet += amount;
    if(currentBet < 0.10) currentBet = 0.10;
    updateSlotUI();
}

function updateSlotUI() {
    const balanceEl = document.getElementById('slot-balance-display');
    const betEl = document.getElementById('slot-bet-amount');
    if(balanceEl) balanceEl.innerText = parseFloat(localStorage.getItem('seksman_balance') || 100).toFixed(2);
    if(betEl) betEl.innerText = currentBet.toFixed(2);
}

function getRandomSymbol() {
    // Simpele randomizer (straks kunnen we gewichten toevoegen)
    const idx = Math.floor(Math.random() * SLOT_SYMBOLS.length);
    return SLOT_SYMBOLS[idx];
}

/* games/slots.js - Update voor spinReel en spinSlots */

/* --- games/slots.js FIX VOOR DESYNC --- */

async function spinSlots() {
    if(isSpinning) return;
    if(!deductBalance(currentBet)) return; 

    isSpinning = true;
    document.getElementById('btn-spin').disabled = true;
    document.getElementById('slot-status').innerText = "Rollen...";
    
    // 1. Reset visuele effecten
    document.getElementById('slot-paylines').innerHTML = ''; 
    const winners = document.querySelectorAll('.winner');
    winners.forEach(w => w.classList.remove('winner'));
    const overlay = document.querySelector('.win-overlay-text');
    if(overlay) overlay.remove();

    // 2. BEPAAL NU AL DE UITSLAG (The Truth)
    // We maken een grid van 5 kolommen x 3 rijen
    gridData = [];
    for(let col=0; col<REEL_COUNT; col++) {
        const colSymbols = [];
        for(let row=0; row<ROW_COUNT; row++) {
            colSymbols.push(getRandomSymbol());
        }
        gridData.push(colSymbols);
    }

    // 3. START DE SHOW (Animatie)
    // We geven aan elke rol mee wat de eindbestemming (targetSymbols) moet zijn
    const spinPromises = [];
    for(let i=0; i<REEL_COUNT; i++) {
        const delay = i * 150; 
        // We sturen de kolom uit ons vooraf bepaalde grid mee
        spinPromises.push(spinReel(i, delay, gridData[i]));
    }

    await Promise.all(spinPromises);
    
    // 4. CHECK WINST (Op basis van de vooraf bepaalde data)
    const winResult = checkWins();
    
    if(winResult > 0) {
        document.getElementById('slot-status').innerText = `GEWONNEN! +${winResult.toFixed(2)} SC`;
        addBalance(winResult);
        // Geluidje kan hier
    } else {
        document.getElementById('slot-status').innerText = "Helaas, probeer het nog eens.";
    }
    
    isSpinning = false;
    document.getElementById('btn-spin').disabled = false;
    updateSlotUI();
}

function spinReel(reelIndex, delay, targetSymbols) {
    return new Promise(resolve => {
        const reel = document.getElementById(`reel-${reelIndex}`);
        let spins = 0;
        // Aantal 'nep' spins voordat hij landt
        const maxSpins = 12 + (reelIndex * 4); 
        
        setTimeout(() => {
            const interval = setInterval(() => {
                spins++;
                
                // STAP A: Gooi de oude HTML weg
                reel.innerHTML = '';
                
                // STAP B: Wat laten we zien?
                if(spins < maxSpins) {
                    // Zolang we draaien: toon willekeurige onzin (Blurry effect)
                    for(let j=0; j<ROW_COUNT; j++) {
                        const randomSym = getRandomSymbol();
                        const el = document.createElement('div');
                        el.className = 'slot-symbol';
                        el.style.filter = 'blur(2px)'; // Snelheidseffect!
                        el.innerHTML = randomSym.icon;
                        reel.appendChild(el);
                    }
                } else {
                    // STAP C: HET EINDE! Toon de vooraf bepaalde symbolen
                    clearInterval(interval);
                    
                    for(let j=0; j<ROW_COUNT; j++) {
                        const finalSym = targetSymbols[j]; // Dit is de ECHTE uitslag
                        const el = document.createElement('div');
                        el.className = 'slot-symbol';
                        el.style.filter = 'none'; // Scherp beeld
                        el.innerHTML = finalSym.icon;
                        reel.appendChild(el);
                    }
                    resolve(); 
                }
            }, 80); 
        }, delay);
    });
}

// Starten bij laden
// Zorg dat je dit aanroept als je naar de view switcht!
// Voeg toe aan window.onload in main.js of roep het hier aan:
// initSlots();

/* --- WIN LOGICA --- */

function checkWins() {
    let totalWin = 0;
    const gridEl = document.getElementById('slot-grid');
    
    // 1. Verwijder oude win-effecten
    const oldWinners = gridEl.querySelectorAll('.winner');
    oldWinners.forEach(el => el.classList.remove('winner'));
    const oldText = document.querySelector('.win-overlay-text');
    if(oldText) oldText.remove();

    // 2. Loop door alle 10 winlijnen
    PAYLINES.forEach((line, lineIndex) => {
        // Haal de symbolen op voor deze lijn
        // line is bijv: [1, 1, 1, 1, 1] (Middelste rij)
        
        // We bouwen een lijstje van wat er op deze lijn ligt
        const lineSymbols = [];
        for(let col=0; col<5; col++) {
            const row = line[col];
            lineSymbols.push(gridData[col][row]); // gridData[kolom][rij]
        }

        // 3. Check voor match van links naar rechts
        let matchCount = 1;
        let matchSymbol = lineSymbols[0]; // We beginnen met het eerste symbool
        let isWildChain = true; // Houden we bij of we nog in een reeks boeken zitten

        // Als de eerste een Boek is, is het nog 'onbepaald' (wild), tenzij alles boek is
        if(matchSymbol.id === 'BOOK') {
            isWildChain = true; 
        } else {
            isWildChain = false;
        }

        for(let i=1; i<5; i++) {
            const nextSymbol = lineSymbols[i];

            // A. Is het volgende symbool identiek?
            if (nextSymbol.id === matchSymbol.id) {
                matchCount++;
            } 
            // B. Is het volgende symbool een Wild (Boek)? -> Telt altijd mee!
            else if (nextSymbol.id === 'BOOK') {
                matchCount++;
            }
            // C. Was onze huidige reeks alleen maar Wilds, en komen we nu een ander symbool tegen?
            // Voorbeeld: BOOK - BOOK - K ... Dit moet tellen als 3x K.
            else if (matchSymbol.id === 'BOOK' && isWildChain) {
                matchSymbol = nextSymbol; // Verander onze 'focus' naar K
                matchCount++;
                isWildChain = false; // Vanaf nu zoeken we specifiek naar K
            }
            // D. Geen match? Stop met tellen.
            else {
                break;
            }
        }

        // 4. Hebben we genoeg matches voor een prijs?
        // We kijken in de config bij payout (bijv. matchSymbol.payout[3])
        if(matchSymbol.payout && matchSymbol.payout[matchCount]) {
            const multiplier = matchSymbol.payout[matchCount];
            const winAmount = currentBet * multiplier;
            
            totalWin += winAmount;

            // 5. Visueel effect: Markeer de winnende vakjes op deze lijn
            for(let i=0; i<matchCount; i++) {
                const col = i;
                const row = line[col];
                
                // Zoek het juiste HTML element in het grid
                // Het grid heeft 5 kolommen (div.slot-reel). In elke rol zitten 3 div.slot-symbol
                const reel = document.getElementById(`reel-${col}`);
                const symbolEl = reel.children[row];
                symbolEl.classList.add('winner');
            }
            
            console.log(`Lijn ${lineIndex+1}: ${matchCount}x ${matchSymbol.id} = ${winAmount.toFixed(2)}`);
        }
    });

    // 6. Als er grote winst is, toon dat groots in beeld
    if(totalWin > 0) {
        const frame = document.querySelector('.slot-frame');
        const overlay = document.createElement('div');
        overlay.className = 'win-overlay-text';
        overlay.innerText = totalWin.toFixed(2);
        frame.appendChild(overlay);
        
        // Haal tekst weg na 2 seconden
        setTimeout(() => overlay.remove(), 2000);
    }

    return totalWin;
}