/**
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';
import {
    loadCharacters,
    saveCharacter,
    viewCharacter,
    deleteCharacter
} from '../../static/js/exports.js';

describe('Characters Management', () => {
    // Setup before each test
    beforeEach(() => {
        // Set up our document body
        document.body.innerHTML = `
            <div class="container">
                <div id="charactersGrid"></div>
                <div id="characterModal">
                    <form id="characterForm">
                        <input type="text" id="characterName" value="Test Character">
                        <input type="text" id="characterRole" value="Test Role">
                        <textarea id="characterNotes">Test Notes</textarea>
                        <input type="file" id="characterImage">
                    </form>
                </div>
                <div id="characterDetailModal">
                    <div id="characterDetailName"></div>
                    <div id="characterDetailRole"></div>
                    <div id="characterDetailNotes"></div>
                    <div id="characterDetailEvents"></div>
                    <img id="characterDetailImage" src="">
                </div>
            </div>
        `;

        // Reset global variables
        global.currentCharacterId = null;
        global.DEFAULT_PROFILE_IMAGE = '/static/img/default-profile.png';
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

        // Mock utility functions
        global.showAlert = jest.fn();
        global.formatDate = (date) => new Date(date).toLocaleString();
        global.formatDateForInput = (date) => new Date(date).toISOString().slice(0, 16);
        global.formatTags = (tags) => {
            if (!tags) return '';
            const tagArray = typeof tags === 'string' ? tags.split(',') : tags;
            return tagArray.map(tag => `<span class="badge bg-secondary">${tag.trim()}</span>`).join('');
        };

        // Mock fetch with a default implementation
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({
                    status: 'success',
                    characters: []
                })
            })
        );
    });

    // Clean up after each test
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('saveCharacter', () => {
        it('should successfully save a new character', async () => {
            // Mock successful response
            global.fetch.mockImplementationOnce(() =>
                Promise.resolve({
                    ok: true,
                    status: 201,
                    json: () => Promise.resolve({
                        status: 'success',
                        data: { id: 1, name: 'Test Character' }
                    })
                })
            );

            await saveCharacter();

            // Verify fetch was called with FormData
            expect(fetch).toHaveBeenCalledWith('/api/characters', {
                method: 'POST',
                body: expect.any(FormData)
            });

            // Verify success message
            expect(showAlert).toHaveBeenCalledWith('Character saved successfully!', 'success');
        });

        it('should handle API errors gracefully', async () => {
            // Mock error response
            global.fetch.mockImplementationOnce(() =>
                Promise.resolve({
                    ok: false,
                    status: 400,
                    json: () => Promise.resolve({
                        status: 'error',
                        message: 'Invalid data'
                    })
                })
            );

            await saveCharacter();

            // Verify error handling
            expect(showAlert).toHaveBeenCalledWith('Error saving character: Invalid data', 'danger');
        });
    });

    describe('loadCharacters', () => {
        it('should load and display characters', async () => {
            // Mock successful response with characters
            global.fetch.mockImplementationOnce(() =>
                Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({
                        status: 'success',
                        characters: [{
                            id: 1,
                            name: 'Test Character',
                            role: 'Test Role',
                            image_path: '/uploads/test.jpg'
                        }]
                    })
                })
            );

            await loadCharacters();

            // Verify characters are displayed
            const grid = document.getElementById('charactersGrid');
            expect(grid.innerHTML).toContain('Test Character');
            expect(grid.innerHTML).toContain('Test Role');
        });

        it('should use default image when character image is not provided', async () => {
            // Mock successful response with character without image
            global.fetch.mockImplementationOnce(() =>
                Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({
                        status: 'success',
                        characters: [{
                            id: 1,
                            name: 'Test Character',
                            role: 'Test Role'
                        }]
                    })
                })
            );

            await loadCharacters();

            // Verify default image is used
            const grid = document.getElementById('charactersGrid');
            expect(grid.innerHTML).toContain(DEFAULT_PROFILE_IMAGE);
        });
    });
}); 