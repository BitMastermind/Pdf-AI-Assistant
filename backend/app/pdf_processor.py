from PyPDF2 import PdfReader
from io import BytesIO
from typing import Tuple


def extract_text_from_pdf(file_content: bytes) -> Tuple[str, int]:
    """
    Extract text from a PDF file.
    Returns tuple of (extracted_text, page_count)
    """
    try:
        pdf_file = BytesIO(file_content)
        reader = PdfReader(pdf_file)
        
        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        
        full_text = "\n\n".join(text_parts)
        page_count = len(reader.pages)
        
        return full_text, page_count
    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {str(e)}")


def get_pdf_info(file_content: bytes) -> dict:
    """Get metadata information from PDF"""
    try:
        pdf_file = BytesIO(file_content)
        reader = PdfReader(pdf_file)
        
        info = {
            "page_count": len(reader.pages),
            "metadata": {}
        }
        
        if reader.metadata:
            info["metadata"] = {
                "title": reader.metadata.get("/Title", ""),
                "author": reader.metadata.get("/Author", ""),
                "subject": reader.metadata.get("/Subject", ""),
                "creator": reader.metadata.get("/Creator", "")
            }
        
        return info
    except Exception as e:
        raise ValueError(f"Failed to get PDF info: {str(e)}")

