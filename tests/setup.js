import { jest } from '@jest/globals';

// Mock browser globals
global.bootstrap = {
    Modal: class {
        static getInstance() {
            return {
                hide: jest.fn(),
                show: jest.fn()
            };
        }
    }
};

// Mock FormData
global.FormData = class FormData {
    constructor() {
        this.data = new Map();
    }
    append(key, value) {
        this.data.set(key, value);
    }
    get(key) {
        return this.data.get(key);
    }
    // Add toString method to help with debugging
    toString() {
        return '[object FormData]';
    }
    [Symbol.toStringTag] = 'FormData';
};

// Mock File API
global.File = class File {
    constructor(bits, name, options = {}) {
        this.name = name;
        this.type = options.type || '';
        this.size = bits.length;
    }
};

// Mock utility functions
global.showAlert = jest.fn();
global.formatDate = (date) => new Date(date).toLocaleString();
global.formatDateForInput = (date) => new Date(date).toISOString().slice(0, 16);
global.formatTags = (tags) => {
    if (!tags) return '';
    const tagArray = typeof tags === 'string' ? tags.split(',') : tags;
    return tagArray.map(tag => `<span class="badge bg-secondary">${tag.trim()}</span>`).join('');
}; 