document.addEventListener('DOMContentLoaded', () => {
    const crackBtn = document.getElementById('crackBtn');
    const verifyBtn = document.getElementById('verifyBtn');
    const exportBtn = document.getElementById('exportBtn');
    const ciphertextEl = document.getElementById('ciphertext');
    const knownTextEl = document.getElementById('knownText');
    const alphabetEl = document.getElementById('alphabet');
    const keyResultsEl = document.getElementById('keyResults');
    const decryptedEl = document.getElementById('decrypted');
    const statusEl = document.getElementById('status');
    const analysisEl = document.getElementById('analysisDetails');
    
    let currentResults = [];
    let worker = new Worker('worker.js');
    
    worker.onmessage = function(e) {
        const { type, data } = e.data;
        
        switch(type) {
            case 'progress':
                statusEl.innerHTML = `Анализ... ${data.progress}% (найдено ${data.keys} ключей)`;
                break;
                
            case 'result':
                currentResults = data.results;
                updateResultsList();
                showTopDecryptions();
                statusEl.innerHTML = `<span class="success">Анализ завершен! Найдено ${currentResults.length} возможных ключей.</span>`;
                crackBtn.disabled = false;
                break;
                
            case 'error':
                statusEl.innerHTML = `<span class="warning">Ошибка: ${data.message}</span>`;
                crackBtn.disabled = false;
                break;
        }
    };
    
    crackBtn.addEventListener('click', () => {
        const ciphertext = ciphertextEl.value.trim().toUpperCase();
        const knownText = knownTextEl.value.trim().toUpperCase();
        const alphabet = alphabetEl.value.trim().toUpperCase();
        
        if (!ciphertext || !knownText || !alphabet) {
            statusEl.innerHTML = '<span class="warning">Заполните все поля!</span>';
            return;
        }
        
        if (new Set(alphabet).size !== alphabet.length) {
            statusEl.innerHTML = '<span class="warning">Алфавит содержит повторяющиеся символы!</span>';
            return;
        }
        
        statusEl.innerHTML = 'Начинаем анализ...';
        crackBtn.disabled = true;
        currentResults = [];
        updateResultsList();
        decryptedEl.value = '';
        
        worker.postMessage({
            type: 'crack',
            ciphertext,
            knownText,
            alphabet
        });
    });
    
    verifyBtn.addEventListener('click', () => {
        const selectedIndex = keyResultsEl.selectedIndex;
        if (selectedIndex === -1) return;
        
        const selectedResult = currentResults[selectedIndex];
        const ciphertext = ciphertextEl.value.trim().toUpperCase();
        const alphabet = alphabetEl.value.trim().toUpperCase();
        
        const decrypted = vigenereDecrypt(ciphertext, selectedResult.key, alphabet);
        displayDecryptedText(decrypted, selectedResult.position, knownTextEl.value.trim().toUpperCase());
    });
    
    exportBtn.addEventListener('click', () => {
        if (currentResults.length === 0) {
            alert('Нет результатов для экспорта!');
            return;
        }
        
        let exportData = `Результаты анализа Kryptos Cracker\n`;
        exportData += `Дата: ${new Date().toLocaleString()}\n`;
        exportData += `Шифртекст: ${ciphertextEl.value.trim()}\n`;
        exportData += `Известный текст: ${knownTextEl.value.trim()}\n`;
        exportData += `Алфавит: ${alphabetEl.value.trim()}\n\n`;
        exportData += `Найденные ключи (${currentResults.length}):\n`;
        
        currentResults.forEach(result => {
            exportData += `- Ключ "${result.key}" (длина: ${result.key.length}, позиция: ${result.position}, доверие: ${result.confidence.toFixed(2)})\n`;
            exportData += `  Расшифрованный фрагмент: "${result.decryptedFragment}"\n`;
        });
        
        const blob = new Blob([exportData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kryptos_results_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    
    function updateResultsList() {
        keyResultsEl.innerHTML = '';
        
        currentResults.sort((a, b) => b.confidence - a.confidence);
        
        currentResults.forEach((result, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `"${result.key}" (длина: ${result.key.length}, поз. ${result.position}, доверие: ${result.confidence.toFixed(2)})`;
            keyResultsEl.appendChild(option);
        });
        
        verifyBtn.disabled = currentResults.length === 0;
    }
    
    function showTopDecryptions() {
        if (currentResults.length === 0) return;
        
        let topResults = currentResults.slice(0, 10);
        let html = '<h4>Топ-10 расшифровок:</h4><ol>';
        
        topResults.forEach(result => {
            html += `<li>
                <strong>Ключ "${result.key}"</strong> (длина ${result.key.length}):
                <div class="fragment">..."${result.decryptedFragment}"...</div>
                <small>Позиция: ${result.position}, Доверие: ${result.confidence.toFixed(2)}</small>
            </li>`;
        });
        
        html += '</ol>';
        analysisEl.innerHTML = html;
    }
    
    function displayDecryptedText(decrypted, position, knownText) {
        // Показываем полный расшифрованный текст
        decryptedEl.value = decrypted;
        
        // Подсвечиваем известный текст и позицию
        if (knownText && decrypted.includes(knownText)) {
            let highlighted = decrypted;
            
            // Подсветка всех вхождений известного текста
            highlighted = highlighted.replace(
                new RegExp(escapeRegExp(knownText), 
                `<span class="match">${knownText}</span>`
            );
            
            // Особое выделение основного вхождения
            const mainMatch = decrypted.substr(position, knownText.length);
            if (mainMatch === knownText) {
                highlighted = highlighted.substr(0, position) + 
                    `<span class="main-match">${mainMatch}</span>` + 
                    highlighted.substr(position + knownText.length);
            }
            
            decryptedEl.innerHTML = highlighted;
        } else {
            decryptedEl.innerHTML = decrypted;
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
            
            if (keyPos === -1) {
                decrypted += '?';
                keyIndex++;
                continue;
            }
            
            const decryptedPos = (cipherPos - keyPos + n) % n;
            decrypted += alphabet[decryptedPos];
            
            keyIndex++;
        }
        
        return decrypted;
    }
    
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    keyResultsEl.addEventListener('change', () => {
        verifyBtn.disabled = keyResultsEl.selectedIndex === -1;
    });
});
