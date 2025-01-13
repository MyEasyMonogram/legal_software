import os
import pytest
from app import app, db
from models.evidence import Evidence
from io import BytesIO
from datetime import datetime

@pytest.fixture
def client():
    """Create a test client."""
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['UPLOAD_FOLDER'] = 'test_uploads'
    
    # Create test upload directory
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            
        # Cleanup
        db.session.remove()
        db.drop_all()
        
    # Remove test upload directory
    for root, dirs, files in os.walk(app.config['UPLOAD_FOLDER']):
        for file in files:
            os.remove(os.path.join(root, file))
    os.rmdir(app.config['UPLOAD_FOLDER'])

def test_evidence_model():
    """Test Evidence model creation and methods."""
    with app.app_context():
        evidence = Evidence(
            file_name='test.pdf',
            file_type='application/pdf',
            file_path='uploads/test.pdf',
            tags='important,test',
            notes='Test notes'
        )
        db.session.add(evidence)
        db.session.commit()
        
        assert evidence.id == 1  # First record should have ID 1
        assert evidence.file_name == 'test.pdf'
        assert evidence.file_type == 'application/pdf'
        assert evidence.tags == 'important,test'
        
        # Test to_dict method
        evidence_dict = evidence.to_dict()
        assert evidence_dict['id'] == 1
        assert evidence_dict['file_name'] == 'test.pdf'
        assert evidence_dict['tags'] == ['important', 'test']
        assert evidence_dict['notes'] == 'Test notes'

def test_auto_incrementing_ids():
    """Test that IDs auto-increment correctly."""
    with app.app_context():
        # Create three evidence records
        for i in range(3):
            evidence = Evidence(
                file_name=f'test{i}.pdf',
                file_type='application/pdf',
                file_path=f'uploads/test{i}.pdf'
            )
            db.session.add(evidence)
        db.session.commit()
        
        # Verify IDs
        evidences = Evidence.query.order_by(Evidence.id).all()
        assert len(evidences) == 3
        assert [e.id for e in evidences] == [1, 2, 3]

def test_upload_evidence(client):
    """Test evidence upload endpoint."""
    data = {
        'file': (BytesIO(b'test file content'), 'test.pdf'),
        'tags': 'important,test',
        'notes': 'Test notes'
    }
    
    response = client.post('/api/evidence', 
                         content_type='multipart/form-data',
                         data=data)
    
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['status'] == 'success'
    assert 'evidence' in json_data
    assert json_data['evidence']['id'] == 1  # First upload should have ID 1
    
    # Verify file was saved
    evidence_path = os.path.join(app.config['UPLOAD_FOLDER'], 'test.pdf')
    assert os.path.exists(evidence_path)
    
    # Verify database entry
    evidence = Evidence.query.first()
    assert evidence.id == 1
    assert evidence.file_name == 'test.pdf'
    assert evidence.tags == 'important,test'
    assert evidence.notes == 'Test notes'

def test_get_evidence(client):
    """Test getting evidence list."""
    with app.app_context():
        # Create test evidence
        evidence = Evidence(
            file_name='test.pdf',
            file_type='application/pdf',
            file_path='uploads/test.pdf',
            tags='important,test',
            notes='Test notes'
        )
        db.session.add(evidence)
        db.session.commit()
        
        response = client.get('/api/evidence')
        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['status'] == 'success'
        assert len(json_data['evidence']) == 1
        assert json_data['evidence'][0]['id'] == 1
        assert json_data['evidence'][0]['file_name'] == 'test.pdf'

def test_update_evidence(client):
    """Test updating evidence metadata."""
    with app.app_context():
        # Create test evidence
        evidence = Evidence(
            file_name='test.pdf',
            file_type='application/pdf',
            file_path='uploads/test.pdf',
            tags='important,test',
            notes='Test notes'
        )
        db.session.add(evidence)
        db.session.commit()
        evidence_id = evidence.id
        
        # Update metadata
        update_data = {
            'tags': ['updated', 'tags'],
            'notes': 'Updated notes'
        }
        
        response = client.put(f'/api/evidence/{evidence_id}',
                            json=update_data)
        
        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['status'] == 'success'
        
        # Verify updates
        updated_evidence = Evidence.query.get(evidence_id)
        assert updated_evidence.id == 1
        assert updated_evidence.tags == 'updated,tags'
        assert updated_evidence.notes == 'Updated notes'

def test_invalid_file_upload(client):
    """Test uploading an invalid file type."""
    data = {
        'file': (BytesIO(b'test file content'), 'test.invalid'),
        'tags': 'test',
        'notes': 'Test notes'
    }
    
    response = client.post('/api/evidence',
                         content_type='multipart/form-data',
                         data=data)
    
    assert response.status_code == 400
    json_data = response.get_json()
    assert json_data['status'] == 'error'
    assert 'File type not allowed' in json_data['message'] 