// صفحة لوحة إنتاج نوى. لا تحتوي backtick ولا ${ لأنها داخل String.raw
export const PAGE = String.raw`<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>استوديو نوى</title>
<style>
:root{--pri:#c34d04;--glow:#ff8a1f;--ink:#342616;--bg:#f9f8fc;--line:#ecd9c8;--mut:#7a6650;--green:#14935a;--red:#d62f2f;--cream:#fff4ea}
*{box-sizing:border-box}body{margin:0;font-family:"IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif;background:var(--bg);color:var(--ink)}
header{background:linear-gradient(90deg,var(--pri),#e0680f);color:#fff;padding:10px 20px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
header img{height:34px;background:#fff;border-radius:8px;padding:3px 8px}header h1{font-size:19px;margin:0;flex:1;min-width:160px}
.pill{padding:3px 12px;border-radius:999px;font-size:13px;font-weight:600;background:#ffffff30}.pill.ok{background:var(--green)}.pill.bad{background:var(--red)}
button,.lnk{font:inherit;font-size:13px;border:1px solid var(--line);background:#fff;color:var(--pri);padding:5px 13px;border-radius:8px;cursor:pointer;text-decoration:none}
button:hover{background:var(--cream)}button.pri{background:var(--pri);border-color:var(--pri);color:#fff}button.pri:hover{background:#a84103}button:disabled{opacity:.45;cursor:not-allowed}
main{padding:18px 20px;max-width:1040px;margin:auto}
.card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px 18px;margin-bottom:16px}
.card h2{margin:0 0 4px;font-size:18px;color:var(--pri)}.sub{color:var(--mut);font-size:13px}
.bar{height:10px;background:#f1e6da;border-radius:6px;overflow:hidden;margin:10px 0 6px}.bar>i{display:block;height:100%;background:linear-gradient(90deg,var(--pri),var(--glow));transition:width .4s}
.sum{display:flex;gap:18px;flex-wrap:wrap;font-size:14px;align-items:center}.sum b{font-size:20px}
.tabs{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap}.tabs button{padding:7px 18px;font-size:14px}.tabs button.on{background:var(--ink);color:#fff;border-color:var(--ink)}
table{width:100%;border-collapse:collapse;font-size:14px}td{padding:9px 6px;border-top:1px solid #f3e8dc;vertical-align:middle}td.n{width:38px;color:var(--mut)}td.acts{text-align:end;white-space:nowrap}
.badge{display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:700;color:#fff;background:#b8a898;white-space:nowrap}
.b-Completed{background:var(--green)}.b-Scripted{background:var(--glow)}.b-Failed{background:var(--red)}.b-Running{background:var(--pri);animation:pulse 1.2s infinite}
@keyframes pulse{50%{opacity:.5}}
.tag{background:var(--cream);border:1px solid var(--line);border-radius:999px;font-size:12px;padding:1px 10px;margin-inline-start:8px;color:var(--pri)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px}
.grid figure{margin:0;background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden;cursor:pointer}
.grid img{width:100%;aspect-ratio:16/10;object-fit:cover;object-position:top;display:block;background:#eee}.grid figcaption{padding:6px 10px;font-size:12px;color:var(--mut);direction:ltr;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sw{display:flex;gap:12px;flex-wrap:wrap}.sw div{width:130px;border:1px solid var(--line);border-radius:12px;overflow:hidden;font-size:12px;text-align:center}.sw i{display:block;height:54px}.sw span{display:block;padding:5px}
.modal{position:fixed;inset:0;background:#000c;display:none;align-items:center;justify-content:center;z-index:9;padding:16px}.modal.on{display:flex}
.modal video{max-width:94vw;max-height:88vh;border-radius:10px;background:#000}.modal img{max-width:96vw;max-height:92vh;border-radius:8px;background:#fff}
pre{background:#2a1d10;color:#ffe9d2;border-radius:10px;padding:10px 12px;font-size:12px;max-height:240px;overflow:auto;direction:ltr;text-align:left;margin:8px 0 0;white-space:pre-wrap}
ol.steps{margin:8px 0 0;padding-inline-start:22px;line-height:1.9;font-size:14px}
select{font:inherit;font-size:13px;padding:5px 8px;border:1px solid var(--line);border-radius:8px;background:#fff}
#toast{position:fixed;bottom:16px;inset-inline-start:16px;background:var(--ink);color:#fff;padding:9px 14px;border-radius:10px;display:none;z-index:10}
@media (max-width:640px){main{padding:10px 12px}header h1{flex:1 1 100%}td.acts{white-space:normal}}
</style></head><body>
<header><img src="/media/assets/brand/logo.png" alt="Nawa"><h1>استوديو نوى · لوحة الإنتاج</h1>
<span class="pill" id="p-site"></span><span class="pill" id="p-job"></span><a class="lnk" id="adm" href="/login" hidden>دخول المسؤول</a></header>
<main>
<div class="card" id="sum"></div>
<div id="jobcard"></div>
<div class="tabs"><button data-t="series" class="on">السلاسل والحلقات</button><button data-t="shots">اللقطات</button><button data-t="brand">الهوية والصوت</button></div>
<div id="t-series"></div><div id="t-shots" hidden></div><div id="t-brand" hidden></div>
</main>
<div class="modal" id="vm" onclick="if(event.target===this)closeM()"></div>
<div id="toast"></div>
<script>
let S=null,voice='ar-SA-HamedNeural',openEp=null;
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const AR={Completed:'مكتملة',Scripted:'سيناريو جاهز',Planned:'مخططة',Running:'قيد الإنتاج',Failed:'فشلت'};
const media=p=>'/media/'+encodeURI(p);
function toast(m){const t=$('toast');t.textContent=m;t.style.display='block';clearTimeout(toast.h);toast.h=setTimeout(()=>t.style.display='none',3500)}
async function cmd(o){const r=await fetch('/api/cmd',{method:'POST',headers:{'content-type':'application/json','x-tutorial':'1'},body:JSON.stringify(o)});const j=await r.json();toast(j.message||j.error);load()}
function play(p){$('vm').innerHTML='<video controls autoplay src="'+media(p)+'"></video>';$('vm').classList.add('on')}
function img(p){$('vm').innerHTML='<img src="'+media(p)+'">';$('vm').classList.add('on')}
function closeM(){$('vm').classList.remove('on');$('vm').innerHTML=''}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeM()});
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('on',x===b));for(const t of ['series','shots','brand'])$('t-'+t).hidden=t!==b.dataset.t});
function draw(){
  $('adm').hidden=!(S.remote&&!S.control);
  const c=S.counts,pct=c.total?Math.round(c.done/c.total*100):0;
  $('sum').innerHTML='<div class="sum"><span><b>'+c.done+'</b> / '+c.total+' حلقة مكتملة</span><span><b>'+c.scripted+'</b> سيناريو جاهز</span><span><b>'+(c.total-c.done-c.scripted)+'</b> مخططة</span></div><div class="bar"><i style="width:'+pct+'%"></i></div><div class="sub">'+pct+'% من الدليل المعتمد</div>';
  const busy=!!(S.job&&S.job.status==='Running'),run=!S.control||busy;
  $('p-site').textContent=S.env.site?'الموقع: مضبوط':'الموقع: أضف بيانات الدخول في .env';$('p-site').className='pill '+(S.env.site?'ok':'bad');
  $('p-job').textContent=busy?'قيد الإنتاج: '+S.job.ep:(S.control?'جاهز':'عرض فقط');$('p-job').onclick=null;$('p-job').className='pill '+(busy?'':'ok');
  // مهمة الإنتاج
  let jh='';
  if(S.job){const j=S.job;jh='<div class="card"><h2>مهمة الإنتاج <span class="badge b-'+j.status+'">'+AR[j.status]+'</span></h2><div class="sub">'+esc(j.ep)+(j.remix?' · إعادة مونتاج':'')+' · '+esc(j.voice)+'</div><pre>'+esc(j.tail||'...')+'</pre></div>'}
  $('jobcard').innerHTML=jh;
  // السلاسل
  let h='<div class="sub" style="margin-bottom:10px">الصوت: <select onchange="voice=this.value">'+S.voices.map(v=>'<option'+(v===voice?' selected':'')+'>'+v+'</option>').join('')+'</select></div>';
  for(const s of S.series){
    h+='<div class="card"><h2>'+esc(s.title)+'<span class="tag">'+esc(s.tag)+'</span></h2><div class="sub">'+esc(s.audience)+' · '+esc(s.note)+'</div><table>';
    for(const e of s.episodes){
      const f=e.ep&&S.episodes[e.ep];
      h+='<tr><td class="n">'+e.n+'</td><td>'+esc(e.title)+'</td><td><span class="badge b-'+e.status+'">'+AR[e.status]+'</span></td><td class="acts">';
      if(f){
        if(f.video)h+='<button onclick="play(\''+f.video.path+'\')">معاينة</button> <a class="lnk" href="'+media(f.video.path)+'" download>تنزيل</a> ';
        h+='<button onclick="openEp=openEp===\''+e.ep+'\'?null:\''+e.ep+'\';draw()">الخطوات</button> ';
        h+='<button class="pri" '+(run?'disabled':'')+' onclick="if(confirm(\'يبدأ التسجيل وقد يأخذ دقائق. متابعة؟\'))cmd({cmd:\'produce\',ep:\''+e.ep+'\',voice:voice})">إنتاج</button> ';
        if(f.canRemix)h+='<button '+(run?'disabled':'')+' onclick="cmd({cmd:\'produce\',ep:\''+e.ep+'\',voice:voice,remix:true})">مونتاج فقط</button>';
      }
      h+='</td></tr>';
      if(f&&openEp===e.ep){
        h+='<tr><td></td><td colspan="3"><div class="sub">'+(f.video?f.video.mb+' ميغابايت · '+(f.video.sec||'?')+' ثانية · '+new Date(f.video.at).toLocaleString('ar'):'لم يُنتَج بعد')+(f.srt?' · <a href="'+media(f.srt)+'" target="_blank">الترجمة SRT</a>':'')+'</div><ol class="steps">'+f.steps.map(x=>'<li>'+(x.card?'<b>['+x.card+']</b> ':'')+esc(x.speech)+'</li>').join('')+'</ol></td></tr>';
      }
    }
    h+='</table></div>';
  }
  $('t-series').innerHTML=h;
  // اللقطات
  let g='';
  for(const [k,t] of [['public','الصفحات العامة'],['app','الأدوات والدروس'],['admin','لوحة الإدارة (محلية)']]){
    const a=S.shots[k];if(!a.length)continue;
    g+='<div class="card"><h2>'+t+' <span class="tag">'+a.length+'</span></h2><div class="grid">'+a.map(p=>'<figure onclick="img(\''+p+'\')"><img loading="lazy" src="'+media(p)+'"><figcaption>'+esc(p.split('/').pop())+'</figcaption></figure>').join('')+'</div></div>';
  }
  $('t-shots').innerHTML=g||'<div class="card sub">لا لقطات بعد: npm run screens</div>';
  // الهوية
  const b=S.brand;
  $('t-brand').innerHTML='<div class="card"><h2>الهوية</h2><img src="'+media(b.logo)+'" height="46"> <div class="sw" style="margin-top:12px">'+Object.entries(b.colors).map(([n,c])=>'<div><i style="background:'+c+'"></i><span>'+n+' '+c+'</span></div>').join('')+'</div></div>'
   +'<div class="card"><h2>الموسيقى</h2>'+(b.music?'<audio controls src="'+media(b.music)+'" style="width:100%"></audio>':'<div class="sub">لا توجد: npm run music</div>')+'</div>'
   +'<div class="card"><h2>الصوت</h2><div class="sub">الحالي: Microsoft Edge TTS المجاني. ElevenLabs: '+(S.env.eleven?'مفتاح موجود في .env':'غير مضبوط (يُضاف في .env عند التجديد)')+'</div></div>';
}
async function load(){try{S=await (await fetch('/api/state')).json();draw()}catch(e){}}
load();setInterval(()=>{if(!S||(S.job&&S.job.status==='Running'))load()},2500);setInterval(load,15000);
</script></body></html>
`;
