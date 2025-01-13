from loguru import logger
import sys
import os
from datetime import datetime

# Create logs directory if it doesn't exist
if not os.path.exists("logs"):
    os.makedirs("logs")

# Configure logger
def setup_logger():
    """
    Configure the logging system with different log levels and formats.
    Creates separate log files for different severity levels.
    """
    # Remove default handler
    logger.remove()
    
    # Format for logs
    log_format = "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
    
    # Add handlers for different log levels
    logger.add(
        sys.stderr,
        format=log_format,
        level="INFO",
        diagnose=True
    )
    
    logger.add(
        "logs/error.log",
        format=log_format,
        level="ERROR",
        rotation="500 MB",
        retention="10 days",
        diagnose=True
    )
    
    logger.add(
        "logs/debug.log",
        format=log_format,
        level="DEBUG",
        rotation="500 MB",
        retention="10 days",
        diagnose=True
    )
    
    logger.add(
        "logs/info.log",
        format=log_format,
        level="INFO",
        rotation="500 MB",
        retention="10 days",
        diagnose=True
    )

def get_recent_logs(level="INFO", limit=100):
    """
    Retrieve recent logs from the appropriate log file.
    
    Args:
        level (str): Log level to retrieve (INFO, ERROR, DEBUG)
        limit (int): Maximum number of log entries to return
    
    Returns:
        list: Recent log entries
    """
    log_file = f"logs/{level.lower()}.log"
    if not os.path.exists(log_file):
        return []
    
    with open(log_file, "r") as f:
        logs = f.readlines()[-limit:]
    return logs

# Initialize logger
setup_logger()

# Export logger instance
app_logger = logger 