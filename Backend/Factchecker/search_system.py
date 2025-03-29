from googlesearch import search
from bing_search import bing_search_get_multiple

def search_query(query, attribute, search_settings: dict):
    if search_settings['search_system'] == 'google':
        print(f'Searching over Google...')
        # TODO: add rule to only return text (not video/images)
        return search(f"Give articles related to the query: {query} with the attribute : {attribute}", verify_ssl=False, num=search_settings['num_results']*(0.1)) # temporarily making it false

    elif search_settings['search_system'] == 'bing':#TODO: dynamically generate aspect based query
        generated_query_with_keywords = "";
        return bing_search_get_multiple(f"{query} {attribute}", count=5)
        #TODO: add other search systems
    else:
        return search(query)

def display_snippet(html_content, settings=None):
    return html_content[:200]
