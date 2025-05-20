function calculateConfidence(key, decryptedFragment) {
    // Реализация оценки ключа
    const factors = {
        length: Math.min(1, 5 / key.length),
        uniqueness: 1 - (new Set(key).size - 1) / key.length,
        vowels: (decryptedFragment.match(/[AEIOUY]/gi) || []).length / decryptedFragment.length
    };

    return (factors.length * 0.5 + factors.uniqueness * 0.3 + factors.vowels * 0.2);
}

self.onmessage = function(e) {
    if (e.data.type !== 'crack') return;

    const { ciphertext, knownText, alphabet } = e.data;
    const maxKeyLength = 15;
    const results = [];
    const totalSteps = maxKeyLength * ciphertext.length;
    let stepsDone = 0;

    for (let keyLength = 1; keyLength <= maxKeyLength; keyLength++) {
        for (let pos = 0; pos < ciphertext.length; pos++) {
            let key = '';
            let valid = true;

            for (let i = 0; i < keyLength; i++) {
                const actualPos = (pos + i) % ciphertext.length;
                const cipherChar = ciphertext[actualPos];
                const knownChar = knownText[i % knownText.length];

                const cipherIndex = alphabet.indexOf(cipherChar);
                const knownIndex = alphabet.indexOf(knownChar);

                if (cipherIndex === -1 || knownIndex === -1) {
                    valid = false;
                    break;
                }

                const keyIndex = (cipherIndex - knownIndex + alphabet.length) % alphabet.length;
                key += alphabet[keyIndex];
            }

            if (valid && key.length === keyLength) {
                const decryptedFragment = decryptFragment(
                    ciphertext.substring(pos, pos + knownText.length),
                    key,
                    alphabet
                );

                results.push({
                    key,
                    position: pos,
                    confidence: calculateConfidence(key, decryptedFragment),
                    decryptedFragment
                });
            }

            stepsDone++;
            if (stepsDone % 100 === 0) {
                self.postMessage({
                    type: 'progress',
                    data: {
                        progress: Math.floor((stepsDone / totalSteps) * 100),
                        keys: results.length
                    }
                });
            }
        }
    }

    self.postMessage({ type: 'result', data: { results } });
};

function decryptFragment(ciphertext, key, alphabet) {
    let decrypted = '';
    let keyIndex = 0;

    for (let i = 0; i < ciphertext.length; i++) {
        const cipherPos = alphabet.indexOf(ciphertext[i]);
        const keyPos = alphabet.indexOf(key[keyIndex % key.length]);
        decrypted += alphabet[(cipherPos - keyPos + alphabet.length) % alphabet.length];
        keyIndex++;
    }

    return decrypted;
}
