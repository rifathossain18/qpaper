from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv
import dj_database_url

# CORS হেডারের ডিফল্ট লিস্ট ইমপোর্ট
from corsheaders.defaults import default_headers

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

# ---------- নিরাপত্তা সেটিংস ----------
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("DJANGO_SECRET_KEY environment variable must be set in production.")

DEBUG = os.environ.get('DJANGO_DEBUG', 'False') == 'True'

# ---------- হোস্ট ও ডোমেইন ----------
# Vercel-এর প্রজেক্ট ডোমেইন (আপনার আসল ডোমেইন দিয়ে বদলে নিন)
VERCEL_DOMAIN = os.environ.get('VERCEL_DOMAIN', 'qpaper.vercel.app')

ALLOWED_HOSTS = [
    VERCEL_DOMAIN,
    '.vercel.app',                     # Vercel-এর সব প্রিভিউ ডোমেইন
    'qpaper-backend-tefq.onrender.com', # পুরোনো Render ডোমেইন (ঐচ্ছিক)
    'localhost',
    '127.0.0.1',
]

# ফ্রন্টএন্ডের ঠিকানা (Vercel-এ frontend ও backend একই ডোমেইনে)
FRONTEND_URL = f"https://{VERCEL_DOMAIN}"

CSRF_TRUSTED_ORIGINS = [
    f"https://{VERCEL_DOMAIN}",
    "https://*.vercel.app",            # প্রিভিউ ডেপ্লয়মেন্টের জন্য
    'https://qpaper-backend-tefq.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
]

# Vercel-এ HTTPS প্রক্সির পেছনে থাকার কারণে
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True

# ---------- অ্যাপ্লিকেশন ----------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'apps.accounts',
    'apps.questions',
    'apps.papers',
    'apps.exports',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'
AUTH_USER_MODEL = 'accounts.User'

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [],
    'APP_DIRS': True,
    'OPTIONS': {
        'context_processors': [
            'django.template.context_processors.request',
            'django.contrib.auth.context_processors.auth',
            'django.contrib.messages.context_processors.messages',
        ],
    },
}]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# ---------- ডেটাবেস (Neon) ----------
DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL'),
        conn_max_age=0  # Neon-এর জন্য 0 রাখা নিরাপদ
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Dhaka'
USE_I18N = True
USE_TZ = True

# ---------- স্ট্যাটিক ও মিডিয়া ----------
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ---------- REST Framework ----------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': ('rest_framework.permissions.IsAuthenticated',),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=2),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}

# ---------- CORS ----------
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    FRONTEND_URL,
    "https://*.vercel.app",
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
]

# CORS_ALLOWED_ORIGIN_REGEXES দিয়ে wildcard ডোমেইন হ্যান্ডেল করুন
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",
]

CORS_ALLOW_HEADERS = list(default_headers) + [
    "authorization",
]

CORS_ALLOW_CREDENTIALS = True