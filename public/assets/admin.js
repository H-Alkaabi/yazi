(()=>{
  'use strict';
  const API='/api/yazi';
  const $=(q,p=document)=>p.querySelector(q), $$=(q,p=document)=>[...p.querySelectorAll(q)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const digits=s=>String(s||'').replace(/\D/g,'');
  const money=n=>new Intl.NumberFormat('ar-AE',{maximumFractionDigits:0}).format(Number(n||0))+' د.إ';
  const statusLabels={new:'جديد',contacted:'تم التواصل',waiting_deposit:'بانتظار العربون',confirmed:'مؤكد',completed:'مكتمل',cancelled:'ملغي',accepted:'مقبول',rejected:'غير مناسب'};
  const depositLabels={unpaid:'غير مدفوع',partial:'مدفوع جزئياً',paid:'مدفوع'};
  let csrf='',items=[],blocks=[],settings={},calDate=new Date(),activeItem=null;

  const toast=msg=>{const el=$('#adminToast');el.textContent=msg;el.classList.add('show');clearTimeout(window.__adt);window.__adt=setTimeout(()=>el.classList.remove('show'),2600)};
  const request=async(action,{method='GET',body}={})=>{
    const opts={method,credentials:'same-origin',cache:'no-store',headers:{}};
    if(body!==undefined){opts.headers['Content-Type']='application/json';opts.headers['X-Yazi-CSRF']=csrf;opts.body=JSON.stringify(body)}
    const r=await fetch(`${API}?action=${encodeURIComponent(action)}`,opts);let x={};try{x=await r.json()}catch{}
    if(!r.ok)throw Object.assign(new Error(x.message||'تعذر تنفيذ الطلب.'),{status:r.status,data:x});return x;
  };

  async function init(){
    $('#todayLabel').textContent=new Intl.DateTimeFormat('ar-AE',{dateStyle:'full',timeZone:'Asia/Dubai'}).format(new Date());
    try{const x=await request('admin_me');csrf=x.csrf;showApp();await loadAll()}catch{showLogin()}
  }
  function showLogin(){document.body.classList.remove('admin-authenticated');$('#loginScreen').hidden=false;$('#adminApp').hidden=true;const s=$('#loginStatus');if(s&&s.textContent==='جارٍ الدخول...')s.textContent=''}
  function showApp(){document.body.classList.add('admin-authenticated');$('#loginScreen').hidden=true;$('#adminApp').hidden=false;const s=$('#loginStatus');if(s)s.textContent=''}

  $('#loginForm').addEventListener('submit',async e=>{e.preventDefault();const status=$('#loginStatus'),btn=$('#loginForm button');status.textContent='جارٍ الدخول...';btn.disabled=true;$('#setupHelp').hidden=true;
    try{const r=await fetch(`${API}?action=admin_login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:$('#password').value.trim()}),credentials:'same-origin'});const x=await r.json();if(!r.ok)throw Object.assign(new Error(x.message),{data:x});csrf=x.csrf;$('#password').value='';status.textContent='';showApp();await loadAll()}
    catch(err){status.textContent=err.message||'تعذر الدخول.';if(err.data?.code==='ADMIN_NOT_CONFIGURED')$('#setupHelp').hidden=false;if(err.data?.code==='INVALID_ADMIN_PASSWORD')status.textContent='كلمة المرور لا تطابق القيمة المحفوظة في Netlify. تأكدي من قيمة YAZI_ADMIN_PASSWORD ثم أعيدي Deploy.'}finally{btn.disabled=false}
  });

  $('#logoutBtn').addEventListener('click',async()=>{try{await request('admin_logout',{method:'POST',body:{}})}catch{}csrf='';showLogin()});
  $('#refreshBtn').addEventListener('click',()=>loadAll(true));

  async function loadAll(notify=false){
    try{const [r,b,s]=await Promise.all([request('admin_list'),request('admin_blocks'),request('admin_settings')]);items=r.items||[];blocks=b.items||[];settings=s.settings||{};renderAll();if(notify)toast('تم تحديث البيانات')}
    catch(err){if(err.status===401){showLogin();return}toast(err.message)}
  }

  function renderAll(){renderStats();renderTable();renderCalendar();renderBlocks();renderSettings()}
  function renderStats(){
    const bookings=items.filter(i=>i.kind==='booking');
    $('#statAll').textContent=items.length;$('#statNew').textContent=items.filter(i=>i.status==='new').length;$('#statConfirmed').textContent=bookings.filter(i=>i.status==='confirmed').length;$('#statDeposit').textContent=bookings.filter(i=>i.status==='waiting_deposit'||(i.status!=='cancelled'&&i.deposit_status==='unpaid')).length;$('#statRevenue').textContent=money(bookings.filter(i=>i.status==='confirmed').reduce((s,i)=>s+Number(i.total_price||0),0));
  }

  function filtered(){const q=$('#searchInput').value.trim().toLowerCase(),kind=$('#kindFilter').value,status=$('#statusFilter').value;return items.filter(i=>(!kind||i.kind===kind)&&(!status||i.status===status)&&(!q||[i.id,i.full_name,i.phone,i.service,i.city,i.event_date].some(v=>String(v||'').toLowerCase().includes(q))))}
  function renderTable(){const rows=filtered();$('#emptyState').hidden=rows.length>0;$('#requestRows').innerHTML=rows.map(i=>{
    const isB=i.kind==='booking';return `<tr><td><span class="kind-pill">${isB?'حجز':'مودل'}</span><div class="request-id">${esc(i.id)}</div></td><td class="person"><strong>${esc(i.full_name)}</strong><a href="tel:${digits(i.phone)}">${esc(i.phone)}</a></td><td>${isB?`${esc(i.service)}${i.hair?' + شعر':''}<br><b>${money(i.total_price)}</b>`:`العمر ${esc(i.age)}<br>${esc(i.city)}`}</td><td>${isB?`${esc(i.event_date)}<br>${esc(i.event_time)}`:esc(i.availability_text||'—')}</td><td>${isB?`<span class="deposit-pill ${esc(i.deposit_status||'unpaid')}">${depositLabels[i.deposit_status||'unpaid']||'—'}</span><br><small>${money(i.deposit_amount)}</small>`:'—'}</td><td><span class="status-pill ${esc(i.status)}">${statusLabels[i.status]||esc(i.status)}</span></td><td class="row-actions"><button type="button" data-open="${esc(i.id)}">التفاصيل</button></td></tr>`}).join('');$$('[data-open]').forEach(b=>b.onclick=()=>openRequest(b.dataset.open))}
  $('#searchInput').addEventListener('input',renderTable);$('#kindFilter').addEventListener('change',renderTable);$('#statusFilter').addEventListener('change',renderTable);

  function renderCalendar(){
    const y=calDate.getFullYear(),m=calDate.getMonth();$('#calendarTitle').textContent=new Intl.DateTimeFormat('ar-AE',{month:'long',year:'numeric'}).format(new Date(y,m,1));
    const first=new Date(y,m,1),start=new Date(y,m,1-first.getDay());const todayKey=isoLocal(new Date());let html='';
    for(let c=0;c<42;c++){const d=new Date(start);d.setDate(start.getDate()+c);const key=isoLocal(d),out=d.getMonth()!==m,dayItems=items.filter(i=>i.kind==='booking'&&i.event_date===key&&!['cancelled','archived'].includes(i.status)).sort((a,b)=>String(a.event_time).localeCompare(String(b.event_time)));html+=`<div class="cal-day ${out?'out':''} ${key===todayKey?'today':''}"><span class="day-number">${d.getDate()}</span>${dayItems.slice(0,3).map(i=>`<button class="cal-event ${esc(i.status)}" type="button" data-cal-open="${esc(i.id)}">${esc(i.event_time)} ${esc(i.full_name)}</button>`).join('')}${dayItems.length>3?`<div class="cal-more">+${dayItems.length-3} مواعيد</div>`:''}</div>`}
    $('#calendar').innerHTML=html;$$('[data-cal-open]').forEach(b=>b.onclick=()=>openRequest(b.dataset.calOpen));
  }
  function isoLocal(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`}
  $('#calPrev').onclick=()=>{calDate=new Date(calDate.getFullYear(),calDate.getMonth()-1,1);renderCalendar()};$('#calNext').onclick=()=>{calDate=new Date(calDate.getFullYear(),calDate.getMonth()+1,1);renderCalendar()};$('#calToday').onclick=()=>{calDate=new Date();renderCalendar()};

  function renderBlocks(){$('#blockedList').innerHTML=blocks.length?blocks.slice(0,20).map(b=>`<div class="blocked-item"><span><b>${esc(b.event_date)}</b> — ${b.event_time==='ALL'?'اليوم كاملاً':esc(b.event_time)}${b.note?`<br>${esc(b.note)}`:''}</span><button type="button" data-unblock="${esc(b.id)}">إزالة</button></div>`).join(''):'<div class="blocked-item"><span>لا توجد مواعيد محجوبة.</span></div>';$$('[data-unblock]').forEach(b=>b.onclick=async()=>{try{await request('admin_block_delete',{method:'POST',body:{id:b.dataset.unblock}});toast('تمت إزالة الحجب');await loadAll()}catch(e){toast(e.message)}})}
  $('#allDay').onchange=e=>{$('#blockTimeLabel').hidden=e.target.checked;$('#blockTime').required=!e.target.checked};
  $('#blockForm').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.currentTarget),data=Object.fromEntries(fd.entries());data.all_day=fd.has('all_day');try{await request('admin_block_add',{method:'POST',body:data});e.currentTarget.reset();$('#blockTimeLabel').hidden=false;$('#blockTime').required=true;toast('تم حجب الموعد');await loadAll()}catch(err){toast(err.message)}};

  function renderSettings(){const f=$('#settingsForm');if(f.elements.slot_buffer_minutes)f.elements.slot_buffer_minutes.value=String(settings.slot_buffer_minutes??0);if(f.elements.lead_hours)f.elements.lead_hours.value=String(settings.lead_hours??0)}
  $('#settingsForm').onsubmit=async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));try{const x=await request('admin_settings',{method:'POST',body:data});settings=x.settings;toast('تم حفظ إعدادات التوفر')}catch(err){toast(err.message)}};

  function openRequest(id){activeItem=items.find(i=>i.id===id);if(!activeItem)return;const i=activeItem,isB=i.kind==='booking',statuses=isB?['new','contacted','waiting_deposit','confirmed','completed','cancelled']:['new','contacted','accepted','rejected'];const waText=encodeURIComponent(`مرحباً ${i.full_name}، بخصوص طلبك ${i.id} لدى YAZI.`);const details=isB?[["الخدمة",`${i.service}${i.hair?' + شعر':''}`],["الإجمالي",money(i.total_price)],["العربون",money(i.deposit_amount)],["الموعد",`${i.event_date} — ${i.event_time}`],["مكان الخدمة",i.location_type==='home'?'موقع العميلة':'الاستوديو'],["المدينة",i.city||'—'],["العنوان",i.address||'—'],["ملاحظات العميلة",i.notes||'—']]:[["العمر",i.age],["المدينة",i.city],["إنستغرام",i.instagram||'—'],["أوقات التوفر",i.availability_text||'—'],["خبرة التصوير",i.experience||'—'],["ملاحظات",i.notes||'—']];
    $('#dialogContent').innerHTML=`<div class="dialog-title"><span class="request-id">${esc(i.id)} • ${new Date(i.created_at).toLocaleString('ar-AE')}</span><h2>${esc(i.full_name)}</h2><p>${isB?'طلب حجز':'طلب مودل'} — ${esc(i.phone)}</p><div class="contact-links"><a href="https://wa.me/${digits(i.phone)}?text=${waText}" target="_blank" rel="noopener">واتساب</a><a href="tel:${digits(i.phone)}">اتصال</a><a href="mailto:hello@yazi.ae?subject=${encodeURIComponent(i.id)}">بريد YAZI</a></div></div><div class="detail-grid">${details.map(([l,v])=>`<div class="detail"><span>${esc(l)}</span><b>${esc(v)}</b></div>`).join('')}</div><div class="dialog-form"><label>الحالة<select id="dialogStatus">${statuses.map(s=>`<option value="${s}" ${s===i.status?'selected':''}>${statusLabels[s]}</option>`).join('')}</select></label>${isB?`<label>حالة العربون<select id="dialogDeposit"><option value="unpaid" ${i.deposit_status==='unpaid'?'selected':''}>غير مدفوع</option><option value="partial" ${i.deposit_status==='partial'?'selected':''}>مدفوع جزئياً</option><option value="paid" ${i.deposit_status==='paid'?'selected':''}>مدفوع</option></select></label>`:''}<label class="wide">ملاحظات داخلية<textarea id="dialogNotes" placeholder="هذه الملاحظات لا تظهر للعميلة">${esc(i.internal_notes||'')}</textarea></label><div class="dialog-actions"><button class="btn primary" type="button" id="saveDialog">حفظ التغييرات</button><button class="danger-btn" type="button" id="archiveDialog">أرشفة الطلب</button></div></div>`;
    $('#saveDialog').onclick=saveDialog;$('#archiveDialog').onclick=archiveDialog;$('#requestDialog').showModal();
  }
  async function saveDialog(){if(!activeItem)return;const body={id:activeItem.id,kind:activeItem.kind,status:$('#dialogStatus').value,internal_notes:$('#dialogNotes').value};if(activeItem.kind==='booking')body.deposit_status=$('#dialogDeposit').value;try{await request('admin_update',{method:'POST',body});toast('تم حفظ التغييرات');$('#requestDialog').close();await loadAll()}catch(err){toast(err.message)}}
  async function archiveDialog(){if(!activeItem||!confirm('أرشفة هذا الطلب؟ إذا كان حجزاً سيتم تحرير الموعد.'))return;try{await request('admin_archive',{method:'POST',body:{id:activeItem.id,kind:activeItem.kind}});toast('تمت أرشفة الطلب');$('#requestDialog').close();await loadAll()}catch(err){toast(err.message)}}

  $('#exportBtn').onclick=()=>{const rows=filtered();const cols=['id','kind','full_name','phone','service','total_price','deposit_amount','deposit_status','event_date','event_time','city','status','created_at'];const csv=[cols.join(','),...rows.map(r=>cols.map(k=>`"${String(r[k]??'').replaceAll('"','""')}"`).join(','))].join('\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`YAZI-requests-${isoLocal(new Date())}.csv`;a.click();URL.revokeObjectURL(url)};
  init();
})();
