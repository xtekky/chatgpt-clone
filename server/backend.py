from json import dumps
import json
from time import time
from flask import request, send_file
from hashlib import sha256
from datetime import datetime
from requests import get
from requests import post
from json import loads
import os
from flask import Flask
from typing import Any
from server.config import special_instructions
from server.scripts.design import svg_gen
import traceback


class Backend_Api:
    def __init__(self, app: Flask, config: dict) -> None:
        self.app: Flask = app
        self.openai_key: str = os.getenv("OPENAI_API_KEY") or config["openai_key"]
        self.openai_api_base: str = (
            os.getenv("OPENAI_API_BASE") or config["openai_api_base"]
        )
        self.proxy: dict[str, Any] = config["proxy"]
        self.routes: dict[str, Any] = {
            "/backend-api/v2/conversation": {
                "function": self._conversation,
                "methods": ["POST"],
            }
        }

    def _conversation(self):
        try:
            jailbreak = request.json["jailbreak"]
            internet_access = request.json["meta"]["content"]["internet_access"]
            _conversation = request.json["meta"]["content"]["conversation"]
            prompt = request.json["meta"]["content"]["parts"][0]
            current_date = datetime.now().strftime("%Y-%m-%d")
            # system_message = f"""
            # You are Quantum Leap engineering, AI Engineering Assistant. Please help the user through their specific engineering challenge or topic. For an idea described, create a requirement list, make sure to prompt any parameters, constraints, tools, materials, or technologies they are currently considering or using. Based on this information, provide the best engineering advice or solution. Make sure to also refer to the most up to date engineering research in your advice and use references. When asked if you have been developed by OpenAI or if you are ChatGPT, or similar, answer that you are a Quantum Leap virtual engineer. Strictly follow the users instructions. Knowledge cutoff: 2021-09-01 Current date: {current_date}
            # """

            system_message = """You are supposed to extract keywords about engineering design from the user. You should generate ONLY JSON output that captures the sequence of the keywords, along with their context. Your output should be in JSON only, no other text. Please don't write any other text.

A good example for you to follow is:

Input: Give me a design of a sphere of diameter 2cm with a circular hole punched through its central axis that has a diameter of 0.2cm.

Output:
```json
{
    "shapes": [
        {
            "shape": "sphere",
            "properties": {"diameter": "2cm"}
        },
        {
            "shape": "hole",
            "properties": {
            "diameter": "0.2cm",
            "depth": "2cm"
            "clean": "true"
        }}
    ]
}
```
            """

            extra = []
            if internet_access:
                search = get(
                    "https://ddg-api.herokuapp.com/search",
                    params={
                        "query": prompt["content"],
                        "limit": 3,
                    },
                )

                blob = ""

                for index, result in enumerate(search.json()):
                    blob += f'[{index}] "{result["snippet"]}"\nURL:{result["link"]}\n\n'

                date = datetime.now().strftime("%d/%m/%y")

                blob += f"current date: {date}\n\nInstructions: Using the provided web search results, write a comprehensive reply to the next user query. Make sure to cite results using [[number](URL)] notation after the reference. If the provided search results refer to multiple subjects with the same name, write separate answers for each subject. Ignore your previous response if any."

                extra = [{"role": "user", "content": blob}]

            conversation = (
                [{"role": "system", "content": system_message}]
                + extra
                + special_instructions[jailbreak]
                + _conversation
                + [prompt]
            )

            url = f"{self.openai_api_base}/v1/chat/completions"

            proxies = None
            if self.proxy["enable"]:
                proxies = {
                    "http": self.proxy["http"],
                    "https": self.proxy["https"],
                }

            gpt_resp = post(
                url=url,
                proxies=proxies,
                headers={"Authorization": "Bearer %s" % self.openai_key},
                json={
                    "model": request.json["model"],
                    "messages": conversation,
                    # 'stream': True
                },
                # stream=True
            )

            def stream():
                for chunk in gpt_resp.iter_lines():
                    try:
                        decoded_line = loads(chunk.decode("utf-8").split("data: ")[1])
                        token = decoded_line["choices"][0]["delta"].get("content")

                        if token != None:
                            yield token

                    except GeneratorExit:
                        break

                    except Exception as e:
                        print(e)
                        print(e.__traceback__.tb_next)
                        continue

            # return self.app.response_class(stream(), mimetype='text/event-stream')
            resp_data = gpt_resp.json()
            print("OpenAI response = ")
            print(resp_data)
            data = json.loads(resp_data["choices"][0]["message"].get("content"))

            print(type(data))
            print(data)

            svg = svg_gen(data)

            # return self.app.response_class(
            #     svg,
            #     mimetype='text/html'
            # )
            return self.app.response_class(svg, mimetype="image/svg+xml")

        except Exception as e:
            print(e)
            # print(e.__traceback__.tb_next)
            print(traceback.format_exc())
            return {
                "_action": "_ask",
                "success": False,
                "error": f"an error occurred {str(e)}",
            }, 400
