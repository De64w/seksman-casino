/* games/mines.js */

// State variabelen
let minesGame = {
    active: false,
    bet: 0,
    minesCount: 3,
    minesLocations: [], 
    revealedCount: 0,
    currentMultiplier: 1.00
};

// --- INIT ---

// Deze functie wordt direct aangeroepen om de dropdown te vullen en het grid te maken
function initMines() {
    initMinesControls();
    initMinesGrid();
    minesUpdateNextMultiplier();
}

function initMinesControls() {
    const select = document.getElementById('mines-count');
    if(!select) return;
    
    select.innerHTML = ''; 

    for (let i = 1; i <= 24; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.text = i + (i === 1 ? ' Mijn' : ' Mijnen');
        if (i === 3) option.selected = true; // Standaard op 3 zoals Stake
        select.appendChild(option);
    }
}

function initMinesGrid() {
    const grid = document.getElementById('mines-grid');
    if(!grid) return;
    
    grid.innerHTML = '';
    
    for (let i = 0; i < 25; i++) {
        const tile = document.createElement('div');
        tile.classList.add('mine-tile');
        tile.id = `tile-${i}`;
        tile.onclick = () => minesClickTile(i);
        grid.appendChild(tile);
    }
}

// --- CORE MATH (De Stake Formule) ---

// Berekent de multiplier exact volgens jouw tabel (1% House Edge)
function getMultiplier(mines, diamondsFound) {
    let multiplier = 0.99; // House Edge startwaarde
    
    // De kansberekening:
    // Voor elke diamant die je vindt, vermenigvuldig je de kans.
    // Formule: (Totaal over / Veilig over)
    
    for (let i = 0; i < diamondsFound; i++) {
        const tilesLeft = 25 - i;
        const safeLeft = 25 - mines - i;
        multiplier *= (tilesLeft / safeLeft);
    }
    
    // Afronden op 2 decimalen naar beneden (floor) zoals casino's vaak doen
    // Of gewoon fixed. Uit jouw tabel blijkt x.xx formaat.
    return Math.floor(multiplier * 100) / 100;
}

// Helper: Voorspel wat de volgende klik oplevert
function getNextMultiplierVal() {
    const mines = parseInt(document.getElementById('mines-count').value);
    // Als spel actief is: kijk naar *volgende* diamant. 
    // Als spel niet actief is: kijk naar de *eerste* diamant.
    const nextCount = minesGame.active ? (minesGame.revealedCount + 1) : 1;
    
    return getMultiplier(mines, nextCount);
}

// --- UI UPDATES ---

function minesSetBet(multiplier) {
    const input = document.getElementById('mines-bet');
    let val = parseFloat(input.value);
    if (isNaN(val)) val = 0;
    
    if (multiplier === 0.5) val = val / 2;
    if (multiplier === 2) val = val * 2;
    
    input.value = parseFloat(val.toFixed(2));
}

function minesUpdateNextMultiplier() {
    const nextVal = getNextMultiplierVal();
    const el = document.getElementById('mines-next-mult');
    if(el) el.innerText = nextVal.toFixed(2) + 'x';
}

// --- GAMEPLAY ---

function minesAction() {
    if (minesGame.active) {
        minesCashout();
    } else {
        minesStartGame();
    }
}

function minesStartGame() {
    const betInput = document.getElementById('mines-bet');
    const minesInput = document.getElementById('mines-count');
    
    const betAmount = parseFloat(betInput.value);
    const mCount = parseInt(minesInput.value);

    if (isNaN(betAmount) || betAmount <= 0) {
        alert("Ongeldige inzet!");
        return;
    }
    if (!deductBalance(betAmount)) {
        return; 
    }

    // Reset State
    minesGame.active = true;
    minesGame.bet = betAmount;
    minesGame.minesCount = mCount;
    minesGame.revealedCount = 0;
    minesGame.currentMultiplier = 1.00;
    minesGame.minesLocations = [];

    // Genereer Mijnen
    const positions = Array.from({length: 25}, (_, i) => i);
    for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    minesGame.minesLocations = positions.slice(0, minesGame.minesCount);

    // UI Reset
    initMinesGrid(); 
    
    const btn = document.getElementById('mines-action-btn');
    btn.innerHTML = "Cashout <span id='cashout-val'>" + betAmount.toFixed(2) + "</span> SC";
    btn.classList.replace('btn-primary', 'btn-secondary'); 
    btn.style.backgroundColor = '#ffae00'; 
    btn.style.color = '#000';
    
    // Disable inputs
    document.getElementById('mines-bet').disabled = true;
    document.getElementById('mines-count').disabled = true;
    document.getElementById('mines-profit').innerText = "0.00";
    
    minesUpdateNextMultiplier();
}

function minesClickTile(index) {
    if (!minesGame.active) return;
    
    const tile = document.getElementById(`tile-${index}`);
    if (tile.classList.contains('revealed')) return;

    // 1. BOM
    if (minesGame.minesLocations.includes(index)) {
        minesGameOver(index); 
    } else {
        // 2. DIAMANT
        tile.classList.add('revealed', 'gem', 'icon-gem');
        minesGame.revealedCount++;
        
        // Bereken nieuwe multiplier
        minesGame.currentMultiplier = getMultiplier(minesGame.minesCount, minesGame.revealedCount);
        
        // Update UI
        const currentWin = minesGame.bet * minesGame.currentMultiplier;
        const profit = currentWin - minesGame.bet;
        
        document.getElementById('mines-profit').innerText = profit.toFixed(2);
        document.getElementById('cashout-val').innerText = currentWin.toFixed(2);
        
        // Check of we max hebben bereikt (alle veilige vakjes open)
        const safeTilesTotal = 25 - minesGame.minesCount;
        if (minesGame.revealedCount >= safeTilesTotal) {
            minesCashout(); // Auto win
        } else {
            minesUpdateNextMultiplier();
        }
    }
}

function minesCashout() {
    if(!minesGame.active) return;

    const winAmount = minesGame.bet * minesGame.currentMultiplier;
    addBalance(winAmount);
    
    minesEndGame(true);
}

function minesGameOver(hitIndex) {
    const tile = document.getElementById(`tile-${hitIndex}`);
    tile.classList.add('revealed', 'boom', 'icon-bomb');
    minesEndGame(false);
}

function minesEndGame(win) {
    minesGame.active = false;
    
    // Onthul alles
    minesGame.minesLocations.forEach(idx => {
        const tile = document.getElementById(`tile-${idx}`);
        if (!tile.classList.contains('revealed')) {
            tile.classList.add('revealed', 'icon-bomb');
            tile.style.opacity = "0.7";
        }
    });

    for(let i=0; i<25; i++) {
        const tile = document.getElementById(`tile-${i}`);
        tile.classList.add('revealed'); 
        if(!tile.classList.contains('icon-bomb') && !tile.classList.contains('icon-gem')) {
            tile.style.opacity = "0.3"; 
        }
    }

    // Reset Button
    const btn = document.getElementById('mines-action-btn');
    btn.innerText = "Start Spel";
    btn.style.backgroundColor = ""; 
    btn.style.color = "";
    btn.classList.replace('btn-secondary', 'btn-primary');

    // Enable inputs
    document.getElementById('mines-bet').disabled = false;
    document.getElementById('mines-count').disabled = false;
    
    // Reset next multiplier view
    minesUpdateNextMultiplier();
}

// Start alles op
initMines();