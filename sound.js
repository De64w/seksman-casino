/* sound.js - DE DJ (Met Bonus Loop) */

const audioFiles = {
    click: new Audio('audio/click.mp3'),
    win: new Audio('audio/win.mp3'),
    bonus: new Audio('audio/bonus.mp3') // Deze wordt nu achtergrondmuziek
};

// Instellingen
audioFiles.click.volume = 0.3;
audioFiles.win.volume = 0.6;

// BONUS MUZIEK INSTELLINGEN
audioFiles.bonus.volume = 0.6; // Iets zachter zodat je de winstgeluiden eroverheen hoort
audioFiles.bonus.loop = true;  // Zorg dat hij blijft herhalen!

function playSound(name) {
    const sound = audioFiles[name];
    if (sound) {
        // Alleen click en win resetten we direct, bonus laten we met rust hier
        if(name === 'click' || name === 'win') {
            sound.currentTime = 0;
            sound.play().catch(e => console.log("Audio play blocked:", e));
        }
    }
}

// SPECIALE FUNCTIES VOOR DE BONUS MUZIEK
function startBonusMusic() {
    audioFiles.bonus.currentTime = 0;
    audioFiles.bonus.play().catch(e => {});
}

function stopBonusMusic() {
    audioFiles.bonus.pause();
    audioFiles.bonus.currentTime = 0;
}

// Knoppen laten klikken
document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => playSound('click'));
    });
});