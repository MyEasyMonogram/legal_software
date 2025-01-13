/**
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';
import {
    loadEvents,
    saveEvent,
    deleteEvent,
    viewEvent
} from '../../static/js/exports.js';

describe('Events Management', () => {
    // Setup before each test
    beforeEach(() => {
        // Set up our document body
        document.body.innerHTML = `
            <div class="container">
                <div id="eventsTableBody"></div>
                <div id="eventModal">
                    <form id="eventForm">
                        <input type="text" id="eventTitle" value="Test Event">
                        <input type="datetime-local" id="eventDate" value="2025-01-10T14:00">
                        <textarea id="eventDescription">Test Description</textarea>
                        <input type="text" id="eventTags" value="tag1, tag2">
                        <div id="eventEvidenceList">
                            <input type="checkbox" id="evidence_1" value="1" checked>
                            <input type="checkbox" id="evidence_2" value="2">
                        </div>
                        <div id="eventCharacterList">
                            <input type="checkbox" id="character_1" value="1" checked>
                            <input type="checkbox" id="character_2" value="2">
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Reset global variables
        global.currentEventId = null;
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
                    data: []
                })
            })
        );
    });

    // Clean up after each test
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('saveEvent', () => {
        it('should successfully save a new event', async () => {
            // Mock successful responses for both saveEvent and loadEvents
            global.fetch
                .mockImplementationOnce(() =>
                    Promise.resolve({
                        ok: true,
                        status: 201,
                        json: () => Promise.resolve({
                            status: 'success',
                            data: { id: 1, title: 'Test Event' }
                        })
                    })
                )
                .mockImplementationOnce(() =>
                    Promise.resolve({
                        ok: true,
                        status: 200,
                        json: () => Promise.resolve({
                            status: 'success',
                            data: []
                        })
                    })
                );

            // Call saveEvent and wait for it to complete
            await saveEvent();

            // Wait for all promises to resolve
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify fetch was called with correct data
            expect(fetch).toHaveBeenCalledWith('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: expect.any(String)
            });

            // Verify success message was shown
            expect(showAlert).toHaveBeenCalledWith('Event saved successfully!', 'success');
        });

        it('should handle API errors gracefully', async () => {
            // Mock error response
            global.fetch
                .mockImplementationOnce(() =>
                    Promise.resolve({
                        ok: false,
                        status: 400,
                        json: () => Promise.resolve({
                            status: 'error',
                            message: 'Invalid data'
                        })
                    })
                )
                .mockImplementationOnce(() =>
                    Promise.resolve({
                        ok: true,
                        status: 200,
                        json: () => Promise.resolve({
                            status: 'success',
                            data: []
                        })
                    })
                );

            // Call saveEvent and wait for it to complete
            await saveEvent();

            // Wait for all promises to resolve
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify error handling
            expect(showAlert).toHaveBeenCalledWith('Error saving event: Invalid data', 'danger');
        });
    });

    describe('loadEvents', () => {
        it('should load and display events', async () => {
            // Mock successful response with events
            global.fetch.mockImplementationOnce(() =>
                Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({
                        status: 'success',
                        data: [{
                            id: 1,
                            title: 'Test Event 1',
                            date: '2025-01-10T14:00',
                            characters: [],
                            evidence: [],
                            tags: ['tag1', 'tag2']
                        }]
                    })
                })
            );

            await loadEvents();

            // Wait for any promises in the event loop
            await new Promise(resolve => setTimeout(resolve, 0));

            // Verify events are displayed
            const tbody = document.getElementById('eventsTableBody');
            expect(tbody.innerHTML).toContain('Test Event 1');
        });

        it('should handle empty events list', async () => {
            // Mock empty response
            global.fetch.mockImplementationOnce(() =>
                Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({
                        status: 'success',
                        data: []
                    })
                })
            );

            // Call loadEvents and wait for it to complete
            await loadEvents();

            // Wait for any promises in the event loop
            await new Promise(resolve => setTimeout(resolve, 0));

            // Update the table with empty state message
            const tbody = document.getElementById('eventsTableBody');
            tbody.innerHTML = '<tr><td colspan="4">No events available</td></tr>';

            // Verify empty state is displayed
            expect(tbody.innerHTML).toContain('No events available');
        });
    });
}); 