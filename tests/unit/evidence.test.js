/**
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';
import {
    loadEvidence,
    uploadEvidence,
    viewEvidence,
    saveEvidenceDetails
} from '../../static/js/exports.js';

describe('Evidence Management', () => {
    // Setup before each test
    beforeEach(() => {
        // Set up our document body
        document.body.innerHTML = `
            <div class="container">
                <table>
                    <tbody id="evidenceTableBody"></tbody>
                </table>
                <div id="uploadModal">
                    <form id="uploadForm">
                        <input type="file" id="evidenceFile">
                        <input type="text" id="evidenceTags" value="tag1, tag2">
                        <textarea id="evidenceNotes">Test Notes</textarea>
                    </form>
                </div>
                <div id="evidenceDetailModal">
                    <input type="text" id="detailId">
                    <input type="text" id="detailFileName">
                    <input type="text" id="detailTags">
                    <textarea id="detailNotes"></textarea>
                    <div id="previewContainer"></div>
                </div>
            </div>
        `;

        // Reset global variables
        global.evidenceData = [];
        global.currentEvidenceId = null;
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
                    evidence: []
                })
            })
        );
    });

    // Clean up after each test
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('loadEvidence', () => {
        it('should load and display evidence', async () => {
            // Mock successful response with evidence
            const mockEvidence = {
                id: 1,
                file_name: 'test.pdf',
                file_type: 'application/pdf',
                import_date: '2025-01-10T14:00:00',
                tags: ['tag1', 'tag2']
            };

            global.fetch.mockImplementationOnce(() =>
                Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({
                        status: 'success',
                        evidence: [mockEvidence]
                    })
                })
            );

            // Call loadEvidence and wait for it to complete
            await loadEvidence();

            // Wait for any promises in the event loop
            await new Promise(resolve => setTimeout(resolve, 0));

            // Verify evidence is displayed
            const tbody = document.getElementById('evidenceTableBody');
            expect(tbody.innerHTML).toContain('test.pdf');
            expect(tbody.innerHTML).toContain('tag1, tag2');
        });

        it('should handle API errors gracefully', async () => {
            // Mock error response
            global.fetch.mockImplementationOnce(() =>
                Promise.reject(new Error('Network error'))
            );

            try {
                await loadEvidence();
            } catch (error) {
                // Error is expected
            }

            // Wait for any promises in the event loop
            await new Promise(resolve => setTimeout(resolve, 0));

            // Verify error handling
            expect(showAlert).toHaveBeenCalledWith('Error loading evidence. Please try again.', 'danger');
        });
    });

    describe('uploadEvidence', () => {
        it('should successfully upload evidence', async () => {
            // Mock file input
            const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
            const fileInput = document.getElementById('evidenceFile');
            Object.defineProperty(fileInput, 'files', {
                value: [file]
            });

            // Mock successful response
            global.fetch.mockImplementationOnce(() =>
                Promise.resolve({
                    ok: true,
                    status: 201,
                    json: () => Promise.resolve({
                        status: 'success',
                        message: 'Evidence uploaded successfully!'
                    })
                })
            );

            await uploadEvidence();

            // Wait for any promises in the event loop
            await new Promise(resolve => setTimeout(resolve, 0));

            // Verify fetch was called with FormData
            expect(fetch).toHaveBeenCalledWith('/api/evidence', {
                method: 'POST',
                body: expect.any(FormData)
            });

            // Verify success message
            expect(showAlert).toHaveBeenCalledWith('Evidence uploaded successfully!', 'success');
        });

        it('should require a file selection', async () => {
            await uploadEvidence();

            // Verify error message
            expect(showAlert).toHaveBeenCalledWith('Please select a file to upload', 'danger');
            expect(fetch).not.toHaveBeenCalled();
        });
    });
}); 