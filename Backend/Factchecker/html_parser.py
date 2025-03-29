from pdf_reader import is_pdf_link, get_text_from_pdf_url
import os
import json
from googlesearch import search
import requests
from bs4 import BeautifulSoup

def scrape_html(url):
    try:
        # Send a request to the URL with a User-Agent header
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
        }
        response = requests.get(url, headers=headers, timeout=5)
        soup = BeautifulSoup(response.text, 'html.parser')
        title = soup.title.string if soup.title else "No title found"
        return soup.prettify(), soup.get_text(separator="\n", strip=True), title
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return None, None, None


def url_to_text(first_url):
    try:
        if first_url.endswith('.pdf') or is_pdf_link(first_url):
            print(f'\tExtracting PDF content...')
            html_content = get_text_from_pdf_url(first_url)
            stripped_html = html_content
        else:
            print(f'\tExtracting WebPage content...')
            html_content, stripped_html, title = scrape_html(first_url)
    except Exception as e:
        return None
    return stripped_html, title

# if __name__ == '__main__':
#     stripped_html = url_to_text('https://stackoverflow.com/questions/35497298/sql-query-for-to-find-item-with-a-specific-attribute-and-related-non-foreign-key')
#     print()