from django.db import models
from accounts.models import User
from destinations.models import Destination
import uuid

class Post(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    destination = models.ForeignKey(
        Destination,
        on_delete=models.CASCADE,
        related_name='posts'
    )

    textContent = models.TextField()
    image = models.URLField(blank=True, null=True)

    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Post by {self.User.fullName}"


class Comment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')

    textContent = models.TextField()
    image = models.URLField(blank=True, null=True)

    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.User.fullName}"

class Bookmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarks')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='bookmarkedBy')
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post')

class Share(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shares')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='sharedBy')
    platform = models.CharField(max_length=50)  
    createdAt = models.DateTimeField(auto_now_add=True)
