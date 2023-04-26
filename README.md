working again ; ) 
I am very busy at the moment so I would be very thankful for contributions and PR's

## To do
- [x] Double confirm when deleting conversation
- [ ] loading / exporting a conversation
- [x] remember user preferences
- [ ] theme changer
- [ ] speech output and input (elevenlabs; ex: https://github.com/cogentapps/chat-with-gpt)
- [ ] load files, ex: https://github.com/mayooear/gpt4-pdf-chatbot-langchain
- [ ] better documentation and cross-platfotm (docker for ex)
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
If you're on Windows, the command will be slightly different:
```
venv\Scripts\activate
```
4. Install the required dependencies by running the following command:
```
pip install -r requirements.txt
```

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
