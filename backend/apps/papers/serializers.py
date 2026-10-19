from rest_framework import serializers
from .models import Paper, PaperQuestion
from apps.questions.serializers import QuestionSerializer


class PaperQuestionSerializer(serializers.ModelSerializer):
    question = QuestionSerializer(read_only=True)
    effective_marks = serializers.SerializerMethodField()
    is_overridden = serializers.SerializerMethodField()

    class Meta:
        model = PaperQuestion
        fields = (
            'id', 'section', 'order', 'question',
            'marks_override', 'effective_marks', 'is_overridden',
        )

    def get_effective_marks(self, obj):
        return obj.marks_override if obj.marks_override is not None else obj.question.marks

    def get_is_overridden(self, obj):
        return obj.marks_override is not None and obj.marks_override != obj.question.marks


class PaperSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = Paper
        fields = (
            'id', 'title', 'created_by', 'created_by_name', 'blueprint',
            'total_marks', 'status', 'share_token', 'is_public',
            'question_count', 'created_at',
            'institution_name', 'exam_name', 'class_name', 'duration',
            'subject_name', 'teacher_notes', 'show_notes', 'template',
        )
        read_only_fields = ('created_by', 'share_token', 'created_at', 'total_marks')

    def get_question_count(self, obj):
        return obj.paper_questions.count()


class PaperDetailSerializer(PaperSerializer):
    paper_questions = PaperQuestionSerializer(many=True, read_only=True)

    class Meta(PaperSerializer.Meta):
        fields = PaperSerializer.Meta.fields + ('paper_questions',)