/* main.js - COMPLETE VERSIE MET ADS & SALDO FIX */

// --- STATE ---
let currentBalance = parseFloat(localStorage.getItem('seksman_balance')) || 100.00;

// Advertentie Systeem State
let adState = {
    queue: [],
    totalReward: 0,
    currentVideoIndex: 0,
    totalVideos: 0
};

// --- INIT ---
window.onload = function() {
    updateBalanceUI();
};

// --- SALDO FUNCTIES ---
function updateBalanceUI() {
    // Zorg dat het altijd 2 decimalen heeft
    localStorage.setItem('seksman_balance', currentBalance.toFixed(2));
    
    const balanceEl = document.getElementById('balance-amount');
    if (balanceEl) {
        balanceEl.innerText = currentBalance.toFixed(2);
    }
}

function deductBalance(amount) {
    if (currentBalance >= amount) {
        currentBalance -= amount;
        updateBalanceUI();
        return true;
    } else {
        alert("Niet genoeg saldo! Bekijk video's om op te waarderen.");
        openAdMenu();
        return false;
    }
}

function addBalance(amount) {
    // Zeker weten dat het een getal is
    currentBalance += parseFloat(amount);
    updateBalanceUI();
}

// --- NAVIGATIE ---
function switchView(viewName) {
    const views = document.querySelectorAll('.view');
    views.forEach(v => v.classList.add('hidden'));
    
    const target = document.getElementById('view-' + viewName);
    if (target) target.classList.remove('hidden');
    else document.getElementById('view-home').classList.remove('hidden');
    
    window.scrollTo(0,0);
}

// --- ADVERTENTIE SYSTEEM ---

function openAdMenu() {
    document.getElementById('ad-menu-overlay').classList.remove('hidden');
}

function closeAdMenu() {
    document.getElementById('ad-menu-overlay').classList.add('hidden');
}

function startAdSequence(option) {
    let count = 0;
    let reward = 0;

    if (option === 1) { count = 1; reward = 100; }
    else if (option === 2) { count = 2; reward = 250; } 
    else if (option === 3) { count = 3; reward = 450; } 

    // Reset en Vul Wachtrij
    adState.queue = [];
    for(let i=0; i<count; i++) {
        const randomNum = Math.floor(Math.random() * 9) + 1;
        adState.queue.push(`videos/ad${randomNum}.mp4`);
    }

    adState.totalReward = reward;
    adState.totalVideos = count;
    adState.currentVideoIndex = 0;

    closeAdMenu();
    document.getElementById('ad-player-overlay').classList.remove('hidden');
    
    playNextAd();
}

function playNextAd() {
    const videoEl = document.getElementById('ad-video-element');
    const statusText = document.getElementById('ad-status-text');
    const progressBar = document.getElementById('ad-progress');
    
    // Zijn we klaar?
    if (adState.currentVideoIndex >= adState.totalVideos) {
        finishAds();
        return;
    }

    statusText.innerText = `Advertentie ${adState.currentVideoIndex + 1} van ${adState.totalVideos}`;
    if(progressBar) progressBar.style.width = '0%';

    // Laad video
    videoEl.src = adState.queue[adState.currentVideoIndex];
    videoEl.controls = false; 
    
    // Probeer af te spelen
    const playPromise = videoEl.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.log("Autoplay prevented");
            statusText.innerText += " (Klik op scherm om te starten)";
            videoEl.onclick = () => videoEl.play();
        });
    }

    // Update progress bar
    videoEl.ontimeupdate = () => {
        if(videoEl.duration && progressBar) {
            const pct = (videoEl.currentTime / videoEl.duration) * 100;
            progressBar.style.width = `${pct}%`;
        }
    };

    // Als video klaar is
    videoEl.onended = function() {
        videoEl.onended = null; // Voorkom dubbele triggers
        adState.currentVideoIndex++;
        setTimeout(playNextAd, 300); // Korte pauze
    };
}

function finishAds() {
    document.getElementById('ad-player-overlay').classList.add('hidden');
    
    // Voeg geld toe
    addBalance(adState.totalReward);
    
    // Feedback in console (of alert als je wilt)
    console.log(`Ads klaar! +${adState.totalReward} SC`);
}