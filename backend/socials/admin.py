from django.contrib import admin
from .models import Post, Comment, Bookmark, Share

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'destination', 'createdAt')
    search_fields = ('id','textContent',)
    list_filter = ('destination',)

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'post', 'user', 'createdAt')
    search_fields = ('id','textContent',)
    list_filter = ('post',)

@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ('id','user', 'post', 'createdAt')
    list_filter = ('user', 'post')

@admin.register(Share)
class ShareAdmin(admin.ModelAdmin):
    list_display = ('id','user', 'post', 'platform', 'createdAt')
    list_filter = ('platform',)
