self.addEventListener('message', (e) => {
    const { ciphertext, knownText, alphabet } = e.data;
    const results = [];
    const totalPositions = ciphertext.length - knownText.length;
    const startTime = Date.now();

    try {
        for (let position = 0; position <= totalPositions; position++) {
            const key = this.calculatePotentialKey(position, ciphertext, knownText, alphabet);
            if (key) {
                results.push({
                    value: key,
                    position,
                    confidence: this.calculateKeyConfidence(key, alphabet)
                });
            }

            if (Date.now() - startTime > 5000) { // Prevent infinite loops
                throw new Error('Processing timeout');
            }

            if (position % 100 === 0) {
                self.postMessage({
                    type: 'progress',
                    data: {
                        processed: position,
                        total: totalPositions
                    }
                });
            }
        }

        self.postMessage({
            type: 'result',
            data: {
                keys: results.sort((a, b) => b.confidence - a.confidence),
                decrypted: this.decryptFullText(ciphertext, results[0]?.value || '', alphabet)
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
    const commonChars = new Set(['K', 'R', 'Y', 'P', 'T', 'O', 'S']); // Kryptos-specific
    let score = 0;
    
    // Length heuristic
    score += Math.min(1, 5 / key.length) * 0.4;
    
    // Uniqueness heuristic
    score += (uniqueChars / key.length) * 0.3;
    
    // Common characters heuristic
    score += (Array.from(key).filter(c => commonChars.has(c)).length / key.length) * 0.3;
    
    return Math.min(1, score);
}

function decryptFullText(ciphertext, key, alphabet) {
    if (!key) return '';
    return VigenereCracker.decrypt(ciphertext, key, alphabet);
}
