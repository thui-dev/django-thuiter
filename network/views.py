import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse, HttpRequest
from django.shortcuts import render
from django.urls import reverse
from django.db.models import Q

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

def new_message(request):
    data = json.loads(request.body)
    print(request.body)

    new_message = Message(
        sender=User.objects.get(id=request.user.id),
        receiver=User.objects.get(username=data['receiver']),
        content=data['content'],
    )
    new_message.save()
    return HttpResponse(status=204)

def temp_last_message(request, username):

    current_user = User.objects.get(id=request.user.id)
    sender = User.objects.get(username=username)

    last_message = Message.objects.filter(Q(sender=sender) & 
                                             Q(receiver=current_user)).order_by('-timestamp').first()

    data = {
        'msg_id':last_message.id,
        'content':last_message.content,
        'timestamp':last_message.timestamp,
    }

    return JsonResponse(data,safe=False, status=201)

def messages_view(request, username):
    data=[]

    user_1 = User.objects.get(id=request.user.id)
    user_2 = User.objects.get(username=username)

    messages = Message.objects.filter(Q(sender=user_1, receiver=user_2) | 
                                      Q(sender=user_2, receiver=user_1)).order_by('timestamp').all()

    for message in messages:
        data.append({
            'sender': message.sender.username,
            'receiver':message.receiver.username,
            'timestamp':message.timestamp,
            'content':message.content,
        })

    return JsonResponse(data, status=200, safe=False)

def change_pfp(request):
    if not request.FILES.get('pfp_img_file'):
        return HttpResponse('error, img empty', status=402)

    request.user.pfp = request.FILES.get('pfp_img_file')
    request.user.save()
    
    return HttpResponseRedirect('/'+request.user.username)

def user_chats(request):
    users = User.objects.get(id=request.user.id).chat.all()
    data=[]
    for user in users:
        data.append({
            "username":user.username,
            "user_pfp_url":user.pfp.url,
        })
    return JsonResponse(data,status=201, safe=False)

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

def api_users_view(request, username):
    data = []

    type = request.GET.get('type')
    if type == 'followers':
        users = User.objects.filter(following=User.objects.get(username=username)).all()
    elif type == 'following':
        users = User.objects.get(username=username).following.all()

    for user in users:
        data.append({
            'username':user.username,
            'pfp_img_url':user.pfp.url,
        })

    return JsonResponse(data, status=201, safe=False)

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
    
    #append comments_count
    post["comments_count"] = Post.objects.filter(comment__id=post["id"]).all().count()
    
    return JsonResponse(post, safe=False, status=201)

def feed_view(request, view):
    
    if view == 'all':
        posts = Post.objects.filter(comment=None).order_by("-id").all()
    elif view == 'following':
        f = User.objects.get(id = request.user.id).following.all()
        g = Post.objects.filter(user__in = f).all()
        posts = g.filter(comment=None).order_by("-id").all()
    elif view=="profile":
        posts = Post.objects.order_by("-id").filter(comment=None, user__username = request.GET.get('username')).all()
    else: #view=="comments":
        posts = Post.objects.order_by("-id").filter(comment__id = request.GET.get('post_id')).all()


    start = int(request.GET.get("start") or 0)
    end = int(request.GET.get("end") or start+6)

    #return "null" if the query has no posts
    try:
        gotdata = posts[start]
    except IndexError:
        posts = ['null']
        start = 0
        end = 1
        return JsonResponse(posts[start:end], safe=False, status=201)

    #serialize to change data
    posts = [post.serialize() for post in posts]

    #append user liked if logged in
    if request.user.is_authenticated:
        for post in posts:
            if Post.objects.filter(id=post["id"], likes=request.user).all():
                post["liked"] = "true"

    #append others
    for post in posts:
        #comments_count
        post["comments_count"] = Post.objects.filter(comment__id=post["id"]).all().count()

        #images
        try:
            sexo = Post.objects.get(id=post["id"]).image.url
        except:
            sexo = ''
        post["image"] = sexo

        #if the post is yours(so the owner can delete)
        if post["user"] == request.user.username:
            post["yours"] = 'true'

    return JsonResponse(posts[start:end], safe=False, status=201)

def add_chat(request, username):
    User.objects.get(id=request.user.id).chat.add(User.objects.get(username=username))
    User.objects.get(username=username).chat.add(User.objects.get(id=request.user.id))
    return HttpResponseRedirect(reverse('index'), status=201)

def create(request):
    if request.method != 'POST':
        return HttpResponse('error, method not supported')

    if not request.POST['post_id'] == 'null':
        post = Post(
            content=request.POST['content'],
            user=request.user,
            image=request.FILES.get("arquivo"),
            comment=Post.objects.get(id=request.POST['post_id'].split('/')[2]),
        )
        post.save()
        return HttpResponseRedirect('/post/'+request.POST['post_id'].split('/')[2])
    
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
        pfp = request.FILES.get("pfp_img_file")

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
            if request.FILES.get('pfp_img_file'):
                user.pfp = request.FILES.get('pfp_img_file')
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
