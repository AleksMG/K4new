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
    
    // Обработчик сообщений от Web Worker
    worker.onmessage = function(e) {
        const { type, data } = e.data;
        
        switch(type) {
            case 'progress':
                statusEl.innerHTML = `Анализ... ${data.progress}% (найдено ${data.keys} ключей)`;
                break;
                
            case 'result':
                currentResults = data.results;
                updateResultsList();
                statusEl.innerHTML = `<span class="success">Анализ завершен! Найдено ${currentResults.length} возможных ключей.</span>`;
                crackBtn.disabled = false;
                break;
                
            case 'error':
                statusEl.innerHTML = `<span class="warning">Ошибка: ${data.message}</span>`;
                crackBtn.disabled = false;
                break;
        }
    };
    
    // Найти все возможные ключи
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
        
        worker.postMessage({
            type: 'crack',
            ciphertext,
            knownText,
            alphabet
        });
    });
    
    // Проверить выбранный ключ
    verifyBtn.addEventListener('click', () => {
        const selectedKey = keyResultsEl.value;
        if (!selectedKey) return;
        
        const ciphertext = ciphertextEl.value.trim().toUpperCase();
        const alphabet = alphabetEl.value.trim().toUpperCase();
        
        const decrypted = vigenereDecrypt(ciphertext, selectedKey, alphabet);
        decryptedEl.value = decrypted;
        
        // Подсветка известного текста
        const knownText = knownTextEl.value.trim().toUpperCase();
        if (decrypted.includes(knownText)) {
            const highlighted = decrypted.replace(
                new RegExp(knownText, 'g'), 
                `<span class="match">${knownText}</span>`
            );
            decryptedEl.innerHTML = highlighted;
        }
    });
    
    // Экспорт результатов
    exportBtn.addEventListener('click', () => {
        if (currentResults.length === 0) {
            alert('Нет результатов для экспорта!');
            return;
        }
        
        let exportData = `Результаты анализа Kryptos Cracker\n`;
        exportData += `Дата: ${new Date().toLocaleString()}\n`;
        exportData += `Шифртекст: ${ciphertextEl.value.trim().substring(0, 50)}...\n`;
        exportData += `Известный текст: ${knownTextEl.value.trim()}\n`;
        exportData += `Алфавит: ${alphabetEl.value.trim()}\n\n`;
        exportData += `Найденные ключи (${currentResults.length}):\n`;
        
        currentResults.forEach(result => {
            exportData += `- Ключ "${result.key}" (позиция ${result.position}, доверие ${result.confidence.toFixed(2)})\n`;
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
    
    // Обновление списка ключей
    function updateResultsList() {
        keyResultsEl.innerHTML = '';
        
        currentResults.sort((a, b) => b.confidence - a.confidence);
        
        currentResults.forEach(result => {
            const option = document.createElement('option');
            option.value = result.key;
            option.textContent = `"${result.key}" (поз. ${result.position}, доверие: ${result.confidence.toFixed(2)})`;
            keyResultsEl.appendChild(option);
        });
        
        verifyBtn.disabled = currentResults.length === 0;
    }
    
    // Функция расшифровки Виженера
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
    
    // Обработчик выбора ключа
    keyResultsEl.addEventListener('change', () => {
        verifyBtn.disabled = keyResultsEl.selectedIndex === -1;
    });
});
