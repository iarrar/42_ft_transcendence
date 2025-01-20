from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model

class CustomUser(AbstractUser):
    games_played = models.IntegerField(null=True, default=None)
    wins = models.IntegerField(null=True, default=None)
    losses = models.IntegerField(null=True, default=None)
    enable_2fa = models.BooleanField(null=False, default=False)
    password = models.CharField(null=True, default=None, max_length=260)
    avatar = models.ImageField(upload_to='static/images/', default='static/images/default-avatar.png')


    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name='customuser_set',
        related_query_name='customuser',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='customuser_set',
        related_query_name='customuser',
    )

    STATUS_CHOICES = [
        ('offline', 'Offline'),
        ('online', 'Online'),
        ('playing', 'Playing'),
    ]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='offline')
    last_activity = models.DateTimeField(auto_now=True)

    def update_status(self, new_status):
        self.status = new_status
        self.save(update_fields=['status', 'last_activity'])

class MatchHistory(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='matches')
    opponent = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='opponent_matches')
    user_score = models.IntegerField()
    opponent_score = models.IntegerField()
    date = models.DateTimeField(auto_now_add=True)
    winner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='won_matches')

    def __str__(self):
        return f"{self.user.username} vs {self.opponent.username} - {self.date.strftime('%Y-%m-%d %H:%M')}"

User = get_user_model()

class Friendship(models.Model):
    user = models.ForeignKey(User, related_name='friendships', on_delete=models.CASCADE)
    friend = models.ForeignKey(User, related_name='friend_of', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'friend')