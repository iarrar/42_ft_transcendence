import pyotp
from datetime import datetime, timedelta
from django.core.mail import send_mail
import os


def	send_otp(request, mail):
	totp = pyotp.TOTP(pyotp.random_base32(), interval = 60)
	otp = totp.now() #otp que l'utilisateur devra entrer au moment de la connexion
	request.session['otp_secret_key'] = totp.secret
	valid_date = datetime.now() + timedelta(minutes=1)
	request.session['otp_valid_date'] = str(valid_date) #enregistrer la date d'expiration de l'otp dans la session utilisateur
	subject = "Your OTP cocode"
	message = f"Your OTP code is {otp}.\nOTP valid until {valid_date}."
	recipient_list = [mail]
	print(f"mail = {send_mail(subject, message, os.environ.get('DEFAULT_FROM_MAIL'), recipient_list, fail_silently=False)}")
	return otp

