/* ==========================================================
   COLLECT THE COIN - HTML5 CANVAS
   Dasar kode mengikuti Materi 7 (halaman 10-23), kemudian
   dikembangkan untuk memenuhi tugas pada halaman 25.
   ========================================================== */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const gameMenu = document.getElementById("gameMenu");
const menuTitle = document.getElementById("menuTitle");
const menuMessage = document.getElementById("menuMessage");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const soundBtn = document.getElementById("soundBtn");

const WIDTH = 600;
const HEIGHT = 400;
const HUD_HEIGHT = 44;
const TARGET_COINS = 15;
const MAX_LEVEL = 5;
const COINS_PER_LEVEL = 3;

// GANTI DATA DI BAWAH INI DENGAN BIODATA PEMBUAT GAME.
const STUDENT_PROFILE = {
    name: "ISI NAMA LENGKAP",
    className: "ISI KELAS",
    number: "ISI NOMOR ABSEN",
    school: "ISI NAMA SEKOLAH"
};

// VARIABEL STATUS PERMAINAN
let score = 0;
let lives = 3;
let collectedCoins = 0;
let level = 1;
let gameState = "ready"; // ready, playing, won, lost
let soundEnabled = true;
let invulnerable = false;
let invulnerableTimer = 0;
let coinAngle = 0;
let enemySpawnTimer = 0;
let lastFrameTime = 0;
let animationFrameId = null;

const keys = {};
const touchKeys = {};

// OBJEK PEMAIN DIBUAT LEBIH BESAR DARI CONTOH PDF (30 x 30).
const player = {
    x: 34,
    y: 190,
    width: 48,
    height: 48,
    speed: 4.1
};

const coin = {
    x: 250,
    y: 150,
    width: 28,
    height: 28
};

// MUSUH DISIMPAN DALAM ARRAY AGAR DAPAT MUNCUL LEBIH DARI SATU.
let enemies = [];

// MEMUAT ASET GAMBAR LOKAL. GAME TETAP BERJALAN DENGAN GAMBAR CADANGAN.
function loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
}

const playerImage = loadImage("assets/player.svg");
const coinImage = loadImage("assets/coin.svg");
const enemyImage = loadImage("assets/enemy.svg");
const backgroundImage = loadImage("assets/background.svg");

// AUDIO DIBUAT DENGAN WEB AUDIO API, SEHINGGA TIDAK MEMERLUKAN FILE MP3.
let audioContext = null;
let musicTimer = null;
let musicNoteIndex = 0;

const melody = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46];

function ensureAudio() {
    if (!audioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) audioContext = new AudioContextClass();
    }
    if (audioContext && audioContext.state === "suspended") {
        audioContext.resume();
    }
}

function playTone(frequency, duration = 0.12, waveform = "sine", volume = 0.045) {
    if (!soundEnabled) return;
    ensureAudio();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

function startMusic() {
    if (!soundEnabled || musicTimer) return;
    ensureAudio();
    if (!audioContext) return;

    musicNoteIndex = 0;
    musicTimer = window.setInterval(() => {
        if (gameState !== "playing" || !soundEnabled) return;
        playTone(melody[musicNoteIndex % melody.length], 0.22, "triangle", 0.018);
        musicNoteIndex++;
    }, 280);
}

function stopMusic() {
    if (musicTimer) {
        window.clearInterval(musicTimer);
        musicTimer = null;
    }
}

function playSound(type) {
    if (!soundEnabled) return;
    if (type === "coin") {
        playTone(880, 0.10, "sine", 0.07);
        window.setTimeout(() => playTone(1174.66, 0.12, "sine", 0.05), 75);
    } else if (type === "hit") {
        playTone(180, 0.24, "sawtooth", 0.07);
    } else if (type === "win") {
        [523.25, 659.25, 783.99, 1046.5].forEach((note, i) => {
            window.setTimeout(() => playTone(note, 0.22, "triangle", 0.06), i * 130);
        });
    }
}

// MENAMPILKAN BIODATA DI BAGIAN BAWAH GAME.
function renderStudentProfile() {
    document.getElementById("studentName").textContent = STUDENT_PROFILE.name;
    document.getElementById("studentClass").textContent = STUDENT_PROFILE.className;
    document.getElementById("studentNumber").textContent = STUDENT_PROFILE.number;
    document.getElementById("studentSchool").textContent = STUDENT_PROFILE.school;
}

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

function isColliding(a, b) {
    return a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
}

// POSISI KOIN DIPILIH SECARA ACAK DAN DIJAUHKAN DARI PEMAIN/MUSUH.
function randomCoinPosition() {
    let attempts = 0;
    let candidate;
    do {
        candidate = {
            x: randomBetween(28, WIDTH - coin.width - 28),
            y: randomBetween(HUD_HEIGHT + 22, HEIGHT - coin.height - 28),
            width: coin.width,
            height: coin.height
        };
        attempts++;
    } while (
        attempts < 60 &&
        (isColliding(candidate, player) || enemies.some(enemy => isColliding(candidate, enemy)))
    );
    coin.x = candidate.x;
    coin.y = candidate.y;
}

function createEnemy() {
    let enemy = null;
    let attempts = 0;

    do {
        const fromLeft = Math.random() < 0.5;
        enemy = {
            x: fromLeft ? randomBetween(95, 180) : randomBetween(410, 550),
            y: randomBetween(HUD_HEIGHT + 25, HEIGHT - 70),
            width: 38,
            height: 38,
            speedX: (Math.random() < 0.5 ? -1 : 1) * randomBetween(1.2, 2.0 + level * 0.35),
            speedY: (Math.random() < 0.5 ? -1 : 1) * randomBetween(0.45, 1.15),
            phase: Math.random() * Math.PI * 2
        };
        attempts++;
    } while (attempts < 40 && isColliding(enemy, player));

    return enemy;
}

function targetEnemyCount() {
    // Jumlah musuh meningkat seiring level, maksimum 9 musuh.
    return Math.min(9, 3 + (level - 1) * 1.5 | 0);
}

function fillEnemiesToLevel() {
    const desired = targetEnemyCount();
    while (enemies.length < desired) enemies.push(createEnemy());
}

function resetGameData() {
    score = 0;
    lives = 3;
    collectedCoins = 0;
    level = 1;
    player.x = 34;
    player.y = 190;
    invulnerable = false;
    invulnerableTimer = 0;
    coinAngle = 0;
    enemySpawnTimer = 0;
    enemies = [];
    keysClear();
    fillEnemiesToLevel();
    randomCoinPosition();
}

function keysClear() {
    Object.keys(keys).forEach(key => { keys[key] = false; });
    Object.keys(touchKeys).forEach(key => { touchKeys[key] = false; });
}

function showMenu(title, message, buttonLabel) {
    menuTitle.textContent = title;
    menuMessage.textContent = message;
    startBtn.textContent = buttonLabel;
    gameMenu.style.display = "flex";
}

function startGame() {
    if (gameState === "playing") return;
    if (gameState === "ready" || gameState === "won" || gameState === "lost") {
        resetGameData();
    }
    gameState = "playing";
    gameMenu.style.display = "none";
    if (soundEnabled) startMusic();
}

function restartGame() {
    stopMusic();
    resetGameData();
    gameState = "playing";
    gameMenu.style.display = "none";
    if (soundEnabled) startMusic();
}

function endGame(result) {
    gameState = result;
    stopMusic();
    if (result === "won") {
        playSound("win");
        showMenu("🎉 KAMU MENANG!", `Hebat! Kamu berhasil mengumpulkan ${collectedCoins} koin dan mencapai level ${level}.`, "MAIN LAGI");
    } else {
        showMenu("GAME OVER", `Nyawa habis. Kamu memperoleh ${collectedCoins} dari ${TARGET_COINS} koin. Coba lagi!`, "COBA LAGI");
    }
}

// UPDATE LOGIKA PERMAINAN
function update(deltaTime) {
    if (gameState !== "playing") return;

    const step = Math.min(deltaTime / 16.67, 2.2);

    // GERAKAN PEMAIN: keyboard komputer maupun tombol smartphone.
    const movingLeft = keys.ArrowLeft || keys.a || keys.A || touchKeys.ArrowLeft;
    const movingRight = keys.ArrowRight || keys.d || keys.D || touchKeys.ArrowRight;
    const movingUp = keys.ArrowUp || keys.w || keys.W || touchKeys.ArrowUp;
    const movingDown = keys.ArrowDown || keys.s || keys.S || touchKeys.ArrowDown;

    if (movingRight) player.x += player.speed * step;
    if (movingLeft) player.x -= player.speed * step;
    if (movingUp) player.y -= player.speed * step;
    if (movingDown) player.y += player.speed * step;

    // BATAS AREA GERAK PEMAIN
    player.x = Math.max(4, Math.min(player.x, WIDTH - player.width - 4));
    player.y = Math.max(HUD_HEIGHT + 8, Math.min(player.y, HEIGHT - player.height - 7));

    // MUSUH BERGERAK DAN MEMANTUL PADA TEPI AREA PERMAINAN.
    enemies.forEach(enemy => {
        enemy.x += enemy.speedX * step;
        enemy.y += enemy.speedY * step;
        enemy.phase += 0.045 * step;

        if (enemy.x <= 2 || enemy.x + enemy.width >= WIDTH - 2) enemy.speedX *= -1;
        if (enemy.y <= HUD_HEIGHT + 6 || enemy.y + enemy.height >= HEIGHT - 6) enemy.speedY *= -1;
    });

    // MUSUH TAMBAHAN MUNCUL PADA WAKTU DAN POSISI ACAK.
    enemySpawnTimer += deltaTime;
    const spawnInterval = Math.max(3300, 7200 - level * 650);
    if (enemySpawnTimer >= spawnInterval && enemies.length < 9) {
        enemies.push(createEnemy());
        enemySpawnTimer = 0;
    }

    // MENGAMBIL KOIN
    if (isColliding(player, coin)) {
        collectedCoins++;
        score += 10;
        playSound("coin");
        randomCoinPosition();

        // LEVEL 1 SAMPAI 5: naik setiap memperoleh 3 koin.
        const newLevel = Math.min(MAX_LEVEL, Math.floor(collectedCoins / COINS_PER_LEVEL) + 1);
        if (newLevel > level) {
            level = newLevel;
            fillEnemiesToLevel();
        }

        if (collectedCoins >= TARGET_COINS) {
            endGame("won");
            return;
        }
    }

    // WAKTU KEBAL SEMENTARA SETELAH TERTABRAK MUSUH.
    if (invulnerable) {
        invulnerableTimer -= step;
        if (invulnerableTimer <= 0) invulnerable = false;
    }

    // TABRAKAN DENGAN SALAH SATU MUSUH
    const hitEnemy = enemies.find(enemy => isColliding(player, enemy));
    if (hitEnemy && !invulnerable) {
        lives--;
        playSound("hit");
        player.x = 34;
        player.y = 190;
        invulnerable = true;
        invulnerableTimer = 95;

        // Musuh yang menabrak dipindah ke sisi lain supaya tidak langsung mengenai pemain.
        hitEnemy.x = Math.random() < 0.5 ? 90 : WIDTH - hitEnemy.width - 35;
        hitEnemy.y = randomBetween(HUD_HEIGHT + 20, HEIGHT - hitEnemy.height - 12);

        if (lives <= 0) {
            endGame("lost");
        }
    }

    coinAngle += 0.055 * step;
}

// MENGGAMBAR LATAR BELAKANG
function drawBackground() {
    if (backgroundImage.complete && backgroundImage.naturalWidth > 0) {
        ctx.drawImage(backgroundImage, 0, 0, WIDTH, HEIGHT);
    } else {
        const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
        gradient.addColorStop(0, "#8ed6ef");
        gradient.addColorStop(1, "#e7f8e8");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = "#52b788";
        ctx.fillRect(0, HEIGHT - 25, WIDTH, 25);
    }
}

function drawPlayer() {
    // Efek berkedip saat pemain kebal setelah tertabrak.
    if (invulnerable && Math.floor(invulnerableTimer / 8) % 2 === 0) return;

    if (playerImage.complete && playerImage.naturalWidth > 0) {
        ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
    } else {
        ctx.fillStyle = "#1d5f91";
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
}

function drawCoin() {
    ctx.save();
    ctx.translate(coin.x + coin.width / 2, coin.y + coin.height / 2);
    ctx.rotate(coinAngle);
    if (coinImage.complete && coinImage.naturalWidth > 0) {
        ctx.drawImage(coinImage, -coin.width / 2, -coin.height / 2, coin.width, coin.height);
    } else {
        ctx.fillStyle = "#ffd43b";
        ctx.beginPath();
        ctx.arc(0, 0, coin.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#d08a00";
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    ctx.restore();
}

function drawEnemies() {
    enemies.forEach(enemy => {
        const bob = Math.sin(enemy.phase) * 2;
        if (enemyImage.complete && enemyImage.naturalWidth > 0) {
            ctx.drawImage(enemyImage, enemy.x, enemy.y + bob, enemy.width, enemy.height);
        } else {
            ctx.fillStyle = "#e63946";
            ctx.fillRect(enemy.x, enemy.y + bob, enemy.width, enemy.height);
        }
    });
}

// GUI: SKOR, KOIN, NYAWA, DAN LEVEL.
function drawUI() {
    ctx.fillStyle = "rgba(10, 22, 35, 0.82)";
    ctx.fillRect(0, 0, WIDTH, HUD_HEIGHT);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Skor: ${score}`, 13, 27);
    ctx.textAlign = "center";
    ctx.fillText(`Koin: ${collectedCoins}/${TARGET_COINS}`, WIDTH / 2, 27);
    ctx.fillText(`Nyawa: ${"♥".repeat(lives)}${"♡".repeat(Math.max(0, 3 - lives))}`, WIDTH * 0.73, 27);
    ctx.textAlign = "right";
    ctx.fillText(`Level: ${level}/${MAX_LEVEL}`, WIDTH - 13, 27);
    ctx.textAlign = "left";
}

function drawGameStatus() {
    if (gameState !== "won" && gameState !== "lost") return;
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(0, HUD_HEIGHT, WIDTH, HEIGHT - HUD_HEIGHT);
}

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawBackground();
    drawCoin();
    drawPlayer();
    drawEnemies();
    drawUI();
    drawGameStatus();
}

// GAME LOOP
function gameLoop(timestamp) {
    const deltaTime = lastFrameTime ? timestamp - lastFrameTime : 16.67;
    lastFrameTime = timestamp;
    update(deltaTime);
    draw();
    animationFrameId = window.requestAnimationFrame(gameLoop);
}

// MENGATUR TOMBOL MENU
startBtn.addEventListener("click", () => {
    ensureAudio();
    startGame();
});

restartBtn.addEventListener("click", () => {
    ensureAudio();
    restartGame();
});

// PENGATUR SUARA ON/OFF
soundBtn.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    soundBtn.textContent = soundEnabled ? "🔊 SUARA: ON" : "🔇 SUARA: OFF";
    soundBtn.setAttribute("aria-pressed", String(soundEnabled));
    if (soundEnabled) {
        ensureAudio();
        if (gameState === "playing") startMusic();
    } else {
        stopMusic();
    }
});

// KONTROL KEYBOARD
window.addEventListener("keydown", event => {
    const allowed = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D"];
    if (allowed.includes(event.key)) event.preventDefault();
    keys[event.key] = true;

    if ((event.key === "r" || event.key === "R") && gameState !== "playing") {
        ensureAudio();
        restartGame();
    }
});

window.addEventListener("keyup", event => {
    keys[event.key] = false;
});

window.addEventListener("blur", keysClear);

// KONTROL SMARTPHONE / LAYAR SENTUH
function releaseTouchKey(key) {
    touchKeys[key] = false;
}

document.querySelectorAll(".controls button").forEach(button => {
    const key = button.dataset.key;

    button.addEventListener("pointerdown", event => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        touchKeys[key] = true;
    });

    button.addEventListener("pointerup", () => releaseTouchKey(key));
    button.addEventListener("pointercancel", () => releaseTouchKey(key));
    button.addEventListener("lostpointercapture", () => releaseTouchKey(key));
});

// INISIALISASI
renderStudentProfile();
resetGameData();
showMenu("COLLECT THE COIN", `Kumpulkan ${TARGET_COINS} koin untuk menang. Hindari musuh dan capai level 5!`, "MULAI GAME");

draw();
if (animationFrameId === null) {
    animationFrameId = window.requestAnimationFrame(gameLoop);
}
