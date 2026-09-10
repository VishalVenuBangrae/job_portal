from pathlib import Path
import re,html,json
root=Path(__file__).resolve().parent.parent
source=(root/'content/terms-source.txt').read_text(encoding='utf-8')
crew,employer=source.split('\nHiring Party\n',1)
crew=crew[crew.index('NCA Daywork App'):]
lead='When you mark yourself available, verified hiring parties may contact you directly regarding daywork opportunities that match your profile, location and availability.'
index={}
for role,text in [('crew',crew),('employer',employer)]:
 lines=[s.strip() for s in text.splitlines() if s.strip()]
 first=next(i for i,s in enumerate(lines) if re.match(r'^1\. ',s))
 title=lines[1];parts=[]
 if role=='crew':parts.append('<blockquote>'+html.escape(lead)+'</blockquote>')
 parts.append('<dl class="legal-meta">')
 for line in lines[2:first]:
  if line.startswith(('Effective date:','Operated by:','Registered address:')):
   k,v=line.split(':',1);parts.append('<div><dt>'+html.escape(k)+'</dt><dd>'+html.escape(v.strip())+'</dd></div>')
 parts.append('</dl>')
 for line in lines[2:first]:
  if not line.startswith(('Effective date:','Operated by:','Registered address:')):parts.append('<p>'+html.escape(line)+'</p>')
 sections=[];body=lines[first:];i=0;opened=False
 while i<len(body):
  line=body[i]
  if re.match(r'^\d+\. ',line):
   if opened:parts.append('</section>')
   number=line.split('.',1)[0];sections.append({'id':'section-'+number,'title':line})
   parts.append('<section class="legal-section" id="section-'+number+'"><h2>'+html.escape(line)+'</h2>');opened=True;i+=1;continue
  parts.append('<p>'+html.escape(line)+'</p>');i+=1
  if line.endswith(':') and i<len(body) and not re.match(r'^\d+\. ',body[i]):
   candidates=[];j=i
   while j<len(body) and not re.match(r'^\d+\. ',body[j]):
    entry=body[j]
    if entry.startswith(('NCA legal entity:','Email:','Registered address:','Privacy contact:')):break
    if len(entry)>350:break
    candidates.append(entry);j+=1
    if entry.endswith('.') or entry.endswith(':'):break
   if len(candidates)>=2:
    parts.append('<ul>'+''.join('<li>'+html.escape(x)+'</li>' for x in candidates)+'</ul>');i=j
 if opened:parts.append('</section>')
 (root/'public/legal'/f'{role}.html').write_text('\n'.join(parts),encoding='utf-8')
 (root/'public'/f'terms-{role}.txt').write_text(text.strip()+'\n',encoding='utf-8')
 index[role]={'title':title,'sections':sections}
(root/'public/legal/index.json').write_text(json.dumps(index,ensure_ascii=False,indent=2),encoding='utf-8')
print('Formatted',len(index['crew']['sections']),'crew sections and',len(index['employer']['sections']),'employer sections.')
