import uuid
from django.db import models
from django.conf import settings
from apps.questions.models import Question


class Paper(models.Model):
    STATUS_CHOICES = (('draft', 'Draft'), ('finalized', 'Finalized'))
    TEMPLATE_CHOICES = (
        ('classic', 'Classic'),
        ('modern', 'Modern'),
        ('academic', 'Academic'),
        ('bold', 'Bold'),
        ('elegant', 'Elegant'),
        ('compact', 'Compact'),
        ('formal', 'Formal'),
        ('contemporary', 'Contemporary'),
        ('vintage', 'Vintage'),
        ('minimal', 'Minimal'),
    )

    title = models.CharField(max_length=255)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                   related_name='papers')
    blueprint = models.JSONField(default=dict)
    total_marks = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default='draft')
    share_token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    is_public = models.BooleanField(default=False)
    share_password = models.CharField(max_length=128, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    institution_name = models.CharField(max_length=255, blank=True)
    exam_name = models.CharField(max_length=255, blank=True)
    class_name = models.CharField(max_length=100, blank=True)
    duration = models.CharField(max_length=50, blank=True)
    subject_name = models.CharField(max_length=120, blank=True)
    teacher_notes = models.TextField(blank=True)
    show_notes = models.BooleanField(default=False)
    template = models.CharField(max_length=20, choices=TEMPLATE_CHOICES, default='classic')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class PaperQuestion(models.Model):
    paper = models.ForeignKey(Paper, on_delete=models.CASCADE, related_name='paper_questions')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    section = models.CharField(max_length=64)
    order = models.PositiveIntegerField(default=1)
    marks_override = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ['order']

    @property
    def effective_marks(self):
        if self.marks_override is not None:
            return self.marks_override
        return self.question.marks