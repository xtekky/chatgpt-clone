FROM python:3.10.12-slim
LABEL maintainer="Quantum Leap Labs Ltd."

ENV PYTHONUNBUFFERED 1

COPY ./requirements.txt /tmp/requirements.txt

WORKDIR /app

# Install system dependencies
# RUN apt-get update && \
#     apt-get install -y --no-install-recommends build-essential libgl1-mesa-glx && \
#     rm -rf /var/lib/apt/lists/*

RUN apt-get update && \
    apt-get install -y --no-install-recommends libgl1

# Create virtual environment and install python dependencies
RUN python -m venv /venv && \
    /venv/bin/pip install --upgrade pip && \
    /venv/bin/pip install -r /tmp/requirements.txt && \
    rm -rf /tmp

COPY . .

ENV BUILD_ENV=PROD

ENV PATH="/venv/bin:$PATH"

EXPOSE 5001

CMD ["python", "run.py"]
