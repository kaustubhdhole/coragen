import os
import requests
import base64

# Configuration
API_KEY = "e3cc9b0d6a4f4e13a194fe19a95ffc47"
headers = {
    "Content-Type": "application/json",
    "api-key": API_KEY,
}
summary = [
    'Cricket is not only an enjoyable sport but also offers numerous health benefits for players of all ages. Engaging in cricket can enhance physical fitness through cardiovascular exercise, strength training, and improved coordination. The various positions in cricket, whether batting, bowling, or fielding, require different physical skills, promoting overall body fitness and agility. Additionally, the social aspect of playing cricket encourages teamwork and camaraderie, contributing to mental well-being and reducing stress levels.',
    "The sport of cricket involves running, jumping, and throwing, which can significantly improve cardiovascular health. Regular participation in cricket can lead to better heart health, increased stamina, and improved muscle tone. Furthermore, the game's dynamic nature helps in developing hand-eye coordination, balance, and reflexes, making it a comprehensive workout that targets multiple aspects of physical fitness. This can be particularly beneficial for younger players in their developmental years, as it encourages an active lifestyle.",
    'Engaging in cricket also offers psychological benefits. The sport teaches valuable life skills such as discipline, perseverance, and strategic thinking. Players learn to handle both success and failure, which can enhance emotional resilience. Additionally, being part of a team fosters a sense of belonging and community, which is crucial for mental health. As players engage with others on the field, they build friendships and social networks that can provide support outside of the game, further enhancing their overall well-being.']

query = "cricket"
article_links = ['https://www.betterhealth.vic.gov.au/health/healthyliving/cricket-health-benefits',
             'https://pmc.ncbi.nlm.nih.gov/articles/PMC6858230/']
# Payload for the request
payload = {
  "messages": [
    {
      "role": "system",
      "content": [
        {
          "type": "text",
          "text": "You will be provided with query and Summary along with the retrieved article links, the content at that link will be used for calculating the score. Your goal is to assess summary groundedness for each summary. Your evaluation should consist of the following:  Summary Groundedness: Evaluate how well each summary sentence is grounded in the provided evidence articles. Criteria:       Evidence Accuracy: Does the sentence summary accurately reflect the content of the evidence documents?       Evidence Citation: Does the summary cite specific parts of the evidence?        Consistency: Is the summary consistent with the facts from the evidence?  For each sentence, you need to rate how much it can be derived (or is grounded) in each of the article. You need to evaluate on a scale from 0 to 5. You should follow the following JSON format : {\"sentence id\": {\"article id\": {score: \"score from 1 to 5\"}, \"article id\": {score: \"score from 1 to 5\"}....}"
        }
      ]
    },
{
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": f"Query: {query}, article_links:{article_links}, summary:{summary}"
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
try:
    response = requests.post(ENDPOINT, headers=headers, json=payload)
    response.raise_for_status()  # Will raise an HTTPError if the HTTP request returned an unsuccessful status code
except requests.RequestException as e:
    raise SystemExit(f"Failed to make the request. Error: {e}")

# Handle the response as needed (e.g., print or process)
print(response.json())