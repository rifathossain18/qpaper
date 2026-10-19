from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('teacher', 'Teacher/Setter'),
        ('viewer', 'Viewer'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='teacher')
    institution = models.CharField(max_length=255, blank=True)
    subject_specialization = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.username