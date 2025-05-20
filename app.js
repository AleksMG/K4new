class VigenereCracker {
    constructor() {
        this.worker = new Worker('cipher-worker.js');
        this.currentResults = [];
        this.selectedKey = null;
        
        this.initElements();
        this.initEvents();
    }
    
    initElements() {
        this.elements = {
            ciphertext: document.getElementById('ciphertext'),
            knownText: document.getElementById('knownText'),
            alphabet: document.getElementById('alphabet'),
            analyzeBtn: document.getElementById('analyzeBtn'),
            bruteBtn: document.getElementById('bruteBtn'),
            loader: document.getElementById('loader'),
            keyList: document.getElementById('keyList'),
            decryptedText: document.getElementById('decryptedText'),
            stats: document.getElementById('stats'),
            visualization: document.getElementById('visualization'),
            tabs: document.querySelectorAll('.tab-btn'),
            tabContents: document.querySelectorAll('.tab-content')
        };
    }
    
    initEvents() {
        this.elements.analyzeBtn.addEventListener('click', () => this.analyze());
        this.elements.bruteBtn.addEventListener('click', () => this.smartBruteForce());
        
        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab));
        });
        
        this.worker.onmessage = (e) => {
            this.elements.loader.style.display = 'none';
            
            if (e.data.type === 'analysis') {
                this.handleAnalysisResults(e.data.results);
            } else if (e.data.type === 'brute') {
                this.handleBruteResults(e.data.results);
            }
        };
    }
    
    switchTab(tab) {
        const tabId = tab.getAttribute('data-tab');
        
        this.elements.tabs.forEach(t => t.classList.remove('active'));
        this.elements.tabContents.forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(`${tabId}Tab`).classList.add('active');
    }
    
    analyze() {
        const ciphertext = this.elements.ciphertext.value.trim();
        const knownText = this.elements.knownText.value.trim();
        const alphabet = this.elements.alphabet.value.trim();
        
        if (!ciphertext || !knownText || !alphabet) {
            alert('Please fill all fields');
            return;
        }
        
        this.elements.loader.style.display = 'block';
        this.elements.keyList.innerHTML = '';
        this.elements.bruteBtn.disabled = true;
        
        this.worker.postMessage({
            type: 'analyze',
            ciphertext,
            knownText,
            alphabet
        });
    }
    
    smartBruteForce() {
        if (!this.currentResults.length) return;
        
        this.elements.loader.style.display = 'block';
        this.elements.keyList.innerHTML = '';
        
        const ciphertext = this.elements.ciphertext.value.trim();
        const alphabet = this.elements.alphabet.value.trim();
        
        this.worker.postMessage({
            type: 'brute',
            ciphertext,
            alphabet,
            candidates: this.currentResults.slice(0, 10).map(r => r.key)
        });
    }
    
    handleAnalysisResults(results) {
        this.currentResults = results;
        this.elements.bruteBtn.disabled = false;
        
        if (!results.length) {
            this.elements.keyList.innerHTML = '<p>No possible keys found</p>';
            return;
        }
        
        results.forEach((result, idx) => {
            const keyItem = document.createElement('div');
            keyItem.className = `key-item ${idx === 0 ? 'selected' : ''}`;
            keyItem.innerHTML = `
                <div class="key-header">
                    <span class="key-text">${result.key}</span>
                    <span class="key-score">${result.score.toFixed(2)}</span>
                </div>
                <div class="key-details">
                    Position: ${result.position} | Length: ${result.key.length}<br>
                    Matches: ${result.matches}
                </div>
            `;
            
            keyItem.addEventListener('click', () => {
                document.querySelectorAll('.key-item').forEach(i => i.classList.remove('selected'));
                keyItem.classList.add('selected');
                this.showDecryptedText(result.key);
            });
            
            this.elements.keyList.appendChild(keyItem);
        });
        
        // Show first result by default
        this.showDecryptedText(results[0].key);
    }
    
    handleBruteResults(results) {
        this.currentResults = results;
        this.handleAnalysisResults(results);
    }
    
    showDecryptedText(key) {
        const ciphertext = this.elements.ciphertext.value.trim();
        const alphabet = this.elements.alphabet.value.trim();
        const knownText = this.elements.knownText.value.trim();
        
        const decrypted = CipherCore.decrypt(ciphertext, key, alphabet);
        let highlighted = decrypted;
        
        // Highlight known text occurrences
        if (knownText) {
            const regex = new RegExp(knownText, 'gi');
            highlighted = highlighted.replace(regex, match => 
                `<span class="highlight">${match}</span>`
            );
        }
        
        this.elements.decryptedText.innerHTML = highlighted;
        
        // Update stats
        this.elements.stats.innerHTML = `
            <p><strong>Key:</strong> ${key}</p>
            <p><strong>Key Length:</strong> ${key.length}</p>
            <p><strong>Decrypted Length:</strong> ${decrypted.length} characters</p>
            <p><strong>Known Text Matches:</strong> ${(decrypted.match(new RegExp(knownText, 'gi'))?.length || 0}</p>
        `;
        
        this.selectedKey = key;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VigenereCracker();
});
