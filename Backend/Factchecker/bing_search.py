# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

# -*- coding: utf-8 -*-

import json
import os
from pprint import pprint
import requests

'''
This sample makes a call to the Bing Web Search API with a query and returns relevant web search.
Documentation: https://docs.microsoft.com/en-us/bing/search-apis/bing-web-search/overview
'''

# Add your Bing Search V7 subscription key and endpoint to your environment variables.
# with open('.bing_key','r+') as f:
#     bing_key = f.read().strip()
subscription_key = os.environ['BING_KEY']

endpoint = "https://api.bing.microsoft.com/v7.0/search"

# Query term(s) to search for.
# query = "Sachin Tendulkar"

# Construct a request
mkt = 'en-US'
# params = {'q': query, 'mkt': mkt}
headers = {'Ocp-Apim-Subscription-Key': subscription_key}

# Call the API
# try:
#     response = requests.get(endpoint, headers=headers, params=params)
#     response.raise_for_status()
#
#     print("Headers:")
#     print(response.headers)
#
#     print("JSON Response:")
#     pprint(response.json())
# except Exception as ex:
#     raise ex

def get_first_webpage_url(data, first=0):
    try:
        # Check if 'webPages' key exists and has 'value' key containing at least one item
        if 'webPages' in data and 'value' in data['webPages'] and data['webPages']['value'] and len(data['webPages']['value']) > first:
            # Return the 'url' of the first item in 'value' list
            return data['webPages']['value'][first]['url']
        else:
            return None
    except (KeyError, TypeError, IndexError) as e:
        # If there's a KeyError, TypeError, or IndexError during access, return None
        return None

def bing_search(query, count=3):
    params = {'q': query, 'mkt':mkt, 'answerCount': 10, 'count': count, 'promote': 'webpages'}
    try:
        response = requests.get(endpoint, headers=headers, params=params)
        response.raise_for_status()
        first_webpage_url = get_first_webpage_url(response.json())
        if count == 2:
            second_webpage_url = get_first_webpage_url(response.json(), first=1)
            return first_webpage_url, second_webpage_url
        return first_webpage_url
    except Exception as ex:
        raise ex
    return None

def bing_search_get_multiple(query, count=10):
    urls = []
    params = {'q': query, 'mkt':mkt, 'answerCount': 10, 'count': count, 'promote': 'webpages'}
    try:
        response = requests.get(endpoint, headers=headers, params=params)
        response.raise_for_status()
        for index in range(count):
            first_webpage_url = get_first_webpage_url(response.json(), first=index)
            urls.append(first_webpage_url)
        return urls
    except Exception as ex:
        raise ex
    return []

# if __name__ == '__main__':
#     #response = bing_search('John Kruzel, “Did Reagan and H.W. Bush Issue Actions Similar to DACA, as Al Franken Said?,” politifact.com, Sep. 8, 2017')
#     #response = bing_search('Sachin Tendulkar')
#     # response = bing_search('Erik Sherman, "Uber and Lyft Drivers Are in a World of Trouble If This New Study Is Right," inc.com, June 1, 2018')
#     response = bing_search_get_multiple(query,1)
#     print(response)