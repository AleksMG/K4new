document.addEventListener('DOMContentLoaded', () => {
    const crackBtn = document.getElementById('crackBtn');
    const verifyBtn = document.getElementById('verifyBtn');
    const ciphertextEl = document.getElementById('ciphertext');
    const knownTextEl = document.getElementById('knownText');
    const alphabetEl = document.getElementById('alphabet');
    const keyResultsEl = document.getElementById('keyResults');
    const decryptedEl = document.getElementById('decrypted');
    const statusEl = document.getElementById('status');
    const analysisEl = document.getElementById('analysisDetails');

    let worker = new Worker('worker.js');
    let currentResults = [];

    worker.onmessage = function(e) {
        const { type, data } = e.data;
        
        switch(type) {
            case 'progress':
                statusEl.innerHTML = `Обработано ${data.progress}% (найдено ключей: ${data.keys})`;
                break;
                
            case 'result':
                currentResults = data.results.sort((a, b) => b.confidence - a.confidence);
                updateResultsList();
                statusEl.innerHTML = `<span class="success">Найдено ${currentResults.length} ключей</span>`;
                crackBtn.disabled = false;
                showTopResults();
                break;
                
            case 'error':
                statusEl.innerHTML = `<span class="warning">Ошибка: ${data.message}</span>`;
                crackBtn.disabled = false;
                break;
        }
    };

    worker.onerror = function(error) {
        console.error('Worker error:', error);
        statusEl.innerHTML = `<span class="warning">Ошибка воркера: ${error.message}</span>`;
        crackBtn.disabled = false;
    };

    crackBtn.addEventListener('click', startAnalysis);
    verifyBtn.addEventListener('click', verifySelectedKey);

    function startAnalysis() {
        const ciphertext = ciphertextEl.value.trim().toUpperCase();
        const knownText = knownTextEl.value.trim().toUpperCase();
        const alphabet = alphabetEl.value.trim().toUpperCase();

        if (!validateInputs(ciphertext, knownText, alphabet)) return;

        resetState();
        worker.postMessage({ type: 'crack', ciphertext, knownText, alphabet });
    }

    function validateInputs(ciphertext, knownText, alphabet) {
        if (!ciphertext || !knownText || !alphabet) {
            statusEl.innerHTML = '<span class="warning">Заполните все поля!</span>';
            return false;
        }

        if (new Set(alphabet).size !== alphabet.length) {
            statusEl.innerHTML = '<span class="warning">Алфавит содержит дубликаты!</span>';
            return false;
        }

        return true;
    }

    function resetState() {
        currentResults = [];
        decryptedEl.value = '';
        keyResultsEl.innerHTML = '';
        analysisEl.innerHTML = '';
        crackBtn.disabled = true;
        statusEl.innerHTML = 'Начало анализа...';
    }

    function updateResultsList() {
        keyResultsEl.innerHTML = '';
        currentResults.slice(0, 100).forEach(result => {
            const option = document.createElement('option');
            option.value = result.key;
            option.textContent = `${result.key} (${result.key.length} симв.) → доверие: ${result.confidence.toFixed(2)}`;
            keyResultsEl.appendChild(option);
        });
        verifyBtn.disabled = currentResults.length === 0;
    }

    function showTopResults() {
        analysisEl.innerHTML = currentResults.slice(0, 5).map(result => 
            `<div class="result-item">
                <strong>${result.key}</strong> (поз. ${result.position})<br>
                Фрагмент: <span class="fragment">${result.decryptedFragment}</span>
            </div>`
        ).join('');
    }

    function verifySelectedKey() {
        const selectedKey = keyResultsEl.value;
        if (!selectedKey) return;

        const ciphertext = ciphertextEl.value.trim().toUpperCase();
        const alphabet = alphabetEl.value.trim().toUpperCase();
        
        const decrypted = vigenereDecrypt(ciphertext, selectedKey, alphabet);
        decryptedEl.value = decrypted;
        highlightKnownText(decrypted);
    }

    function highlightKnownText(decrypted) {
        const knownText = knownTextEl.value.trim().toUpperCase();
        if (knownText) {
            decryptedEl.innerHTML = decrypted.replace(
                new RegExp(escapeRegExp(knownText), 
                '<span class="match">$&</span>'
            );
        }
    }

    function vigenereDecrypt(ciphertext, key, alphabet) {
        const n = alphabet.length;
        let decrypted = '';
        let keyIndex = 0;

        for (let i = 0; i < ciphertext.length; i++) {
            const cipherChar = ciphertext[i];
            const cipherPos = alphabet.indexOf(cipherChar);

            if (cipherPos === -1) {
                decrypted += cipherChar;
                continue;
            }

            const keyChar = key[keyIndex % key.length];
            const keyPos = alphabet.indexOf(keyChar);
            const decryptedPos = (cipherPos - keyPos + n) % n;
            
            decrypted += alphabet[decryptedPos];
            keyIndex++;
        }

        return decrypted;
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
});
