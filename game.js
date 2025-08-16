


// Variáveis de controle do jogo (agora todas declaradas no topo)
const gameArea = document.getElementById('game-area');
const wordInput = document.getElementById('word-input');
const scoreDisplay = document.getElementById('score');
const foundWordsDisplay = document.getElementById('found-words');
const cronometroDisplay = document.getElementById('cronometro');
const listaPalavras = document.getElementById("lista-palavras");
const acertoAudio = document.getElementById('acerto-som');
const gameOverOverlay = document.getElementById('game-over-overlay');
const finalScoreDisplay = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');





let score = 0;
let foundWordsCount = 0;
let gameSpeed = 0.5;
let wordSpawnInterval;
let letraInterval;
let fallingWords = [];
let cronometroInterval;
let tempo = 0;
let acertosParaAumentarVelocidade = 0;
let wordsInCurrentPool = [];
let palavrasIniciadas = false;

// Banco de palavras para o modo fácil
const easyWords = [
    "prato", "copo", "faca", "garfo", "colher", "pote", "jarra", "prerrogativa", "tigela", "toalha",
    "perseverança", "cronometro", "olho", "nariz", "boca", "braco", "joelho", "dedo", "perna", "orelha",
    "cotovelo", "ombro", "desenvolver", "leopardo", "otorrino", "ruido", "hiperidrose", "joao", "hugo", "lara",
    "mila", "pedro", "maria", "lucas", "sofia", "rio", "lima", "paris", "roma", "toquio","dissimulado",
    "cairo", "macau", "belem", "braga", "teresina", "mesa", "cadeira", "janela", "porta","complacente",
    "parede", "chao", "teto", "escada", "lampada", "sofa", "intangibilidade", "espelho", "livro",
    "caneta", "lapis", "borracha", "papel", "caderno", "mochila", "sapato", "camisa","resiliência",
    "calca", "meia", "blusa", "casaco", "chapeu", "gravata", "relogio", "anel", "brinco",
    "pulseira", "oculos", "celular", "computador", "mouse", "teclado", "monitor", "extracurricular",
    "carro", "moto", "bicicleta", "onibus", "trem", "aviao", "barco", "navio", "caminhao",
    "trator", "ambulancia", "bombeiro", "policia", "escola", "hospital", "igreja", "mercado",
    "padaria", "farmacia", "condolências", "parque", "cinema", "teatro", "museu", "biblioteca"
];

// Função para tocar o som de acerto
function tocarSomAcerto() {
    if (acertoAudio) {
        acertoAudio.pause();
        acertoAudio.currentTime = 0;
        acertoAudio.play();
    }
}

// Inicia o cronômetro
function iniciarCronometro() {
    tempo = 0;
    cronometroDisplay.textContent = 'Tempo: 00:00';
    cronometroInterval = setInterval(() => {
        tempo++;
        const minutos = Math.floor(tempo / 60);
        const segundos = tempo % 60;
        cronometroDisplay.textContent = `Tempo: ${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
    }, 1000);
}

// Para o cronômetro
function pararCronometro() {
    clearInterval(cronometroInterval);
}

// Atualiza o painel lateral com as palavras que estão caindo
function atualizarPainelLateral() {
    listaPalavras.innerHTML = '';
    fallingWords.forEach(fw => {
        if (!fw.isRandomLetter && fw.word.length > 1) {
            const item = document.createElement("li");
            item.textContent = fw.word;
            listaPalavras.appendChild(item);
        }
    });
}

// Cria UMA letra aleatória
function criarLetraVisual() {
    if (!palavrasIniciadas) return;

    const letras = "abcdefghijklmnopqrstuvwxyz";
    const letra = letras[Math.floor(Math.random() * letras.length)];

    const letraElement = document.createElement('span');
    letraElement.textContent = letra;
    letraElement.classList.add('falling-letter');
    letraElement.style.left = `${Math.random() * gameArea.clientWidth}px`;
    letraElement.style.top = '-20px';
    gameArea.appendChild(letraElement);

    // Adiciona a letra ao array de elementos caindo para controle no gameLoop
    fallingWords.push({ word: letra, letters: [{ element: letraElement, speed: gameSpeed }], isRandomLetter: true });
}

// Cria UMA palavra válida para o jogo
function createFallingElement() {
    if (wordsInCurrentPool.length === 0 && easyWords.length > 0) {
        wordsInCurrentPool = [...easyWords];
    }
    
    if (wordsInCurrentPool.length === 0) {
        return;
    }

    const wordIndex = Math.floor(Math.random() * wordsInCurrentPool.length);
    const wordOrLetter = wordsInCurrentPool[wordIndex];
    wordsInCurrentPool.splice(wordIndex, 1);

    const columnCount = 20;
    const columnWidth = gameArea.clientWidth / columnCount;
    const wordLetters = [];
    let leftPosition;
    let isOverlapping = true;
    let attempts = 0;
    const maxAttempts = 50;

    while (isOverlapping && attempts < maxAttempts) {
        isOverlapping = false;
        const columnIndex = Math.floor(Math.random() * (columnCount - wordOrLetter.length + 1));
        leftPosition = columnIndex * columnWidth;

        for (const existingWord of fallingWords) {
            if (!existingWord.isRandomLetter) {
                const existingLeft = parseFloat(existingWord.letters[0].element.style.left);
                const existingRight = existingLeft + (existingWord.word.length * columnWidth);
                const newRight = leftPosition + (wordOrLetter.length * columnWidth);
                if ((leftPosition < existingRight && newRight > existingLeft)) {
                    isOverlapping = true;
                    break;
                }
            }
        }
        attempts++;
    }

    if (attempts >= maxAttempts) {
        return;
    }

    for (let i = 0; i < wordOrLetter.length; i++) {
        const letterElement = document.createElement('span');
        letterElement.textContent = wordOrLetter[i];
        letterElement.classList.add('falling-letter', 'palavra-valida');
        letterElement.style.left = `${leftPosition + (i * columnWidth)}px`;
        letterElement.style.top = '-20px';
        gameArea.appendChild(letterElement);
        wordLetters.push({ element: letterElement, speed: gameSpeed });
    }

    fallingWords.push({ word: wordOrLetter, letters: wordLetters, isRandomLetter: false });
    atualizarPainelLateral();
    palavrasIniciadas = true;
}

// Loop principal do jogo: faz as palavras e letras caírem
function gameLoop() {
    for (const fallingWord of fallingWords) {
        fallingWord.letters.forEach(letter => {
            let top = parseFloat(letter.element.style.top);
            letter.element.style.top = `${top + letter.speed}px`;
        });
    }

    for (let i = fallingWords.length - 1; i >= 0; i--) {
        const element = fallingWords[i];
        
        if (element.letters.length === 0) { // Evita erro se o array de letras estiver vazio
            fallingWords.splice(i, 1);
            continue;
        }

        const topPosition = parseFloat(element.letters[0].element.style.top);

        if (!element.isRandomLetter && topPosition > gameArea.clientHeight) {
            // Fim de Jogo: se uma PALAVRA real chegou ao fim da tela
            clearInterval(wordSpawnInterval);
            clearInterval(letraInterval);
            pararCronometro();
            wordInput.disabled = true;

            // Mostra a tela de game over
            finalScoreDisplay.textContent = score;
            gameOverOverlay.style.display = 'flex';
            return;
        } 
        else if (element.isRandomLetter && topPosition > gameArea.clientHeight) {
            // Apenas remove letras aleatórias que saíram da tela
            element.letters.forEach(letter => letter.element.remove());
            fallingWords.splice(i, 1);
        }
    }
    requestAnimationFrame(gameLoop);
}

// Evento para verificar se a palavra digitada está correta
// ...existing code...
wordInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && wordInput.value.trim() !== '') {
        const inputWord = wordInput.value.toLowerCase().trim();
        const fallingIndex = fallingWords.findIndex(fw => 
            fw.word === inputWord && 
            !fw.isRandomLetter &&
            fw.word.length > 1
        );

        if (fallingIndex !== -1) {
            // Pontuação diferenciada para palavras grandes
            let pontos = 10;
            if (fallingWords[fallingIndex].word.length > 8) {
                pontos = 20; // ou outro valor que desejar
            }
            score += pontos;
            foundWordsCount++;
            scoreDisplay.textContent = `Pontuação: ${score}`;
            foundWordsDisplay.textContent = `Palavras: ${foundWordsCount}`;
            tocarSomAcerto();

            fallingWords[fallingIndex].letters.forEach(letter => letter.element.remove());
            fallingWords.splice(fallingIndex, 1);

            if (gameSpeed < 5) {
                gameSpeed += 0.1;
            }
            atualizarPainelLateral();
        }
        wordInput.value = '';
    }
});

// Função para iniciar o jogo
function startGame() {
    // Limpa intervalos e estado do jogo
    clearInterval(wordSpawnInterval);
    clearInterval(letraInterval);
    pararCronometro();
    
    gameArea.innerHTML = '';
    gameOverOverlay.style.display = 'none'; // Esconde a tela de game over
    score = 0;
    foundWordsCount = 0;
    fallingWords = [];
    gameSpeed = 0.5;
    acertosParaAumentarVelocidade = 0;
    scoreDisplay.textContent = `Pontuação: ${score}`;
    foundWordsDisplay.textContent = `Palavras: ${foundWordsCount}`;
    wordInput.disabled = false;
    wordInput.value = '';
    wordInput.focus();
    palavrasIniciadas = false;

    // Zera e inicia o cronômetro
    iniciarCronometro();

    wordsInCurrentPool = [...easyWords];

    // Inicia a criação das palavras e letras
    wordSpawnInterval = setInterval(createFallingElement, 4000);
    letraInterval = setInterval(criarLetraVisual, 300);

    // Inicia o loop principal do jogo
    gameLoop();

    setTimeout(() => {
        palavrasIniciadas = true;
    }, 100);
}

// Eventos para iniciar e reiniciar o jogo
document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('start-button');
    if (btn) {
        btn.addEventListener('click', startGame);
    }
    if (restartButton) {
        restartButton.addEventListener('click', startGame);
    }
});
  