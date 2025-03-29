

import requests
import json
import logging


def compute_groundedness(summary_sentence, articles: list, prompt,attribute, query):
    """
    Compute groundedness scores for articles based on summary content.

    Args:
        summary_sentence: The summary text to evaluate
        articles: List of article URLs
        prompt: The evaluation prompt
        query: The search query

    Returns:
        dict: Dictionary mapping article URLs to their groundedness scores
    """
    # Set up logging
    logging.basicConfig(level=logging.DEBUG)
    logger = logging.getLogger(__name__)

    API_KEY = os.environ['OPEN-AI-KEY']  # Add your API key here
    headers = {
        "Content-Type": "application/json",
        "api-key": API_KEY,
    }

    payload = {
        "messages": [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": "You will be provided with query, aspect and some Summary, along with the retrieved documents links which will be given by the user in the list of name articles_links the content at the link will be used by you for calculating the groundedness score of summary with each article. Your goal is to assess summary groundedness for each summary. Your evaluation should consist of the following:  Summary Groundedness: Evaluate how well each summary is grounded in the fetched article from the article link. Criteria:\n        Evidence Accuracy: Does the sentence summary accurately reflect the content of the article?\n        Evidence Citation: Does the summary cite specific parts of the article?\n        Consistency: Is the summary consistent with the facts from the article?\n\n  For each sentence, you need to rate how much it can be derived (or is grounded) in each of the article. You need to evaluate on a scale from 0 to 5. You should follow the following JSON format : {article_url_1:  score from 1 to 5,..., article_url_n:  score from 1 to 5}"
                    }
                ]
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"query: {query},aspect:{attribute} Summary: {summary_sentence}, article_links:{articles}"
                    }
                ]
            },
        ],
        "temperature": 0.7,
        "top_p": 0.95,
        "max_tokens": 800
    }

    ENDPOINT = "https://sweden-api.openai.azure.com/openai/deployments/gpt-4o-mini-atharv/chat/completions?api-version=2024-02-15-preview"

    try:
        # Make the API request
        response = requests.post(ENDPOINT, headers=headers, json=payload)
        response.raise_for_status()

        # Parse the response
        response_json = response.json()
        logger.debug(f"Received response: {response_json}")

        # Extract content from response
        if not response_json.get('choices'):
            logger.error("No choices in response")
            return {url: 0 for url in articles}

        content = response_json['choices'][0]['message'].get('content')
        if not content:
            logger.error("No content in response")
            return {url: 0 for url in articles}

        logger.debug(f"Content to parse: {content}")

        # Parse the JSON content
        try:
            scores_dict = json.loads(content)
            logger.debug(f"Parsed scores: {scores_dict}")

            # Validate scores
            if not isinstance(scores_dict, dict):
                logger.error("Parsed content is not a dictionary")
                return {url: 0 for url in articles}

            # Ensure all values are valid scores
            validated_scores = {}
            for url, score in scores_dict.items():
                try:
                    score_value = float(score)
                    if 0 <= score_value <= 5:
                        validated_scores[url] = score_value
                    else:
                        validated_scores[url] = 0
                except (ValueError, TypeError):
                    validated_scores[url] = 0

            # Ensure all input articles have scores
            for url in articles:
                if url not in validated_scores:
                    validated_scores[url] = 0

            return validated_scores

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON content: {e}")
            return {url: 0 for url in articles}

    except requests.RequestException as e:
        logger.error(f"Request failed: {e}")
        return {url: 0 for url in articles}

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {url: 0 for url in articles}