"""PDF utility functions for the Legal Evidence Manager."""
import os
from PyPDF2 import PdfReader, PdfWriter
from werkzeug.utils import secure_filename
from models.evidence import Evidence, db
from utils.logger import app_logger as logger

def get_pdf_page_count(file_path):
    """Get the total number of pages in a PDF file."""
    try:
        logger.info(f"=== Starting PDF page count for file: {file_path} ===")
        
        # Normalize the file path
        file_path = os.path.normpath(file_path)
        logger.info(f"Normalized file path: {file_path}")
        logger.info(f"Current working directory: {os.getcwd()}")
        logger.info(f"File exists: {os.path.exists(file_path)}")
        logger.info(f"File size: {os.path.getsize(file_path) if os.path.exists(file_path) else 'N/A'}")
        
        if not os.path.exists(file_path):
            logger.error(f"PDF file not found: {file_path}")
            raise FileNotFoundError(f"PDF file not found: {file_path}")
            
        with open(file_path, 'rb') as file:
            try:
                logger.info("Reading PDF file with PyPDF2")
                reader = PdfReader(file)
                page_count = len(reader.pages)
                logger.info(f"Successfully counted {page_count} pages")
                return page_count
            except Exception as e:
                logger.error(f"Error reading PDF with PyPDF2: {str(e)}")
                raise ValueError(f"Error reading PDF file: {str(e)}")
    except FileNotFoundError as e:
        logger.error(f"FileNotFoundError: {str(e)}")
        raise
    except IOError as e:
        logger.error(f"IOError opening file: {str(e)}")
        raise ValueError(f"Error opening file: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in get_pdf_page_count: {str(e)}")
        raise

def split_pdf(evidence, splits):
    """
    Split a PDF into multiple sections based on the provided splits.
    Each split should have a title, start_page, end_page, and optional notes.
    """
    logger.info(f"=== Starting PDF split operation for evidence {evidence.id} ===")
    logger.info(f"Evidence details: file={evidence.file_name}, type={evidence.file_type}")
    logger.info(f"Number of splits requested: {len(splits)}")
    
    try:
        # Get the absolute path of the source PDF
        file_path = os.path.normpath(os.path.join('uploads', evidence.file_path))
        logger.info(f"Source PDF path: {file_path}")
        logger.info(f"Current working directory: {os.getcwd()}")
        logger.info(f"File exists: {os.path.exists(file_path)}")
        logger.info(f"File size: {os.path.getsize(file_path) if os.path.exists(file_path) else 'N/A'}")
        
        if not os.path.exists(file_path):
            logger.error(f"Source PDF not found: {file_path}")
            raise FileNotFoundError(f"Source PDF not found: {file_path}")
            
        # Open the source PDF
        with open(file_path, 'rb') as file:
            logger.info("Reading source PDF with PyPDF2")
            reader = PdfReader(file)
            total_pages = len(reader.pages)
            logger.info(f"Source PDF has {total_pages} pages")
            
            # Validate page ranges
            for i, split in enumerate(splits):
                start_page = split['start_page']
                end_page = split['end_page']
                logger.info(f"Validating split {i + 1}: pages {start_page}-{end_page}")
                if start_page < 1 or end_page > total_pages or start_page > end_page:
                    logger.error(f"Invalid page range in split {i + 1}: {start_page}-{end_page}")
                    raise ValueError(f"Invalid page range: {start_page}-{end_page}")
            
            # Create split PDFs
            results = []
            for i, split in enumerate(splits, 1):
                logger.info(f"=== Processing split {i} of {len(splits)} ===")
                logger.info(f"Split details: {split}")
                
                # Create a new PDF writer
                writer = PdfWriter()
                
                # Add pages to the new PDF
                for page_num in range(split['start_page'] - 1, split['end_page']):
                    writer.add_page(reader.pages[page_num])
                logger.info(f"Added {split['end_page'] - split['start_page'] + 1} pages to the split")
                
                # Create new evidence record with hierarchical ID
                child_id = evidence.get_next_child_id()
                split_filename = f"{child_id}_{evidence.file_name.rsplit('.', 1)[0]}_{split['start_page']}-{split['end_page']}.pdf"
                logger.info(f"Generated split filename: {split_filename}")
                
                child_evidence = Evidence(
                    hierarchical_id=child_id,
                    title=split['title'],
                    file_name=split_filename,
                    file_type='application/pdf',
                    file_path=split_filename,  # Store just the filename
                    parent_id=evidence.id,
                    original_file_id=evidence.original_file_id or evidence.id,
                    notes=split.get('notes', ''),
                    is_split=True,
                    page_range=f"{split['start_page']}-{split['end_page']}",
                    total_pages=split['end_page'] - split['start_page'] + 1
                )
                
                # Save the split PDF
                split_path = os.path.normpath(os.path.join('uploads', split_filename))
                logger.info(f"Saving split PDF to: {split_path}")
                
                # Ensure the uploads directory exists
                os.makedirs('uploads', exist_ok=True)
                
                with open(split_path, 'wb') as output_file:
                    writer.write(output_file)
                logger.info(f"Split PDF saved successfully")
                
                # Update file size
                child_evidence.file_size = os.path.getsize(split_path)
                logger.info(f"Split PDF size: {child_evidence.file_size} bytes")
                
                # Add to results
                results.append(child_evidence)
                db.session.add(child_evidence)
                logger.info(f"Created evidence record for split {i}")
            
            logger.info(f"=== Successfully created {len(results)} split PDFs ===")
            return results
            
    except FileNotFoundError as e:
        logger.error(f"FileNotFoundError: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Error in split_pdf: {str(e)}")
        raise 