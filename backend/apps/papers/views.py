from django.db.models import Count, Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.questions.models import Question
from .models import Paper, PaperQuestion
from .serializers import PaperSerializer, PaperDetailSerializer, PaperQuestionSerializer
from .services import generate_paper


class PaperViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Paper.objects.filter(created_by=self.request.user).prefetch_related(
            'paper_questions__question')

    def get_serializer_class(self):
        if self.action in ('retrieve', 'create', 'update', 'partial_update'):
            return PaperDetailSerializer
        return PaperSerializer

    @action(detail=False, methods=['post'])
    def generate(self, request):
        title = request.data.get('title')
        blueprint = request.data.get('blueprint')
        subject_id = request.data.get('subject')
        if not title or not blueprint:
            return Response({'error': 'title and blueprint are required'}, status=400)
        paper = generate_paper(request.user, title, blueprint, subject_id)
        return Response(PaperDetailSerializer(paper).data, status=201)

    @action(detail=True, methods=['post'])
    def replace_question(self, request, pk=None):
        paper = self.get_object()
        pq_id = request.data.get('paper_question_id')
        new_q_id = request.data.get('new_question_id')
        pq = PaperQuestion.objects.get(id=pq_id, paper=paper)
        new_q = Question.objects.get(id=new_q_id, created_by=request.user)
        pq.question = new_q
        pq.save()
        return Response({'status': 'ok'})

    @action(detail=True, methods=['post'])
    def remove_question(self, request, pk=None):
        paper = self.get_object()
        pq_id = request.data.get('paper_question_id')
        PaperQuestion.objects.filter(id=pq_id, paper=paper).delete()
        total = sum((p.effective_marks if hasattr(p, 'effective_marks') else (p.marks_override or 1))
                    for p in paper.paper_questions.all())
        return Response({'status': 'ok', 'total_marks': total})

    @action(detail=True, methods=['post'])
    def finalize(self, request, pk=None):
        paper = self.get_object()
        paper.status = 'finalized'
        paper.save()
        return Response({'status': 'finalized'})

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        paper = self.get_object()
        paper.is_public = bool(request.data.get('is_public', True))
        paper.share_password = request.data.get('password', '')
        paper.save()
        return Response({
            'share_url': f"/api/papers/share/{paper.share_token}/",
            'token': str(paper.share_token),
            'is_public': paper.is_public,
        })


class SharedPaperView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            paper = Paper.objects.get(share_token=token, is_public=True)
        except Paper.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        return Response(PaperDetailSerializer(paper).data)


class DashboardStatsView(APIView):
    def get(self, request):
        user = request.user
        qs = Question.objects.filter(created_by=user)
        total = qs.count()
        used = qs.filter(paperquestion__isnull=False).distinct().count()
        recent_papers = list(Paper.objects.filter(created_by=user)
                             .order_by('-created_at')[:5]
                             .values('id', 'title', 'created_at', 'total_marks', 'status'))
        by_difficulty = list(qs.values('difficulty').annotate(c=Count('id')))
        by_type = list(qs.values('question_type').annotate(c=Count('id')))
        by_topic = list(qs.values('topic__name').annotate(c=Count('id')).order_by('-c')[:8])
        return Response({
            'total_questions': total,
            'used_questions': used,
            'unused_questions': total - used,
            'by_difficulty': by_difficulty,
            'by_type': by_type,
            'by_topic': by_topic,
            'recent_papers': recent_papers,
        })