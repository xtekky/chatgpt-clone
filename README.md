# Django ChatGPT Clone

Django version of the [chatgpt-clone](https://github.com/xtekky/chatgpt-clone).

[![Built with Cookiecutter Django](https://img.shields.io/badge/built%20with-Cookiecutter%20Django-ff69b4.svg?logo=cookiecutter)](https://github.com/cookiecutter/cookiecutter-django/)
[![Black code style](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/ambv/black)

License: GPLv3

## Requirements

- Python 3.9+
- Node
- PostgreSQL
- Git
- Task.dev
- [Doppler CLI](https://docs.doppler.com/docs/install-cli)
- OpenAPI API Key: [https://platform.openai.com/account/api-keys](https://platform.openai.com/account/api-keys)

You can install all required dependencies using homebrew by running:

```sh
brew install python node postgresql@14 git go-task dopplerhq/cli/doppler
```

## Doppler

Install the Doppler CLI:

```sh
# See https://docs.doppler.com/docs/install-cli for other operating systems
brew install dopplerhq/cli/doppler
```

Login and create your free Doppler account on the Developer plan:

```sh
doppler login
```

Create `chatgpt-webapp` Project:

```sh
doppler projects create chatgpt-webapp
```

Use the `Development` environment:

```sh
doppler setup --project chatgpt-webapp --config dev
```

Import the secrets and config from `sample.env`:

```sh
doppler secrets upload sample.env
```

Verify the CLI can fetch secrets:

```sh
doppler secrets
```

## Local Development Environment

Create virtual environment and install dependencies:

```sh
task dev:venv
```

Activate virtual environment:

```sh
source ~/.virtualenvs/django-chatgpt-clone/bin/activate
```

Initialize the database:

```sh
task dev:init-local-db
```

Perform the required database migrations:

```sh
task dev:migrations
```

Then run the dev server:

```sh
task django:server
```

### Optional: Local Development with TLS

It's recommended to run the development server in TLS mode with a locally trusted certificate using `mkcert`.

Add the `chatgptclone.local` host to your hosts file:

```sh
echo -e "\n127.0.0.1\tchatgptclone.local" | sudo tee -a /etc/hosts > /dev/null
```

2. Install mkcert by running

```sh
brew install mkcert
```

```sh
mkcert -install
```

3. Generate the TLS certificate:
  
```sh
mkcert chatgptclone.local
```
  
This will generate two files: `chatgptclone.local.pem` (certificate) and `chatgptclone.local-key.pem` (private key), both signed by the local CA.

4. Then run the server using Gunicorn:

```sh
task server
```

## Cookiecutter Django Settings

Moved to [settings](http://cookiecutter-django.readthedocs.io/en/latest/settings.html).

## Basic Commands

### Setting Up Your Users

- To create a **normal user account**, just go to Sign Up and fill out the form. Once you submit it, you'll see a "Verify Your E-mail Address" page. Go to your console to see a simulated email verification message. Copy the link into your browser. Now the user's email should be verified and ready to go.

- To create a **superuser account**, use this command:

      $ python manage.py createsuperuser

For convenience, you can keep your normal user logged in on Chrome and your superuser logged in on Firefox (or similar), so that you can see how the site behaves for both kinds of users.

### Type checks

Running type checks with mypy:

    $ mypy chatgpt_clone

### Test coverage

To run the tests, check your test coverage, and generate an HTML coverage report:

    $ coverage run -m pytest
    $ coverage html
    $ open htmlcov/index.html

#### Running tests with pytest

    $ pytest

### Sentry

Sentry is an error logging aggregator service. You can sign up for a free account at <https://sentry.io/signup/?code=cookiecutter> or download and host it yourself.
The system is set up with reasonable defaults, including 404 logging and integration with the WSGI application.

You must set the DSN url in production.

## Deployment

The following details how to deploy this application.

### Heroku

See detailed [cookiecutter-django Heroku documentation](http://cookiecutter-django.readthedocs.io/en/latest/deployment-on-heroku.html).
