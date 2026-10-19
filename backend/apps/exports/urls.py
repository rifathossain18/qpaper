from django.urls import path
from .views import PaperPDFExportView, PaperWordExportView, PaperAnswerKeyPDFView

urlpatterns = [
    path('papers/<int:paper_id>/export/pdf/', PaperPDFExportView.as_view()),
    path('papers/<int:paper_id>/export/answer-key/', PaperAnswerKeyPDFView.as_view()),
    path('papers/<int:paper_id>/export/word/', PaperWordExportView.as_view()),
]