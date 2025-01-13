// Global variables
console.log('=== Initializing main.js module ===');

export let currentEvidenceId = null;
export let currentEventId = null;
export let currentCharacterId = null;

// Event Listeners Setup
export function setupEventListeners() {
    console.log('=== Setting up event listeners ===');
    
    // Event form submission
    const saveEventBtn = document.getElementById('saveEventBtn');
    console.log('Looking for save event button...', saveEventBtn);
    
    if (saveEventBtn) {
        console.log('Found save event button, attaching click listener');
        // Remove the button's current click listeners
        const newBtn = saveEventBtn.cloneNode(true);
        saveEventBtn.parentNode.replaceChild(newBtn, saveEventBtn);
        
        // Add the new click listener
        newBtn.addEventListener('click', function(e) {
            console.log('Save event button clicked!');
            e.preventDefault();
            window.saveEvent();
        });
    } else {
        console.error('Save event button not found in the DOM');
    }
    
    // Event modal shown event
    const eventModal = document.getElementById('eventModal');
    if (eventModal) {
        console.log('Found event modal, attaching shown.bs.modal listener');
        eventModal.addEventListener('shown.bs.modal', function() {
            console.log('Event modal shown, loading form data...');
            window.loadEventFormData();
        });
    } else {
        console.error('Event modal not found in the DOM');
    }
    
    console.log('=== Event listeners setup complete ===');
}

// Initialize modals
export function initializeModals() {
    console.log('=== Initializing Modals ===');
    const modals = {};
    const modalIds = [
        'evidenceDetailModal',
        'eventModal',
        'eventDetailModal',
        'characterModal',
        'characterDetailModal',
        'uploadModal',
        'bugModal'
    ];

    modalIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`Initializing modal: ${id}`);
            modals[id.replace('Modal', '').toLowerCase()] = new bootstrap.Modal(element);
        } else {
            console.error(`Modal element not found: ${id}`);
        }
    });

    console.log('Initialized modals:', Object.keys(modals));
    return modals;
}

// Events Management
export async function loadEvents() {
    try {
        console.log('=== Loading events ===');
        const response = await fetch('/api/events');
        const data = await response.json();
        console.log('Events API response:', data);
        
        if (data.status === 'success') {
            const tbody = document.getElementById('eventsTableBody');
            if (!tbody) {
                console.error('Events table body not found in DOM');
                return;
            }
            
            tbody.innerHTML = '';
            
            const events = data.data;
            if (events && Array.isArray(events)) {
                console.log(`Processing ${events.length} events`);
                events.forEach(event => {
                    const row = createEventRow(event);
                    tbody.appendChild(row);
                });
            } else {
                console.log('No events found or invalid events data');
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">No events found</td></tr>';
            }
        } else {
            console.error('Error in events response:', data.message);
            showAlert('Error loading events: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Error loading events:', error);
        console.error('Error stack:', error.stack);
        showAlert('Error loading events. Please try again.', 'danger');
    }
}

export function createEventRow(event) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${event.title}</td>
        <td>${formatDate(event.date)}</td>
        <td>${event.characters ? event.characters.length : 0} characters</td>
        <td>${event.evidence ? event.evidence.length : 0} items</td>
        <td>${formatTags(event.tags)}</td>
        <td>
            <div class="btn-group">
                <button class="btn btn-sm btn-outline-primary" data-action="viewEvent" data-event-id="${event.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" data-action="deleteEvent" data-event-id="${event.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    return row;
}

export async function loadEventFormData() {
    try {
        // Load evidence for selection
        const evidenceResponse = await fetch('/api/evidence');
        const evidenceData = await evidenceResponse.json();
        
        if (evidenceData.status === 'success') {
            const evidenceList = document.getElementById('eventEvidenceList');
            evidenceList.innerHTML = '';
            
            evidenceData.evidence.forEach(item => {
                const div = document.createElement('div');
                div.className = 'list-group-item';
                div.innerHTML = `
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="${item.id}" id="evidence_${item.id}">
                        <label class="form-check-label" for="evidence_${item.id}">
                            ${item.file_name}
                        </label>
                    </div>
                `;
                evidenceList.appendChild(div);
            });
        }
        
        // Load characters for selection
        const charactersResponse = await fetch('/api/characters');
        const charactersData = await charactersResponse.json();
        
        if (charactersData.status === 'success') {
            const characterList = document.getElementById('eventCharacterList');
            characterList.innerHTML = '';
            
            charactersData.characters.forEach(character => {
                const div = document.createElement('div');
                div.className = 'list-group-item';
                div.innerHTML = `
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="${character.id}" id="character_${character.id}">
                        <label class="form-check-label" for="character_${character.id}">
                            ${character.name}
                        </label>
                    </div>
                `;
                characterList.appendChild(div);
            });
        }
    } catch (error) {
        console.error('Error loading form data:', error);
        showAlert('Error loading form data. Please try again.', 'danger');
    }
}

export async function saveEvent() {
    console.log('saveEvent function called');
    try {
        // Log form values
        const title = document.getElementById('eventTitle').value;
        const date = document.getElementById('eventDate').value;
        const description = document.getElementById('eventDescription').value;
        const tagsString = document.getElementById('eventTags').value;
        const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag); // Convert to array and clean
        const evidenceIds = getSelectedIds('evidence');
        const characterIds = getSelectedIds('character');

        console.log('Form values:', {
            title,
            date,
            description,
            tags,
            evidenceIds,
            characterIds
        });

        const eventData = {
            title,
            date,
            description,
            tags,
            evidence_ids: evidenceIds,
            character_ids: characterIds
        };
        
        const method = currentEventId ? 'PUT' : 'POST';
        const url = currentEventId ? `/api/events/${currentEventId}` : '/api/events';
        
        console.log(`Making ${method} request to ${url}`);
        console.log('Request payload:', eventData);

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.status === 'success') {
            console.log('Event saved successfully');
            const modal = bootstrap.Modal.getInstance(document.getElementById('eventModal'));
            if (modal) {
                modal.hide();
            }
            showAlert('Event saved successfully!', 'success');
            // Clear the form
            document.getElementById('eventForm').reset();
            // Reset the current event ID
            currentEventId = null;
            // Reload events
            await loadEvents();
        } else {
            console.error('Server returned error:', data.message);
            showAlert('Error saving event: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Error in saveEvent:', error);
        showAlert('Error saving event. Please try again.', 'danger');
    }
}

export async function viewEvent(eventId) {
    try {
        const response = await fetch(`/api/events/${eventId}?include_relationships=true`);
        const data = await response.json();
        
        if (data.status === 'success') {
            const event = data.event;
            currentEventId = event.id;
            
            document.getElementById('eventDetailTitle').textContent = event.title;
            document.getElementById('eventDetailDate').textContent = formatDate(event.date);
            document.getElementById('eventDetailDescription').textContent = event.description || 'No description provided';
            
            // Display tags
            const tagsContainer = document.getElementById('eventDetailTags');
            tagsContainer.innerHTML = formatTags(event.tags);
            
            // Display associated characters
            const charactersContainer = document.getElementById('eventDetailCharacters');
            charactersContainer.innerHTML = '';
            if (event.characters && event.characters.length > 0) {
                event.characters.forEach(character => {
                    const div = document.createElement('div');
                    div.className = 'mb-2';
                    div.innerHTML = `
                        <button class="btn btn-sm btn-outline-secondary" onclick="viewCharacter(${character.id})">
                            ${character.name}
                        </button>
                    `;
                    charactersContainer.appendChild(div);
                });
            } else {
                charactersContainer.innerHTML = '<p>No characters associated with this event.</p>';
            }
            
            // Display associated evidence
            const evidenceContainer = document.getElementById('eventDetailEvidence');
            evidenceContainer.innerHTML = '';
            if (event.evidence && event.evidence.length > 0) {
                event.evidence.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'mb-2';
                    div.innerHTML = `
                        <button class="btn btn-sm btn-outline-secondary" onclick="viewEvidence(${item.id})">
                            ${item.file_name}
                        </button>
                    `;
                    evidenceContainer.appendChild(div);
                });
            } else {
                evidenceContainer.innerHTML = '<p>No evidence associated with this event.</p>';
            }
            
            bootstrap.Modal.getInstance(document.getElementById('eventDetailModal')).show();
        } else {
            showAlert('Error loading event details: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Error loading event details:', error);
        showAlert('Error loading event details. Please try again.', 'danger');
    }
}

export async function editEvent() {
    try {
        const response = await fetch(`/api/events/${currentEventId}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            const event = data.event;
            
            document.getElementById('eventTitle').value = event.title;
            document.getElementById('eventDate').value = formatDateForInput(event.date);
            document.getElementById('eventDescription').value = event.description || '';
            document.getElementById('eventTags').value = event.tags || '';
            
            // Check associated evidence and characters
            event.evidence_ids.forEach(id => {
                const checkbox = document.getElementById(`evidence_${id}`);
                if (checkbox) checkbox.checked = true;
            });
            
            event.character_ids.forEach(id => {
                const checkbox = document.getElementById(`character_${id}`);
                if (checkbox) checkbox.checked = true;
            });
            
            bootstrap.Modal.getInstance(document.getElementById('eventDetailModal')).hide();
            bootstrap.Modal.getInstance(document.getElementById('eventModal')).show();
        } else {
            showAlert('Error loading event for editing: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Error loading event for editing:', error);
        showAlert('Error loading event for editing. Please try again.', 'danger');
    }
}

export async function deleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event?')) {
        try {
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                showAlert('Event deleted successfully!', 'success');
                loadEvents();
            } else {
                showAlert('Error deleting event: ' + data.message, 'danger');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            showAlert('Error deleting event. Please try again.', 'danger');
        }
    }
}

// Characters Management
export async function loadCharacters() {
    try {
        const response = await fetch('/api/characters');
        const data = await response.json();
        
        if (data.status === 'success') {
            const grid = document.getElementById('charactersGrid');
            grid.innerHTML = '';
            
            data.characters.forEach(character => {
                const card = createCharacterCard(character);
                grid.appendChild(card);
            });
        } else {
            showAlert('Error loading characters: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Error loading characters:', error);
        showAlert('Error loading characters. Please try again.', 'danger');
    }
}

export function createCharacterCard(character) {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';
    col.innerHTML = `
        <div class="card h-100">
            <img src="${character.image_path || DEFAULT_PROFILE_IMAGE}" class="card-img-top" alt="${character.name}">
            <div class="card-body">
                <h5 class="card-title">${character.name}</h5>
                <p class="card-text"><strong>Role:</strong> ${character.role}</p>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewCharacter(${character.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteCharacter(${character.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `;
    return col;
}

export async function saveCharacter() {
    try {
        const formData = new FormData();
        formData.append('name', document.getElementById('characterName').value);
        formData.append('role', document.getElementById('characterRole').value);
        formData.append('notes', document.getElementById('characterNotes').value);
        
        const imageFile = document.getElementById('characterImage').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }
        
        const method = currentCharacterId ? 'PUT' : 'POST';
        const url = currentCharacterId ? `/api/characters/${currentCharacterId}` : '/api/characters';
        
        const response = await fetch(url, {
            method: method,
            body: formData
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            bootstrap.Modal.getInstance(document.getElementById('characterModal')).hide();
            showAlert('Character saved successfully!', 'success');
            loadCharacters();
        } else {
            showAlert('Error saving character: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Error saving character:', error);
        showAlert('Error saving character. Please try again.', 'danger');
    }
}

export async function viewCharacter(characterId) {
    try {
        const response = await fetch(`/api/characters/${characterId}?include_relationships=true`);
        const data = await response.json();
        
        if (data.status === 'success') {
            const character = data.character;
            currentCharacterId = character.id;
            
            document.getElementById('characterDetailName').textContent = character.name;
            document.getElementById('characterDetailRole').textContent = character.role;
            document.getElementById('characterDetailNotes').textContent = character.notes || 'No notes provided';
            document.getElementById('characterDetailImage').src = character.image_path || '/static/img/default-profile.png';
            
            // Display associated events
            const eventsContainer = document.getElementById('characterDetailEvents');
            eventsContainer.innerHTML = '';
            if (character.events && character.events.length > 0) {
                character.events.forEach(event => {
                    const div = document.createElement('div');
                    div.className = 'mb-2';
                    div.innerHTML = `
                        <button class="btn btn-sm btn-outline-secondary" onclick="viewEvent(${event.id})">
                            ${event.title} - ${formatDate(event.date)}
                        </button>
                    `;
                    eventsContainer.appendChild(div);
                });
            } else {
                eventsContainer.innerHTML = '<p>No events associated with this character.</p>';
            }
            
            bootstrap.Modal.getInstance(document.getElementById('characterDetailModal')).show();
        } else {
            showAlert('Error loading character details: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Error loading character details:', error);
        showAlert('Error loading character details. Please try again.', 'danger');
    }
}

export async function deleteCharacter(characterId) {
    if (confirm('Are you sure you want to delete this character?')) {
        try {
            const response = await fetch(`/api/characters/${characterId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                showAlert('Character deleted successfully!', 'success');
                loadCharacters();
            } else {
                showAlert('Error deleting character: ' + data.message, 'danger');
            }
        } catch (error) {
            console.error('Error deleting character:', error);
            showAlert('Error deleting character. Please try again.', 'danger');
        }
    }
}

// Utility Functions
export function getSelectedIds(type) {
    console.log(`Getting selected ${type} IDs`);
    const checkboxes = document.querySelectorAll(`input[id^="${type}_"]:checked`);
    const ids = Array.from(checkboxes).map(cb => parseInt(cb.value));
    console.log(`Selected ${type} IDs:`, ids);
    return ids;
}

export function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
}

export function formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
}

export function formatTags(tags) {
    if (!tags || !Array.isArray(tags)) return '';
    return tags.map(tag => `<span class="badge bg-secondary me-1">${tag}</span>`).join('');
}

export function showAlert(message, type = 'info') {
    console.log(`Showing alert: ${message} (${type})`);
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Find the container for alerts (create one if it doesn't exist)
    let alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alertContainer';
        alertContainer.style.position = 'fixed';
        alertContainer.style.top = '20px';
        alertContainer.style.right = '20px';
        alertContainer.style.zIndex = '9999';
        document.body.appendChild(alertContainer);
    }
    
    alertContainer.appendChild(alertDiv);
    
    // Remove the alert after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// ... existing code ... 