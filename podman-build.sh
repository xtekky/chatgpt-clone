# Build stage
podman build -t build-stage -f - . << EOF
FROM python:3.8-alpine AS build

WORKDIR /app

COPY requirements.txt requirements.txt
RUN apk add --no-cache build-base && \
    pip3 install --user --no-cache-dir -r requirements.txt

COPY . .
EOF

# Save the build-stage container ID.
build_container_id=$(podman ps -a | grep build-stage | awk '{print $1}')

# Production stage
podman build -t production-stage -f - . << EOF
FROM python:3.8-alpine AS production

WORKDIR /app

COPY --from=$build_container_id /root/.local /root/.local
COPY . .

ENV PATH=/root/.local/bin:$PATH

CMD ["python3", "./run.py"]
EOF
