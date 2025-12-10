/* games/crash.js */

// State
let crashGame = {
    running: false,
    crashed: false,
    cashedOut: false,
    bet: 0,
    startTime: 0,
    crashPoint: 0,
    currentMultiplier: 1.00,
    animationFrame: null,
    history: []
};

// Canvas Settings
const canvas = document.getElementById('crash-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

// --- INITIALIZATION ---

// Zorg dat canvas scherp is op retina schermen
function resizeCrashCanvas() {
    if(!canvas) return;
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = 400; // Hoogte zoals in CSS
}
window.addEventListener('resize', resizeCrashCanvas);
// Roep eenmalig aan bij laden
setTimeout(resizeCrashCanvas, 100);

// Helper Inputs
function crashSetBet(multiplier) {
    const input = document.getElementById('crash-bet');
    let val = parseFloat(input.value);
    if (isNaN(val)) val = 0;
    
    if (multiplier === 0.5) val = val / 2;
    if (multiplier === 2) val = val * 2;
    
    input.value = parseFloat(val.toFixed(2));
}

// --- GAME LOGIC ---

function crashAction() {
    if (crashGame.running) {
        // Spel is bezig -> Cashout proberen
        if (!crashGame.crashed && !crashGame.cashedOut) {
            doCashout();
        }
    } else {
        // Spel staat stil -> Starten
        startCrashRound();
    }
}

function startCrashRound() {
    const betInput = document.getElementById('crash-bet');
    const autoInput = document.getElementById('crash-auto');
    const amount = parseFloat(betInput.value);
    
    // Validatie
    if (isNaN(amount) || amount <= 0) {
        alert("Ongeldige inzet.");
        return;
    }
    if (!deductBalance(amount)) return; // Check saldo in main.js

    // Reset State
    crashGame.running = true;
    crashGame.crashed = false;
    crashGame.cashedOut = false;
    crashGame.bet = amount;
    crashGame.currentMultiplier = 1.00;
    
    // Bepaal Crash Point (Gewogen Random Logica)
    // 1% huisvoordeel zit verwerkt in de kans dat hij direct op 1.00 crasht
    // Formule: 0.99 / (1 - random)
    const houseEdge = 0.99; // 1%
    const r = Math.random();
    crashGame.crashPoint = Math.max(1.00, Math.floor((houseEdge / (1 - r)) * 100) / 100);
    
    // UI Updates
    document.getElementById('crash-action-btn').innerText = "Cashout";
    document.getElementById('crash-action-btn').style.backgroundColor = "#ffae00"; // Oranje
    document.getElementById('crash-action-btn').style.color = "#000";
    document.getElementById('crash-current-multiplier').classList.remove('text-crashed', 'text-cashed');
    document.getElementById('crash-current-multiplier').style.color = "white";
    document.getElementById('crash-status-text').innerText = "Raket stijgt...";
    
    // Disable inputs
    betInput.disabled = true;
    
    // Start Loop
    crashGame.startTime = Date.now();
    crashGame.animationFrame = requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (!crashGame.running) return;

    const now = Date.now();
    const timeElapsed = (now - crashGame.startTime) / 1000; // seconden

    // Groei Formule (Exponentieel)
    // Dit zorgt voor het langzame begin en de versnelling
    crashGame.currentMultiplier = 1.00 + Math.pow(timeElapsed, 2) * 0.1;
    
    // Check Auto Cashout
    const autoVal = parseFloat(document.getElementById('crash-auto').value);
    if (!crashGame.cashedOut && !isNaN(autoVal) && crashGame.currentMultiplier >= autoVal) {
        doCashout();
    }

    // Check Crash
    if (crashGame.currentMultiplier >= crashGame.crashPoint) {
        triggerCrash();
        return; // Stop loop
    }

    // Update UI Cijfers
    document.getElementById('crash-current-multiplier').innerText = crashGame.currentMultiplier.toFixed(2) + 'x';
    
    if (!crashGame.cashedOut) {
        const potentialWin = crashGame.bet * crashGame.currentMultiplier;
        document.getElementById('crash-potential-win').innerText = potentialWin.toFixed(2) + " SC";
        // Button text update
        document.getElementById('crash-action-btn').innerText = "Cashout (" + potentialWin.toFixed(2) + ")";
    }

    // Draw Frame
    drawCrashGraph();
    
    crashGame.animationFrame = requestAnimationFrame(gameLoop);
}

function doCashout() {
    crashGame.cashedOut = true;
    
    const winAmount = crashGame.bet * crashGame.currentMultiplier;
    addBalance(winAmount); // main.js
    
    // UI Feedback
    const btn = document.getElementById('crash-action-btn');
    btn.innerText = "Gecashd!";
    btn.disabled = true;
    btn.style.backgroundColor = "#2f4553"; // Grijs
    btn.style.color = "#fff";
    
    document.getElementById('crash-current-multiplier').classList.add('text-cashed');
    document.getElementById('crash-status-text').innerText = `Gewonnen: ${winAmount.toFixed(2)} SC`;
}

function triggerCrash() {
    crashGame.running = false;
    crashGame.crashed = true;
    cancelAnimationFrame(crashGame.animationFrame);

    // Zet multiplier precies op crash point
    document.getElementById('crash-current-multiplier').innerText = crashGame.crashPoint.toFixed(2) + 'x';
    document.getElementById('crash-current-multiplier').classList.add('text-crashed');
    document.getElementById('crash-status-text').innerText = "CRASHED!";

    // Reset Button
    const btn = document.getElementById('crash-action-btn');
    btn.innerText = "Start Ronde";
    btn.disabled = false;
    btn.style.backgroundColor = ""; // Reset naar class
    btn.style.color = "";
    btn.classList.replace('btn-secondary', 'btn-primary');

    // Enable inputs
    document.getElementById('crash-bet').disabled = false;

    // Teken de laatste frame (met explosie)
    drawCrashGraph();
    
    // Update History
    addToHistory(crashGame.crashPoint);
}

function addToHistory(val) {
    crashGame.history.unshift(val); // Nieuwste vooraan
    if(crashGame.history.length > 10) crashGame.history.pop();
    
    const container = document.getElementById('crash-history');
    container.innerHTML = '';
    
    crashGame.history.forEach(mult => {
        const span = document.createElement('span');
        span.classList.add('history-badge');
        span.innerText = mult.toFixed(2) + 'x';
        
        if(mult < 2) span.classList.add('loss');
        else if(mult >= 10) span.classList.add('moon');
        else span.classList.add('win');
        
        container.appendChild(span);
    });
}

// --- CANVAS DRAWING ---

function drawCrashGraph() {
    if (!ctx || !canvas) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // 1. Clear Canvas
    ctx.clearRect(0, 0, width, height);
    
    // 2. Bepaal schaal (Zoom out effect)
    // We willen dat de raket altijd op ongeveer 80% van de breedte en hoogte zit
    // Tenzij multiplier < 2, dan vaste schaal
    let maxGraphY = Math.max(2, crashGame.currentMultiplier * 1.5);
    let maxGraphX = 10; // Seconden basis

    // 3. Teken Grid (Optioneel, maakt het profi)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Horizontale lijnen
    for(let i=1; i<5; i++) {
        let y = height - (i * (height/5));
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }
    ctx.stroke();

    // 4. Teken de Curve
    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = crashGame.crashed ? "#ff4444" : "#00e701"; // Rood als crashed, anders groen
    
    // Startpunt (linksonder)
    ctx.moveTo(0, height);

    // Teken curve op basis van tijd
    // Dit is een simpele visualisatie, niet wiskundig exact de grafiek van de multiplier,
    // maar een bezier curve die er goed uitziet.
    
    // Eindpunt berekenen (Raket positie)
    // We animeren X van 0 naar 80% breedte
    // We animeren Y van onder naar 80% hoogte
    
    // Progressie factor (0 tot 1)
    // In de eerste paar seconden bouwt dit op.
    let progress = Math.min(1, (crashGame.currentMultiplier - 1) / 5); // Na 5x zit hij "vast" in de hoek
    if (crashGame.currentMultiplier > 2) progress = 1; // Sneller "locken"
    
    // Dynamische posities
    let rocketX = width * 0.8; // Raket blijft rechts hangen bij hoge getallen
    let rocketY = height - (height * 0.8); 
    
    // Als we nog laag zijn (onder 2x), beweeg de raket echt
    if (crashGame.currentMultiplier < 2) {
        rocketX = (crashGame.currentMultiplier - 1) * width * 0.8;
        rocketY = height - ((crashGame.currentMultiplier - 1) * height * 0.8);
    }

    // Kwadratische curve naar de raket
    ctx.quadraticCurveTo(rocketX * 0.5, height, rocketX, rocketY);
    ctx.stroke();

    // 5. Teken de Raket (Emoji)
    ctx.save();
    ctx.translate(rocketX, rocketY);
    
    // Rotatie berekenen (hoek van de grafiek)
    let angle = -45 * (Math.PI / 180); // Standaard 45 graden omhoog
    if (crashGame.crashed) angle = 45 * (Math.PI / 180); // Naar beneden vallen
    
    ctx.rotate(angle);
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🚀", 0, 0);
    
    // Als gecrasht, teken explosie
    if(crashGame.crashed) {
         ctx.fillText("💥", 0, 0);
    }
    
    ctx.restore();
}

// Start resize bij laden
resizeCrashCanvas();