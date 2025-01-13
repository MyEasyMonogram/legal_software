import { showAlert, formatDate, formatTags } from './main.js';

console.log('=== Initializing evidence.js module ===');

export let currentEvidenceId = null;

export async function uploadEvidence(event) {
    try {
        console.log('=== Starting evidence upload ===');
        event.preventDefault();
        
        const fileInput = document.getElementById('evidenceFile');
        const titleInput = document.getElementById('evidenceTitle');
        const tagsInput = document.getElementById('evidenceTags');
        const notesInput = document.getElementById('evidenceNotes');
        const uploadModal = document.getElementById('uploadEvidenceModal');
        
        console.log('Checking file input...');
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            showAlert('Please select a file to upload', 'error');
            console.error('No file selected');
            return;
        }
        
        const file = fileInput.files[0];
        console.log(`Processing file: ${file.name} (${file.size} bytes)`);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', titleInput.value || file.name);
        formData.append('tags', tagsInput.value);
        formData.append('notes', notesInput.value);
        
        console.log('Sending upload request...');
        const response = await fetch('/api/evidence', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        console.log('Upload response:', data);
        
        if (response.ok) {
            showAlert('Evidence uploaded successfully', 'success');
            console.log('Upload successful, refreshing evidence table...');
            await loadEvidence();
            
            // Reset form and close modal
            fileInput.value = '';
            titleInput.value = '';
            tagsInput.value = '';
            notesInput.value = '';
            
            const modalInstance = bootstrap.Modal.getInstance(uploadModal);
            if (modalInstance) {
                modalInstance.hide();
            }
        } else {
            throw new Error(data.message || 'Upload failed');
        }
        
    } catch (error) {
        console.error('Error in uploadEvidence:', error);
        showAlert(`Error uploading evidence: ${error.message}`, 'error');
    }
}

export async function loadEvidence() {
    try {
        console.log('=== Loading evidence ===');
        const response = await fetch('/api/evidence');
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to load evidence');
        }
        
        console.log(`Loaded ${data.evidence.length} evidence items`);
        const tbody = document.querySelector('#evidenceTable tbody');
        tbody.innerHTML = '';
        
        data.evidence.forEach(evidence => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${evidence.hierarchical_id}</td>
                <td>${evidence.title}</td>
                <td>${formatDate(evidence.created_at)}</td>
                <td>${formatTags(evidence.tags)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewEvidence('${evidence.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEvidence('${evidence.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error in loadEvidence:', error);
        showAlert(`Error loading evidence: ${error.message}`, 'error');
    }
}

// Initialize evidence functionality when the module loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Setting up evidence event listeners...');
    
    const uploadForm = document.getElementById('uploadEvidenceForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', uploadEvidence);
        console.log('Upload form handler attached');
    }
    
    // Load initial evidence data
    loadEvidence().catch(error => {
        console.error('Error loading initial evidence:', error);
        showAlert('Error loading evidence data', 'error');
    });
}); 