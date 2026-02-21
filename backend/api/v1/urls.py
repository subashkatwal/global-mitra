from django.urls import path,include


urlpatterns = [
    

    path('auth', include('accounts.auth.v1.urls')),
    path('profile', include('profiles.v1.urls')),
    # path('reports', include('reports.v1.urls')),
    path('destinations', include('destinations.v1.urls')),
    path('socials', include('socials.v1.urls')),

]


