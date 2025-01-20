from rest_framework import serializers
from .models import CustomUser
from .models import MatchHistory

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password', 'games_played', 'wins', 'losses', 'enable_2fa', 'avatar')

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            enable_2fa=validated_data.get('enable_2fa', False)
        )
        return user

    def update(self, instance, validated_data):
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        instance.enable_2fa = validated_data.get('enable_2fa', instance.enable_2fa)
        instance.save()
        return instance

class MatchHistorySerializer(serializers.ModelSerializer):
    opponent_username = serializers.SerializerMethodField()

    class Meta:
        model = MatchHistory
        fields = ['id', 'opponent_username', 'user_score', 'opponent_score', 'date']

    def get_opponent_username(self, obj):
        if obj.opponent:
            return obj.opponent.username
        return 'AI'

class FriendSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'status']