
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    #api routes
    path("create", views.create, name="create"),
    path("feed/<str:view>", views.feed_view, name="feed_view"),
    path("post/<int:id>", views.post, name="post_view"),
    path("profile/<str:who>", views.profile_view, name="profile_view"),
    path("follow/<str:user>", views.follow_view, name="follow_view"),
    path("change_profile", views.change_profile, name="change_profile"),
    path("delete_post/<int:id>", views.delete_post, name="delete_post"),
]
