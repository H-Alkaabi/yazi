(()=>{
  'use strict';
  const API='/api/yazi';
  const $=(q,p=document)=>p.querySelector(q), $$=(q,p=document)=>[...p.querySelectorAll(q)];
  const money=n=>new Intl.NumberFormat('ar-AE',{maximumFractionDigits:0}).format(Number(n||0))+' د.إ';
  const servicePrices={'مكياج عادي':500,'مكياج مرافقات':450,'مكياج سهرة':600,'مكياج عروس':2100};
  const toast=(msg,type='')=>{const el=$('#toast');if(!el)return;el.textContent=msg;el.className='toast show '+type;clearTimeout(window.__yaziToast);window.__yaziToast=setTimeout(()=>el.className='toast',4200)};
  const api=async(action,options={})=>{
    const r=await fetch(`${API}?action=${encodeURIComponent(action)}`,{cache:'no-store',credentials:'same-origin',...options});
    let x={};try{x=await r.json()}catch{}
    if(!r.ok)throw Object.assign(new Error(x.message||'تعذر الاتصال بالخادم.'),{status:r.status,data:x});
    return x;
  };

  const menu=$('.menu-btn'),nav=$('.main-nav');
  menu?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open))});
  $$('.main-nav a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu?.setAttribute('aria-expanded','false')}));

  const obs='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');obs.unobserve(e.target)}}),{threshold:.1}):null;
  $$('.reveal').forEach(el=>obs?obs.observe(el):el.classList.add('in'));

  const minDate=new Date();minDate.setMinutes(minDate.getMinutes()-minDate.getTimezoneOffset());const today=minDate.toISOString().slice(0,10);
  $$('input[type=date]').forEach(i=>i.min=today);

  const service=$('#service'),hair=$('#hair'),priceTotal=$('#priceTotal'),depositTotal=$('#depositTotal');
  function updatePrice(){const base=servicePrices[service?.value]||0,total=base+(hair?.checked?150:0);priceTotal.textContent=total?money(total):'—';depositTotal.textContent=total?money(total*.5):'—'}
  service?.addEventListener('change',updatePrice);hair?.addEventListener('change',updatePrice);updatePrice();

  $$('.service-pick').forEach(btn=>btn.addEventListener('click',()=>{const card=btn.closest('[data-service]');if(service&&card){service.value=card.dataset.service;updatePrice();$('#booking')?.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>service.focus(),500)}}));

  const addressWrap=$('.conditional-address'),address=$('#address');
  $$('input[name="location_type"]').forEach(r=>r.addEventListener('change',()=>{const home=$('input[name="location_type"]:checked')?.value==='home';if(addressWrap)addressWrap.hidden=!home;if(address)address.required=home}));

  async function checkAvailability(date,time,resultEl){
    if(!date||!time)return false;
    resultEl.className='availability-result checking';resultEl.textContent='جارٍ التحقق...';
    try{const x=await api(`availability&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`);resultEl.textContent=x.message;resultEl.className='availability-result '+(x.available?'ok':'bad');return !!x.available}
    catch(err){resultEl.textContent=err.message;resultEl.className='availability-result bad';return false}
  }

  $('#availabilityForm')?.addEventListener('submit',async e=>{e.preventDefault();const d=$('#availDate').value,t=$('#availTime').value,r=$('#availabilityResult');
    // use direct URL because action carries its own query parameters
    r.className='availability-result checking';r.textContent='جارٍ التحقق...';
    try{const res=await fetch(`${API}?action=availability&date=${encodeURIComponent(d)}&time=${encodeURIComponent(t)}`,{cache:'no-store'});const x=await res.json();r.textContent=x.message||'تعذر التحقق';r.className='availability-result '+(x.available?'ok':'bad');if(x.available){$('#event_date').value=d;$('#event_time').value=t;toast('الموعد متاح مبدئياً','ok')}}catch{r.textContent='تعذر الاتصال بالنظام حالياً.';r.className='availability-result bad'}
  });

  async function mirrorForm(){ return true; }

  function bookingSummary(data,id,total,deposit){return [`رقم الطلب: ${id}`,`الاسم: ${data.full_name}`,`الهاتف: ${data.phone}`,`الخدمة: ${data.service}${data.hair?' + شعر':''}`,`الإجمالي: ${total} د.إ`,`العربون: ${deposit} د.إ`,`التاريخ: ${data.event_date}`,`الوقت: ${data.event_time}`].join('\n')}

  async function submitBooking(form){
    const status=$('.form-status',form),btn=$('button[type="submit"]',form),success=$('#bookingSuccess');
    status.textContent='جارٍ التحقق وإرسال الطلب...';status.className='form-status';btn.disabled=true;success.hidden=true;
    try{
      const fd=new FormData(form),data=Object.fromEntries(fd.entries());data.hair=fd.has('hair');
      const availabilityResult=document.createElement('div');
      const x=await api('booking',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      status.textContent='تم الإرسال بنجاح.';status.className='form-status ok';
      const summary=bookingSummary(data,x.id,x.total_price,x.deposit_amount);
      mirrorForm('booking-notifications',{request_id:x.id,full_name:data.full_name,phone:data.phone,service:data.service,event_date:data.event_date,event_time:data.event_time,summary});
      success.innerHTML=`<span class="success-mark">✓</span><div><b>تم استلام طلبك</b><p>رقم الطلب: <strong>${x.id}</strong><br>الإجمالي: <strong>${money(x.total_price)}</strong> — العربون: <strong>${money(x.deposit_amount)}</strong></p><div class="success-actions"><a class="btn primary" target="_blank" rel="noopener" href="${x.whatsapp_url}">متابعة عبر واتساب</a><a class="btn ghost" href="${x.email_url}">إرسال عبر البريد</a></div></div>`;
      success.hidden=false;toast(`تم استلام طلبك — ${x.id}`,'ok');
      form.reset();addressWrap.hidden=true;address.required=false;updatePrice();success.scrollIntoView({behavior:'smooth',block:'center'});
    }catch(err){status.textContent=err.message;status.className='form-status bad';toast(err.message,'bad')}
    finally{btn.disabled=false}
  }

  async function submitModel(form){
    const status=$('.form-status',form),btn=$('button[type="submit"]',form),success=$('#modelSuccess');status.textContent='جارٍ الإرسال...';status.className='form-status';btn.disabled=true;success.hidden=true;
    try{const data=Object.fromEntries(new FormData(form).entries());const x=await api('model',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});status.textContent='تم الإرسال بنجاح.';status.className='form-status ok';
      const summary=`رقم الطلب: ${x.id}\nالاسم: ${data.full_name}\nالهاتف: ${data.phone}\nالمدينة: ${data.city}`;mirrorForm('model-notifications',{request_id:x.id,full_name:data.full_name,phone:data.phone,summary});
      success.innerHTML=`<span class="success-mark">✓</span><div><b>تم استلام طلب التقديم</b><p>رقم الطلب: <strong>${x.id}</strong>. سيتم التواصل عند وجود جلسة مناسبة.</p><a class="btn ghost" target="_blank" rel="noopener" href="${x.whatsapp_url}">متابعة عبر واتساب</a></div>`;success.hidden=false;form.reset();toast(`تم إرسال الطلب — ${x.id}`,'ok');success.scrollIntoView({behavior:'smooth',block:'center'});
    }catch(err){status.textContent=err.message;status.className='form-status bad';toast(err.message,'bad')}finally{btn.disabled=false}
  }
  $('#bookingForm')?.addEventListener('submit',e=>{e.preventDefault();submitBooking(e.currentTarget)});
  $('#modelForm')?.addEventListener('submit',e=>{e.preventDefault();submitModel(e.currentTarget)});

  const chatToggle=$('#chatToggle'),chatPanel=$('#chatPanel'),chatClose=$('#chatClose');
  const setChat=open=>{if(!chatPanel)return;chatPanel.hidden=!open;chatToggle?.setAttribute('aria-expanded',String(open))};
  chatToggle?.addEventListener('click',()=>setChat(chatPanel.hidden));chatClose?.addEventListener('click',()=>setChat(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setChat(false)});
})();
