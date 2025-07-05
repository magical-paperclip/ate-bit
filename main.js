import { Terminal } from './terminal.js';

// Initialize terminal when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.terminal = new Terminal();
});