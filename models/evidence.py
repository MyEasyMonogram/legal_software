import os
from datetime import datetime
from werkzeug.utils import secure_filename
from models.db import db
from utils.logger import logger

class Evidence(db.Model):
    """Evidence model for storing uploaded files and metadata."""
    id = db.Column(db.Integer, primary_key=True)
    hierarchical_id = db.Column(db.String(10), unique=True, nullable=False)
    title = db.Column(db.String(255))
    file_name = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50))
    file_size = db.Column(db.Integer, default=0)
    file_path = db.Column(db.String(512))
    tags = db.Column(db.String(512))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @staticmethod
    def get_next_hierarchical_id():
        """Get the next available hierarchical ID."""
        try:
            last_evidence = Evidence.query.order_by(Evidence.id.desc()).first()
            if last_evidence and last_evidence.hierarchical_id:
                last_num = int(last_evidence.hierarchical_id[1:])
                next_num = last_num + 1
            else:
                next_num = 1
            return f'E{next_num:03d}'
        except Exception as e:
            logger.error(f"Error generating hierarchical ID: {str(e)}")
            raise

    @classmethod
    def from_upload(cls, file, title=None, tags=None, notes=None):
        """Create an Evidence instance from an uploaded file."""
        try:
            logger.info("Creating Evidence instance from upload...")
            
            # Get the next hierarchical ID
            hierarchical_id = cls.get_next_hierarchical_id()
            logger.info(f"Generated hierarchical ID: {hierarchical_id}")
            
            # Secure the filename and get file info
            filename = secure_filename(file.filename)
            file_type = os.path.splitext(filename)[1].lower()
            
            # Create the evidence instance
            evidence = cls(
                hierarchical_id=hierarchical_id,
                title=title or os.path.splitext(filename)[0],
                file_name=filename,
                file_type=file_type,
                file_size=0,  # Will be updated after file is saved
                file_path=os.path.join('uploads', filename),
                tags=','.join(tags) if isinstance(tags, list) else tags,
                notes=notes
            )
            
            logger.info(f"Evidence instance created: {evidence.hierarchical_id}")
            return evidence
            
        except Exception as e:
            logger.error(f"Error creating Evidence from upload: {str(e)}")
            raise

    def to_dict(self):
        """Convert the Evidence instance to a dictionary."""
        return {
            'id': self.id,
            'hierarchical_id': self.hierarchical_id,
            'title': self.title,
            'file_name': self.file_name,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'file_path': self.file_path,
            'tags': self.tags.split(',') if self.tags else [],
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        } 