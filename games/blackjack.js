/* games/blackjack.js - FIX VOOR PUSH & SPLIT LOGICA */

// State
let bjGame = {
    active: false,
    bet: 0,
    deck: [],
    dealerHand: [],
    hands: [],    // Array van handen
    currentHandIndex: 0,
    chipsOnTable: []
};

// Config
const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = [
    { rank: '2', val: 2 }, { rank: '3', val: 3 }, { rank: '4', val: 4 },
    { rank: '5', val: 5 }, { rank: '6', val: 6 }, { rank: '7', val: 7 },
    { rank: '8', val: 8 }, { rank: '9', val: 9 }, { rank: '10', val: 10 },
    { rank: 'J', val: 10 }, { rank: 'Q', val: 10 }, { rank: 'K', val: 10 },
    { rank: 'A', val: 11 }
];

// --- BETTING ---

function bjAddChip(amount) {
    if (bjGame.active) return;
    if ((bjGame.bet + amount) > currentBalance) {
        alert("Niet genoeg saldo!");
        return;
    }
    bjGame.bet += amount;
    updateBetUI(amount);
}

function bjClearBet() {
    if (bjGame.active) return;
    bjGame.bet = 0;
    bjGame.chipsOnTable = [];
    updateBetUI(0, true);
}

function updateBetUI(addedAmount = 0, clear = false) {
    const totalDisplay = document.getElementById('bj-total-bet-display');
    const chipStack = document.getElementById('bj-chip-stack');
    
    totalDisplay.innerText = `Totaal: ${bjGame.bet.toFixed(2)} SC`;

    if (clear) {
        chipStack.innerHTML = '';
    } else if (addedAmount > 0) {
        addChipVisual(addedAmount);
    }
}

function addChipVisual(val) {
    const stack = document.getElementById('bj-chip-stack');
    const chip = document.createElement('button');
    chip.className = `chip chip-${val}`;
    chip.innerText = val;
    const rx = (Math.random() * 10) - 5;
    const ry = (Math.random() * 10) - 5;
    chip.style.transform = `translate(${rx}px, ${ry}px) scale(0.8)`;
    stack.appendChild(chip);
    bjGame.chipsOnTable.push(chip);
}

// --- GAME LOGIC ---

function bjCreateDeck() {
    let deck = [];
    for(let d=0; d<6; d++) {
        for (let suit of SUITS) for (let v of VALUES) deck.push({ suit: suit, rank: v.rank, value: v.val });
    }
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function bjDeal() {
    if (bjGame.bet <= 0) { alert("Plaats inzet"); return; }
    if (!deductBalance(bjGame.bet)) return;

    // Reset
    bjGame.active = true;
    bjGame.deck = bjCreateDeck();
    bjGame.dealerHand = [];
    
    // Hand 1
    bjGame.hands = [
        { cards: [], status: 'playing', bet: bjGame.bet }
    ];
    bjGame.currentHandIndex = 0;

    // UI Reset
    document.getElementById('bj-bet-controls').classList.add('hidden');
    document.getElementById('bj-play-controls').classList.remove('hidden');
    document.getElementById('bj-message-overlay').classList.add('hidden');
    document.getElementById('player-hand-1').classList.add('hidden');
    document.getElementById('player-hand-0').classList.remove('inactive-hand');
    document.getElementById('player-hand-0').classList.add('active-hand');

    document.getElementById('btn-double').disabled = false;
    document.getElementById('btn-split').disabled = true;

    // Deal
    bjDrawCard(0);
    bjDrawCard('dealer');
    bjDrawCard(0);
    bjDrawCard('dealer', true);

    bjUpdateBoard();

    // Check Split
    const c1 = bjGame.hands[0].cards[0];
    const c2 = bjGame.hands[0].cards[1];
    if (c1.value === c2.value && currentBalance >= bjGame.bet) {
        document.getElementById('btn-split').disabled = false;
    }

    // Check Instant Blackjack
    if (bjGetScore(bjGame.hands[0].cards) === 21) {
        bjStand(); 
    }
}

function bjDrawCard(target, hidden = false) {
    const card = bjGame.deck.pop();
    card.hidden = hidden;
    if (target === 'dealer') bjGame.dealerHand.push(card);
    else bjGame.hands[target].cards.push(card);
}

function bjGetScore(cards) {
    let score = 0; let aces = 0;
    cards.forEach(c => {
        if(c.hidden) return;
        score += c.value;
        if (c.rank === 'A') aces++;
    });
    while (score > 21 && aces > 0) { score -= 10; aces--; }
    return score;
}

// --- ACTIONS ---

function bjHit() {
    if (!bjGame.active) return;
    document.getElementById('btn-double').disabled = true;
    document.getElementById('btn-split').disabled = true;

    const currentHand = bjGame.hands[bjGame.currentHandIndex];
    bjDrawCard(bjGame.currentHandIndex);
    bjUpdateBoard();

    if (bjGetScore(currentHand.cards) > 21) nextTurn();
}

function bjStand() {
    if (!bjGame.active) return;
    nextTurn();
}

function bjDouble() {
    const currentHand = bjGame.hands[bjGame.currentHandIndex];
    if (!deductBalance(currentHand.bet)) return;
    
    currentHand.bet *= 2;
    bjDrawCard(bjGame.currentHandIndex);
    bjUpdateBoard();
    nextTurn(); // Double is altijd 1 kaart en dan stand
}

function bjSplit() {
    if (!bjGame.active) return;
    const hand0 = bjGame.hands[0];
    
    // Check saldo: Splitten kost nog een keer je inzet
    if (currentBalance < hand0.bet) {
        alert(`Niet genoeg saldo om te splitten! Je hebt ${hand0.bet.toFixed(2)} SC nodig.`);
        return;
    }
    
    // Betaal de inzet voor de tweede hand
    deductBalance(hand0.bet);

    // Splits de kaarten
    const splitCard = hand0.cards.pop();
    
    // Maak Hand 2
    bjGame.hands.push({
        cards: [splitCard],
        status: 'playing',
        bet: hand0.bet // Zelfde inzet als hand 1
    });

    // Deel nieuwe kaarten
    bjDrawCard(0);
    bjDrawCard(1);

    // UI Updates
    document.getElementById('player-hand-1').classList.remove('hidden');
    document.getElementById('btn-split').disabled = true;
    
    bjGame.currentHandIndex = 0;
    updateHandFocus();
    bjUpdateBoard();
    
    // Update totale inzet display
    const totalBet = hand0.bet * 2;
    document.getElementById('bj-total-bet-display').innerText = `Totaal: ${totalBet.toFixed(2)} SC`;
    
    // Visuele chips erbij
    bjGame.chipsOnTable.forEach(chipBtn => {
        addChipVisual(parseInt(chipBtn.innerText));
    });
}

function nextTurn() {
    const currentHand = bjGame.hands[bjGame.currentHandIndex];
    const score = bjGetScore(currentHand.cards);
    
    if (score > 21) currentHand.status = 'bust';
    else currentHand.status = 'stand';

    if (bjGame.currentHandIndex < bjGame.hands.length - 1) {
        bjGame.currentHandIndex++;
        updateHandFocus();
        document.getElementById('btn-double').disabled = false;
    } else {
        playDealer();
    }
}

function updateHandFocus() {
    document.getElementById('player-hand-0').className = bjGame.currentHandIndex === 0 ? 'bj-hand active-hand' : 'bj-hand inactive-hand';
    document.getElementById('player-hand-1').className = bjGame.currentHandIndex === 1 ? 'bj-hand active-hand' : 'bj-hand inactive-hand';
}

function playDealer() {
    bjGame.turn = 'dealer';
    bjGame.dealerHand[1].hidden = false;
    bjUpdateBoard();

    // Als alles bust is, hoeft dealer niet te spelen
    if (bjGame.hands.every(h => h.status === 'bust')) {
        bjResolveGame();
        return;
    }

    const loop = setInterval(() => {
        const dScore = bjGetScore(bjGame.dealerHand);
        if (dScore < 17) {
            bjDrawCard('dealer');
            bjUpdateBoard();
        } else {
            clearInterval(loop);
            bjResolveGame();
        }
    }, 800);
}

// --- RESOLVE ---

function bjResolveGame() {
    const dScore = bjGetScore(bjGame.dealerHand);
    
    let totalBet = 0;
    let totalPayout = 0;

    // Bereken resultaat per hand
    bjGame.hands.forEach(hand => {
        totalBet += hand.bet;
        
        const pScore = bjGetScore(hand.cards);
        let multiplier = 0;

        if (hand.status === 'bust') {
            multiplier = 0; 
        } else if (dScore > 21) {
            multiplier = 2; // Dealer bust = winst
        } else if (pScore > dScore) {
            multiplier = 2; // Hoger = winst
            // Blackjack check (alleen 2 kaarten en niet gesplit, of versimpelde regel: elke 21 met 2 kaarten)
            if (pScore === 21 && hand.cards.length === 2 && bjGame.hands.length === 1) {
                multiplier = 2.5; 
            }
        } else if (pScore === dScore) {
            multiplier = 1; // Push (inzet terug)
        } else {
            multiplier = 0; // Dealer hoger
        }

        totalPayout += (hand.bet * multiplier);
    });

    if (totalPayout > 0) addBalance(totalPayout);

    // Bepaal bericht op basis van Netto Resultaat
    let message = "";
    let profit = totalPayout - totalBet;

    if (profit > 0) {
        message = "YOU WIN"; // Netto winst
    } else if (profit === 0) {
        message = "PUSH";    // Quitte gespeeld
    } else {
        message = "DEALER WINS"; // Netto verlies
    }

    bjGameOver(message, profit);
}

function bjGameOver(msg, profit) {
    bjGame.active = false;
    const overlay = document.getElementById('bj-message-overlay');
    const title = document.getElementById('bj-result-title');
    const amtEl = document.getElementById('bj-result-amount');
    
    title.innerText = msg;
    
    // Tekst kleur en Bedrag display
    if (msg === "YOU WIN") {
        title.style.color = "#00e701";
        amtEl.innerText = `+${profit.toFixed(2)} SC`;
        amtEl.classList.remove('hidden');
    } else if (msg === "PUSH") {
        title.style.color = "white";
        // Bij push: toon +0.00 of verberg het bedrag, wat jij mooier vindt.
        // Hier kiezen we voor +0.00 om duidelijk te maken dat je niks verloren hebt.
        amtEl.innerText = "+0.00 SC";
        amtEl.classList.remove('hidden');
    } else {
        title.style.color = "#ff4444";
        amtEl.classList.add('hidden'); // Geen bedrag bij verlies
    }
    
    overlay.classList.remove('hidden');

    setTimeout(() => {
        overlay.classList.add('hidden');
        document.getElementById('bj-play-controls').classList.add('hidden');
        document.getElementById('bj-bet-controls').classList.remove('hidden');
        
        // Reset Views
        document.getElementById('dealer-cards').innerHTML = '';
        document.getElementById('player-cards-0').innerHTML = '';
        document.getElementById('player-cards-1').innerHTML = '';
        document.getElementById('dealer-score').classList.add('hidden');
        document.getElementById('player-score-0').classList.add('hidden');
        document.getElementById('player-score-1').classList.add('hidden');
        document.getElementById('player-hand-1').classList.add('hidden');
        
        bjClearBet();
    }, 3500);
}

// --- RENDER ---

function bjUpdateBoard() {
    renderHand('dealer', bjGame.dealerHand, 'dealer-cards');
    
    renderHand('player', bjGame.hands[0].cards, 'player-cards-0');
    updateScoreBubble('player-score-0', bjGame.hands[0].cards);
    
    if (bjGame.hands.length > 1) {
        renderHand('player', bjGame.hands[1].cards, 'player-cards-1');
        updateScoreBubble('player-score-1', bjGame.hands[1].cards);
    }

    updateScoreBubble('dealer-score', bjGame.dealerHand);
}

function updateScoreBubble(id, cards) {
    const el = document.getElementById(id);
    const score = bjGetScore(cards);
    el.innerText = score;
    el.classList.remove('hidden');
}

function renderHand(who, cards, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    cards.forEach(c => {
        const div = document.createElement('div');
        div.className = 'playing-card';
        if (c.hidden) div.classList.add('facedown');
        else {
            if (c.suit === '♥' || c.suit === '♦') div.classList.add('card-red');
            else div.classList.add('card-black');
            div.innerHTML = `<div class="card-top">${c.rank}<br>${c.suit}</div><div class="card-center">${c.suit}</div><div class="card-bottom">${c.rank}<br>${c.suit}</div>`;
        }
        container.appendChild(div);
    });
}