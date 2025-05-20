class VigenereCracker {
    constructor() {
        this.worker = new Worker('worker.js');
        this.initializeUI();
    }

    initializeUI() {
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.statusElement = document.getElementById('status');
        this.keyList = document.getElementById('keyList');
        this.decryptedText = document.getElementById('decryptedText');
        
        this.analyzeBtn.addEventListener('click', () => this.startAnalysis());
        
        this.worker.onmessage = (e) => this.handleWorkerMessage(e);
        this.worker.onerror = (error) => this.handleWorkerError(error);
    }

    startAnalysis() {
        const params = this.getInputParams();
        if (!this.validateInput(params)) return;

        this.clearResults();
        this.setLoadingState(true);
        this.worker.postMessage(params);
    }

    getInputParams() {
        return {
            ciphertext: document.getElementById('ciphertext').value.trim().toUpperCase(),
            knownText: document.getElementById('knownText').value.trim().toUpperCase(),
            alphabet: document.getElementById('alphabet').value.trim().toUpperCase()
        };
    }

    validateInput({ ciphertext, knownText, alphabet }) {
        if (!ciphertext || !knownText || !alphabet) {
            this.showError('All fields are required');
            return false;
        }

        if (new Set(alphabet).size !== alphabet.length) {
            this.showError('Alphabet must contain unique characters');
            return false;
        }

        return true;
    }

    handleWorkerMessage(e) {
        const { type, data } = e.data;
        
        switch (type) {
            case 'progress':
                this.updateProgress(data);
                break;
                
            case 'result':
                this.displayResults(data);
                break;
                
            case 'error':
                this.showError(data.message);
                break;
        }
        
        this.setLoadingState(false);
    }

    displayResults({ keys, decrypted }) {
        this.keyList.innerHTML = keys.map((key, index) => `
            <div class="key-item" onclick="vigenereCracker.selectKey(${index})">
                <div class="key-header">
                    <span class="key-value">${key.value}</span>
                    <span class="key-length">${key.value.length} chars</span>
                </div>
                <div class="key-meta">
                    Position: ${key.position} | Confidence: ${key.confidence.toFixed(2)}
                </div>
            </div>
        `).join('');

        this.decryptedText.innerHTML = this.highlightText(
            decrypted, 
            this.getInputParams().knownText
        );
    }

    selectKey(index) {
        const key = this.currentResults[index];
        this.decryptedText.innerHTML = this.highlightText(
            this.decryptText(key.value),
            this.getInputParams().knownText
        );
    }

    decryptText(key) {
        const { ciphertext, alphabet } = this.getInputParams();
        return VigenereCracker.decrypt(ciphertext, key, alphabet);
    }

    static decrypt(ciphertext, key, alphabet) {
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

    highlightText(text, phrase) {
        if (!phrase) return text;
        const regex = new RegExp(`(${this.escapeRegExp(phrase)})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    updateProgress({ processed, total, keysFound }) {
        const percent = Math.round((processed / total) * 100);
        this.statusElement.innerHTML = `
            <progress value="${percent}" max="100"></progress>
            ${percent}% (Keys found: ${keysFound})
        `;
    }

    showError(message) {
        this.statusElement.innerHTML = `<span style="color: var(--error-color)">${message}</span>`;
    }

    setLoadingState(isLoading) {
        this.analyzeBtn.disabled = isLoading;
    }

    clearResults() {
        this.keyList.innerHTML = '';
        this.decryptedText.innerHTML = '';
    }

    handleWorkerError(error) {
        console.error('Worker error:', error);
        this.showError('Processing error - try shorter inputs');
    }
}

const vigenereCracker = new VigenereCracker();
