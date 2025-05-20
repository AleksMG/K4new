self.addEventListener('message', (e) => {
    const { ciphertext, knownText, alphabet } = e.data;
    const results = [];
    const totalPositions = ciphertext.length - knownText.length;
    const startTime = Date.now();

    try {
        for (let position = 0; position <= totalPositions; position++) {
            const key = calculatePotentialKey(position, ciphertext, knownText, alphabet);
            if (key) {
                results.push({
                    value: key,
                    position,
                    confidence: calculateKeyConfidence(key, alphabet)
                });
            }

            if (Date.now() - startTime > 5000) {
                throw new Error('Processing timeout');
            }

            if (position % 10 === 0) {
                self.postMessage({
                    type: 'progress',
                    data: {
                        processed: position,
                        total: totalPositions,
                        keysFound: results.length
                    }
                });
            }
        }

        self.postMessage({
            type: 'result',
            data: {
                keys: results.sort((a, b) => b.confidence - a.confidence),
                decrypted: decryptFullText(ciphertext, results[0]?.value || '', alphabet)
            }
        });
    } catch (error) {
        self.postMessage({
            type: 'error',
            data: { message: error.message }
        });
    }
});

function calculatePotentialKey(position, ciphertext, knownText, alphabet) {
    const mod = alphabet.length;
    let key = '';
    
    for (let i = 0; i < knownText.length; i++) {
        const cipherChar = ciphertext[position + i];
        const knownChar = knownText[i];
        
        const cipherIndex = alphabet.indexOf(cipherChar);
        const knownIndex = alphabet.indexOf(knownChar);
        
        if (cipherIndex === -1 || knownIndex === -1) return null;
        
        const keyIndex = (cipherIndex - knownIndex + mod) % mod;
        key += alphabet[keyIndex];
    }
    
    return key;
}

function calculateKeyConfidence(key, alphabet) {
    const uniqueChars = new Set(key).size;
    const commonChars = new Set(['K','R','Y','P','T','O','S']);
    let score = 0;
    
    // Length heuristic
    score += Math.min(1, 5 / key.length) * 0.4;
    
    // Uniqueness heuristic
    score += (uniqueChars / key.length) * 0.3;
    
    // Common characters
    score += (Array.from(key).filter(c => commonChars.has(c)).length / key.length) * 0.3;
    
    return Math.min(1, score);
}

function decryptFullText(ciphertext, key, alphabet) {
    if (!key) return '';
    return VigenereCracker.decrypt(ciphertext, key, alphabet);
}

// Fix for undefined reference
const VigenereCracker = {
    decrypt: (ciphertext, key, alphabet) => {
        const mod = alphabet.length;
        return ciphertext.split('').map((char, index) => {
            const keyChar = key[index % key.length];
            const charPos = alphabet.indexOf(char);
            const keyPos = alphabet.indexOf(keyChar);
            return charPos === -1 || keyPos === -1 
                ? char 
                : alphabet[(charPos - keyPos + mod) % mod];
        }).join('');
    }
};
