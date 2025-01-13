// Characters Management
let currentCharacterId = null;

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
        <div class="card character-card h-100">
            <div class="card-img-container">
                <img src="${character.image_path || '/static/img/default-profile.png'}" class="card-img-top" alt="${character.name}">
            </div>
            <div class="card-body">
                <h5 class="card-title">${character.name}</h5>
                <p class="card-text"><strong>Role:</strong> ${character.role}</p>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" data-action="viewCharacter" data-character-id="${character.id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-outline-danger" data-action="deleteCharacter" data-character-id="${character.id}">
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
                        <button class="btn btn-sm btn-outline-secondary" data-action="viewEvent" data-event-id="${event.id}">
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