import random
from django.db import transaction
from apps.questions.models import Question, Subject
from .models import Paper, PaperQuestion


@transaction.atomic
def generate_paper(user, title, blueprint, subject_id=None):
    """Create a Paper from a blueprint. Only overrides marks when explicitly set."""
    subject_name = ''
    if subject_id:
        try:
            subject_name = Subject.objects.get(id=subject_id).name
        except Subject.DoesNotExist:
            pass

    paper = Paper.objects.create(
        title=title,
        created_by=user,
        blueprint=blueprint,
        subject_name=subject_name,
    )

    order = 1
    total_marks = 0
    used_ids = set()

    base_qs = Question.objects.filter(created_by=user)
    if subject_id:
        base_qs = base_qs.filter(subject_id=subject_id)

    for section in blueprint.get('sections', []):
        sec_name = section.get('name') or 'Section'
        for rule in section.get('questions', []):
            qs = base_qs
            if rule.get('type'):
                qs = qs.filter(question_type=rule['type'])
            if rule.get('difficulty'):
                qs = qs.filter(difficulty=rule['difficulty'])
            if rule.get('topic'):
                qs = qs.filter(topic_id=rule['topic'])
            if used_ids:
                qs = qs.exclude(id__in=used_ids)

            pool = list(qs)
            random.shuffle(pool)
            picked = pool[: int(rule.get('count', 0))]

            # ── Marks override logic ─────────────────────
            # Empty / missing / null / ''  →  use question.marks (no override)
            # Non-empty numeric value      →  explicit override
            raw_override = rule.get('marks_each')
            override_value = None
            if raw_override not in (None, '', 0, '0'):
                try:
                    override_value = int(raw_override)
                except (TypeError, ValueError):
                    override_value = None
            # ─────────────────────────────────────────────

            for q in picked:
                marks = override_value if override_value is not None else q.marks
                PaperQuestion.objects.create(
                    paper=paper,
                    question=q,
                    section=sec_name,
                    order=order,
                    marks_override=override_value,  # None = fallback to question.marks
                )
                used_ids.add(q.id)
                total_marks += marks
                order += 1

    paper.total_marks = total_marks
    paper.save(update_fields=['total_marks'])
    return paper