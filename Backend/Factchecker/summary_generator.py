import logging
import json
import requests
import openai

from transformers import pipeline
import anthropic

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def generate_gpt_summary( api_key: str, query, attribute,attribute_links) -> list:
    try:
        if not api_key:
            logger.error("No API key provided")
            return ["Error: API key is required"]
        API_KEY = "e3cc9b0d6a4f4e13a194fe19a95ffc47"
        headers = {
            "Content-Type": "application/json",
            "api-key": API_KEY,
        }

        # Summary Generation
        query = query
        documents = attribute_links  # Payload for the request
        payload = {
            "messages": [
                {
                    "role": "system",
                    "content": [
                        {
                            "type": "text",
                            "text": """"Analyze all articles and extract key insights addressing the query and selected aspect. Create a comprehensive, evidence-based summary that integrates perspectives from multiple sources without redundancy. For each key point:

1. Present one distinct argument or perspective
2. Include supporting evidence (specific facts, statistics, dates, or direct quotations)
3. Employ diverse language and phrasing to enhance readability
4. Contribute unique information not repeated elsewhere

Format your response as concise, insightful paragraphs (1-2 sentences each) in this JSON structure:

{
  "summary1": "First key insight with supporting evidence.",
  "summary2": "Second distinct perspective with relevant facts.",
  "summary3": "Third unique angle with specific supporting details.",
  "summary4": "Additional perspective with concrete evidence."
}
}"""
                        }
                    ]
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": f"Query: {query}, documents:{documents}"
                        }
                    ]
                },
            ],
            "temperature": 0.7,
            "top_p": 0.95,
            "max_tokens": 800
        }

        ENDPOINT = "https://sweden-api.openai.azure.com/openai/deployments/gpt-4o-mini-atharv/chat/completions?api-version=2024-02-15-preview"

        # Send request
        response = requests.post(ENDPOINT, headers=headers, json=payload)
        response.raise_for_status()

        response_json = response.json()
        content = response_json['choices'][0]['message']['content']
        parsed_content = json.loads(content.strip('```json\n').strip('```'))

        # Return just the list of paragraphs
        paragraphs =[]
        paragraphs.append(parsed_content['summary1'])
        paragraphs.append(parsed_content['summary2'])
        paragraphs.append(parsed_content['summary3'])
        paragraphs.append(parsed_content['summary4'])

        return paragraphs

    except requests.RequestException as e:
        logger.warning(f"API request failed: {str(e)}")
        return []
    except json.JSONDecodeError as e:
        logger.warning(f"JSON parsing failed: {str(e)}")
        return []
    except Exception as e:
        logger.warning(f"Unexpected error in summary generation: {str(e)}")
        return []

def generate_claude_summary(content: str, api_key: str) -> list:
    """Generate summary using Claude"""
    try:
        client = anthropic.Client(api_key=api_key)
        response = client.messages.create(
            model="claude-3",
            max_tokens=300,
            messages=[{
                "role": "user",
                "content": f"Generate a concise summary in 3-4 key points for: {content}"
            }]
        )
        summary = response.content[0].text
        return [point.strip() for point in summary.split('\n') if point.strip()]
    except Exception as e:
        logger.error(f"Claude summary error: {str(e)}")
        return []


def generate_huggingface_summary(content: str, api_key: str) -> list:
    """Generate summary using HuggingFace models"""
    try:
        summarizer = pipeline(
            "summarization",
            model="facebook/bart-large-cnn",
            token=api_key
        )

        # Handle long content by chunking
        max_chunk_length = 1024
        chunks = [content[i:i + max_chunk_length] for i in range(0, len(content), max_chunk_length)]

        summaries = []
        for chunk in chunks:
            result = summarizer(chunk, max_length=130, min_length=30)
            summaries.append(result[0]['summary_text'])

        return summaries
    except Exception as e:
        logger.error(f"HuggingFace summary error: {str(e)}")
        return []


def generate_summary(settings: dict, query,attribute, attribute_links) -> list:

    try:
        generator_type = settings.get('generator', 'gpt').lower()
        api_key = settings.get('apiKey')

        if not api_key:
            logger.error("No API key provided")
            return ["Error: API key is required"]

        # Choose generator based on settings
        if generator_type.startswith('gpt'):
            return generate_gpt_summary(api_key, query, attribute,attribute_links)

        elif generator_type == 'claude':
            return generate_claude_summary( api_key)

        elif generator_type == 'huggingface':
            return generate_huggingface_summary( api_key)

        else:
            # Fallback to basic summarization
            return [f'Generated summary of:...']

    except Exception as e:
        logger.error(f"Summary generation error: {str(e)}")
        return [f"Error generating summary: {str(e)}"]


# summary = [
#     'Cricket is not only an enjoyable sport but also offers numerous health benefits for players of all ages. Engaging in cricket can enhance physical fitness through cardiovascular exercise, strength training, and improved coordination. The various positions in cricket, whether batting, bowling, or fielding, require different physical skills, promoting overall body fitness and agility. Additionally, the social aspect of playing cricket encourages teamwork and camaraderie, contributing to mental well-being and reducing stress levels.',
#     "The sport of cricket involves running, jumping, and throwing, which can significantly improve cardiovascular health. Regular participation in cricket can lead to better heart health, increased stamina, and improved muscle tone. Furthermore, the game's dynamic nature helps in developing hand-eye coordination, balance, and reflexes, making it a comprehensive workout that targets multiple aspects of physical fitness. This can be particularly beneficial for younger players in their developmental years, as it encourages an active lifestyle.",
#     'Engaging in cricket also offers psychological benefits. The sport teaches valuable life skills such as discipline, perseverance, and strategic thinking. Players learn to handle both success and failure, which can enhance emotional resilience. Additionally, being part of a team fosters a sense of belonging and community, which is crucial for mental health. As players engage with others on the field, they build friendships and social networks that can provide support outside of the game, further enhancing their overall well-being.']
#
# query = "cricket"
# article_links = ['https://www.betterhealth.vic.gov.au/health/healthyliving/cricket-health-benefits',
#              'https://pmc.ncbi.nlm.nih.gov/articles/PMC6858230/']
#
# print(generate_gpt_summary("atharva","e3cc9b0d6a4f4e13a194fe19a95ffc47",query,article_links))