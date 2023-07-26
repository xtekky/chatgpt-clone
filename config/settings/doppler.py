import os
import re

from tabulate import tabulate


def log_value(key, value):
    if re.search(r"KEY|TOKEN|SECRET|CERT|PASS", key):
        return "*" * len(value) if len(value) > 0 else ""
    if len(value) > 60:
        return f"{value[:59]}..."
    return value


def log_secrets():
    if os.environ.get("DOPPLER_PROJECT"):
        print(
            "\n[info]: App config supplied by Doppler ({} => {})\n".format(
                os.environ["DOPPLER_PROJECT"],
                os.environ["DOPPLER_CONFIG"],
            ),
        )
    doppler_secrets = [
        "DJANGO_ADMIN_URL",
        "DJANGO_ALLOWED_HOSTS",
        "DJANGO_DEBUG",
        "DJANGO_SECRET_KEY",
        "DJANGO_SERVER_EMAIL",
        "DJANGO_SETTINGS_MODULE",
        "DOPPLER_CONFIG",
        "DOPPLER_ENVIRONMENT",
        "DOPPLER_PROJECT",
        "HOST",
        "OPENAI_API_BASE_URL",
        "OPENAI_API_KEY",
        "OPENAI_MODEL",
        "OPENAI_SYSTEM_MESSAGE",
        "PORT",
        "POSTGRES_DB",
        "POSTGRES_HOST",
        "POSTGRES_PASSWORD",
        "POSTGRES_PORT",
        "POSTGRES_USER",
        "REDIS_URL",
        "WEB_CONCURRENCY",
    ]
    print(
        tabulate(
            [[key, log_value(key, os.environ.get(key, ""))] for key in doppler_secrets],
            headers=["Key", "Value"],
            tablefmt="rounded_outline",
        )
    )
