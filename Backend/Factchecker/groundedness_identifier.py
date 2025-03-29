# import requests
#
#
# def compute_groundedness( summary_sentence, articles: list, prompt, query):
#     API_KEY = ""
#     headers = {
#         "Content-Type": "application/json",
#         "api-key": API_KEY,
#     }
#
#     # # RAG Triad (evaluation)
#     # articles = ['', '', '']
#     # query = ['']
#     # documents = ['', '', '']
#
#     # Summary Generation
#     # test_summary=['Cricket is not only an enjoyable sport but also offers numerous health benefits for players of all ages. Engaging in cricket can enhance physical fitness through cardiovascular exercise, strength training, and improved coordination. The various positions in cricket, whether batting, bowling, or fielding, require different physical skills, promoting overall body fitness and agility. Additionally, the social aspect of playing cricket encourages teamwork and camaraderie, contributing to mental well-being and reducing stress levels.', "The sport of cricket involves running, jumping, and throwing, which can significantly improve cardiovascular health. Regular participation in cricket can lead to better heart health, increased stamina, and improved muscle tone. Furthermore, the game's dynamic nature helps in developing hand-eye coordination, balance, and reflexes, making it a comprehensive workout that targets multiple aspects of physical fitness. This can be particularly beneficial for younger players in their developmental years, as it encourages an active lifestyle.", 'Engaging in cricket also offers psychological benefits. The sport teaches valuable life skills such as discipline, perseverance, and strategic thinking. Players learn to handle both success and failure, which can enhance emotional resilience. Additionally, being part of a team fosters a sense of belonging and community, which is crucial for mental health. As players engage with others on the field, they build friendships and social networks that can provide support outside of the game, further enhancing their overall well-being.']
#     #
#     # query = "cricket"
#     # documents = ['https://www.betterhealth.vic.gov.au/health/healthyliving/cricket-health-benefits',
#     #              'https://pmc.ncbi.nlm.nih.gov/articles/PMC6858230/']  # Payload for the request
#     payload = {
#         "messages": [
#             {
#                 "role": "system",
#                 "content": [
#                     {
#                         "type": "text",
#                         "text": "You will be provided with query and some Summary, along with the retrieved documents links which will be given by the user in the list of name articles_links the content at the link will be used by you for calculating the groundedness score of summary with each article. Your goal is to assess summary groundedness for each summary. Your evaluation should consist of the following:  Summary Groundedness: Evaluate how well each summary is grounded in the fetched article from the article link. Criteria:\n        Evidence Accuracy: Does the sentence summary accurately reflect the content of the article?\n        Evidence Citation: Does the summary cite specific parts of the article?\n        Consistency: Is the summary consistent with the facts from the article?\n\n  For each sentence, you need to rate how much it can be derived (or is grounded) in each of the article. You need to evaluate on a scale from 0 to 5. You should follow the following JSON format : {article_url_1:  score from 1 to 5,..., article_url_n:  score from 1 to 5}"
#
#                     }
#
#                 ]
#             },
#             {
#                 "role": "user",
#                 "content": [
#                     {
#                         "type": "text",
#                         "text": f"query: {query}, Summary: {summary_sentence}, article_links:{articles}"
#                     }
#                 ]
#             },
#         ],
#         "temperature": 0.7,
#         "top_p": 0.95,
#         "max_tokens": 800
#     }
#
#     ENDPOINT = "https://sweden-api.openai.azure.com/openai/deployments/gpt-4o-mini-atharv/chat/completions?api-version=2024-02-15-preview"
#
#     # Send request
#     try:
#         response = requests.post(ENDPOINT, headers=headers, json=payload)
#         response.raise_for_status()  # Will raise an HTTPError if the HTTP request returned an unsuccessful status code
#         response_json = response.json()
#         print(response_json)
#
#         content = response_json['choices'][0]['message']['content']
#         import json
#         scores_dict = json.loads(content)
#         print(type(scores_dict))
#         return scores_dict
#
#
#     except requests.RequestException as e:
#         raise SystemExit(f"Failed to make the request. Error: {e}")

    # return {'sentence id': {'doc id': 'score..', 'doc id 2': 'score 1 to 5'}}
#
# print(compute_groundedness('Cricket is not only an enjoyable sport but also offers numerous health benefits for players of all ages. Engaging in cricket can enhance physical fitness through cardiovascular exercise, strength training, and improved coordination. The various positions in cricket, whether batting, bowling, or fielding, require different physical skills, promoting overall body fitness and agility. Additionally, the social aspect of playing cricket encourages teamwork and camaraderie, contributing to mental well-being and reducing stress levels.',['https://www.betterhealth.vic.gov.au/health/healthyliving/cricket-health-benefits',
#                   'https://pmc.ncbi.nlm.nih.gov/articles/PMC6858230/'] , "groundedness", "cricket"))

# from openai import OpenAI
# import json
#
#
# class GroundednessIdentifier:
#     def __init__(self):
#         self.client = OpenAI()  # Assumes OPENAI_API_KEY environment variable is set
#
#     def compute_groundedness(self, summary_sentences: dict, source_articles: dict):
#         prompt = self._build_prompt(summary_sentences, source_articles)
#
#         response = self.client.chat.completions.create(
#             model="gpt-3.5-turbo-1106",
#             response_format={"type": "json"},
#             messages=[{
#                 "role": "system",
#                 "content": "{
#   "groundedness": "You will be provided with a summary with multiple sentences for a search query, along with the retrieved documents for that query. Your goal is to assess summary groundedness for each sentence. Your evaluation should consist of the following:  Summary Groundedness: Evaluate how well each summary sentence is grounded in the provided evidence documents. Criteria:\n        Evidence Accuracy: Does the sentence summary accurately reflect the content of the evidence documents?\n        Evidence Citation: Does the summary cite specific parts of the evidence?\n        Consistency: Is the summary consistent with the facts from the evidence?\n\n  For each sentence, you need to rate how much it can be derived (or is grounded) in each of the documents. You need to evaluate on a scale from 0 to 5. You should follow the following JSON format : {\"sentence id\": {\"doc id\": {explanation: \" explanation of why this sentence is allotted this score \" score: \"score from 1 to 5\"}, \"doc id\": {explanation: score: \"score from 1 to 5\"}}"
# }"
#             }, {
#                 "role": "user",
#                 "content": prompt
#             }]
#         )
#
#         return json.loads(response.choices[0].message.content)
#
#     def _build_prompt(self, summary_sentences: dict, source_articles: dict):
#         return f"""
# For each summary sentence below, identify which source documents support it and score the groundedness from 1-5 (1=not grounded, 5=fully grounded).
#
# Summary sentences:
# {json.dumps(summary_sentences, indent=2)}
#
# Source articles:
# {json.dumps(source_articles, indent=2)}
#
# Return a JSON with the format:
# {{
#     "sentence_id": {{
#         "doc_id": score,
#         "doc_id_2": score
#     }}
# }}"""

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

    API_KEY = "e3cc9b0d6a4f4e13a194fe19a95ffc47"  # Add your API key here
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