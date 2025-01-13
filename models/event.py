from datetime import datetime
from models.db import db

class Event(db.Model):
    """Model for storing events."""
    __tablename__ = 'events'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(255), nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    description = db.Column(db.Text)
    tags = db.Column(db.String(512))
    
    def to_dict(self):
        """Convert event to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'title': self.title,
            'date': self.date.isoformat(),
            'description': self.description,
            'tags': self.tags.split(',') if self.tags else []
        }
    
    @staticmethod
    def from_dict(data):
        """Create an Event instance from dictionary data."""
        return Event(
            title=data['title'],
            date=datetime.fromisoformat(data['date']),
            description=data.get('description'),
            tags=','.join(data.get('tags', []))
        ) 