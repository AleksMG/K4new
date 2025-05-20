:root {
    --primary-color: #2c3e50;
    --secondary-color: #3498db;
    --background-color: #f8f9fa;
    --error-color: #e74c3c;
    --success-color: #27ae60;
}

body {
    font-family: 'Roboto', sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 2rem;
    background-color: var(--background-color);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 15px rgba(0,0,0,0.1);
}

.input-section {
    margin-bottom: 2rem;
}

.input-group {
    margin-bottom: 1.5rem;
}

label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--primary-color);
}

input, textarea {
    width: 100%;
    padding: 0.8rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
}

.monospace {
    font-family: 'Fira Code', monospace;
    font-size: 0.9rem;
}

.controls {
    display: flex;
    align-items: center;
    gap: 1rem;
}

button {
    padding: 0.8rem 1.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
}

button.primary {
    background-color: var(--secondary-color);
    color: white;
}

button.primary:hover {
    background-color: #2980b9;
}

.results-section {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 2rem;
    margin-top: 2rem;
}

.key-list {
    height: 500px;
    overflow-y: auto;
    border: 1px solid #eee;
    border-radius: 4px;
    padding: 1rem;
}

.key-item {
    padding: 0.8rem;
    margin-bottom: 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.key-item:hover {
    background-color: var(--background-color);
}

.decryption-results {
    border: 1px solid #eee;
    border-radius: 4px;
    padding: 1rem;
    height: 500px;
    overflow-y: auto;
}

.highlight {
    background-color: #fff3cd;
    padding: 0.2rem 0.4rem;
    border-radius: 2px;
}

.status {
    color: var(--primary-color);
    font-size: 0.9rem;
}
