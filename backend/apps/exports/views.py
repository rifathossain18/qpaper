import math
from io import BytesIO
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

# ── ReportLab ──────────────────────────────────────────────
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
)
from reportlab.platypus.flowables import Flowable

# ── python-docx ────────────────────────────────────────────
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

from apps.papers.models import Paper


# ══════════════════════════════════════════════════════════
# TEMPLATE CONFIGS — mirror the frontend CSS
# ══════════════════════════════════════════════════════════
TEMPLATES = {
    'classic': {
        'bg': '#fdfcf7', 'ink': '#0f172a', 'ink_soft': '#475569',
        'accent': '#1e3a8a', 'rule': '#c9d1e3', 'rule_strong': '#1e3a8a',
        'heading_font': 'Times-Bold', 'heading_italic': 'Times-Italic',
        'body_font': 'Times-Roman', 'number_style': 'circle', 'ornament': 'double',
    },
    'modern': {
        'bg': '#ffffff', 'ink': '#0f172a', 'ink_soft': '#64748b',
        'accent': '#4f46e5', 'rule': '#d8d5f6', 'rule_strong': '#4f46e5',
        'heading_font': 'Helvetica-Bold', 'heading_italic': 'Helvetica-Oblique',
        'body_font': 'Helvetica', 'number_style': 'circle', 'ornament': 'single',
    },
    'academic': {
        'bg': '#ffffff', 'ink': '#1f2937', 'ink_soft': '#4b5563',
        'accent': '#166534', 'rule': '#c8dcc9', 'rule_strong': '#166534',
        'heading_font': 'Times-Bold', 'heading_italic': 'Times-Italic',
        'body_font': 'Times-Roman', 'number_style': 'circle', 'ornament': 'single',
    },
    'bold': {
        'bg': '#ffffff', 'ink': '#000000', 'ink_soft': '#262626',
        'accent': '#000000', 'rule': '#737373', 'rule_strong': '#000000',
        'heading_font': 'Helvetica-Bold', 'heading_italic': 'Helvetica-BoldOblique',
        'body_font': 'Helvetica', 'number_style': 'filled', 'ornament': 'thick',
    },
    'elegant': {
        'bg': '#fbf8f1', 'ink': '#44403c', 'ink_soft': '#78716c',
        'accent': '#7c2d12', 'rule': '#d6d3d1', 'rule_strong': '#a8a29e',
        'heading_font': 'Times-Bold', 'heading_italic': 'Times-Italic',
        'body_font': 'Times-Roman', 'number_style': 'circle', 'ornament': 'ornament',
    },
    'compact': {
        'bg': '#ffffff', 'ink': '#1e293b', 'ink_soft': '#64748b',
        'accent': '#475569', 'rule': '#d0d5dc', 'rule_strong': '#475569',
        'heading_font': 'Helvetica-Bold', 'heading_italic': 'Helvetica-Oblique',
        'body_font': 'Helvetica', 'number_style': 'plain', 'ornament': 'single',
    },
    'formal': {
        'bg': '#ffffff', 'ink': '#1f2937', 'ink_soft': '#4b5563',
        'accent': '#991b1b', 'rule': '#d9c8c8', 'rule_strong': '#991b1b',
        'heading_font': 'Times-Bold', 'heading_italic': 'Times-Italic',
        'body_font': 'Times-Roman', 'number_style': 'square', 'ornament': 'double',
    },
    'contemporary': {
        'bg': '#ffffff', 'ink': '#0f172a', 'ink_soft': '#64748b',
        'accent': '#7c3aed', 'rule': '#ddd4f7', 'rule_strong': '#7c3aed',
        'heading_font': 'Helvetica-Bold', 'heading_italic': 'Helvetica-Oblique',
        'body_font': 'Helvetica', 'number_style': 'circle', 'ornament': 'gradient',
    },
    'vintage': {
        'bg': '#fdf8ec', 'ink': '#44403c', 'ink_soft': '#78716c',
        'accent': '#78716c', 'rule': '#ded6c8', 'rule_strong': '#a8a29e',
        'heading_font': 'Times-Bold', 'heading_italic': 'Times-Italic',
        'body_font': 'Times-Roman', 'number_style': 'circle', 'ornament': 'ornament',
    },
    'minimal': {
        'bg': '#ffffff', 'ink': '#0f172a', 'ink_soft': '#64748b',
        'accent': '#000000', 'rule': '#e2e8f0', 'rule_strong': '#cbd5e1',
        'heading_font': 'Helvetica', 'heading_italic': 'Helvetica-Oblique',
        'body_font': 'Helvetica', 'number_style': 'plain', 'ornament': 'single',
    },
}


# ══════════════════════════════════════════════════════════
# Helpers
# ══════════════════════════════════════════════════════════
def _grouped(paper):
    sections = {}
    for pq in paper.paper_questions.select_related('question').order_by('order'):
        sections.setdefault(pq.section, []).append(pq)
    return sections


def _get_paper_or_403(request, paper_id):
    try:
        paper = Paper.objects.get(id=paper_id)
    except Paper.DoesNotExist:
        return None, HttpResponse('Not found', status=404)
    if paper.created_by_id != request.user.id and not paper.is_public:
        return None, HttpResponse('Forbidden', status=403)
    return paper, None


def _c(hex_color):
    """Shorthand for colors.HexColor."""
    return colors.HexColor(hex_color)


# ══════════════════════════════════════════════════════════
# Custom Flowables
# ══════════════════════════════════════════════════════════
class OrnamentRule(Flowable):
    """Draw a decorative horizontal rule matching the template style."""

    def __init__(self, width, style, color, height=14):
        Flowable.__init__(self)
        self.width = width
        self.style = style
        self.color = color
        self.height = height

    def wrap(self, aw, ah):
        return (self.width, self.height)

    def draw(self):
        c = self.canv
        y = self.height / 2
        c.saveState()
        c.setStrokeColor(self.color)
        c.setFillColor(self.color)

        if self.style == 'double':
            c.setLineWidth(1.4)
            c.line(0, y + 1.5, self.width, y + 1.5)
            c.setLineWidth(0.5)
            c.line(0, y - 1.5, self.width, y - 1.5)

        elif self.style == 'thick':
            c.setLineWidth(2.6)
            c.line(0, y, self.width, y)

        elif self.style == 'dashed':
            c.setLineWidth(0.5)
            try:
                c.setDash(2, 2)
            except Exception:
                pass
            c.line(0, y, self.width, y)

        elif self.style == 'ornament':
            c.setLineWidth(0.5)
            gap = 12
            c.line(0, y, self.width / 2 - gap, y)
            c.line(self.width / 2 + gap, y, self.width, y)
            # Star
            cx, cy = self.width / 2, y
            pts = []
            for i in range(10):
                angle = math.radians(i * 36 - 90)
                r = 5 if i % 2 == 0 else 2
                pts.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
            p = c.beginPath()
            p.moveTo(*pts[0])
            for pt in pts[1:]:
                p.lineTo(*pt)
            p.close()
            c.drawPath(p, fill=1, stroke=0)

        elif self.style == 'gradient':
            try:
                c.setStrokeAlpha(0.25)
                c.setLineWidth(1.4)
                c.line(self.width * 0.05, y, self.width * 0.4, y)
                c.setStrokeAlpha(0.85)
                c.line(self.width * 0.4, y, self.width * 0.6, y)
                c.setStrokeAlpha(0.25)
                c.line(self.width * 0.6, y, self.width * 0.95, y)
                c.setStrokeAlpha(1)
            except Exception:
                c.setLineWidth(1.2)
                c.line(0, y, self.width, y)

        else:  # single
            c.setLineWidth(0.5)
            c.line(0, y, self.width, y)

        c.restoreState()


class SectionHeading(Flowable):
    """Centered section title with lines on both sides."""

    def __init__(self, name, template, width, height=26):
        Flowable.__init__(self)
        self.name = name
        self.template = template
        self.width = width
        self.height = height

    def wrap(self, aw, ah):
        return (self.width, self.height)

    def draw(self):
        from reportlab.pdfbase.pdfmetrics import stringWidth
        c = self.canv
        y = self.height / 2
        font = self.template['heading_font']
        fs = 13

        text_w = stringWidth(self.name, font, fs)
        pad = 10
        left_end = (self.width - text_w) / 2 - pad
        right_start = (self.width + text_w) / 2 + pad

        c.saveState()
        c.setStrokeColor(_c(self.template['rule_strong']))
        c.setLineWidth(0.5)
        c.line(0, y, left_end, y)
        c.line(right_start, y, self.width, y)

        c.setFillColor(_c(self.template['ink']))
        c.setFont(font, fs)
        c.drawCentredString(self.width / 2, y - fs / 2 + 2, self.name)
        c.restoreState()


class QNumberBadge(Flowable):
    """Circular / square / filled / plain number badge."""

    def __init__(self, num, style, accent, ink, size=20):
        Flowable.__init__(self)
        self.num = num
        self.style = style
        self.accent = accent
        self.ink = ink
        self.size = size
        self.width = size
        self.height = size

    def wrap(self, aw, ah):
        return (self.width, self.height)

    def draw(self):
        c = self.canv
        c.saveState()

        if self.style == 'plain':
            c.setFillColor(self.ink)
            c.setFont('Helvetica-Bold', 11)
            c.drawString(0, self.size / 2 - 4, f"{self.num}.")
        else:
            text_color = self.ink
            if self.style == 'filled':
                c.setFillColor(self.accent)
                c.circle(self.size / 2, self.size / 2, self.size / 2, fill=1, stroke=0)
                text_color = _c('#ffffff')
            elif self.style == 'square':
                c.setStrokeColor(self.accent)
                c.setFillColor(_c('#ffffff'))
                c.setLineWidth(0.8)
                c.rect(0.5, 0.5, self.size - 1, self.size - 1, fill=1, stroke=1)
            else:  # circle
                c.setStrokeColor(self.accent)
                c.setFillColor(_c('#ffffff'))
                c.setLineWidth(0.8)
                c.circle(self.size / 2, self.size / 2, self.size / 2 - 0.5, fill=1, stroke=1)

            c.setFillColor(text_color)
            c.setFont('Helvetica-Bold', 10)
            text = str(self.num)
            tw = c.stringWidth(text, 'Helvetica-Bold', 10)
            c.drawString((self.size - tw) / 2, self.size / 2 - 3.5, text)

        c.restoreState()


def _marks_badge(marks, overridden):
    """Rounded-corner marks chip."""
    if overridden:
        bg, border, color = '#fef3c7', '#f59e0b', '#92400e'
    else:
        bg, border, color = '#f1f5f9', '#cbd5e1', '#475569'

    style = ParagraphStyle(
        'Marks',
        alignment=TA_CENTER,
        fontSize=9,
        fontName='Courier-Bold',
        textColor=_c(color),
        leading=12,
    )
    p = Paragraph(str(marks), style)
    t = Table([[p]], colWidths=[26], rowHeights=[16])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), _c(bg)),
        ('BOX', (0, 0), (-1, -1), 0.6, _c(border)),
        ('ROUNDEDCORNERS', [4]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('LEFTPADDING', (0, 0), (-1, -1), 2),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING', (0, 0), (-1, -1), 1),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
    ]))
    return t


def _build_question_row(pq, index, template):
    q = pq.question
    marks = pq.marks_override if pq.marks_override is not None else q.marks
    overridden = pq.marks_override is not None and pq.marks_override != q.marks

    num_badge = QNumberBadge(
        index, template['number_style'],
        _c(template['accent']), _c(template['ink']),
    )

    text_style = ParagraphStyle(
        'QText',
        fontName=template['body_font'],
        fontSize=10.5,
        leading=15,
        textColor=_c(template['ink']),
        spaceAfter=2,
    )
    content = [Paragraph(q.text, text_style)]

    if q.options:
        opt_style = ParagraphStyle(
            'Opt',
            fontName=template['body_font'],
            fontSize=9.5,
            leading=13,
            textColor=_c(template['ink_soft']),
            leftIndent=2,
        )
        opt_cells = []
        for j, opt in enumerate(q.options):
            label = f"<font name='Courier' color='{template['ink_soft']}'>({chr(97 + j)})</font>"
            opt_cells.append(Paragraph(f"{label} {opt}", opt_style))

        if len(opt_cells) <= 4:
            rows = []
            for i in range(0, len(opt_cells), 2):
                row = [opt_cells[i]]
                row.append(opt_cells[i + 1] if i + 1 < len(opt_cells) else Paragraph("", opt_style))
                rows.append(row)
            opt_table = Table(rows, colWidths=['50%', '50%'])
            opt_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 1),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
            ]))
            content.append(Spacer(1, 3))
            content.append(opt_table)
        else:
            content.append(Spacer(1, 2))
            for c in opt_cells:
                content.append(c)

    marks_cell = _marks_badge(marks, overridden)

    row = Table(
        [[num_badge, content, marks_cell]],
        colWidths=[24, None, 28],
    )
    row.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    return row


# ══════════════════════════════════════════════════════════
# PDF: Paper
# ══════════════════════════════════════════════════════════
class PaperPDFExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, paper_id):
        paper, err = _get_paper_or_403(request, paper_id)
        if err:
            return err

        template = TEMPLATES.get(paper.template, TEMPLATES['classic'])
        buffer = BytesIO()

        doc = SimpleDocTemplate(
            buffer, pagesize=A4,
            leftMargin=2 * cm, rightMargin=2 * cm,
            topMargin=1.8 * cm, bottomMargin=1.8 * cm,
        )

        bg_color = _c(template['bg'])

        def page_bg(canv, doc):
            canv.saveState()
            canv.setFillColor(bg_color)
            canv.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
            canv.restoreState()

        story = self._build_story(paper, template, doc.width)
        doc.build(story, onFirstPage=page_bg, onLaterPages=page_bg)

        buffer.seek(0)
        resp = HttpResponse(buffer.read(), content_type='application/pdf')
        safe = paper.title.replace(' ', '_').replace('/', '_')
        resp['Content-Disposition'] = f'attachment; filename="{safe}.pdf"'
        return resp

    def _build_story(self, paper, tpl, cw):
        story = []
        ink = _c(tpl['ink'])
        ink_soft = _c(tpl['ink_soft'])
        accent = _c(tpl['accent'])
        rule_strong = _c(tpl['rule_strong'])
        rule_soft = _c(tpl['rule'])

        # Top ornament
        story.append(OrnamentRule(cw, tpl['ornament'], rule_strong))
        story.append(Spacer(1, 12))

        # Institution
        if paper.institution_name:
            story.append(Paragraph(
                paper.institution_name,
                ParagraphStyle('Inst', fontName=tpl['heading_font'],
                               fontSize=20, leading=24, alignment=TA_CENTER,
                               textColor=ink, spaceAfter=4),
            ))

        # Small center dot ornament
        story.append(Spacer(1, 4))

        # Exam name
        exam_display = paper.exam_name or paper.title
        if exam_display:
            story.append(Paragraph(
                exam_display.upper(),
                ParagraphStyle('Exam', fontName=tpl['heading_font'],
                               fontSize=13, leading=17, alignment=TA_CENTER,
                               textColor=accent, spaceAfter=8),
            ))

        # Subject | Class
        info_parts = []
        if paper.subject_name:
            info_parts.append(f"Subject: <b>{paper.subject_name}</b>")
        if paper.class_name:
            info_parts.append(f"Class: <b>{paper.class_name}</b>")
        if info_parts:
            story.append(Paragraph(
                ' &nbsp;&nbsp;·&nbsp;&nbsp; '.join(info_parts),
                ParagraphStyle('Info', fontName=tpl['body_font'],
                               fontSize=10.5, leading=14, alignment=TA_CENTER,
                               textColor=ink_soft, spaceAfter=8),
            ))

        # Time | Total Marks
        story.append(Spacer(1, 4))
        left_style = ParagraphStyle('L', fontName=tpl['body_font'],
                                    fontSize=10.5, leading=14, textColor=ink_soft)
        right_style = ParagraphStyle('R', fontName=tpl['body_font'],
                                     fontSize=10.5, leading=14, textColor=ink_soft,
                                     alignment=TA_RIGHT)
        time_text = f"Time: <b>{paper.duration}</b>" if paper.duration else "Time: ________"
        marks_text = f"Total Marks: <b>{paper.total_marks}</b>"

        meta_table = Table(
            [[Paragraph(time_text, left_style), Paragraph(marks_text, right_style)]],
            colWidths=[cw / 2, cw / 2],
        )
        meta_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ]))
        story.append(meta_table)

        story.append(Spacer(1, 8))
        story.append(OrnamentRule(cw, tpl['ornament'], rule_strong))
        story.append(Spacer(1, 12))

        # Sections
        sections = _grouped(paper)
        if not sections:
            story.append(Paragraph(
                '<i>No questions were generated.</i>',
                ParagraphStyle('empty', fontName=tpl['body_font'], fontSize=10,
                               textColor=ink_soft),
            ))
        else:
            for sec_name, items in sections.items():
                story.append(SectionHeading(sec_name, tpl, cw))
                story.append(Spacer(1, 4))
                for i, pq in enumerate(items, 1):
                    story.append(_build_question_row(pq, i, tpl))

        # Notes
        if paper.show_notes and paper.teacher_notes:
            story.append(Spacer(1, 22))
            story.append(OrnamentRule(cw, 'dashed', rule_soft))
            story.append(Spacer(1, 8))
            story.append(Paragraph(
                'Notes',
                ParagraphStyle('NH', fontName=tpl['heading_font'], fontSize=12,
                               leading=15, textColor=accent, spaceAfter=6),
            ))
            for line in paper.teacher_notes.split('\n'):
                story.append(Paragraph(
                    line or '&nbsp;',
                    ParagraphStyle('N', fontName=tpl['body_font'], fontSize=10.5,
                                   leading=15, textColor=ink_soft),
                ))

        # Footer
        story.append(Spacer(1, 20))
        story.append(OrnamentRule(cw, 'dashed', rule_soft))
        story.append(Spacer(1, 6))

        fs = ParagraphStyle('F', fontName=tpl['body_font'], fontSize=8,
                            leading=11, textColor=ink_soft)
        fs_mid = ParagraphStyle('FM', parent=fs, alignment=TA_CENTER, fontName='Courier')
        fs_right = ParagraphStyle('FR', parent=fs, alignment=TA_RIGHT)

        total_q = paper.paper_questions.count()
        footer = Table(
            [[
                Paragraph('END OF PAPER', fs),
                Paragraph(f"{total_q} Q · {paper.total_marks} MARKS", fs_mid),
                Paragraph('BEST OF LUCK', fs_right),
            ]],
            colWidths=[cw / 3, cw / 3, cw / 3],
        )
        footer.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ]))
        story.append(footer)

        return story


# ══════════════════════════════════════════════════════════
# PDF: Answer Key
# ══════════════════════════════════════════════════════════
class PaperAnswerKeyPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, paper_id):
        paper, err = _get_paper_or_403(request, paper_id)
        if err:
            return err

        tpl = TEMPLATES.get(paper.template, TEMPLATES['classic'])
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=A4,
            leftMargin=2 * cm, rightMargin=2 * cm,
            topMargin=1.8 * cm, bottomMargin=1.8 * cm,
        )

        bg_color = _c(tpl['bg'])

        def page_bg(canv, doc):
            canv.saveState()
            canv.setFillColor(bg_color)
            canv.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
            canv.restoreState()

        story = []
        ink = _c(tpl['ink'])
        accent = _c(tpl['accent'])
        rule_strong = _c(tpl['rule_strong'])

        story.append(OrnamentRule(doc.width, tpl['ornament'], rule_strong))
        story.append(Spacer(1, 12))

        if paper.institution_name:
            story.append(Paragraph(
                paper.institution_name,
                ParagraphStyle('I', fontName=tpl['heading_font'], fontSize=18,
                               leading=22, alignment=TA_CENTER, textColor=ink),
            ))
            story.append(Spacer(1, 4))

        story.append(Paragraph(
            f"Answer Key — {paper.exam_name or paper.title}",
            ParagraphStyle('K', fontName=tpl['heading_font'], fontSize=13,
                           leading=17, alignment=TA_CENTER, textColor=accent),
        ))
        story.append(Spacer(1, 6))
        story.append(OrnamentRule(doc.width, tpl['ornament'], rule_strong))
        story.append(Spacer(1, 14))

        body = ParagraphStyle('Body', fontName=tpl['body_font'], fontSize=10.5,
                              leading=15, textColor=ink)

        for i, pq in enumerate(
            paper.paper_questions.select_related('question').order_by('order'), 1
        ):
            q = pq.question
            marks = pq.marks_override if pq.marks_override is not None else q.marks
            answer = q.correct_answer or '(no answer provided)'
            story.append(Paragraph(
                f"<b>{i}.</b> &nbsp; {answer} &nbsp;&nbsp;<i>[{marks}]</i>",
                body,
            ))
            story.append(Spacer(1, 6))

        doc.build(story, onFirstPage=page_bg, onLaterPages=page_bg)

        buffer.seek(0)
        resp = HttpResponse(buffer.read(), content_type='application/pdf')
        resp['Content-Disposition'] = f'attachment; filename="answer_key_{paper.id}.pdf"'
        return resp


# ══════════════════════════════════════════════════════════
# Word: Paper
# ══════════════════════════════════════════════════════════
class PaperWordExportView(APIView):
    permission_classes = [IsAuthenticated]

    # Font mapping ReportLab → Word
    FONT_MAP = {
        'Times-Roman': 'Times New Roman',
        'Times-Bold': 'Times New Roman',
        'Times-Italic': 'Times New Roman',
        'Helvetica': 'Arial',
        'Helvetica-Bold': 'Arial',
        'Helvetica-Oblique': 'Arial',
        'Helvetica-BoldOblique': 'Arial',
    }

    def get(self, request, paper_id):
        paper, err = _get_paper_or_403(request, paper_id)
        if err:
            return err

        tpl = TEMPLATES.get(paper.template, TEMPLATES['classic'])

        doc = Document()
        if tpl['bg'] != '#ffffff':
            self._set_page_background(doc, tpl['bg'])

        for s in doc.sections:
            s.top_margin = Cm(1.8)
            s.bottom_margin = Cm(1.8)
            s.left_margin = Cm(2)
            s.right_margin = Cm(2)

        heading_font = self.FONT_MAP.get(tpl['heading_font'], 'Times New Roman')
        body_font = self.FONT_MAP.get(tpl['body_font'], 'Times New Roman')

        accent = self._rgb(tpl['accent'])
        ink = self._rgb(tpl['ink'])
        ink_soft = self._rgb(tpl['ink_soft'])

        # Top rule
        self._add_rule(doc, tpl['rule_strong'], thickness=12)
        self._add_spacer(doc, 3)

        # Institution
        if paper.institution_name:
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(paper.institution_name)
            r.bold = True
            r.font.size = Pt(20)
            r.font.name = heading_font
            r.font.color.rgb = ink

        self._add_spacer(doc, 4)

        # Exam name
        exam_display = paper.exam_name or paper.title
        if exam_display:
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(exam_display.upper())
            r.bold = True
            r.font.size = Pt(13)
            r.font.name = heading_font
            r.font.color.rgb = accent

        # Subject | Class
        info_parts = []
        if paper.subject_name:
            info_parts.append(f"Subject: {paper.subject_name}")
        if paper.class_name:
            info_parts.append(f"Class: {paper.class_name}")
        if info_parts:
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run("  ·  ".join(info_parts))
            r.font.size = Pt(10.5)
            r.font.name = body_font
            r.font.color.rgb = ink_soft

        # Time | Marks table
        table = doc.add_table(rows=1, cols=2)
        row = table.rows[0]
        c1 = row.cells[0]
        c1.text = ""
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(f"Time: {paper.duration or '________'}")
        r1.font.name = body_font
        r1.font.size = Pt(10.5)
        r1.font.color.rgb = ink_soft

        c2 = row.cells[1]
        c2.text = ""
        p2 = c2.paragraphs[0]
        p2.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        r2 = p2.add_run(f"Total Marks: {paper.total_marks}")
        r2.bold = True
        r2.font.name = body_font
        r2.font.size = Pt(10.5)
        r2.font.color.rgb = ink_soft

        self._add_spacer(doc, 3)
        self._add_rule(doc, tpl['rule_strong'], thickness=12)
        self._add_spacer(doc, 6)

        # Sections
        for sec_name, items in _grouped(paper).items():
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(sec_name)
            r.bold = True
            r.font.size = Pt(13)
            r.font.name = heading_font
            r.font.color.rgb = ink
            self._add_rule_below_paragraph(p, tpl['rule'], thickness=6)
            self._add_spacer(doc, 4)

            for i, pq in enumerate(items, 1):
                q = pq.question
                marks = pq.marks_override if pq.marks_override is not None else q.marks
                overridden = pq.marks_override is not None and pq.marks_override != q.marks

                p = doc.add_paragraph()
                p.paragraph_format.space_after = Pt(2)

                num = p.add_run(f"{i}.  ")
                num.bold = True
                num.font.name = body_font
                num.font.size = Pt(11)
                num.font.color.rgb = ink

                txt = p.add_run(q.text + "  ")
                txt.font.name = body_font
                txt.font.size = Pt(11)
                txt.font.color.rgb = ink

                m_color = self._rgb('#92400e') if overridden else ink_soft
                m = p.add_run(f"[{marks}]")
                m.italic = True
                m.font.size = Pt(10)
                m.font.name = body_font
                m.font.color.rgb = m_color

                if q.options:
                    for j, opt in enumerate(q.options):
                        op = doc.add_paragraph()
                        op.paragraph_format.left_indent = Cm(0.8)
                        op.paragraph_format.space_after = Pt(1)
                        lr = op.add_run(f"({chr(97 + j)}) ")
                        lr.font.name = 'Courier New'
                        lr.font.size = Pt(10)
                        lr.font.color.rgb = ink_soft
                        orun = op.add_run(opt)
                        orun.font.name = body_font
                        orun.font.size = Pt(10.5)
                        orun.font.color.rgb = ink

                self._add_spacer(doc, 4)

        # Notes
        if paper.show_notes and paper.teacher_notes:
            self._add_spacer(doc, 12)
            self._add_rule(doc, tpl['rule'], thickness=4)
            self._add_spacer(doc, 6)

            p = doc.add_paragraph()
            r = p.add_run("Notes")
            r.bold = True
            r.font.size = Pt(12)
            r.font.name = heading_font
            r.font.color.rgb = accent

            for line in paper.teacher_notes.split('\n'):
                np_ = doc.add_paragraph()
                nr = np_.add_run(line)
                nr.font.name = body_font
                nr.font.size = Pt(10.5)
                nr.font.color.rgb = ink_soft

        # Footer
        self._add_spacer(doc, 12)
        self._add_rule(doc, tpl['rule'], thickness=4)
        self._add_spacer(doc, 3)

        footer_p = doc.add_paragraph()
        total_q = paper.paper_questions.count()
        fr = footer_p.add_run(
            f"END OF PAPER    ·    {total_q} Q · {paper.total_marks} MARKS    ·    BEST OF LUCK"
        )
        fr.font.name = body_font
        fr.font.size = Pt(8)
        fr.font.color.rgb = ink_soft
        footer_p.alignment = WD_ALIGN_PARAGRAPH.CENTER

        buffer = BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        resp = HttpResponse(
            buffer.read(),
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        )
        safe = paper.title.replace(' ', '_').replace('/', '_')
        resp['Content-Disposition'] = f'attachment; filename="{safe}.docx"'
        return resp

    # ── Word helpers ──────────────────────────────────────
    def _rgb(self, hex_color):
        h = hex_color.lstrip('#')
        return RGBColor(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))

    def _set_page_background(self, doc, hex_color):
        try:
            settings = doc.settings.element
            if settings.find(qn('w:displayBackgroundShape')) is None:
                settings.append(OxmlElement('w:displayBackgroundShape'))
            bg = OxmlElement('w:background')
            bg.set(qn('w:color'), hex_color.lstrip('#'))
            doc.element.insert(0, bg)
        except Exception:
            pass

    def _add_rule(self, doc, hex_color, thickness=6):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        self._add_rule_below_paragraph(p, hex_color, thickness)

    def _add_rule_below_paragraph(self, paragraph, hex_color, thickness=6):
        pPr = paragraph._p.get_or_add_pPr()
        pBdr = OxmlElement('w:pBdr')
        bottom = OxmlElement('w:bottom')
        bottom.set(qn('w:val'), 'single')
        bottom.set(qn('w:sz'), str(thickness))
        bottom.set(qn('w:space'), '1')
        bottom.set(qn('w:color'), hex_color.lstrip('#'))
        pBdr.append(bottom)
        pPr.append(pBdr)

    def _add_spacer(self, doc, points):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.add_run().font.size = Pt(points)