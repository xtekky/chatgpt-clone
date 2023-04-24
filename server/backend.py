from json import dumps
from time import time
from flask import request
from hashlib import sha256
from datetime import datetime
from requests import get
from requests import post 

from server.config import special_instructions


class Backend_Api:
    def __init__(self, app) -> None:
        self.app = app
        self.routes = {
            '/backend-api/v2/conversation': {
                'function': self._conversation,
                'methods': ['POST']
            }
        }

    def _conversation(self):
        try:
            jailbreak = request.json['jailbreak']
            internet_access = request.json['meta']['content']['internet_access']
            _conversation = request.json['meta']['content']['conversation']
            prompt = request.json['meta']['content']['parts'][0]
            current_date = datetime.now().strftime("%Y-%m-%d")
            system_message = f'You are GPT-3.5 also known as ChatGPT, a large language model trained by OpenAI. Strictly follow the users instructions. Knowledge cutoff: 2021-09-01 Current date: {current_date}'

            if '0040' in request.json['model']:
                system_message = f'You are GPT-4, newest generation of OpenAI GPT series. Strictly follow the users instructions. Knowledge cutoff: 2021-09-01 Current date: {current_date}'

            extra = []
            if internet_access:
                search = get('https://ddg-api.herokuapp.com/search', params={
                    'query': prompt["content"],
                    'limit': 3,
                })

                blob = ''

                for index, result in enumerate(search.json()):
                    blob += f'[{index}] "{result["snippet"]}"\nURL:{result["link"]}\n\n'

                date = datetime.now().strftime('%d/%m/%y')

                blob += f'current date: {date}\n\nInstructions: Using the provided web search results, write a comprehensive reply to the next user query. Make sure to cite results using [[number](URL)] notation after the reference. If the provided search results refer to multiple subjects with the same name, write separate answers for each subject. Ignore your previous response if any.'

                extra = [{'role': 'user', 'content': blob}]

            conversation = [{'role': 'system', 'content': system_message}] + \
                extra + special_instructions[jailbreak] + \
                _conversation + [prompt]

            timestamp = int(time() * 1000)
            headers = {
                'authority' : 'chatforai.com',
                'origin'    : 'https://chatforai.com',
                'referer'   : 'https://chatforai.com/',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
            }

            gpt_resp = post('https://chatforai.com/api/generate', headers=headers, stream=True, 
                data = dumps(separators=(',', ':'), obj={
                    'messages': conversation,
                    'time': timestamp,
                    'pass': None,
                    'sign': sha256(f'{timestamp}:{conversation[-1]["content"]}:k6zeE77ge7XF'.encode()).hexdigest(), 'key': ''}))

            def stream():
                answer = ''
                for chunk in gpt_resp.iter_content(chunk_size=1024):
                    try:
                        answer += chunk.decode()
                        yield chunk.decode()

                    except GeneratorExit:
                        break

                    except Exception as e:
                        print(e)
                        print(e.__traceback__.tb_next)
                        continue
                        
            return self.app.response_class(stream(), mimetype='text/event-stream')

        except Exception as e:
            print(e)
            print(e.__traceback__.tb_next)
            return {
                '_action': '_ask',
                'success': False,
                "error": f"an error occured {str(e)}"}, 400
