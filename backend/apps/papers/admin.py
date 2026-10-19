# admin.py
from django.contrib import admin
from .models import Paper, PaperQuestion

class PaperQuestionInline(admin.TabularInline):
    model = PaperQuestion
    extra = 0

@admin.register(Paper)
class PaperAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_by', 'total_marks', 'status', 'created_at')
    inlines = [PaperQuestionInline]