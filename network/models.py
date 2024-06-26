from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    following = models.ManyToManyField("User", blank=True)
    pfp = models.ImageField(upload_to="pfps", default='pfps/Default_pfp.jpg')
    chat = models.ManyToManyField("User", blank=True, related_name="chats")

class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, null=True, related_name="senders")
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, null=True, related_name="receivers")
    content = models.CharField(max_length=256)
    timestamp = models.DateTimeField(auto_now_add=True)

class Post(models.Model):
    image = models.ImageField(upload_to="posts", null=True, blank=True)
    comment = models.ForeignKey("Post", on_delete=models.CASCADE, null=True)
    likes = models.ManyToManyField("User", related_name="likes", blank=True)
    content = models.CharField(max_length=256)
    user = models.ForeignKey(User, related_name='user_posts', on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def serialize(self):
        
        try:
            pfp_img_url = self.user.pfp.url
        except:
            pfp_img_url = ''
        
        return {    
            "pfp_img_url": pfp_img_url,
            "id": self.id,
            "likes": self.likes.count(),
            "content":self.content,
            "user":self.user.username,
            "liked":"false",
            "yours":"false",
            "timestamp":self.timestamp,
        }