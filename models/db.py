import os
from flask_sqlalchemy import SQLAlchemy
from utils.logger import logger
import traceback

db = SQLAlchemy()

def init_db(app):
    """Initialize the database."""
    try:
        logger.info("=== Initializing Database ===")
        
        # Ensure instance directory exists
        instance_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance')
        os.makedirs(instance_path, exist_ok=True)
        logger.info(f"Instance directory ensured at: {instance_path}")
        
        logger.info("Dropping existing tables...")
        db.drop_all()
        
        logger.info("Creating new tables...")
        db.create_all()
        
        # Ensure uploads directory exists
        uploads_path = os.path.join(instance_path, 'uploads')
        os.makedirs(uploads_path, exist_ok=True)
        logger.info(f"Uploads directory ensured at: {uploads_path}")
        
        logger.info("Database initialization completed successfully.")
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        logger.error(f"Stack trace: {traceback.format_exc()}")
        raise 