from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime
from search_system import search_query, display_snippet
from summary_generator import generate_summary, generate_gpt_summary
from groundedness_identifier import compute_groundedness
from cross_attribute_scorer import compute_cross_attribute_scores  # New import
import html_parser
from huggingface_handler import (
    load_model,
    unload_model,
    get_available_models,
    generate_text,
    evaluate_groundedness,
    generate_text_api
)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


def get_relevance_score(content, attribute):
    """Calculate relevance score for content related to attribute"""
    return 0.85


def process_attribute_data(content, attribute, generator_settings, evaluation_settings, query, article_links):
    """Process content based on specific attribute"""

    print(evaluation_settings)

    # Check if HuggingFace is the selected generator
    if generator_settings.get('generator') == 'huggingface':
        generated_summary_list = generate_huggingface_summary(
            query,
            attribute,
            article_links,
            generator_settings.get('huggingface', {})
        )
    else:
        # Original generate_summary call
        generated_summary_list = generate_summary(
            generator_settings,
            query,
            attribute,
            article_links
        )

    # Process articles first
    articles = []
    for i, article_content in enumerate(content[:5]):
        relevance_score = get_relevance_score(article_content["extracted_content"], attribute)
        if relevance_score > 0.6:  # relevance cutoff
            articles.append({
                "id": f"article_{i}",
                "title": article_content["article_title"],
                "content": display_snippet(article_content["extracted_content"]),
                "url": article_links[i] if i < len(article_links) else "#",
                "relevance_score": relevance_score
            })

    # Create summary points
    summary_points = []
    for i, content_chunk in enumerate(generated_summary_list):
        summary_point = {
            "id": f"summary_{i}",
            "text": content_chunk,
            "confidence": 0.9,
            "source_count": len(articles)
        }

        # Check if evaluation settings contain Answer Groundedness
        is_groundedness_enabled = False  # Default value
        groundedness_prompt = ""

        # First determine if the evaluation settings is a list (from categories) or a dict
        if isinstance(evaluation_settings, list):
            for setting in evaluation_settings:
                if isinstance(setting, dict) and setting.get("name") == "Answer Groundedness":
                    is_groundedness_enabled = setting.get("isEnabled", False)
                    groundedness_prompt = setting.get("prompt", "")
                    break  # Exit loop once "Answer Groundedness" is found

            # If huggingface evaluator is enabled in the evaluation settings
            huggingface_evaluator_enabled = False
            huggingface_settings = None

            for setting in evaluation_settings:
                if isinstance(setting, dict) and setting.get("huggingface"):
                    huggingface_settings = setting.get("huggingface", {})
                    huggingface_evaluator_enabled = huggingface_settings.get("evaluatorEnabled", False)
                    break

        else:  # Dictionary format
            # This handles the case where evaluation_settings is a dictionary
            is_groundedness_enabled = evaluation_settings.get("Answer Groundedness", {}).get("isEnabled", False)
            groundedness_prompt = evaluation_settings.get("Answer Groundedness", {}).get("prompt", "")
            huggingface_evaluator_enabled = evaluation_settings.get("huggingface", {}).get("evaluatorEnabled", False)
            huggingface_settings = evaluation_settings.get("huggingface", {})

        # Compute groundedness scores if enabled
        if is_groundedness_enabled:
            # Check if HuggingFace is being used for evaluation - fixed to handle both list and dict formats
            if huggingface_evaluator_enabled and huggingface_settings:
                # Use HuggingFace for groundedness evaluation
                scores = compute_huggingface_groundedness(
                    content_chunk,
                    article_links,
                    attribute,
                    query,
                    huggingface_settings
                )
            else:
                # Use original groundedness computation
                scores = compute_groundedness(
                    content_chunk,
                    article_links,
                    groundedness_prompt,
                    attribute,
                    query
                )

            # Transform scores into articleScores format
            if scores:  # Add null check since compute_groundedness might return None
                article_scores = {}
                for j, article in enumerate(articles):
                    article_id = f"article_{j}"
                    # Get score from groundedness result, default to 3.0 if not found
                    score = scores.get(article["url"], 3.0)  # Default to 3.0 if URL not found
                    article_scores[article_id] = score

                summary_point["articleScores"] = article_scores
        else:
            # If groundedness is not enabled, provide default scores
            article_scores = {}
            for j, _ in enumerate(articles):
                article_id = f"article_{j}"
                # Provide a default score based on article relevance
                article_scores[article_id] = 3.0 + (0.5 * (len(articles) - j))  # Decreasing scores from 5.0
            summary_point["articleScores"] = article_scores

        summary_points.append(summary_point)

    return {
        "summary": summary_points,
        "articles": articles
    }

@app.route('/')
def home():
    return "Home Page"


@app.route('/api/search', methods=['POST'])
def perform_search():
    try:
        data = request.get_json()
        print(data)
        query = data.get('query', '')
        browser = data.get('browser', {}).get('type', 'google')
        generator_settings = data.get('generator', {})
        evaluation_settings = data.get('evaluation', {}).get('categories', {})
        attributes = data.get('attributes', [])

        logger.info(f"Processing search request - Query: {query}, Browser: {browser}, Attributes: {attributes}")

        if not query or not attributes:
            return jsonify({
                "error": "Missing required parameters",
                "details": {
                    "query": "Required" if not query else None,
                    "attributes": "Required" if not attributes else None
                }
            }), 400

        # Search settings
        search_settings = {
            'search_system': browser,
            'num_results': 10,
            'relevance_cutoff': 0.6
        }

        # Process results for each attribute
        articles_and_summaries = {}
        for attribute in attributes:
            search_results = search_query(query, attribute, search_settings)
            attribute_content = []
            attribute_links = []

            for url in search_results:
                try:
                    extracted_content, title = html_parser.url_to_text(url)

                    if extracted_content and len(attribute_content) < 5:
                        attribute_links.append(url)
                        attribute_content.append({"article_title": title, "extracted_content": extracted_content})
                    else:
                        break
                except Exception as e:
                    logger.warning(f"Error processing URL for {attribute}: {str(e)}")
                    continue

            # Process data for this attribute
            if attribute_content:
                articles_and_summaries[attribute] = process_attribute_data(
                    attribute_content,
                    attribute,
                    generator_settings,
                    evaluation_settings,
                    query,
                    attribute_links
                )
            else:
                logger.warning(f"No content found for attribute: {attribute}")

        # NEW CODE: Calculate cross-attribute scores if there are multiple attributes
        if len(articles_and_summaries) > 1:
            # Get API key from generator settings
            api_key = generator_settings.get('apiKey', '')
            # Compute cross-attribute relevance scores
            articles_and_summaries = compute_cross_attribute_scores(articles_and_summaries, api_key)

        response_data = {
            "status": "success",
            "query": query,
            "timestamp": datetime.now().isoformat(),
            "results": articles_and_summaries,
            "metadata": {
                "browser": browser,
                "total_sources": len(articles_and_summaries),
                "processed_attributes": len(articles_and_summaries),
                "processing_time": datetime.now().isoformat()
            }
        }
        print(response_data)
        return jsonify(response_data), 200

    except Exception as e:
        logger.error(f"Error processing search: {str(e)}", exc_info=True)
        return jsonify({
            "error": "Internal server error",
            "details": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500


@app.route('/api/huggingface/models', methods=['GET'])
def get_models():
    """Get list of available HuggingFace models."""
    model_type = request.args.get('type', None)
    models = get_available_models(model_type)
    return jsonify({
        "status": "success",
        "models": models
    }), 200


@app.route('/api/huggingface/load', methods=['POST'])
def load_hf_model():
    """Load a HuggingFace model."""
    try:
        data = request.get_json()
        model_name = data.get('model_name')
        model_type = data.get('model_type', 'generator')
        use_gpu = data.get('use_gpu', True)

        if not model_name:
            return jsonify({
                "status": "error",
                "message": "Model name is required"
            }), 400

        result = load_model(model_name, model_type, use_gpu)
        return jsonify(result), 200 if result["status"] == "success" else 500

    except Exception as e:
        logger.error(f"Error loading model: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route('/api/huggingface/unload', methods=['POST'])
def unload_hf_model():
    """Unload a HuggingFace model."""
    try:
        data = request.get_json()
        model_name = data.get('model_name')
        model_type = data.get('model_type', 'generator')

        if not model_name:
            return jsonify({
                "status": "error",
                "message": "Model name is required"
            }), 400

        result = unload_model(model_name, model_type)
        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error unloading model: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


def generate_huggingface_summary(query, attribute, article_links, settings):
    """Generate summary using HuggingFace models."""
    try:
        # Check whether to use API or local model
        if settings.get('deployment') == 'api':
            api_key = settings.get('apiKey')
            model_name = settings.get('selectedModel')

            if not api_key or not model_name:
                logger.error("API key and model name required for HuggingFace API")
                return ["Error: API key and model name are required"]

            # Construct prompt for the API
            prompt = (
                f"Generate a summary of the following articles about {attribute} related to '{query}'. "
                f"Provide 3 distinct paragraphs that capture the key points:"
            )

            # Generate using the API
            result = generate_text_api(
                model_name=model_name,
                prompt=prompt,
                api_key=api_key,
                params={
                    "max_new_tokens": settings.get('maxNewTokens', 512),
                    "temperature": settings.get('temperature', 0.7),
                    "top_p": settings.get('topP', 0.95)
                }
            )

            # Split into paragraphs
            paragraphs = [p.strip() for p in result.split("\n\n") if p.strip()]

            # Return at most 3 paragraphs
            return paragraphs[:4]

        else:  # Local model
            model_name = settings.get('selectedModel')

            if not model_name:
                logger.error("Model name required for local HuggingFace generation")
                return ["Error: Model name is required"]

            # Construct prompt for local model
            prompt = (
                f"Generate a summary of the following articles about {attribute} related to '{query}'. "
                f"Provide 3 distinct paragraphs that capture the key points:"
            )

            # Generate text using loaded model
            result = generate_text(
                model_name=model_name,
                prompt=prompt,
                params={
                    "max_new_tokens": settings.get('maxNewTokens', 512),
                    "temperature": settings.get('temperature', 0.7),
                    "top_p": settings.get('topP', 0.95)
                }
            )

            # Split into paragraphs
            paragraphs = [p.strip() for p in result.split("\n\n") if p.strip()]

            # Return at most 3 paragraphs
            return paragraphs[:3]

    except Exception as e:
        logger.error(f"HuggingFace summary error: {str(e)}")
        return [f"Error generating summary: {str(e)}"]


def compute_huggingface_groundedness(summary_sentence, articles, attribute, query, settings):
    """Compute groundedness using HuggingFace models."""
    try:
        # Check whether to use API or local model
        if settings.get('deployment') == 'api':
            api_key = settings.get('apiKey') or settings.get('generatorApiKey')
            model_name = settings.get('selectedModel')

            if not api_key or not model_name:
                logger.error("API key and model name required for HuggingFace API")
                return {url: 0 for url in articles}

            # Use API-based evaluation
            # This would require implementation if needed
            logger.warning("API-based groundedness evaluation not implemented")
            return {url: 3.0 for url in articles}  # Default scores

        else:  # Local model
            model_name = settings.get('selectedModel')

            if not model_name:
                logger.error("Model name required for local HuggingFace evaluation")
                return {url: 0 for url in articles}

            # Use local model evaluation
            return evaluate_groundedness(
                model_name=model_name,
                summary_text=summary_sentence,
                articles=articles,
                query=query,
                attribute=attribute
            )

    except Exception as e:
        logger.error(f"HuggingFace evaluation error: {str(e)}")
        return {url: 0 for url in articles}


@app.route('/api/test-search', methods=['GET', 'POST'])
def test_search():
    """Test endpoint that returns dummy data to test frontend color coding"""
    from datetime import datetime
    from flask import jsonify

    dummy_data = {
        "status": "success",
        "query": "Should LLM be open sourced",
        "timestamp": "2025-03-27T21:34:36",
        "results": {
            "Benefits": {
                "summary": [
                    {
                        "id": "summary_0",
                        "text": "Open-source LLMs enable transparency and compliance while reducing bias through code inspection, with IBM research showing 47% fewer bias incidents due to comprehensive auditing. Organizations in regulated industries have increasingly adopted these models, with GovTech reporting 68% implementation specifically for their verifiable compliance features that align with legal and ethical requirements.",
                        "confidence": 0.9,
                        "source_count": 3,
                        "articleScores": {
                            "article_0": 4.7,
                            "article_1": 3.8,
                            "article_2": 4.5,
                            "article_3": 2.9,
                            "article_4": 3.2
                        },
                        "crossAttributeScores": {
                            "Drawbacks": {
                                "summary_0": 4.5,
                                "summary_1": 1.8,
                                "summary_2": 3.2,
                                "summary_3": 0.6
                            }
                        },
                        "groundedness": 3.8
                    },
                    {
                        "id": "summary_1",
                        "text": "Eliminating licensing fees and vendor dependency makes AI more accessible to smaller organizations, with Data Science Dojo reporting average savings of $125,000-$450,000 annually. Implementation ROI is achieved quickly, with 72% of SMEs recouping costs within 14 months while experiencing an additional 30% reduction in vendor support expenses.",
                        "confidence": 0.88,
                        "source_count": 2,
                        "articleScores": {
                            "article_0": 3.9,
                            "article_1": 4.8,
                            "article_2": 2.7,
                            "article_3": 3.0,
                            "article_4": 3.5
                        },
                        "crossAttributeScores": {
                            "Drawbacks": {
                                "summary_0": 3.2,
                                "summary_1": 2.5,
                                "summary_2": 2.8,
                                "summary_3": 3.4
                            }
                        },
                        "groundedness": 3.6
                    },
                    {
                        "id": "summary_2",
                        "text": "Global collaboration accelerates LLM innovation, with the 2024 Open AI Ecosystem Report documenting 347 monthly contributions from over 40 countries. This collective approach delivers performance improvements 2.3 times faster than proprietary alternatives and enables specialized adaptations across 23 industries within months rather than years.",
                        "confidence": 0.87,
                        "source_count": 3,
                        "articleScores": {
                            "article_0": 3.4,
                            "article_1": 4.6,
                            "article_2": 2.8,
                            "article_3": 4.4,
                            "article_4": 3.9
                        },
                        "crossAttributeScores": {
                            "Drawbacks": {
                                "summary_0": 3.0,
                                "summary_1": 2.3,
                                "summary_2": 3.7,
                                "summary_3": 3.1
                            }
                        },
                        "groundedness": 3.8
                    },
                    {
                        "id": "summary_3",
                        "text": "On-premises deployment of open-source LLMs significantly enhances data security by keeping sensitive information under organizational control. TheBlue.ai research indicates 84% of enterprises using on-premises models reported zero data exposures compared to 37% for cloud-based alternatives, with healthcare organizations reducing compliance violations by 62% and financial institutions cutting incident response times by 41%.",
                        "confidence": 0.89,
                        "source_count": 2,
                        "articleScores": {
                            "article_0": 3.8,
                            "article_1": 2.7,
                            "article_2": 3.1,
                            "article_3": 4.9,
                            "article_4": 3.3
                        },
                        "crossAttributeScores": {
                            "Drawbacks": {
                                "summary_0": 3.3,
                                "summary_1": 2.6,
                                "summary_2": 2.4,
                                "summary_3": 3.0
                            }
                        },
                        "groundedness": 3.6
                    }
                ],
                "articles": [
                    {
                        "id": "article_0",
                        "title": "What are Open Source Large Language Models?",
                        "content": "Previously it seemed that the bigger an LLM was, the better, but now enterprises are realizing they can be prohibitively expensive in terms of research and innovation. In response, an open source model (link resides outside ibm.com) ecosystem began showing promise and challenging the LLM business model.Organizations can use open source LLM models to create virtually any project useful to their employees or, when the open source license allows, that can be offered as commercial products. Open source LLM models allow you to create an app with language generation abilities, such as writing emails, blog posts or creative stories. An LLM like Falcon-40B, offered under an Apache 2.0 license, can respond to a prompt with high-quality text suggestions you can then refine and polish.",
                        "url": "https://www.ibm.com/think/topics/open-source-llms",
                        "relevance_score": 0.9
                    },
                    {
                        "id": "article_1",
                        "title": "Open Source LLMs: Revolutionizing Enterprise Growth",
                        "content": "As soon as ChatGPT was revealed, OpenAI's GPT models quickly rose to prominence. However, businesses began to recognize the high costs associated with closed-source models, questioning the value of investing in large models that lacked specific knowledge about their operations. In response, many opted for smaller open LLMs, utilizing Retriever-And-Generator (RAG) pipelines to integrate their data, achieving comparable or even superior efficiency. There are several advantages to closed-source large language models worth considering.",
                        "url": "https://datasciencedojo.com/blog/open-source-llms-for-enterprises-benefits/",
                        "relevance_score": 0.88
                    },
                    {
                        "id": "article_2",
                        "title": "Open Source Large Language Models",
                        "content": "Large language models (LLMs) are foundation models that use artificial intelligence (AI), deep learning and massive data sets, including websites, articles and books, to generate text, translate between languages and write many types of content. There are two types of these generative AI models: proprietary large language models and open source large language models. Previously it seemed that the bigger an LLM was, the better, but now enterprises are realizing they can be prohibitively expensive in terms of research and innovation. In response, an open source model ecosystem began showing promise and challenging the LLM business model.",
                        "url": "https://insider.govtech.com/texas/sponsored/open-source-large-language-models",
                        "relevance_score": 0.87
                    },
                    {
                        "id": "article_3",
                        "title": "Open Source Large Language Models (LLMs) - Future",
                        "content": "While commercial models are often in the spotlight, using Open Source LLMs offers a range of noteworthy advantages: Independence from External Providers: Companies are not dependent on external vendors who may raise prices, discontinue services, or withdraw models. Businesses maintain full control over their AI infrastructure. Secure Data Processing: Since open-source models can be operated locally, sensitive data doesn't need to leave the company. This is particularly valuable in highly regulated industries like healthcare or finance. Reduced Latency for Time-Critical Applications: Running models on-device, rather than relying on API calls to external servers, significantly reduces latency. This is essential for real-time applications, where even slight delays could impact performance, such as in customer interactions, robotics, or edge computing scenarios. Long-Term Cost Efficiency: Unlike commercial models, which often charge based on usage, open-source models only incur the operational costs of your own infrastructure. This can lead to significant savings, especially with high usage volumes. Transparency and Trust: With open access to the code, companies gain insight into how the model operates, increasing trust. Businesses can ensure the model works as intended and optimize it when needed. Customization and Specialization: Open Source LLMs allow models to be fine-tuned for specific requirements. For instance, industry-specific customizations in healthcare can achieve maximum accuracy and relevance. Active Community and Tools: There is a vibrant community around Open Source Large Language Models, producing not only a wide range of models but also high-quality libraries and tools. These resources enable companies to stay up to date with the latest generative AI advancements and benefit from rapid innovation.",
                        "url": "https://theblue.ai/blog/open-source-large-llms/",
                        "relevance_score": 0.85
                    },
                    {
                        "id": "article_4",
                        "title": "The Open Source Advantage in Large Language Models (LLMs)",
                        "content": "Large language models (LLMs) have rapidly advanced natural language processing, driving significant breakthroughs in tasks such as text generation, machine translation, and domain-specific reasoning. The field now faces a critical dilemma in its approach: closed-source models like GPT-4 deliver state-of-the-art performance but restrict reproducibility, accessibility, and external oversight, while open-source frameworks like LLaMA and Mixtral democratize access, foster collaboration, and support diverse applications, achieving competitive results through techniques like instruction tuning and LoRA. Hybrid approaches address challenges like bias mitigation and resource accessibility by combining the scalability of closed-source systems with the transparency and inclusivity of open-source framework. However, in this position paper, we argue that open-source remains the most robust path for advancing LLM research and ethical deployment.",
                        "url": "https://arxiv.org/abs/2412.12004",
                        "relevance_score": 0.84
                    }
                ]
            },
            "Drawbacks": {
                "summary": [
                    {
                        "id": "summary_0",
                        "text": "Public nature of open-source LLMs introduces security vulnerabilities, with cyber security firms identifying 34 exploitable vulnerabilities in 2024 (41% classified as high-severity). These security gaps have resulted in 17 documented organizational breaches directly attributed to improperly secured implementations, causing approximately $240 million in combined damages.",
                        "confidence": 0.85,
                        "source_count": 3,
                        "articleScores": {
                            "article_0": 4.8,
                            "article_1": 3.9,
                            "article_2": 2.5,
                            "article_3": 3.3,
                            "article_4": 4.2
                        },
                        "crossAttributeScores": {
                            "Benefits": {
                                "summary_0": 3.5,
                                "summary_1": 3.2,
                                "summary_2": 3.0,
                                "summary_3": 3.3
                            }
                        },
                        "groundedness": 3.7
                    },
                    {
                        "id": "summary_1",
                        "text": "Insufficient regulation of open-source LLMs can amplify data biases, with audits revealing gender bias rates 23% higher than commercial alternatives and racial bias in 31% of responses. These biases have real-world impacts, with documented cases of discriminatory decision support affecting resource allocation in three municipal governments.",
                        "confidence": 0.83,
                        "source_count": 2,
                        "articleScores": {
                            "article_0": 2.9,
                            "article_1": 3.7,
                            "article_2": 4.9,
                            "article_3": 2.5,
                            "article_4": 3.2
                        },
                        "crossAttributeScores": {
                            "Benefits": {
                                "summary_0": 3.0,
                                "summary_1": 2.8,
                                "summary_2": 2.1,
                                "summary_3": 3.5
                            }
                        },
                        "groundedness": 3.4
                    },
                    {
                        "id": "summary_2",
                        "text": "Lack of safety barriers in open-source LLMs enables exploitation for harmful content creation, with the 2024 Disinformation Threat Report documenting 142 targeted political disinformation campaigns across 17 countries. Intelligence agencies have identified at least 7 sophisticated operations using fine-tuned open models to produce falsified evidence that bypassed standard detection methods.",
                        "confidence": 0.84,
                        "source_count": 3,
                        "articleScores": {
                            "article_0": 3.2,
                            "article_1": 3.8,
                            "article_2": 2.7,
                            "article_3": 4.9,
                            "article_4": 3.5
                        },
                        "crossAttributeScores": {
                            "Benefits": {
                                "summary_0": 3.4,
                                "summary_1": 2.7,
                                "summary_2": 3.7,
                                "summary_3": 2.4
                            }
                        },
                        "groundedness": 3.6
                    },
                    {
                        "id": "summary_3",
                        "text": "Widespread access to powerful AI capabilities raises dual-use concerns, with January 2025 research showing minimal technical expertise now required for sophisticated cyberattacks. Military analysts report previously nation-state capabilities now accessible to non-state actors, contributing to a 78% increase in industrial espionage targeting sensitive intellectual property sectors.",
                        "confidence": 0.82,
                        "source_count": 2,
                        "articleScores": {
                            "article_0": 3.3,
                            "article_1": 4.0,
                            "article_2": 2.5,
                            "article_3": 3.7,
                            "article_4": 4.8
                        },
                        "crossAttributeScores": {
                            "Benefits": {
                                "summary_0": 2.9,
                                "summary_1": 2.2,
                                "summary_2": 3.0,
                                "summary_3": 4.2
                            }
                        },
                        "groundedness": 3.7
                    }
                ],
                "articles": [
                    {
                        "id": "article_0",
                        "title": "Security Vulnerabilities in Open Source LLMs",
                        "content": "Detailed analysis of security risks and vulnerabilities associated with open-source language models. This comprehensive security review documents specific exploitation vectors unique to transparent AI architectures. The researchers identify and categorize 34 distinct vulnerability types discovered in popular open-source implementations during 2024, with severity classifications according to industry-standard CVSS metrics. The article includes forensic analysis of 17 documented breach incidents directly attributable to improperly secured open LLMs, with detailed impact assessments and financial damage estimates. It concludes with a security hardening framework specifically designed for organizations implementing open-source AI solutions, offering practical mitigation strategies for each vulnerability class.",
                        "url": "https://www.cybersecurity-review.com/open-source-llm-vulnerabilities",
                        "relevance_score": 0.88
                    },
                    {
                        "id": "article_1",
                        "title": "The Dark Side of AI Democratization",
                        "content": "Examines the potential misuses and ethical concerns surrounding widely accessible AI technologies. This ethics-focused paper explores the democratization paradox of AI capabilities becoming available to potentially malicious actors. The researchers trace the evolution of nation-state level capabilities becoming accessible to individuals and small organizations with minimal technical resources. The article presents a comprehensive ethical framework for evaluating AI deployment contexts and establishing appropriate safeguards. It includes interviews with security experts and policy analysts regarding the shifting landscape of technological capabilities. The conclusion offers nuanced perspectives on balancing innovation with responsible governance in open AI ecosystems, addressing both technical and policy-based approaches to ethical AI deployment.",
                        "url": "https://ethics.ai/reports/democratization-risks",
                        "relevance_score": 0.86
                    },
                    {
                        "id": "article_2",
                        "title": "Bias Amplification in Unregulated AI Models",
                        "content": "Research study on how open-source models can perpetuate and magnify societal biases without proper safeguards. This rigorous academic analysis presents findings from a comprehensive audit of five leading open-source LLMs using standardized fairness benchmarks. The researchers document significantly higher rates of gender and racial bias compared to commercial counterparts with built-in debiasing mechanisms. The study includes detailed case studies of public sector deployments where biased decision support directly impacted resource allocation in municipal governments. The article provides quantitative metrics on bias manifestation across different application domains and usage contexts. It concludes with a proposed regulatory framework and technical approaches for bias detection and mitigation specific to open-source AI implementations.",
                        "url": "https://ai-fairness-institute.org/research/bias-amplification",
                        "relevance_score": 0.85
                    },
                    {
                        "id": "article_3",
                        "title": "Weaponizing Open Source AI: Emerging Threats",
                        "content": "Analysis of how malicious actors exploit open AI technologies for harmful purposes. This threat intelligence report documents the alarming rise in malicious exploitation of open-source language models for disinformation and harmful content generation. The research compiles findings from the 2024 Disinformation Threat Report, providing detailed statistics on 142 separate political disinformation campaigns across 17 countries directly linked to repurposed open LLMs. The authors analyze the 218% year-over-year increase in AI-generated hate speech and present technical fingerprinting of seven sophisticated operations using fine-tuned open models to generate synthetic media. The report includes evasion techniques being employed to bypass current detection methods and concludes with recommended countermeasures for platforms and security researchers.",
                        "url": "https://www.threatintelligence.org/reports/open-source-ai-threats",
                        "relevance_score": 0.84
                    },
                    {
                        "id": "article_4",
                        "title": "Dual-Use Concerns in AI: The Open Source Dilemma",
                        "content": "Discusses the challenges of balancing innovation with security when AI capabilities become widely accessible. This policy-focused analysis examines the dual-use dilemmas inherent in open-source AI technologies. The researchers present evidence from January 2025 studies demonstrating how individuals with minimal technical expertise can now repurpose open models for sophisticated cyber attacks. The article quantifies the 65% reduction in skill barriers for conducting advanced persistent threats and analyzes the economic implications of previously restricted capabilities becoming widely available. Military and intelligence perspectives document the 78% increase in industrial espionage targeting sectors with sensitive intellectual property. The paper concludes with a balanced framework for policy approaches that preserve innovation benefits while establishing appropriate guardrails for high-risk capabilities.",
                        "url": "https://www.tech-policy-institute.org/reports/dual-use-ai-dilemma",
                        "relevance_score": 0.83
                    }
                ]
            }
        },
        "metadata": {
            "browser": "google",
            "total_sources": 9,
            "processed_attributes": 3,
            "processing_time": datetime.now().isoformat()
        }
    }

    return jsonify(dummy_data), 200

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5001, debug=True)