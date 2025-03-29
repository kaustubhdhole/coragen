import requests
import PyPDF2
from io import BytesIO


def get_text_from_pdf_url(pdf_url):
    try:
        # Initialize a variable to hold all extracted text
        full_text = ""

        # Send a request to the PDF URL with a User-Agent header
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
        }
        response = requests.get(pdf_url, headers=headers, timeout=60)

        # Check if the request was successful
        if response.status_code == 200:
            # Create a PDF reader object from bytes
            pdf_reader = PyPDF2.PdfReader(BytesIO(response.content))

            # Loop through each page in the PDF
            for page in pdf_reader.pages:
                # Extract text from the page and add it to the full text
                page_text = page.extract_text()
                if page_text:  # Ensure that the page contains text
                    full_text += page_text + "\n"  # Add a newline after each page's text
        else:
            raise Exception(f"Failed to retrieve the PDF file. Status code: {response.status_code}")

        return full_text
    except Exception as e:
        print(f"Error retrieving PDF from {pdf_url}: {e}")
        return None

def is_pdf_link(url):
    try:
        response = requests.head(url, allow_redirects=True, timeout=5)
        content_type = response.headers.get('Content-Type', '').lower()
        return 'application/pdf' in content_type
    except requests.RequestException as e:
        print(f"Failed to make a request: {e}")
        return False