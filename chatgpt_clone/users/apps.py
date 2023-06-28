from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class UsersConfig(AppConfig):
    name = "chatgpt_clone.users"
    verbose_name = _("Users")

    def ready(self):
        try:
            import chatgpt_clone.users.signals  # noqa: F401
        except ImportError:
            pass
