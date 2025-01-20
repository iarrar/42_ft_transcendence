from django.utils import timezone
from datetime import timedelta

class UserStatusMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            # Mettre à jour le statut uniquement si l'utilisateur est authentifié
            last_activity = request.user.last_activity
            now = timezone.now()

            if last_activity and (now - last_activity) > timedelta(minutes=5):
                request.user.status = 'offline'
            else:
                request.user.status = 'online'

            request.user.last_activity = now
            request.user.save(update_fields=['status', 'last_activity'])

        response = self.get_response(request)
        return response