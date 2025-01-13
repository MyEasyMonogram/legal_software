from flask import Flask, render_template, request, jsonify, send_from_directory, abort
from utils.logger import app_logger as logger
from models.db import db, init_db
from config import Config
import json
from datetime import datetime
import os
import werkzeug.utils
from utils.pdf_utils import get_pdf_page_count, split_pdf
import traceback
from werkzeug.utils import secure_filename
from models.evidence import Evidence
from models.event import Event
from models.character import Character

app = Flask(__name__)
app.config.from_object(Config)
Config.init_app(app)

# Set up absolute paths for database and uploads
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
INSTANCE_DIR = os.path.join(BASE_DIR, 'instance')
DB_PATH = os.path.join(INSTANCE_DIR, 'legal.db')
UPLOAD_FOLDER = os.path.join(INSTANCE_DIR, 'uploads')

# Ensure directories exist with proper permissions
os.makedirs(INSTANCE_DIR, exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Configure Flask app
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_PATH}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Initialize database
db.init_app(app)
with app.app_context():
    init_db(app)

def allowed_file(filename, allowed_extensions=None):
    """Check if the file extension is allowed."""
    if allowed_extensions is None:
        allowed_extensions = Config.ALLOWED_EXTENSIONS
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

@app.route('/')
def index():
    """Home page with evidence table."""
    return render_template('index.html')

@app.route('/api/evidence', methods=['GET'])
def get_evidence():
    """Get all evidence entries."""
    try:
        from models.evidence import Evidence
        evidence = Evidence.query.all()
        return jsonify({
            'status': 'success',
            'evidence': [e.to_dict() for e in evidence]
        })
    except Exception as e:
        logger.exception("Error fetching evidence")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/evidence', methods=['POST'])
def upload_evidence():
    """Upload evidence file."""
    try:
        logger.info("=== Starting evidence upload ===")
        
        if 'file' not in request.files:
            logger.error("No file provided in request")
            return jsonify({'status': 'error', 'message': 'No file provided'}), 400
            
        file = request.files['file']
        if not file.filename:
            logger.error("Empty filename provided")
            return jsonify({'status': 'error', 'message': 'No file selected'}), 400
            
        filename = secure_filename(file.filename)
        logger.info(f"Processing file: {filename}")
        
        # Save file
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        logger.info(f"File saved to: {file_path}")
        
        # Create evidence record
        try:
            evidence = Evidence.from_upload(
                file=file,
                title=request.form.get('title'),
                tags=request.form.get('tags'),
                notes=request.form.get('notes')
            )
            db.session.add(evidence)
            db.session.commit()
            logger.info(f"Evidence saved to database with ID: {evidence.id}")
            
            return jsonify({
                'status': 'success',
                'message': 'Evidence uploaded successfully',
                'evidence': evidence.to_dict()
            }), 200
            
        except Exception as e:
            logger.error(f"Error saving evidence to database: {str(e)}")
            logger.error(f"Stack trace: {traceback.format_exc()}")
            # Clean up the file if database save fails
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Cleaned up file after error: {file_path}")
            db.session.rollback()
            return jsonify({
                'status': 'error',
                'message': 'Error saving evidence',
                'details': str(e)
            }), 500
            
    except Exception as e:
        logger.error(f"Error processing evidence upload: {str(e)}")
        logger.error(f"Stack trace: {traceback.format_exc()}")
        return jsonify({
            'status': 'error',
            'message': 'Error processing upload',
            'details': str(e)
        }), 500

@app.route('/api/evidence/<evidence_id>', methods=['GET'])
def get_evidence_detail(evidence_id):
    """Get detailed information about a specific evidence item."""
    try:
        from models.evidence import Evidence
        evidence = Evidence.query.get_or_404(evidence_id)
        return jsonify({
            'status': 'success',
            'evidence': evidence.to_dict()
        })
    except Exception as e:
        logger.exception(f"Error fetching evidence detail for ID: {evidence_id}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/evidence/<evidence_id>', methods=['PUT'])
def update_evidence(evidence_id):
    """Update evidence metadata."""
    try:
        from models.evidence import Evidence
        evidence = Evidence.query.get_or_404(evidence_id)
        data = request.json
        
        if 'tags' in data:
            evidence.tags = ','.join(data['tags'])
        if 'notes' in data:
            evidence.notes = data['notes']
        
        db.session.commit()
        logger.info(f"Evidence {evidence_id} updated successfully")
        
        return jsonify({
            'status': 'success',
            'message': 'Evidence updated successfully',
            'evidence': evidence.to_dict()
        })
    except Exception as e:
        logger.exception(f"Error updating evidence {evidence_id}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/uploads/<path:filename>')
def serve_file(filename):
    """Serve uploaded files."""
    try:
        if not os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'], filename)):
            logger.error(f"File not found: {filename}")
            abort(404)
        
        logger.info(f"Serving file: {filename}")
        return send_from_directory(
            app.config['UPLOAD_FOLDER'],
            filename,
            as_attachment=False
        )
    except Exception as e:
        logger.exception(f"Error serving file: {filename}")
        abort(500)

# Existing routes for bug reporting and logging
@app.route('/submit_bug', methods=['POST'])
def submit_bug():
    """Handle bug submission."""
    try:
        data = request.json
        bug_title = data.get('title')
        bug_details = data.get('details')
        
        logger.error(f"Bug Report - {bug_title}: {bug_details}")
        
        bug_report = {
            'title': bug_title,
            'details': bug_details,
            'timestamp': datetime.now().isoformat(),
            'logs': get_recent_logs(level="ERROR", limit=10)
        }
        
        os.makedirs('bug_reports', exist_ok=True)
        filename = f"bug_reports/bug_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(bug_report, f, indent=2)
        
        return jsonify({'status': 'success', 'message': 'Bug report submitted successfully'})
    except Exception as e:
        logger.exception("Error submitting bug report")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/static/js/<path:filename>')
def serve_js(filename):
    """Serve JavaScript files with proper MIME type for modules."""
    try:
        logger.info(f"Serving JavaScript file: {filename}")
        response = send_from_directory('static/js', filename)
        response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        logger.info(f"JavaScript file served successfully: {filename}")
        return response
    except Exception as e:
        logger.error(f"Error serving JavaScript file {filename}: {str(e)}")
        logger.error(f"Stack trace: {traceback.format_exc()}")
        abort(500)

@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files with proper MIME types."""
    try:
        return send_from_directory('static', filename)
    except Exception as e:
        logger.error(f"Error serving static file {filename}: {str(e)}")
        abort(404)

@app.before_request
def log_request_info():
    """Log details about every request."""
    logger.info('=== New Request ===')
    logger.info(f'Method: {request.method}')
    logger.info(f'URL: {request.url}')
    logger.info(f'Headers: {dict(request.headers)}')
    if request.is_json:
        logger.info(f'JSON Data: {request.get_json()}')
    elif request.form:
        logger.info(f'Form Data: {dict(request.form)}')
    if request.files:
        logger.info(f'Files: {[f.filename for f in request.files.values()]}')

@app.after_request
def log_response_info(response):
    """Log details about every response."""
    logger.info('=== Response ===')
    logger.info(f'Status: {response.status}')
    logger.info(f'Headers: {dict(response.headers)}')
    return response

if __name__ == '__main__':
    app.run(debug=True) 