import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse

from .models import *

def index(request, username="", post='', post_id=''):
    return render(request, "network/index.html")


def follow_view(request, user):
    if request.method == "GET":
        action = request.GET.get("action")
        if action == "follow":
            User.objects.get(id=request.user.id).following.add(User.objects.get(username=user))
        elif action == "unfollow":
            User.objects.get(id=request.user.id).following.remove(User.objects.get(username=user))

        return HttpResponse(status=204)

def change_pfp(request):
    request.user.pfp = request.FILES.get('pfp_img_file')
    request.user.save()
    
    return HttpResponseRedirect('/'+request.user.username)

def api_profile_view(request, who):
    
    data={
        'following': 'false',
        'following_count':User.objects.get(username=who).following.count(),
        'followers_count':User.objects.filter(following__username=who).all().count(),
        'username':User.objects.get(username=who).username,
        'pfp_img_url':User.objects.get(username=who).pfp.url,
    }

    if request.user.is_authenticated:
        following = 'false'
        if who == request.user.username:
            following = 'self'
        elif User.objects.get(username=request.user.username).following.filter(username=who).all():
            following = 'true'
        data["following_button"]=following

    return JsonResponse(data, safe=False)


def api_post(request, id):
    if request.method == 'PUT':
        try:
            post = Post.objects.get(id=id)
        except:
            return JsonResponse('no thuit with this id')
        
        data = json.loads(request.body)

        if data["liked"] == 'true':
            post = Post.objects.get(id=id)
            post.likes.add(request.user)
            post.save()
            return HttpResponse(status=204)
        elif data["liked"] == 'false':
            post = Post.objects.get(id=id)
            post.likes.remove(request.user)
            post.save()
            return HttpResponse(status=204)
    
    #specific post view
    post = Post.objects.get(id=id).serialize()
    #append user liked if logged in
    if request.user.is_authenticated:
        if Post.objects.filter(id=id, likes=request.user).all(): 
            post["liked"] = "true"
    #append image url
    try:
        sexo = Post.objects.get(id=post["id"]).image.url
    except:
        sexo = ''
    if post["user"] == request.user.username:
        post["yours"] = 'true'
    post["image"] = sexo

    return JsonResponse(post, safe=False, status=201)

def feed_view(request, view):
    
    if view == 'all':
        posts = Post.objects.order_by("-id").all()
    elif view == 'following':
        f = User.objects.get(id = request.user.id).following.all()
        g = Post.objects.filter(user__in = f).all()

        posts = g.order_by("-id").all()
    else:
        posts = Post.objects.order_by("-id").filter(user__username = view).all()

    start = int(request.GET.get("start") or 0)
    end = int(request.GET.get("end") or start+6)

    #serialize to change data
    posts = [post.serialize() for post in posts]

    #append user liked if logged in
    if request.user.is_authenticated:
        final = []
        for post in posts:
            if Post.objects.filter(id=post["id"], likes=request.user).all():
                post["liked"] = "true"

    #append images and yours
    final = []
    for post in posts:
        try:
            sexo = Post.objects.get(id=post["id"]).image.url
        except:
            sexo = ''

        if post["user"] == request.user.username:
            post["yours"] = 'true'

        post["image"] = sexo

    return JsonResponse(posts[start:end], safe=False, status=201)

def create(request):
    if request.method != 'POST':
        return HttpResponse('error, method not supported')

    post = Post( 
        content=request.POST['content'],
        user=request.user,
        image=request.FILES.get("arquivo"),
    )
    post.save()
    return HttpResponseRedirect(reverse("index"))



def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")

def api_delete_post(request, id):
    post = Post.objects.get(id=id)
    post.delete()
    return HttpResponse(status=204)

def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })
        
        if username == '':
            return render(request, "network/register.html", {
                "message": "insira o nome de usuário"
            })
        if password == '':
            return render(request, "network/register.html", {
                "message": "insira uma senha"
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
