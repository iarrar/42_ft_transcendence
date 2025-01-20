from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import F, Case, When, IntegerField
from .models import CustomUser

class LeaderboardView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        sort_by = request.query_params.get('sort_by', 'wins')

        valid_sort_fields = ['wins', 'losses', 'games_played']
        if sort_by not in valid_sort_fields:
            return Response({'error': f'Invalid sort_by field. Must be one of {valid_sort_fields}'}, status=400)

        users = CustomUser.objects.all().order_by(
            Case(
                When(**{f'{sort_by}__isnull': True}, then=0),
                default=F(sort_by),
                output_field=IntegerField()
            ).desc()
        )
        leaderboard = [
            {
                'username': user.username,
                'games_played': user.games_played if user.games_played is not None else 0,
                'wins': user.wins if user.wins is not None else 0,
                'losses': user.losses if user.losses is not None else 0
            }
            for user in users
        ]

        return Response(leaderboard)