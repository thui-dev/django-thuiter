
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("<str:username>", views.index, name="index"),
    path("post/<int:post_id>", views.index, name="index"),


    #api routes
    path("/create", views.create, name="create"),
    path("feed/<str:view>", views.feed_view, name="feed_view"),
    path("follow/<str:user>", views.follow_view, name="follow_view"),
    path("/change_pfp", views.change_pfp, name="change_pfp"),
    
    path("api/delete_post/<int:id>", views.api_delete_post, name="api_delete_post"),
    path("api/post/<int:id>", views.api_post, name="api_post_view"),
    path("api/profile/<str:who>", views.api_profile_view, name="api_profile_view"),
]
