// Функция для расчета "доверия" к ключу (чем выше, тем более осмысленный ключ)
function calculateKeyConfidence(key, alphabet) {
    // Эвристики для определения "осмысленности" ключа:
    // 1. Чем меньше уникальных символов, тем лучше (повторяющиеся паттерны)
    // 2. Чем чаще встречаются символы из начала алфавита (часто используемые буквы)
    // 3. Чем меньше скачков между символами (плавные изменения)
    
    const uniqueChars = new Set(key).size;
    const uniqueScore = 1 - (uniqueChars - 1) / key.length;
    
    let positionScore = 0;
    for (let i = 0; i < key.length; i++) {
        positionScore += 1 - (alphabet.indexOf(key[i]) / alphabet.length);
    }
    positionScore /= key.length;
    
    let smoothness = 0;
    for (let i = 1; i < key.length; i++) {
        const diff = Math.abs(alphabet.indexOf(key[i]) - alphabet.indexOf(key[i-1]));
        smoothness += 1 - (diff / alphabet.length);
    }
    smoothness /= (key.length - 1);
    
    return (uniqueScore * 0.4 + positionScore * 0.3 + smoothness * 0.3);
}

function findAllKeys(ciphertext, knownText, alphabet) {
    const results = [];
    const n = alphabet.length;
    const maxAttempts = 10000; // Защита от бесконечного цикла
    
    let attempts = 0;
    let lastReport = 0;
    
    // Проверяем все возможные позиции в шифртексте
    for (let pos = 0; pos <= ciphertext.length - knownText.length; pos++) {
        if (attempts++ > maxAttempts) break;
        
        // Рассчитываем процент выполнения
        const progress = Math.floor((pos / (ciphertext.length - knownText.length)) * 100);
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
        
        let isValid = true;
        let key = '';
        
        // Проверяем, что все символы известного текста есть в алфавите
        for (let i = 0; i < knownText.length; i++) {
            const knownChar = knownText[i];
            if (alphabet.indexOf(knownChar) === -1) {
                isValid = false;
                break;
            }
        }
        if (!isValid) continue;
        
        // Вычисляем ключ для текущей позиции
        for (let i = 0; i < knownText.length; i++) {
            const cipherChar = ciphertext[pos + i];
            const knownChar = knownText[i];
            
            const cipherIndex = alphabet.indexOf(cipherChar);
            const knownIndex = alphabet.indexOf(knownChar);
            
            if (cipherIndex === -1) {
                isValid = false;
                break;
            }
            
            const keyIndex = (cipherIndex - knownIndex + n) % n;
            key += alphabet[keyIndex];
        }
        
        if (isValid && key.length > 0) {
            const confidence = calculateKeyConfidence(key, alphabet);
            results.push({
                position: pos,
                key,
                confidence
            });
        }
    }
    
    return results;
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
