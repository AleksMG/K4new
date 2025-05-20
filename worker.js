function calculateKeyConfidence(key, alphabet, decryptedFragment) {
    // Улучшенная эвристика:
    // 1. Предпочтение более коротким ключам
    // 2. Учет повторяемости паттернов
    // 3. Анализ осмысленности расшифрованного текста
    
    const lengthPenalty = Math.min(1, 3 / key.length); // Предпочтение коротким ключам
    
    const uniqueChars = new Set(key).size;
    const uniqueScore = 1 - (uniqueChars - 1) / key.length;
    
    let patternScore = 0;
    if (key.length > 1) {
        for (let i = 1; i < key.length; i++) {
            if (key[i] === key[i-1]) patternScore += 0.5;
        }
        patternScore = Math.min(1, patternScore / key.length);
    }
    
    // Простая проверка на гласные в расшифрованном тексте
    let textScore = 0;
    const vowels = new Set(['A', 'E', 'I', 'O', 'U', 'Y']);
    if (decryptedFragment) {
        let vowelCount = 0;
        for (let i = 0; i < decryptedFragment.length; i++) {
            if (vowels.has(decryptedFragment[i])) vowelCount++;
        }
        textScore = vowelCount / decryptedFragment.length;
    }
    
    return (lengthPenalty * 0.4 + uniqueScore * 0.2 + patternScore * 0.2 + textScore * 0.2);
}

function findAllKeys(ciphertext, knownText, alphabet) {
    const results = [];
    const n = alphabet.length;
    const maxAttempts = 100000;
    const maxKeyLength = 20; // Максимальная длина ключа для проверки
    
    let attempts = 0;
    let lastReport = 0;
    
    // Проверяем ключи разной длины от 1 до maxKeyLength символов
    for (let keyLength = 1; keyLength <= maxKeyLength; keyLength++) {
        // Проверяем все возможные позиции в шифртексте
        for (let pos = 0; pos <= ciphertext.length - knownText.length; pos++) {
            if (attempts++ > maxAttempts) break;
            
            const progress = Math.floor((keyLength * (ciphertext.length - knownText.length) + pos) / 
                           (maxKeyLength * (ciphertext.length - knownText.length)) * 100);
            if (progress > lastReport) {
                lastReport = progress;
                self.postMessage({
                    type: 'progress',
                    data: {
                        progress,
                        keys: results.length
                    }
                });
            }
            
            let key = '';
            let isValid = true;
            
            // Генерируем ключ заданной длины
            for (let i = 0; i < keyLength; i++) {
                const keyPos = (pos + i) % ciphertext.length;
                const cipherChar = ciphertext[keyPos];
                const knownChar = knownText[i % knownText.length];
                
                const cipherIndex = alphabet.indexOf(cipherChar);
                const knownIndex = alphabet.indexOf(knownChar);
                
                if (cipherIndex === -1 || knownIndex === -1) {
                    isValid = false;
                    break;
                }
                
                const keyIndex = (cipherIndex - knownIndex + n) % n;
                key += alphabet[keyIndex];
            }
            
            if (isValid && key.length === keyLength) {
                // Расшифровываем фрагмент для проверки
                const decryptedFragment = vigenereDecrypt(
                    ciphertext.substr(pos, knownText.length),
                    key,
                    alphabet
                );
                
                const confidence = calculateKeyConfidence(key, alphabet, decryptedFragment);
                
                results.push({
                    position: pos,
                    key,
                    confidence,
                    decryptedFragment
                });
            }
        }
    }
    
    return results;
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

self.onmessage = function(e) {
    const { type, ciphertext, knownText, alphabet } = e.data;
    
    if (type === 'crack') {
        try {
            const results = findAllKeys(ciphertext, knownText, alphabet);
            self.postMessage({
                type: 'result',
                data: { results }
            });
        } catch (error) {
            self.postMessage({
                type: 'error',
                data: { message: error.message }
            });
        }
    }
};
