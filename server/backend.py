from json import dumps
from time import time, sleep
from flask import request
from hashlib import sha256
from datetime import datetime
from requests import get
from requests import post
from orjson import loads
import threading
import weakref
import os

from server.config import special_instructions


class Backend_Api:
    def __init__(self, app, config: dict) -> None:
        self.app = app
        self.openai_key = os.getenv("OPENAI_API_KEY") or config['openai_key']
        self.openai_api_base = os.getenv("OPENAI_API_BASE") or config['openai_api_base']
        self.proxy = config['proxy']
        backend_config = config["backend_config"]
        self.join_chunks = backend_config["join_chunks"]
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
            system_message = f'You are ChatGPT also known as ChatGPT, a large language model trained by OpenAI. Strictly follow the users instructions. Knowledge cutoff: 2021-09-01 Current date: {current_date}'

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

            url = f"{self.openai_api_base}/v1/chat/completions"

            proxies = None
            if self.proxy['enable']:
                proxies = {
                    'http': self.proxy['http'],
                    'https': self.proxy['https'],
                }

            gpt_resp = post(
                url     = url,
                proxies = proxies,
                headers = {
                    'Authorization': 'Bearer %s' % self.openai_key
                }, 
                json    = {
                    'model'             : request.json['model'], 
                    'messages'          : conversation,
                    'stream'            : True
                },
                stream  = True
            )

            if gpt_resp.status_code >= 400:
                error_data = gpt_resp.json().get('error', {})
                error_code = error_data.get('code', None)
                error_message = error_data.get('message', "An error occurred")
                return {
                    'successs': False,
                    'error_code': error_code,
                    'message': error_message,
                    'status_code': gpt_resp.status_code
                }, gpt_resp.status_code

            def stream():
                for chunk in gpt_resp.iter_lines():
                    try:
                        if chunk:
                            token = loads(chunk[6:])["choices"][0]["delta"].get("content")

                            if token is not None:
                                yield token

                    except GeneratorExit:
                        break

                    except Exception as e:
                        print(e)
                        print(e.__traceback__.tb_next)
                        continue

            if self.join_chunks:
                storage, lock = [], threading.Lock()

                def storage_reader(storage: list, lock: threading.Lock):
                    try:
                        while True:
                            if len(storage) > 0:
                                lock.acquire()
                                joined_chunk = "".join(storage)
                                storage.clear()
                                lock.release()
                                yield joined_chunk
                            else:
                                sleep(0.05)
                    except TypeError:
                        lock.release()
                        lock.acquire()
                        joined_chunk = "".join(storage[:-1])
                        storage.clear()
                        lock.release()
                        yield joined_chunk

                def storage_writer(storage: list, lock: threading.Lock, weakref_storage_reader, read_from_generator):
                    for chunk in read_from_generator:
                        if weakref_storage_reader():
                            lock.acquire()
                            storage.append(chunk)
                            lock.release()
                        else:
                            break
                    lock.acquire()
                    storage.append(1)
                    lock.release()

                result_stream = storage_reader(storage, lock)
                threading.Thread(target=storage_writer,
                                 args=(storage, lock, weakref.ref(result_stream), stream())).start()
                return self.app.response_class(result_stream, mimetype='text/event-stream')

            return self.app.response_class(stream(), mimetype='text/event-stream')

        except Exception as e:
            print(e)
            print(e.__traceback__.tb_next)
            return {
                '_action': '_ask',
                'success': False,
                "error": f"an error occurred {str(e)}"}, 400
