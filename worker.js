importScripts('cipher-core.js');

self.onmessage = function(e) {
    const { type } = e.data;
    
    if (type === 'analyze') {
        const results = analyzeCipher(e.data.ciphertext, e.data.knownText, e.data.alphabet);
        self.postMessage({ type: 'analysis', results });
    } 
    else if (type === 'brute') {
        const results = smartBruteForce(e.data.ciphertext, e.data.alphabet, e.data.candidates);
        self.postMessage({ type: 'brute', results });
    }
};

function analyzeCipher(ciphertext, knownText, alphabet) {
    const results = [];
    
    // Find all possible positions of known text in ciphertext
    for (let i = 0; i <= ciphertext.length - knownText.length; i++) {
        const possibleKey = CipherCore.reverseEngineerKey(
            ciphertext.substr(i, knownText.length),
            knownText,
            alphabet
        );
        
        if (possibleKey) {
            // Decrypt full text with this potential key
            const decrypted = CipherCore.decrypt(ciphertext, possibleKey, alphabet);
            
            // Score the key based on various factors
            const score = scoreKey(possibleKey, decrypted, knownText);
            
            results.push({
                key: possibleKey,
                position: i,
                decrypted,
                score,
                matches: (decrypted.match(new RegExp(knownText, 'gi'))?.length || 0
            });
        }
    }
    
    // Sort by score (descending)
    return results.sort((a, b) => b.score - a.score);
}

function smartBruteForce(ciphertext, alphabet, candidates) {
    const results = [];
    
    // For each candidate key, try variations
    candidates.forEach(baseKey => {
        // Try different key lengths by repeating or truncating
        const variations = generateKeyVariations(baseKey, 3);
        
        variations.forEach(variant => {
            const decrypted = CipherCore.decrypt(ciphertext, varient, alphabet);
            const score = scoreKey(variant, decrypted);
            
            results.push({
                key: variant,
                decrypted,
                score,
                matches: 0 // Not tracking known text matches here
            });
        });
    });
    
    return results.sort((a, b) => b.score - a.score);
}

function generateKeyVariations(baseKey, maxLengthDiff = 2) {
    const variations = [baseKey];
    const baseLength = baseKey.length;
    
    // Generate shorter keys
    for (let i = 1; i <= maxLengthDiff; i++) {
        if (baseLength - i > 0) {
            variations.push(baseKey.substring(0, baseLength - i));
        }
    }
    
    // Generate longer keys by repeating
    for (let i = 1; i <= maxLengthDiff; i++) {
        variations.push(baseKey.repeat(Math.ceil((baseLength + i) / baseLength)).substring(0, baseLength + i));
    }
    
    return variations;
}

function scoreKey(key, decryptedText, knownText = '') {
    let score = 0;
    
    // 1. Shorter keys are better (if they produce good results)
    score += (1 / key.length) * 10;
    
    // 2. More known text matches is better
    if (knownText) {
        const matches = (decryptedText.match(new RegExp(knownText, 'gi'))?.length || 0;
        score += matches * 5;
    }
    
    // 3. Higher ratio of alphabetic characters is better
    const alphaChars = decryptedText.replace(/[^a-zA-Z]/g, '').length;
    score += (alphaChars / decryptedText.length) * 20;
    
    // 4. Higher ratio of lowercase letters (more likely to be plaintext)
    const lowerChars = decryptedText.replace(/[^a-z]/g, '').length;
    score += (lowerChars / decryptedText.length) * 10;
    
    // 5. Higher ratio of space characters (if present)
    const spaceCount = decryptedText.split(' ').length - 1;
    score += (spaceCount / decryptedText.length) * 15;
    
    return score;
}
