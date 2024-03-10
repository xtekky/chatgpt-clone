Development of this repository is currently in a halt, due to lack of time. Updates are comming end of June.

working again ; ) 
I am very busy at the moment so I would be very thankful for contributions and PR's

## To do
- [x] Double confirm when deleting conversation
- [x] remember user preferences
- [x] theme changer
- [ ] loading / exporting a conversation
- [ ] speech output and input (elevenlabs; ex: https://github.com/cogentapps/chat-with-gpt)
- [ ] load files, ex: https://github.com/mayooear/gpt4-pdf-chatbot-langchain
- [ ] better documentation
- [ ] use react / faster backend language ? (newbies may be more confused and discouraged to use it)
 
# ChatGPT Clone
feel free to improve the code / suggest improvements

<img width="1470" alt="image" src="https://user-images.githubusercontent.com/98614666/232768610-fdeada85-3d21-4cf9-915e-a0ec9f3b7a9f.png">


## Getting Started
To get started with this project, you'll need to clone the repository and set up a virtual environment. This will allow you to install the required dependencies without affecting your system-wide Python installation.

### Prequisites
Before you can set up a virtual environment, you'll need to have Python installed on your system. You can download Python from the official website: https://www.python.org/downloads/

### Cloning the Repository
Run the following command to clone the repository:
```
git clone https://github.com/xtekky/chatgpt-clone.git
```

### Setting up a Virtual Environment
To set up a virtual environment, follow these steps:

1. Navigate to the root directory of your project.
```
cd chatgpt-clone
```
2. Run the following command to create a new virtual environment:
```
python -m venv venv
```
3.  Activate the virtual environment by running the following command:
```
source venv/bin/activate
```
If you are using fish shell, the command will be slightly different:
```
source venv/bin/activate.fish
```
If you're on Windows, the command will be slightly different:
```
venv\Scripts\activate
```
4. Install the required dependencies by running the following command:
```
pip install -r requirements.txt
```

### Configure the Application
To configure the application, there are a few properties that can be set either via the environment or via config.json.  The environment variable takes priority.

| Field               | Env Variable    | config.json     | examples                                           |
|---------------------|-----------------|-----------------|----------------------------------------------------|
| The OpenAI Api Key  | OPENAI_API_KEY  | openai_key      | sk-...                                             
| The OpenAI Base URL | OPENAI_API_BASE | openai_api_base | https://api.openai.com <br> http://my-reverse-proxy/ 

Use the Base URL if you need to run your queries through a reverse proxy (like [this one](https://github.com/stulzq/azure-openai-proxy) which will run your queries through Azure's OpenAI endpoints )


### Running the Application
To run the application, make sure the virtual environment is active and run the following command:
```
python run.py
```

### Docker
The easiest way to run ChatGPT Clone is by using docker
```
docker-compose up
```

### Kubernetes

1. Run `kubectl apply -f kubernetes/`. It will create a deployment and ClusterIP Ingress in the namespace "chatgpt-clone"
2. Create a secret containing your OPENAI-API-TOKEN with: `kubectl create secret generic openai-api-key --from-literal=openai-api-key=[YOUR_OPENAI_TOKEN] -n chatgpt-clone`
3. Either change the service to load balancer or ingress (don't forget to password protect it!!), or port-forward it to your local machine: `kubectl port-forward deployment/chatgpt-clone 1338:1338 -n chatgpt-clone`

#### Kubernetes: (optional) Hosting at a domain (ingress)

If you want to host the app at a domain follow these steps:

1. Install - if you haven't already - the nginx ingress 
```
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx
--namespace ingress-nginx
--create-namespace
```
2. Create a basic auth secret which will password protect the app
    - `htpasswd -c auth user` (you might need _apt-get install apache2-utils_)
    - Enter your password
    - This creates a file "auth"
3. "Submit" the password as secret to Kubernetes with: 
    - `kubectl create secret generic basic-auth --from-file=auth -n chatgpt-clone`
4. Insert your domain in the "kubernetes/nginxingress/chatgpt-clone-ingress.yaml" file.
5. Point your matching domain to your K8s IP
6. `kubectl apply -f kubernetes/nginxingress/`