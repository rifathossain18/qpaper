import csv, io
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from .models import Subject, Topic, Question
from .serializers import SubjectSerializer, TopicSerializer, QuestionSerializer


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    pagination_class = None


class TopicViewSet(viewsets.ModelViewSet):
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer
    filterset_fields = ['subject']

    def get_queryset(self):
        qs = super().get_queryset()
        subject = self.request.query_params.get('subject')
        if subject:
            qs = qs.filter(subject_id=subject)
        return qs


class QuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['text', 'topic__name', 'subject__name']
    ordering_fields = ['created_at', 'marks', 'difficulty']

    def get_queryset(self):
        qs = Question.objects.filter(created_by=self.request.user).select_related(
            'subject', 'topic', 'created_by')
        params = self.request.query_params
        for f in ['subject', 'topic', 'question_type', 'difficulty', 'bloom_level']:
            v = params.get(f)
            if v:
                qs = qs.filter(**{f: v})
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def count(self, request):
        """Returns number of questions matching the current filters.
        Used by PaperBuilder to show 'X available' per blueprint row."""
        return Response({'count': self.get_queryset().count()})    

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser])
    def bulk_upload(self, request):
        """
        Upload a CSV with columns:
        subject,topic,question_type,text,options,correct_answer,marks,difficulty,bloom_level
        `options` is a '|' separated list.
        """
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'file required'}, status=400)
        decoded = file.read().decode('utf-8')
        reader = csv.DictReader(io.StringIO(decoded))
        created = 0
        errors = []
        for row in reader:
            try:
                subject, _ = Subject.objects.get_or_create(name=row['subject'].strip())
                topic = None
                if row.get('topic'):
                    topic, _ = Topic.objects.get_or_create(
                        subject=subject, name=row['topic'].strip())
                Question.objects.create(
                    subject=subject, topic=topic,
                    question_type=row.get('question_type', 'MCQ').strip().upper(),
                    text=row['text'].strip(),
                    options=[o.strip() for o in (row.get('options') or '').split('|') if o.strip()],
                    correct_answer=row.get('correct_answer', ''),
                    marks=int(row.get('marks') or 1),
                    difficulty=(row.get('difficulty') or 'medium').lower(),
                    bloom_level=(row.get('bloom_level') or 'remember').lower(),
                    created_by=request.user,
                )
                created += 1
            except Exception as e:
                errors.append({'row': row.get('text', '')[:40], 'error': str(e)})
        return Response({'created': created, 'errors': errors})