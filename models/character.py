from models.db import db

class Character(db.Model):
    """Model for storing characters."""
    __tablename__ = 'characters'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(255), nullable=False)
    image_path = db.Column(db.String(512))
    notes = db.Column(db.Text)
    
    def to_dict(self):
        """Convert character to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'name': self.name,
            'role': self.role,
            'image_path': self.image_path,
            'notes': self.notes
        }
    
    @staticmethod
    def from_dict(data):
        """Create a Character instance from dictionary data."""
        return Character(
            name=data['name'],
            role=data['role'],
            image_path=data.get('image_path'),
            notes=data.get('notes')
        ) 