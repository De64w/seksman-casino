/* games/plinko.js */

// State
let plinkoGame = {
    active: false, // Wordt true zolang er ballen rollen
    bet: 0,
    risk: 'medium',
    rows: 16,
    balls: [],
    particles: [],
    lastTime: 0
};

// Canvas
const pCanvas = document.getElementById('plinko-canvas');
const pCtx = pCanvas ? pCanvas.getContext('2d') : null;

// Kleuren
const COLORS = {
    pin: '#ffffff',
    ball: '#ff0044',
    text: '#000000'
};

// --- MULTIPLIER DATA ---
const MULTIPLIERS = {
    low: {
        8:  [5.6, 2.1, 1.1, 1, 0.5],
        10: [8.9, 3, 1.4, 1.1, 1, 0.5],
        12: [10, 3, 1.6, 1.4, 1.1, 1, 0.5],
        14: [7.1, 4, 1.9, 1.4, 1.3, 1.1, 1, 0.5],
        16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5]
    },
    medium: {
        8:  [13, 3, 1.3, 0.7, 0.4],
        10: [22, 5, 2, 1.4, 0.6, 0.4],
        12: [33, 11, 4, 2, 1.1, 0.6, 0.3],
        14: [58, 15, 7, 4, 1.9, 1, 0.5, 0.2],
        16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3]
    },
    high: {
        8:  [29, 4, 1.5, 0.3, 0.2],
        10: [76, 10, 3, 0.9, 0.3, 0.2],
        12: [170, 24, 8.1, 2, 0.7, 0.2, 0.2],
        14: [420, 56, 18, 5, 1.9, 0.3, 0.2, 0.2],
        16: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2]
    }
};

// --- INIT & HELPERS ---

function initPlinko() {
    resizePlinkoCanvas();
    plinkoUpdateUI();
    requestAnimationFrame(plinkoLoop);
}

function resizePlinkoCanvas() {
    if(!pCanvas) return;
    pCanvas.width = 800;
    pCanvas.height = 600; 
}

function plinkoSetBet(multiplier) {
    const input = document.getElementById('plinko-bet');
    let val = parseFloat(input.value) || 0;
    if (multiplier === 0.5) val /= 2;
    if (multiplier === 2) val *= 2;
    input.value = val.toFixed(2);
}

function plinkoUpdateUI() {
    // Check of inputs disabled moeten zijn (als er ballen rollen)
    const isBusy = plinkoGame.balls.length > 0;
    
    const riskSelect = document.getElementById('plinko-risk');
    const rowsSelect = document.getElementById('plinko-rows');
    
    // Alleen updaten als we NIET bezig zijn, of als dit de initiele aanroep is
    if (!isBusy) {
        plinkoGame.risk = riskSelect.value;
        plinkoGame.rows = parseInt(rowsSelect.value);
    }
    
    // Disable/Enable controls
    riskSelect.disabled = isBusy;
    rowsSelect.disabled = isBusy;
}

function getBucketColor(val) {
    if(val >= 10) return '#ff4444'; // Rood
    if(val >= 3) return '#ffae00';  // Oranje
    if(val >= 1.5) return '#00e701'; // Groen
    return '#ffc107'; // Geel
}

// --- GAME LOGIC ---

function plinkoDrop() {
    const betInput = document.getElementById('plinko-bet');
    const amount = parseFloat(betInput.value);

    if (isNaN(amount) || amount <= 0) {
        alert("Ongeldige inzet.");
        return;
    }
    if (!deductBalance(amount)) return;

    // Bepaal pad
    let path = [];
    let position = 0;
    for(let i=0; i<plinkoGame.rows; i++) {
        const dir = Math.random() < 0.5 ? 0 : 1;
        if (dir === 1) position++;
        path.push(dir);
    }
    
    plinkoGame.balls.push({
        x: 400,       // Precies in het midden
        y: 20,        // AANPASSING: Start hoger (was 50). Hierdoor valt hij "het scherm in".
        radius: 6,
        vx: 0,        // AANPASSING: Geen horizontale snelheid bij start. Laat hem recht vallen.
        vy: 0,        // Start snelheid verticaal 0 (zwaartekracht pakt hem op)
        currentRow: 0,
        path: path,
        targetBucket: position,
        bet: amount,
        finished: false
    });
    
    plinkoUpdateUI();
}

// --- PHYSICS ENGINE ---

function updatePlinko(dt) {
    const gravity = 800;
    const rows = plinkoGame.rows;
    const startY = 80;
    const bucketsY = 580;
    const totalH = 500;
    const rowH = totalH / rows;
    
    // FIX: Dynamische GAP berekening (hetzelfde als in drawPlinko)
    // We gebruiken de canvas breedte (800) en padding (80 totaal).
    const w = 800;
    const gap = (w - 80) / rows; 
    
    plinkoGame.balls.forEach(ball => {
        if(ball.finished) return;

        // Gravity
        ball.vy += gravity * dt;
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        // --- FIX: Dynamische Onzichtbare Muren ---
        // Bereken progressie (0.0 = top, 1.0 = bodem)
        let progressY = (ball.y - startY) / (bucketsY - startY);
        progressY = Math.max(0, Math.min(1, progressY));

        // De top is altijd het midden (400)
        const centerX = 400;
        
        // De bodem-breedte hangt af van aantal rijen en de gap
        const totalBottomWidth = rows * gap;
        const bottomLeftX = (w - totalBottomWidth) / 2; // Startpunt grid links-onder
        
        // Interpoleer de muur-positie op de huidige hoogte van de bal
        // Als progress 0 is (top), is de muur op 400.
        // Als progress 1 is (bodem), is de muur op bottomLeftX.
        // We voegen een kleine marge toe zodat de bal niet OP de muur plakt, maar er net binnen
        const currentMinX = centerX - (progressY * (centerX - bottomLeftX));
        const currentMaxX = 800 - currentMinX; 

        // Boundary Checks
        if (ball.x < currentMinX + ball.radius) {
             ball.x = currentMinX + ball.radius;
             if(ball.vx < 0) ball.vx *= -0.3; 
        } else if (ball.x > currentMaxX - ball.radius) {
             ball.x = currentMaxX - ball.radius;
             if(ball.vx > 0) ball.vx *= -0.3; 
        }

        // Pin Collision
        const currentRowY = startY + (ball.currentRow * rowH);
        
        if (ball.y > currentRowY && ball.currentRow < rows) {
            ball.y = currentRowY;
            ball.vy *= -0.4; 
            
            const direction = ball.path[ball.currentRow]; 
            const force = (Math.random() * 40) + 120; 
            
            if (direction === 0) {
                ball.vx = -force + (Math.random() * 20); 
            } else {
                ball.vx = force + (Math.random() * 20);
            }
            
            ball.currentRow++;
            spawnParticles(ball.x, ball.y);
        }

        // Check Einde
        if (ball.y > bucketsY && !ball.finished) {
            finishBall(ball);
        }
    });

    // Cleanup finished balls
    plinkoGame.balls = plinkoGame.balls.filter(b => !b.finished);
    
    // Check of we klaar zijn, zo ja: unlock controls
    plinkoUpdateUI();
    
    // Particles update
    plinkoGame.particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        p.alpha -= dt * 2;
    });
    plinkoGame.particles = plinkoGame.particles.filter(p => p.life > 0);
}

function spawnParticles(x, y) {
    for(let i=0; i<3; i++) {
        plinkoGame.particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            life: 0.3,
            alpha: 1,
            color: 'white'
        });
    }
}

function finishBall(ball) {
    ball.finished = true;
    
    const half = MULTIPLIERS[plinkoGame.risk][plinkoGame.rows];
    const center = plinkoGame.rows / 2;
    const dist = Math.abs(ball.targetBucket - center);
    const arrayIndex = (plinkoGame.rows / 2) - dist;
    const safeIndex = Math.floor(Math.max(0, Math.min(half.length-1, arrayIndex)));
    const multiplier = half[safeIndex];
    
    const win = ball.bet * multiplier;
    addBalance(win); 
}

// --- DRAWING ---

function plinkoLoop(timestamp) {
    const dt = (timestamp - plinkoGame.lastTime) / 1000;
    plinkoGame.lastTime = timestamp;
    if(dt < 0.1) updatePlinko(dt);
    drawPlinko();
    requestAnimationFrame(plinkoLoop);
}

function drawPlinko() {
    if(!pCtx) return;
    const w = 800;
    const h = 600;
    pCtx.clearRect(0,0,w,h);
    
    const rows = plinkoGame.rows;
    const startY = 80;
    
    // De Gap berekening is nu identiek aan de physics engine
    const gap = (w - 80) / rows;

    // 1. Pinnen
    pCtx.fillStyle = COLORS.pin;
    for(let r=0; r<=rows; r++) {
        const y = startY + (r * (500 / rows));
        
        // De breedte van deze specifieke rij pinnen
        const totalRowW = r * gap;
        // Centreer deze rij
        const offset = (w - totalRowW) / 2;
        
        if (r < rows) {
            for(let c=0; c<=r; c++) {
                pCtx.beginPath();
                // offset = start links, c * gap = positie van de pin
                pCtx.arc(offset + (c * gap), y, 4, 0, Math.PI*2);
                pCtx.fill();
            }
        }
    }
    
    // 2. Bakjes
    const bucketY = 580;
    const bucketW = gap - 4;
    const half = MULTIPLIERS[plinkoGame.risk][plinkoGame.rows];
    
    for(let i=0; i<=rows; i++) {
        const center = rows / 2;
        const dist = Math.abs(i - center);
        const idx = (rows/2) - dist;
        const safeIdx = Math.floor(Math.max(0, Math.min(half.length-1, idx)));
        const val = half[safeIdx];
        
        // Positie berekening moet exact matchen met pinnen logic
        const totalRowW = rows * gap;
        const offset = (w - totalRowW) / 2;
        // i * gap = positie pin, - (gap/2) centreert bakje TUSSEN pinnen
        const bx = offset + (i * gap) - (gap/2);
        
        pCtx.fillStyle = getBucketColor(val);
        roundRect(pCtx, bx, bucketY - 15, bucketW, 30, 4);
        pCtx.fill();
        
        pCtx.fillStyle = "black";
        pCtx.font = "bold 11px Arial";
        pCtx.textAlign = "center";
        pCtx.textBaseline = "middle";
        // Dynamische font grootte voor als bakjes klein worden (bij 16 rijen)
        const fontSize = Math.min(11, bucketW / 2.5);
        pCtx.font = `bold ${fontSize}px Arial`;
        pCtx.fillText(val + 'x', bx + (bucketW/2), bucketY);
    }
    
    // 3. Balletjes
    plinkoGame.balls.forEach(ball => {
        pCtx.fillStyle = COLORS.ball;
        pCtx.beginPath();
        pCtx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
        pCtx.fill();
    });
    
    // 4. Particles
    plinkoGame.particles.forEach(p => {
        pCtx.globalAlpha = p.alpha;
        pCtx.fillStyle = p.color;
        pCtx.beginPath();
        pCtx.arc(p.x, p.y, 2, 0, Math.PI*2);
        pCtx.fill();
        pCtx.globalAlpha = 1;
    });
}

function roundRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

// Start
initPlinko();