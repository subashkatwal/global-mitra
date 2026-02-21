# socials/admin.py
from django.contrib import admin
from .models import Post, Comment, Bookmark, Share

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'createdAt']       
    list_filter = ['createdAt']                        
    search_fields = ['user__username', 'textContent']

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'post', 'createdAt']
    search_fields = ['user__username', 'textContent']

@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'post', 'createdAt']

@admin.register(Share)
class ShareAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'post', 'platform', 'createdAt']
    list_filter = ['platform']