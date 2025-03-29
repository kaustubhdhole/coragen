"""
Cross-attribute relevance scoring module.
Evaluates the similarity between summaries across different attributes.
"""
import requests
import logging
import json

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


def compute_cross_attribute_scores(results, api_key=None):
    """
    Compute cross-attribute relevance scores between summaries of different attributes.

    Args:
        results: Dictionary containing results by attribute with summaries and articles
        api_key: OpenAI API key for scoring (optional if set in environment)

    Returns:
        Updated results dictionary with crossAttributeScores added to each summary
    """
    # Skip if only one attribute (no cross-comparison needed)
    if len(results) <= 1:
        logger.info("Only one attribute found, skipping cross-attribute scoring")
        return results

    logger.info(f"Computing cross-attribute scores for {len(results)} attributes")

    # Extract summaries by attribute
    summaries_by_attribute = {}
    for attr, data in results.items():
        if 'summary' in data:
            summaries_by_attribute[attr] = data['summary']

    # For each attribute and summary, compare with all summaries from other attributes
    for source_attr, source_summaries in summaries_by_attribute.items():
        for source_summary in source_summaries:
            # Initialize crossAttributeScores if it doesn't exist
            if 'crossAttributeScores' not in source_summary:
                source_summary['crossAttributeScores'] = {}

            for target_attr, target_summaries in summaries_by_attribute.items():
                if source_attr == target_attr:
                    continue  # Skip comparing with own attribute

                # Initialize this target attribute in crossAttributeScores
                if target_attr not in source_summary['crossAttributeScores']:
                    source_summary['crossAttributeScores'][target_attr] = {}

                for target_summary in target_summaries:
                    # Calculate relevance score between these two summaries
                    score = evaluate_summary_similarity(
                        source_summary['text'],
                        target_summary['text'],
                        api_key
                    )

                    # Store the score
                    source_summary['crossAttributeScores'][target_attr][target_summary['id']] = score

    return results


def evaluate_summary_similarity(summary1, summary2, api_key):
    """
    Use LLM to evaluate similarity between two summaries on a scale of 0-5.

    Args:
        summary1: Text of the first summary
        summary2: Text of the second summary
        api_key: OpenAI API key for scoring

    Returns:
        float: Similarity score between 0 and 5
    """
    # API_KEY = api_key or ""
    API_KEY=os.environ['OPEN-AI-KEY']
    headers = {
        "Content-Type": "application/json",
        "api-key": API_KEY,
    }

    prompt = f"""
    On a scale of 0 to 5, where 0 means completely unrelated and 5 means highly related,
    rate how relevant or similar these two summaries are to each other:

    Summary 1: {summary1}

    Summary 2: {summary2}

    Consider conceptual similarities, shared topics, and logical connections.
    Provide only a numerical score between 0 and 5, with one decimal place precision.
    """

    payload = {
        "messages": [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": "You are a helpful assistant that evaluates how similar two text summaries are to each other."
                    }
                ]
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            },
        ],
        "temperature": 0.3,
        "top_p": 0.95,
        "max_tokens": 20  # Keep it short as we only need a number
    }

    ENDPOINT = "https://sweden-api.openai.azure.com/openai/deployments/gpt-4o-mini-atharv/chat/completions?api-version=2024-02-15-preview"

    try:
        response = requests.post(ENDPOINT, headers=headers, json=payload)
        response.raise_for_status()

        response_json = response.json()
        content = response_json['choices'][0]['message']['content']

        # Parse the response to get the numerical score
        try:
            score = float(content.strip())
            # Ensure score is in valid range
            score = max(0, min(5, score))
            return round(score, 1)
        except ValueError:
            logger.warning(f"Could not parse LLM response as a number: {content}")
            return 0  # Neutral score as fallback

    except Exception as e:
        logger.error(f"Error calling LLM API: {str(e)}")
        return 0  # Neutral score as fallback