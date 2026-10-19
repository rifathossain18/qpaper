from django.db import models
from django.conf import settings


class Subject(models.Model):
    name = models.CharField(max_length=120, unique=True)
    code = models.CharField(max_length=32, blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Topic(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='topics')
    name = models.CharField(max_length=120)

    class Meta:
        unique_together = ('subject', 'name')
        ordering = ['name']

    def __str__(self):
        return f"{self.subject.name} / {self.name}"


class Question(models.Model):
    TYPE_CHOICES = (
        ('MCQ', 'MCQ'),
        ('TF', 'True/False'),
        ('SHORT', 'Short Answer'),
        ('LONG', 'Long Answer'),
        ('FILL', 'Fill in the Blanks'),
        ('MATCH', 'Matching'),
    )
    DIFFICULTY_CHOICES = (
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    )
    BLOOM_CHOICES = (
        ('remember', 'Remember'),
        ('understand', 'Understand'),
        ('apply', 'Apply'),
        ('analyze', 'Analyze'),
        ('evaluate', 'Evaluate'),
        ('create', 'Create'),
    )

    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='questions')
    topic = models.ForeignKey(Topic, on_delete=models.SET_NULL, null=True, blank=True,
                              related_name='questions')
    question_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    text = models.TextField()
    options = models.JSONField(default=list, blank=True)
    correct_answer = models.TextField(blank=True)
    marks = models.PositiveIntegerField(default=1)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    bloom_level = models.CharField(max_length=15, choices=BLOOM_CHOICES, default='remember')
    image = models.ImageField(upload_to='questions/', null=True, blank=True)

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                   related_name='questions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['subject', 'difficulty']),
            models.Index(fields=['question_type']),
        ]

    def __str__(self):
        return f"[{self.question_type}] {self.text[:60]}"