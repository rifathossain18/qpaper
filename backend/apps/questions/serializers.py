from rest_framework import serializers
from .models import Subject, Topic, Question


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'


class TopicSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = Topic
        fields = ('id', 'subject', 'subject_name', 'name')


class QuestionSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Question
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')


class BulkQuestionSerializer(serializers.Serializer):
    questions = QuestionSerializer(many=True)