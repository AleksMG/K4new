class CipherCore {
    static encrypt(plaintext, key, alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
        if (!plaintext || !key) return '';
        
        const normalizedAlphabet = this.normalizeAlphabet(alphabet);
        const normalizedKey = this.normalizeText(key, normalizedAlphabet);
        const normalizedText = this.normalizeText(plaintext, normalizedAlphabet);
        
        let result = '';
        
        for (let i = 0; i < normalizedText.length; i++) {
            const textChar = normalizedText[i];
            const keyChar = normalizedKey[i % normalizedKey.length];
            
            if (textChar === ' ') {
                result += ' ';
                continue;
            }
            
            const textIndex = normalizedAlphabet.indexOf(textChar);
            const keyIndex = normalizedAlphabet.indexOf(keyChar);
            
            if (textIndex === -1) {
                result += textChar;
                continue;
            }
            
            const newIndex = (textIndex + keyIndex) % normalizedAlphabet.length;
            result += normalizedAlphabet[newIndex];
        }
        
        return result;
    }
    
    static decrypt(ciphertext, key, alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
        if (!ciphertext || !key) return '';
        
        const normalizedAlphabet = this.normalizeAlphabet(alphabet);
        const normalizedKey = this.normalizeText(key, normalizedAlphabet);
        const normalizedText = this.normalizeText(ciphertext, normalizedAlphabet);
        
        let result = '';
        
        for (let i = 0; i < normalizedText.length; i++) {
            const textChar = normalizedText[i];
            const keyChar = normalizedKey[i % normalizedKey.length];
            
            if (textChar === ' ') {
                result += ' ';
                continue;
            }
            
            const textIndex = normalizedAlphabet.indexOf(textChar);
            const keyIndex = normalizedAlphabet.indexOf(keyChar);
            
            if (textIndex === -1) {
                result += textChar;
                continue;
            }
            
            let newIndex = (textIndex - keyIndex) % normalizedAlphabet.length;
            if (newIndex < 0) {
                newIndex += normalizedAlphabet.length;
            }
            
            result += normalizedAlphabet[newIndex];
        }
        
        return result;
    }
    
    static reverseEngineerKey(ciphertextSegment, knownPlaintext, alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
        if (ciphertextSegment.length !== knownPlaintext.length) {
            return null;
        }
        
        const normalizedAlphabet = this.normalizeAlphabet(alphabet);
        const normalizedCipher = this.normalizeText(ciphertextSegment, normalizedAlphabet);
        const normalizedPlain = this.normalizeText(knownPlaintext, normalizedAlphabet);
        
        let key = '';
        
        for (let i = 0; i < normalizedCipher.length; i++) {
            const cipherChar = normalizedCipher[i];
            const plainChar = normalizedPlain[i];
            
            const cipherIndex = normalizedAlphabet.indexOf(cipherChar);
            const plainIndex = normalizedAlphabet.indexOf(plainChar);
            
            if (cipherIndex === -1 || plainIndex === -1) {
                return null;
            }
            
            let keyIndex = (cipherIndex - plainIndex) % normalizedAlphabet.length;
            if (keyIndex < 0) {
                keyIndex += normalizedAlphabet.length;
            }
            
            key += normalizedAlphabet[keyIndex];
        }
        
        return key;
    }
    
    static normalizeAlphabet(alphabet) {
        // Remove duplicates and convert to uppercase
        const unique = new Set(alphabet.toUpperCase().split(''));
        return Array.from(unique).join('');
    }
    
    static normalizeText(text, alphabet) {
        // Convert to uppercase and filter characters not in alphabet
        return text.toUpperCase().split('').filter(c => 
            alphabet.includes(c) || c === ' '
        ).join('');
    }
}
