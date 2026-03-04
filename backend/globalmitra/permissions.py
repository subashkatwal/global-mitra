from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.user == request.user

class IsAdminUser(BasePermission):
    """
    Custom permission to only allow users with role='ADMIN'.
    """
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'ADMIN'
        )
    
class IsAdminOrReadOnly(BasePermission):
    """
    Custom permission:
    - Admin users can do anything (GET, POST, PUT, DELETE)
    - Non-admin users can only read (GET)
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:  # Use SAFE_METHODS directly
            return True
        return bool(request.user and request.user.is_staff)