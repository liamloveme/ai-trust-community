#!/usr/bin/env python3
"""Build the complete (not delta) launch PRD from one Markdown source."""
from pathlib import Path
from docx import Document
from docx.shared import Inches,Pt,RGBColor,Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH,WD_BREAK,WD_LINE_SPACING
from docx.enum.table import WD_TABLE_ALIGNMENT,WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.section import WD_SECTION_START
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import re

root=Path(__file__).resolve().parents[1]
src=root/'docs/完整产品需求计划书-PRD.md'
out=root/'AI交易守望站-V3.1-完整产品需求计划书.docx'
md=src.read_text('utf-8')
doc=Document()
sec=doc.sections[0];sec.page_height=Cm(29.7);sec.page_width=Cm(21);sec.top_margin=Cm(2.1);sec.bottom_margin=Cm(1.9);sec.left_margin=Cm(2.25);sec.right_margin=Cm(2.0)
FONT='Noto Sans CJK SC';BLUE=RGBColor(27,77,106);DARK=RGBColor(32,50,65);GRAY=RGBColor(99,119,132)
styles=doc.styles
normal=styles['Normal'];normal.font.name=FONT;normal.font.size=Pt(9.5);normal.font.color.rgb=DARK
normal._element.rPr.rFonts.set(qn('w:eastAsia'),FONT)
normal.paragraph_format.space_after=Pt(6);normal.paragraph_format.line_spacing=1.20
for name,size,before,after in [('Title',23,0,13),('Heading 1',15,16,8),('Heading 2',12,13,7),('Heading 3',10.5,10,5)]:
 s=styles[name];s.font.name=FONT;s.font.size=Pt(size);s.font.color.rgb=BLUE;s.font.bold=True
 s._element.rPr.rFonts.set(qn('w:eastAsia'),FONT)
 s.paragraph_format.space_before=Pt(before);s.paragraph_format.space_after=Pt(after)
 s.paragraph_format.keep_with_next=True

# Header, page numbers, running footer
header=sec.header.paragraphs[0];header.text='AI交易守望站  /  AI TRUST COMMUNITY     ·     完整产品需求计划书 V3.1';header.alignment=WD_ALIGN_PARAGRAPH.RIGHT
for r in header.runs:r.font.name=FONT;r.font.size=Pt(8);r.font.color.rgb=GRAY
footer=sec.footer.paragraphs[0];footer.alignment=WD_ALIGN_PARAGRAPH.CENTER
r=footer.add_run('公益论坛 · 开源首次发布 v1.0.1    |    第 ');r.font.size=Pt(8);r.font.color.rgb=GRAY
fld=OxmlElement('w:fldSimple');fld.set(qn('w:instr'),'PAGE');footer._p.append(fld)
r=footer.add_run(' 页');r.font.size=Pt(8);r.font.color.rgb=GRAY

# Cover
p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.space_before=Pt(92)
r=p.add_run('AI交易守望站');r.font.name=FONT;r.font.size=Pt(31);r.font.bold=True;r.font.color.rgb=BLUE
p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;r=p.add_run('AI TRUST COMMUNITY');r.font.name=FONT;r.font.size=Pt(13);r.font.color.rgb=GRAY
p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.space_before=Pt(30)
r=p.add_run('完整产品需求计划书  ·  PRD');r.font.name=FONT;r.font.size=Pt(20);r.font.bold=True;r.font.color.rgb=DARK
p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.space_before=Pt(10)
r=p.add_run('GitHub 首发 v1.0.1    /    研发版本 V3.1');r.font.size=Pt(11);r.font.color.rgb=GRAY
p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.space_before=Pt(42)
p.add_run('适用范围：产品、设计、前端、后端、数据库、审核运营、运维与开源维护者\n').bold=True
p.add_run('本文为完整产品需求基线，涵盖既有功能、技术方案、接口安全与上线验收，非增量补丁。')
doc.add_page_break()

# TOC simple helpful curated
h=doc.add_heading('目录 / Contents',level=1)
sections=re.findall(r'^## ([0-9]+\.\s*[^\n]+)$',md,flags=re.M)
for title in sections:
 p=doc.add_paragraph();p.style='Normal';p.paragraph_format.space_after=Pt(3)
 r=p.add_run(title);r.font.color.rgb=BLUE;r.font.size=Pt(9.5)
doc.add_page_break()

# Content, skip first doc heading & front metadata replicated cover
lines=md.splitlines(); i=0;skip_intro=True
while i<len(lines):
 line=lines[i].strip()
 if not line or line=='---':i+=1;continue
 if line.startswith('# '):i+=1;continue
 if skip_intro and not line.startswith('## '):i+=1;continue
 skip_intro=False
 if line.startswith('## '):doc.add_heading(line[3:].strip(),level=1);i+=1;continue
 if line.startswith('### '):doc.add_heading(line[4:].strip(),level=2);i+=1;continue
 if line.startswith('|') and i+1<len(lines) and lines[i+1].lstrip().startswith('|---'):
  headerCells=[x.strip() for x in line.strip('|').split('|')]
  i+=2;rows=[]
  while i<len(lines) and lines[i].strip().startswith('|'):
   rows.append([x.strip() for x in lines[i].strip().strip('|').split('|')]);i+=1
  tb=doc.add_table(rows=1,cols=len(headerCells));tb.style='Table Grid';tb.alignment=WD_TABLE_ALIGNMENT.CENTER;tb.autofit=True
  for ci,v in enumerate(headerCells):tb.rows[0].cells[ci].text=v
  for row in rows:
   cells=tb.add_row().cells
   for ci,val in enumerate(row[:len(cells)]):cells[ci].text=val.replace('`','').replace('**','')
  for rownum,row in enumerate(tb.rows):
   for cell in row.cells:
    cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
    for para in cell.paragraphs:
     para.paragraph_format.space_after=Pt(2);para.paragraph_format.space_before=Pt(2);para.paragraph_format.line_spacing=1.12
     for run in para.runs:run.font.name=FONT;run.font.size=Pt(7.6 if len(headerCells)>=5 else 8.4);run.font.bold=rownum==0
     for run in para.runs:run._element.rPr.rFonts.set(qn('w:eastAsia'),FONT)
    if rownum==0:
     shade=OxmlElement('w:shd');shade.set(qn('w:fill'),'E7F0F3');cell._tc.get_or_add_tcPr().append(shade)
  doc.add_paragraph().paragraph_format.space_after=Pt(2)
  continue
 # list item
 if re.match(r'^(- |\d+\. )',line):
  is_bul=line.startswith('- ')
  txt=re.sub(r'^(- |\d+\. )','',line)
  p=doc.add_paragraph(style='List Bullet' if is_bul else 'List Number')
  p.paragraph_format.space_after=Pt(4)
 else:
  txt=line;p=doc.add_paragraph()
 # parse inline bold, code; simple segmentation
 chunks=re.split(r'(\*\*.*?\*\*|`[^`]+`)',txt)
 for chunk in chunks:
  if not chunk:continue
  bold=chunk.startswith('**') and chunk.endswith('**')
  code=chunk.startswith('`') and chunk.endswith('`')
  st=chunk[2:-2] if bold else chunk[1:-1] if code else chunk
  run=p.add_run(st)
  run.font.bold=bold
  if code:run.font.name='DejaVu Sans Mono';run.font.size=Pt(8);run.font.color.rgb=BLUE
 i+=1
# metadata
props=doc.core_properties;props.title='AI交易守望站 · 完整产品需求计划书 V3.1';props.subject='开源论坛全部需求与安全技术规格';props.author='AI Trust Community Contributors';props.keywords='PRD, 开源, 举报论坛, RBAC, 安全审计'
doc.save(out)
print(out, out.stat().st_size)
