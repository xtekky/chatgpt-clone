from django.urls import path

from . import views

app_name = "chat"
urlpatterns = [
    path("", views.chat, name="chat"),
    path("<slug:conversation_id>/", views.chat, name="chat"),
]
