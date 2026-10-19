# admin.py
from django.contrib import admin
from .models import Subject, Topic, Question

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')

@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ('name', 'subject')

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'question_type', 'subject', 'difficulty', 'marks', 'created_by')
    list_filter = ('question_type', 'difficulty', 'bloom_level', 'subject')
    search_fields = ('text',)