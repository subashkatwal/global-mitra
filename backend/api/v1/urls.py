from django.urls import path,include


urlpatterns = [
    

    path('auth', include('accounts.auth.v1.urls')),
    path('profile', include('profiles.v1.urls')),
    # path('reports', include('reports.v1.urls')),
    # path('destinations', include('voting.v1.urls')),
    # path('socials', include('posts.v1.urls')),

]


