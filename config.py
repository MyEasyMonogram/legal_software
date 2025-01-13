import os

class Config:
    """Application configuration."""
    # Database
    SQLALCHEMY_DATABASE_URI = 'sqlite:///evidence.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # File upload settings
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100MB max file size
    
    # Supported file types
    ALLOWED_EXTENSIONS = {
        # Documents
        'pdf', 'doc', 'docx', 'txt', 'rtf',
        # Images
        'jpg', 'jpeg', 'png', 'gif', 'bmp',
        # Audio
        'mp3', 'wav', 'ogg',
        # Video
        'mp4', 'avi', 'mov',
        # Other
        'csv', 'xlsx', 'xls'
    }
    
    # Preview support
    PREVIEWABLE_TYPES = {
        'image': ['jpg', 'jpeg', 'png', 'gif'],
        'pdf': ['pdf'],
        'video': ['mp4'],
        'audio': ['mp3', 'wav']
    }
    
    @staticmethod
    def init_app(app):
        """Initialize application configuration."""
        # Create upload directory if it doesn't exist
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True) 