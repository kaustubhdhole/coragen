import os
import logging
import threading
from functools import lru_cache
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import requests

# Set up logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Model cache to store loaded models
model_cache = {}
model_load_lock = threading.Lock()


def is_valid_huggingface_model(model_name):
    """Check if a model exists on HuggingFace Hub."""
    try:
        api_url = f"https://huggingface.co/api/models/{model_name}"
        response = requests.get(api_url)
        return response.status_code == 200
    except Exception as e:
        logger.error(f"Error checking model {model_name}: {str(e)}")
        return False


def load_model(model_name, model_type='generator', use_gpu=True):
    """
    Load a model from HuggingFace Hub.

    Args:
        model_name (str): The name of the model on HuggingFace
        model_type (str): Either 'generator' or 'evaluator'
        use_gpu (bool): Whether to use GPU acceleration

    Returns:
        dict: Status of model loading operation
    """
    cache_key = f"{model_type}_{model_name}"

    # Check if model is already loaded
    if cache_key in model_cache:
        logger.info(f"Model {model_name} already loaded for {model_type}")
        return {"status": "success", "message": "Model already loaded", "model_id": model_name}

    # Use a lock to prevent concurrent loading of the same model
    with model_load_lock:
        try:
            # Verify model exists on HuggingFace
            if not is_valid_huggingface_model(model_name):
                return {"status": "error", "message": f"Model {model_name} not found on HuggingFace"}

            logger.info(f"Loading model {model_name} for {model_type}...")

            # Set device based on availability
            device = "cuda" if torch.cuda.is_available() and use_gpu else "cpu"
            logger.info(f"Using device: {device}")

            # Load tokenizer
            tokenizer = AutoTokenizer.from_pretrained(model_name)

            # Load model with appropriate settings based on type
            if model_type == 'generator':
                model = AutoModelForCausalLM.from_pretrained(
                    model_name,
                    torch_dtype=torch.float16 if device == "cuda" else torch.float32,
                    device_map="auto" if device == "cuda" else None,
                    low_cpu_mem_usage=True
                )

                # Create text generation pipeline
                text_generator = pipeline(
                    "text-generation",
                    model=model,
                    tokenizer=tokenizer,
                    device=0 if device == "cuda" else -1
                )

                model_cache[cache_key] = {
                    "model": model,
                    "tokenizer": tokenizer,
                    "pipeline": text_generator
                }

            elif model_type == 'evaluator':
                model = AutoModelForCausalLM.from_pretrained(
                    model_name,
                    torch_dtype=torch.float16 if device == "cuda" else torch.float32,
                    device_map="auto" if device == "cuda" else None,
                    low_cpu_mem_usage=True
                )

                # Create text generation pipeline with lower temperature for evaluation
                evaluator = pipeline(
                    "text-generation",
                    model=model,
                    tokenizer=tokenizer,
                    device=0 if device == "cuda" else -1
                )

                model_cache[cache_key] = {
                    "model": model,
                    "tokenizer": tokenizer,
                    "pipeline": evaluator
                }

            logger.info(f"Successfully loaded {model_name} for {model_type}")
            return {"status": "success", "message": "Model loaded successfully", "model_id": model_name}

        except Exception as e:
            logger.error(f"Failed to load model {model_name}: {str(e)}")
            return {"status": "error", "message": f"Failed to load model: {str(e)}"}


def unload_model(model_name, model_type='generator'):
    """Unload a model from memory."""
    cache_key = f"{model_type}_{model_name}"

    if cache_key in model_cache:
        try:
            # Delete the model and references to free up memory
            del model_cache[cache_key]
            # Force garbage collection
            import gc
            gc.collect()

            # Clear CUDA cache if available
            if torch.cuda.is_available():
                torch.cuda.empty_cache()

            logger.info(f"Unloaded model {model_name} for {model_type}")
            return {"status": "success", "message": "Model unloaded successfully"}
        except Exception as e:
            logger.error(f"Error unloading model {model_name}: {str(e)}")
            return {"status": "error", "message": str(e)}
    else:
        return {"status": "warning", "message": "Model not found in cache"}


def get_available_models(model_type=None):
    """Get a list of currently loaded models."""
    models = []

    for key, _ in model_cache.items():
        type_prefix, model_name = key.split('_', 1)
        if model_type is None or type_prefix == model_type:
            models.append({
                "id": model_name,
                "type": type_prefix,
                "is_loaded": True
            })

    return models


def generate_text(model_name, prompt, params=None):
    """
    Generate text using a loaded model.

    Args:
        model_name (str): The name of the loaded model
        prompt (str): The prompt for text generation
        params (dict): Parameters for generation like max_length, temperature, etc.

    Returns:
        str: Generated text
    """
    cache_key = f"generator_{model_name}"

    if cache_key not in model_cache:
        raise ValueError(f"Model {model_name} not loaded. Please load it first.")

    # Default parameters
    default_params = {
        "max_new_tokens": 512,
        "temperature": 0.7,
        "top_p": 0.95,
        "repetition_penalty": 1.1,
        "do_sample": True
    }

    # Override defaults with provided params
    if params:
        default_params.update(params)

    try:
        generator = model_cache[cache_key]["pipeline"]
        result = generator(
            prompt,
            **default_params
        )

        # Extract the generated text from the result
        generated_text = result[0]['generated_text']

        # Remove the prompt from the beginning
        if generated_text.startswith(prompt):
            generated_text = generated_text[len(prompt):].strip()

        return generated_text
    except Exception as e:
        logger.error(f"Error generating text with {model_name}: {str(e)}")
        raise


def evaluate_groundedness(model_name, summary_text, articles, query, attribute):
    """
    Evaluate groundedness of a summary against source articles.

    Args:
        model_name (str): The name of the loaded evaluator model
        summary_text (str): The summary to evaluate
        articles (list): List of article URLs
        query (str): The original search query
        attribute (str): The attribute or aspect being analyzed

    Returns:
        dict: Groundedness scores for each article
    """
    cache_key = f"evaluator_{model_name}"

    if cache_key not in model_cache:
        raise ValueError(f"Evaluator model {model_name} not loaded. Please load it first.")

    try:
        evaluator = model_cache[cache_key]["pipeline"]

        # Construct the prompt for groundedness evaluation
        prompt = (
            f"You will evaluate the groundedness of a summary based on articles. "
            f"Score each article from 0 to 5 where 0 means not grounded at all and 5 means fully grounded.\n\n"
            f"Query: {query}\n"
            f"Aspect: {attribute}\n"
            f"Summary: {summary_text}\n"
            f"Articles: {articles}\n\n"
            f"Provide your evaluation as a JSON with article URLs as keys and scores as values:\n"
        )

        # Generate evaluation
        result = evaluator(
            prompt,
            max_new_tokens=128,
            temperature=0.3,
            do_sample=False,
            return_full_text=False
        )

        # Extract the generated text
        generated_text = result[0]['generated_text']

        # Parse the JSON from the response
        import json
        import re

        # Try to extract JSON object from the response
        match = re.search(r'{.*}', generated_text, re.DOTALL)
        if match:
            try:
                scores_dict = json.loads(match.group(0))
                # Validate and normalize scores
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
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                logger.error(f"Failed to parse JSON from evaluation: {generated_text}")
                return {url: 0 for url in articles}
        else:
            logger.error(f"No JSON found in evaluation response: {generated_text}")
            return {url: 0 for url in articles}

    except Exception as e:
        logger.error(f"Error evaluating groundedness with {model_name}: {str(e)}")
        return {url: 0 for url in articles}


# API handler for HuggingFace through REST API
def generate_text_api(model_name, prompt, api_key, params=None):
    """Use HuggingFace Inference API to generate text."""
    API_URL = f"https://api-inference.huggingface.co/models/{model_name}"
    headers = {"Authorization": f"Bearer {api_key}"}

    # Default parameters
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 512,
            "temperature": 0.7,
            "top_p": 0.95,
            "repetition_penalty": 1.1,
            "do_sample": True
        }
    }

    # Override defaults with provided params
    if params:
        payload["parameters"].update(params)

    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        response.raise_for_status()

        result = response.json()

        # The API response format can vary - handle different formats
        if isinstance(result, list) and result:
            if "generated_text" in result[0]:
                return result[0]["generated_text"]

        # Fallback for different API responses
        return str(result)

    except Exception as e:
        logger.error(f"Error using HuggingFace API for {model_name}: {str(e)}")
        raise