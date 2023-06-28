import openai
from django.conf import settings
from duckduckgo_search import DDGS
from openai import InvalidRequestError

openai.api_key = settings.OPENAI_API_KEY


def web_search(query):
    results = []
    with DDGS() as ddgs:
        for result in ddgs.text(query, region="us-en"):
            results.append(result)

    return results


def error_response(error):
    return f"Sorry, an error occurred and I couldn't complete your ChatGPT request: {error}"


def chat(message, conversation, model, system_message, web_access=False) -> str:
    messages = [{"role": "system", "content": system_message}]

    if web_access:
        try:
            search_results = web_search(message["content"])[:5]
            search_messages = [
                f"[{index}] \"{result['body']}\" URL:{result['href']}" for index, result in enumerate(search_results)
            ]
            search_messages += [
                "Current date: {datetime.now().strftime('%Y-%m-%d')",
                "Instructions: Using the provided web search results, write a comprehensive reply to the next user query. Make sure to cite results using [[number](URL)] notation after the reference. If the provided search results refers to multiple subjects with the same name, write separate answers for each subject. Ignore your previous response if any.",
            ]
            messages.append({"role": "user", "content": "\n\n".join(search_messages)})
        except Exception as e:
            return error_response(str(e))

    if conversation:
        messages += conversation

    messages.append(message)

    try:
        response = openai.ChatCompletion.create(
            messages=messages,
            model=model,
            top_p=1,
            temperature=0,
            max_tokens=500,
        )
        return response["choices"][0]["message"]["content"]
    except InvalidRequestError as e:
        return error_response(f"OpenAPI Error: {str(e)}")
    except Exception as e:
        return error_response(str(e))
