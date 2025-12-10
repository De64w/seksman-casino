// --- GLOBAL STATE ---
let currentBalance = 100.00; // Start saldo
const STORAGE_KEY = 'seksman_sc_balance';

// --- INITIALIZATION ---
window.onload = function() {
    loadBalance();
    updateBalanceUI();
    // Zorg dat we standaard op home beginnen
    switchView('home');
};

// --- WALLET LOGIC ---

function loadBalance() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
        currentBalance = parseFloat(saved);
    } else {
        currentBalance = 100.00;
        saveBalance();
    }
}

function saveBalance() {
    localStorage.setItem(STORAGE_KEY, currentBalance.toFixed(2));
}

function updateBalanceUI() {
    const display = document.getElementById('balance-display');
    if (display) {
        display.innerText = currentBalance.toFixed(2);
    }
}

// Functie voor games om geld af te schrijven (inzet)
// Geeft true terug als gelukt, false als te weinig saldo
function deductBalance(amount) {
    if (amount <= 0) return false;
    if (currentBalance >= amount) {
        currentBalance -= amount;
        saveBalance();
        updateBalanceUI();
        return true;
    }
    alert("Niet genoeg Seksmancoins (SC)!");
    return false;
}

// Functie voor games om winst toe te voegen
function addBalance(amount) {
    if (amount > 0) {
        currentBalance += amount;
        saveBalance();
        updateBalanceUI();
    }
}

function resetBalance() {
    currentBalance = 100.00;
    saveBalance();
    updateBalanceUI();
}

// --- NAVIGATION LOGIC ---

function switchView(viewName) {
    // 1. Verberg alle views
    const views = document.querySelectorAll('.view');
    views.forEach(div => {
        div.classList.add('hidden');
        div.classList.remove('active');
    });

    // 2. Toon de gevraagde view
    const targetId = 'view-' + viewName;
    const targetView = document.getElementById(targetId);
    
    if (targetView) {
        targetView.classList.remove('hidden');
        targetView.classList.add('active');
    } else {
        console.error("View niet gevonden: " + targetId);
    }
}