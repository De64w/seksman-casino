/* games/slots.js - BOOK OF SEKSMAN (LOOPING BONUS AUDIO) */

/* --- 1. CONFIGURATIE --- */
const SLOT_SYMBOLS = [
    { id: '10', weight: 150, icon: '<img src="images/slots/10.png" class="slot-img">', payout: {3: 0.5, 4: 2, 5: 10} }, 
    { id: 'J',  weight: 150, icon: '<img src="images/slots/J.png" class="slot-img">', payout: {3: 0.5, 4: 2, 5: 10} },
    { id: 'Q',  weight: 120, icon: '<img src="images/slots/Q.png" class="slot-img">', payout: {3: 0.5, 4: 2, 5: 10} },
    { id: 'K',  weight: 120, icon: '<img src="images/slots/K.png" class="slot-img">', payout: {3: 0.5, 4: 3, 5: 15} },
    { id: 'A',  weight: 120, icon: '<img src="images/slots/A.png" class="slot-img">', payout: {3: 0.5, 4: 3, 5: 15} },
    { id: 'H1', weight: 60, icon: '<img src="images/slots/h1.png" class="slot-img">', payout: {2: 0.5, 3: 3, 4: 10, 5: 75} }, 
    { id: 'H2', weight: 60, icon: '<img src="images/slots/h2.png" class="slot-img">', payout: {2: 0.5, 3: 3, 4: 10, 5: 75} }, 
    { id: 'H3', weight: 40, icon: '<img src="images/slots/h3.png" class="slot-img">', payout: {2: 0.5, 3: 4, 4: 40, 5: 200} }, 
    { id: 'H4', weight: 20, icon: '<img src="images/slots/h4.png" class="slot-img">', payout: {2: 1, 3: 10, 4: 100, 5: 500} }, 
    { id: 'BOOK', weight: 20, icon: '<img src="images/slots/book.png" class="slot-img">', payout: {3: 2, 4: 20, 5: 200} } 
];

const PAYLINES = [
    [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], 
    [0, 1, 2, 1, 0], [2, 1, 0, 1, 2], [1, 0, 0, 0, 1], 
    [1, 2, 2, 2, 1], [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 0, 1, 0, 1]
];

const REEL_COUNT = 5;
const ROW_COUNT = 3;
let currentBet = 0.50;
let isSpinning = false;
let gridData = [];

// Bonus Variabelen
let freeSpins = 0;
let totalBonusSpins = 10;
let isInBonus = false;
let specialSymbol = null; 
let bonusSessionTotal = 0; 

/* --- 2. SETUP & UI --- */
function initSlots() {
    const grid = document.getElementById('slot-grid');
    if(!grid) return;
    grid.innerHTML = '';
    for(let i=0; i<REEL_COUNT; i++) {
        const reel = document.createElement('div');
        reel.className = 'slot-reel';
        reel.id = `reel-${i}`;
        for(let j=0; j<ROW_COUNT; j++) {
            const el = document.createElement('div');
            el.className = 'slot-symbol';
            el.innerHTML = getRandomSymbol().icon;
            reel.appendChild(el);
        }
        grid.appendChild(reel);
    }
    updateSlotUI();
}

function updateSlotUI() {
    const balanceEl = document.getElementById('slot-balance-display');
    const betEl = document.getElementById('slot-bet-amount');
    const controlsDiv = document.querySelector('.slot-controls');
    const statusEl = document.getElementById('slot-status');
    const spinBtn = document.getElementById('btn-spin');

    if(balanceEl) balanceEl.innerText = parseFloat(localStorage.getItem('seksman_balance') || 100).toFixed(2);
    if(betEl) betEl.innerText = currentBet.toFixed(2);

    if(isInBonus) {
        if(controlsDiv) controlsDiv.classList.add('hidden-visually');
        const currentSpinNum = Math.min((totalBonusSpins - freeSpins) + 1, totalBonusSpins);
        const smallIcon = specialSymbol ? specialSymbol.icon.replace('class="slot-img"', 'style="width:25px; vertical-align:middle;"') : '?';
        if(statusEl) {
            statusEl.innerHTML = `<span style="color:#ffd700;">BONUS SPIN ${currentSpinNum} / ${totalBonusSpins}</span> &nbsp;|&nbsp; Speciaal: ${smallIcon} &nbsp;|&nbsp; Winst: ${bonusSessionTotal.toFixed(2)}`;
        }
    } else {
        if(controlsDiv) controlsDiv.classList.remove('hidden-visually');
        if(statusEl && !isSpinning && !statusEl.innerText.includes('GEWONNEN')) {
            statusEl.innerText = "Druk op SPIN om te beginnen!";
        }
        if(spinBtn) spinBtn.disabled = isSpinning;
    }
}

function adjustSlotBet(amount) {
    if(isSpinning || isInBonus) return;
    currentBet += amount;
    if(currentBet < 0.10) currentBet = 0.10;
    updateSlotUI();
}

function getRandomSymbol() {
    let totalWeight = 0;
    SLOT_SYMBOLS.forEach(s => totalWeight += s.weight);
    let random = Math.random() * totalWeight;
    for(let symbol of SLOT_SYMBOLS) {
        if(random < symbol.weight) return symbol;
        random -= symbol.weight;
    }
    return SLOT_SYMBOLS[0];
}

function forceTriggerBonus() {
    if(isSpinning || isInBonus) return;
    triggerBonusReveal();
}

/* --- 3. SPIN LOGICA --- */
async function spinSlots() {
    if(!isInBonus) {
        if(isSpinning) return;
        if(!deductBalance(currentBet)) return;
    } else {
        freeSpins--;
    }

    isSpinning = true;
    updateSlotUI();
    
    if(!isInBonus) document.getElementById('slot-status').innerText = "Rollen...";
    
    document.getElementById('slot-paylines').innerHTML = '';
    document.querySelectorAll('.winner').forEach(w => w.classList.remove('winner'));
    const overlay = document.querySelector('.win-overlay-text');
    if(overlay) overlay.remove();

    gridData = [];
    for(let col=0; col<REEL_COUNT; col++) {
        const colSymbols = [];
        for(let row=0; row<ROW_COUNT; row++) {
            colSymbols.push(getRandomSymbol());
        }
        gridData.push(colSymbols);
    }

    const spinPromises = [];
    for(let i=0; i<REEL_COUNT; i++) {
        const delay = i * 150;
        spinPromises.push(spinReel(i, delay, gridData[i]));
    }
    await Promise.all(spinPromises);

    let spinWin = checkWins();

    if(isInBonus && specialSymbol) {
        const expandWin = checkExpandingWins();
        if(expandWin > 0) {
            await new Promise(r => setTimeout(r, 600));
            spinWin += expandWin;
            if(typeof playSound === 'function') playSound('win');
            
            document.getElementById('slot-status').innerHTML = `<span style="color:#ffd700;">✨ EXPANDING WINST! +${expandWin.toFixed(2)} ✨</span>`;
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    if(spinWin > 0) {
        const winMsg = `GEWONNEN! +${spinWin.toFixed(2)} SC`;
        document.getElementById('slot-status').innerText = winMsg;
        addBalance(spinWin);
        
        if(typeof playSound === 'function') playSound('win');
        
        if(isInBonus) bonusSessionTotal += spinWin;
    } else if (!isInBonus) {
        document.getElementById('slot-status').innerText = "Helaas, probeer het nog eens.";
    }

    if(isInBonus && freeSpins <= 0) {
        await new Promise(r => setTimeout(r, 1500));
        showBonusSummary();
    }

    isSpinning = false;
    if(!isInBonus) document.getElementById('btn-spin').disabled = false;
}

function spinReel(reelIndex, delay, targetSymbols) {
    return new Promise(resolve => {
        const reel = document.getElementById(`reel-${reelIndex}`);
        let spins = 0;
        const maxSpins = 12 + (reelIndex * 4);
        setTimeout(() => {
            const interval = setInterval(() => {
                spins++;
                reel.innerHTML = '';
                if(spins < maxSpins) {
                    for(let j=0; j<ROW_COUNT; j++) {
                        const el = document.createElement('div');
                        el.className = 'slot-symbol';
                        el.style.filter = 'blur(2px)';
                        el.innerHTML = getRandomSymbol().icon;
                        reel.appendChild(el);
                    }
                } else {
                    clearInterval(interval);
                    for(let j=0; j<ROW_COUNT; j++) {
                        const el = document.createElement('div');
                        el.className = 'slot-symbol';
                        el.style.filter = 'none';
                        el.innerHTML = targetSymbols[j].icon;
                        reel.appendChild(el);
                    }
                    resolve();
                }
            }, 60);
        }, delay);
    });
}

function checkWins() {
    let totalWin = 0;
    let bookCount = 0;
    for(let c=0; c<5; c++) {
        for(let r=0; r<3; r++) {
            if(gridData[c][r].id === 'BOOK') bookCount++;
        }
    }

    if(bookCount >= 3) {
        if(!isInBonus) {
            // Normaal spel -> Bonus Trigger
            setTimeout(() => triggerBonusReveal(), 500);
        } else {
            // Retrigger -> GEEN EXTRA MUZIEK STARTEN (Hij loopt al!)
            // We spelen alleen een 'win' geluidje voor het effect
            if(typeof playSound === 'function') playSound('win');

            freeSpins += 10;
            totalBonusSpins += 10;
            updateSlotUI();
            const status = document.getElementById('slot-status');
            status.innerHTML += " <span style='color:#00e701'>+10 RETRIGGER!</span>";
        }
    }

    PAYLINES.forEach((line) => {
        const lineSymbols = [];
        for(let col=0; col<5; col++) lineSymbols.push(gridData[col][line[col]]);
        let matchCount = 1;
        let matchSymbol = lineSymbols[0];
        let isWildChain = (matchSymbol.id === 'BOOK');
        for(let i=1; i<5; i++) {
            const next = lineSymbols[i];
            if(next.id === matchSymbol.id) matchCount++;
            else if(next.id === 'BOOK') matchCount++;
            else if(matchSymbol.id === 'BOOK' && isWildChain) {
                matchSymbol = next; matchCount++; isWildChain = false;
            } else break;
        }
        if(matchSymbol.payout && matchSymbol.payout[matchCount]) {
            totalWin += currentBet * matchSymbol.payout[matchCount];
            for(let i=0; i<matchCount; i++) {
                const reel = document.getElementById(`reel-${i}`);
                if(reel && reel.children[line[i]]) reel.children[line[i]].classList.add('winner');
            }
        }
    });
    
    if(totalWin > 0) {
        const frame = document.querySelector('.slot-frame');
        const overlay = document.createElement('div');
        overlay.className = 'win-overlay-text';
        overlay.innerText = totalWin.toFixed(2);
        frame.appendChild(overlay);
        setTimeout(() => overlay.remove(), 2000);
    }
    return totalWin;
}

function checkExpandingWins() {
    if(!specialSymbol) return 0;
    let reelsWithSymbol = 0;
    let colsToExpand = [];
    for(let col=0; col<REEL_COUNT; col++) {
        let hasSymbol = false;
        for(let row=0; row<ROW_COUNT; row++) {
            if(gridData[col][row].id === specialSymbol.id) hasSymbol = true;
        }
        if(hasSymbol) { reelsWithSymbol++; colsToExpand.push(col); }
    }
    if(specialSymbol.payout[reelsWithSymbol]) {
        colsToExpand.forEach(colIdx => {
            const reel = document.getElementById(`reel-${colIdx}`);
            for(let r=0; r<3; r++) {
                reel.children[r].innerHTML = specialSymbol.icon;
                reel.children[r].classList.add('winner');
                reel.children[r].style.boxShadow = "0 0 20px #ffd700";
                const img = reel.children[r].querySelector('img');
                if(img) img.style.transform = "scale(1.1)";
            }
        });
        return (currentBet * specialSymbol.payout[reelsWithSymbol]) * 10;
    }
    return 0;
}

function triggerBonusReveal() {
    // START MUZIEK HIER!
    if(typeof startBonusMusic === 'function') startBonusMusic();

    const overlay = document.getElementById('bonus-reveal-overlay');
    const iconContainer = document.getElementById('book-reveal-icon');
    const startBtn = document.getElementById('btn-start-bonus');
    overlay.classList.remove('hidden');
    overlay.classList.add('active');
    startBtn.classList.add('hidden');
    iconContainer.className = 'reveal-icon scrolling-symbol';

    let possible = SLOT_SYMBOLS.filter(s => s.id !== 'BOOK');
    specialSymbol = possible[Math.floor(Math.random() * possible.length)];
    
    let counter = 0;
    const interval = setInterval(() => {
        counter++;
        iconContainer.innerHTML = possible[Math.floor(Math.random() * possible.length)].icon;
        
        if(typeof playSound === 'function') playSound('click');

        if(counter >= 20) {
            clearInterval(interval);
            iconContainer.className = 'reveal-icon chosen-symbol-effect';
            iconContainer.innerHTML = specialSymbol.icon;
            
            if(typeof playSound === 'function') playSound('win');

            setTimeout(() => {
                startBtn.classList.remove('hidden');
                startBtn.innerText = "START AUTO SPINS";
            }, 500);
        }
    }, 80);
}

async function startFreeSpinsSession() {
    const overlay = document.getElementById('bonus-reveal-overlay');
    overlay.classList.remove('active');
    setTimeout(() => overlay.classList.add('hidden'), 500);
    
    isInBonus = true;
    freeSpins = 10;
    totalBonusSpins = 10;
    bonusSessionTotal = 0;
    
    updateSlotUI();
    document.querySelector('.slot-machine-container').style.boxShadow = "0 0 50px #ff0000"; 
    
    await autoPlayBonus();
}

async function autoPlayBonus() {
    await new Promise(r => setTimeout(r, 1000));
    while(freeSpins > 0 && isInBonus) {
        await spinSlots();
        await new Promise(r => setTimeout(r, 1500));
    }
}

function showBonusSummary() {
    const overlay = document.getElementById('bonus-end-overlay');
    const winDisplay = document.getElementById('bonus-total-win-display');
    if(winDisplay) winDisplay.innerText = bonusSessionTotal.toFixed(2) + " SC";
    overlay.classList.remove('hidden');
    setTimeout(() => overlay.classList.add('active'), 50);
}

function claimBonusWins() {
    // STOP MUZIEK HIER!
    if(typeof stopBonusMusic === 'function') stopBonusMusic();

    const overlay = document.getElementById('bonus-end-overlay');
    overlay.classList.remove('active');
    setTimeout(() => overlay.classList.add('hidden'), 500);
    isInBonus = false;
    specialSymbol = null;
    document.querySelector('.slot-machine-container').style.boxShadow = "0 0 30px rgba(212, 175, 55, 0.2)"; 
    updateSlotUI();
}