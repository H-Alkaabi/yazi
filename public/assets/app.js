(()=>{
  'use strict';

  /* =========================================================
     YAZI MAIN APP
     ========================================================= */

  const API='/api/yazi';

  const $=(q,p=document)=>p.querySelector(q);
  const $$=(q,p=document)=>[...p.querySelectorAll(q)];

  const money=n=>
    new Intl.NumberFormat('ar-AE',{
      maximumFractionDigits:0
    }).format(Number(n||0))+' د.إ';

  const servicePrices={
    'مكياج عادي':500,
    'مكياج مرافقات':450,
    'مكياج سهرة':600,
    'مكياج عروس':2100
  };


  /* =========================================================
     TOAST
     ========================================================= */

  const toast=(msg,type='')=>{
    const el=$('#toast');

    if(!el) return;

    el.textContent=msg;
    el.className='toast show '+type;

    clearTimeout(window.__yaziToast);

    window.__yaziToast=setTimeout(()=>{
      el.className='toast';
    },4200);
  };


  /* =========================================================
     API
     ========================================================= */

  const api=async(action,options={})=>{

    const r=await fetch(
      `${API}?action=${encodeURIComponent(action)}`,
      {
        cache:'no-store',
        credentials:'same-origin',
        ...options
      }
    );

    let x={};

    try{
      x=await r.json();
    }catch{}

    if(!r.ok){
      throw Object.assign(
        new Error(x.message||'تعذر الاتصال بالخادم.'),
        {
          status:r.status,
          data:x
        }
      );
    }

    return x;
  };


  /* =========================================================
     MOBILE MENU
     ========================================================= */

  const menu=$('.menu-btn');
  const nav=$('.main-nav');

  menu?.addEventListener('click',()=>{

    if(!nav) return;

    const open=nav.classList.toggle('open');

    menu.setAttribute(
      'aria-expanded',
      String(open)
    );
  });


  $$('.main-nav a').forEach(a=>{

    a.addEventListener('click',()=>{

      nav?.classList.remove('open');

      menu?.setAttribute(
        'aria-expanded',
        'false'
      );

    });

  });


  /* =========================================================
     REVEAL ON SCROLL
     ========================================================= */

  const observer=
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          entries=>{

            entries.forEach(entry=>{

              if(entry.isIntersecting){

                entry.target.classList.add('in');

                observer.unobserve(
                  entry.target
                );

              }

            });

          },
          {
            threshold:.1
          }
        )
      : null;


  $$('.reveal').forEach(el=>{

    if(observer){
      observer.observe(el);
    }else{
      el.classList.add('in');
    }

  });


  /* =========================================================
     MINIMUM DATE
     ========================================================= */

  const minDate=new Date();

  minDate.setMinutes(
    minDate.getMinutes()
    -
    minDate.getTimezoneOffset()
  );

  const today=
    minDate
      .toISOString()
      .slice(0,10);


  $$('input[type="date"]').forEach(input=>{
    input.min=today;
  });


  /* =========================================================
     SERVICE PRICE
     ========================================================= */

  const service=$('#service');
  const hair=$('#hair');

  const priceTotal=$('#priceTotal');
  const depositTotal=$('#depositTotal');


  function updatePrice(){

    const base=
      servicePrices[
        service?.value
      ] || 0;

    const total=
      base
      +
      (
        hair?.checked
          ? 170
          : 0
      );


    if(priceTotal){

      priceTotal.textContent=
        total
          ? money(total)
          : '—';

    }


    if(depositTotal){

      depositTotal.textContent=
        total
          ? money(total*.5)
          : '—';

    }

  }


  service?.addEventListener(
    'change',
    updatePrice
  );


  hair?.addEventListener(
    'change',
    updatePrice
  );


  updatePrice();

  /* =========================================================
     PORTFOLIO CAROUSEL
     ========================================================= */

  const carousel=$('[data-carousel]');

  if(carousel){
    const track=$('.carousel-track',carousel);
    const status=$('.carousel-status',carousel);
    const images=Array.from({length:10},(_,i)=>i+1);

    for(let i=images.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [images[i],images[j]]=[images[j],images[i]];
    }

    images.forEach((number,index)=>{
      const link=document.createElement('a');
      link.className='carousel-slide';
      link.href='/portfolio/';
      link.setAttribute('aria-label',`عرض العمل ${index+1} في معرض الأعمال`);
      link.innerHTML=`<img src="/assets/gallery-${String(number).padStart(2,'0')}.webp" loading="lazy" width="800" height="1000" alt="إطلالة مكياج من أعمال YAZI">`;
      track?.append(link);
    });

    let current=0;
    const visible=()=>matchMedia('(max-width: 700px)').matches?1:matchMedia('(max-width: 900px)').matches?2:3;
    const render=()=>{
      const count=visible();
      current=Math.min(current,Math.max(0,images.length-count));
      track.style.transform=`translateX(-${current*(100/count)}%)`;
      status.textContent=`${current+1}–${Math.min(current+count,images.length)} / ${images.length}`;
    };
    $('.carousel-prev',carousel)?.addEventListener('click',()=>{current=Math.max(0,current-1);render()});
    $('.carousel-next',carousel)?.addEventListener('click',()=>{current=Math.min(images.length-visible(),current+1);render()});
    addEventListener('resize',render,{passive:true});
    render();
  }


  /* =========================================================
     SERVICE CARDS
     ========================================================= */

  $$('.service-pick').forEach(btn=>{

    btn.addEventListener('click',()=>{

      const card=
        btn.closest(
          '[data-service]'
        );


      if(!service || !card){
        return;
      }


      service.value=
        card.dataset.service;


      updatePrice();


      $('#booking')
        ?.scrollIntoView({
          behavior:'smooth',
          block:'start'
        });


      setTimeout(()=>{
        service.focus();
      },500);

    });

  });


  /* =========================================================
     LOCATION TYPE
     ========================================================= */

  const addressWrap=
    $('.conditional-address');

  const address=
    $('#address');


  $$(
    'input[name="location_type"]'
  ).forEach(radio=>{

    radio.addEventListener(
      'change',
      ()=>{

        const home=
          $(
            'input[name="location_type"]:checked'
          )
          ?.value
          ===
          'home';


        if(addressWrap){
          addressWrap.hidden=!home;
        }


        if(address){
          address.required=home;
        }

      }
    );

  });


  /* =========================================================
     AVAILABILITY CHECK
     ========================================================= */

  $('#availabilityForm')
    ?.addEventListener(
      'submit',
      async e=>{

        e.preventDefault();


        const date=
          $('#availDate')
          ?.value;

        const time=
          $('#availTime')
          ?.value;

        const result=
          $('#availabilityResult');


        if(!result){
          return;
        }


        result.className=
          'availability-result checking';

        result.textContent=
          'جارٍ التحقق...';


        try{

          const response=
            await fetch(
              `${API}?action=availability&date=${encodeURIComponent(date||'')}&time=${encodeURIComponent(time||'')}`,
              {
                cache:'no-store'
              }
            );


          const x=
            await response.json();


          result.textContent=
            x.message
            ||
            'تعذر التحقق';


          result.className=
            'availability-result '
            +
            (
              x.available
                ? 'ok'
                : 'bad'
            );


          if(x.available){

            const eventDate=
              $('#event_date');

            const eventTime=
              $('#event_time');


            if(eventDate){
              eventDate.value=date;
            }


            if(eventTime){
              eventTime.value=time;
            }


            toast(
              'الموعد متاح مبدئياً',
              'ok'
            );

          }

        }catch{

          result.textContent=
            'تعذر الاتصال بالنظام حالياً.';

          result.className=
            'availability-result bad';

        }

      }
    );


  /* =========================================================
     MIRROR FORM
     ========================================================= */

  async function mirrorForm(){
    return true;
  }


  /* =========================================================
     BOOKING SUMMARY
     ========================================================= */

  function bookingSummary(
    data,
    id,
    total,
    deposit
  ){

    return [

      `رقم الطلب: ${id}`,

      `الاسم: ${data.full_name}`,

      `الهاتف: ${data.phone}`,

      `الخدمة: ${data.service}${data.hair?' + شعر':''}`,

      `الإجمالي: ${total} د.إ`,

      `العربون: ${deposit} د.إ`,

      `التاريخ: ${data.event_date}`,

      `الوقت: ${data.event_time}`

    ].join('\n');

  }


  /* =========================================================
     BOOKING SUBMISSION
     ========================================================= */

  async function submitBooking(form){

    const status=
      $('.form-status',form);

    const btn=
      $('button[type="submit"]',form);

    const success=
      $('#bookingSuccess');


    if(status){

      status.textContent=
        'جارٍ التحقق وإرسال الطلب...';

      status.className=
        'form-status';

    }


    if(btn){
      btn.disabled=true;
    }


    if(success){
      success.hidden=true;
    }


    try{

      const fd=
        new FormData(form);


      const data=
        Object.fromEntries(
          fd.entries()
        );


      data.hair=
        fd.has('hair');


      const x=
        await api(
          'booking',
          {
            method:'POST',

            headers:{
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify(data)
          }
        );


      if(status){

        status.textContent=
          'تم الإرسال بنجاح.';

        status.className=
          'form-status ok';

      }


      const summary=
        bookingSummary(
          data,
          x.id,
          x.total_price,
          x.deposit_amount
        );


      mirrorForm(
        'booking-notifications',
        {
          request_id:x.id,
          full_name:data.full_name,
          phone:data.phone,
          service:data.service,
          event_date:data.event_date,
          event_time:data.event_time,
          summary
        }
      );


      if(success){

        success.innerHTML=`

          <span class="success-mark">
            ✓
          </span>

          <div>

            <b>
              تم استلام طلبك
            </b>

            <p>

              رقم الطلب:
              <strong>
                ${x.id}
              </strong>

              <br>

              الإجمالي:
              <strong>
                ${money(x.total_price)}
              </strong>

              —

              العربون:
              <strong>
                ${money(x.deposit_amount)}
              </strong>

            </p>

            <div class="success-actions">

              <a
                class="btn primary"
                target="_blank"
                rel="noopener"
                href="${x.whatsapp_url}"
              >
                متابعة عبر واتساب
              </a>

              <a
                class="btn ghost"
                href="${x.email_url}"
              >
                إرسال عبر البريد
              </a>

            </div>

          </div>

        `;


        success.hidden=false;

      }


      toast(
        `تم استلام طلبك — ${x.id}`,
        'ok'
      );


      form.reset();


      if(addressWrap){
        addressWrap.hidden=true;
      }


      if(address){
        address.required=false;
      }


      updatePrice();


      success
        ?.scrollIntoView({
          behavior:'smooth',
          block:'center'
        });


    }catch(err){

      if(status){

        status.textContent=
          err.message;

        status.className=
          'form-status bad';

      }


      toast(
        err.message,
        'bad'
      );


    }finally{

      if(btn){
        btn.disabled=false;
      }

    }

  }


  /* =========================================================
     MODEL APPLICATION
     ========================================================= */

  async function submitModel(form){

    const status=
      $('.form-status',form);

    const btn=
      $('button[type="submit"]',form);

    const success=
      $('#modelSuccess');


    if(status){

      status.textContent=
        'جارٍ الإرسال...';

      status.className=
        'form-status';

    }


    if(btn){
      btn.disabled=true;
    }


    if(success){
      success.hidden=true;
    }


    try{

      const data=
        Object.fromEntries(
          new FormData(form)
            .entries()
        );


      const x=
        await api(
          'model',
          {
            method:'POST',

            headers:{
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify(data)
          }
        );


      if(status){

        status.textContent=
          'تم الإرسال بنجاح.';

        status.className=
          'form-status ok';

      }


      const summary=
        `رقم الطلب: ${x.id}\n`
        +
        `الاسم: ${data.full_name}\n`
        +
        `الهاتف: ${data.phone}\n`
        +
        `المدينة: ${data.city}`;


      mirrorForm(
        'model-notifications',
        {
          request_id:x.id,
          full_name:data.full_name,
          phone:data.phone,
          summary
        }
      );


      if(success){

        success.innerHTML=`

          <span class="success-mark">
            ✓
          </span>

          <div>

            <b>
              تم استلام طلب التقديم
            </b>

            <p>

              رقم الطلب:

              <strong>
                ${x.id}
              </strong>.

              سيتم التواصل عند وجود جلسة مناسبة.

            </p>

            <a
              class="btn ghost"
              target="_blank"
              rel="noopener"
              href="${x.whatsapp_url}"
            >
              متابعة عبر واتساب
            </a>

          </div>

        `;


        success.hidden=false;

      }


      form.reset();


      toast(
        `تم إرسال الطلب — ${x.id}`,
        'ok'
      );


      success
        ?.scrollIntoView({
          behavior:'smooth',
          block:'center'
        });


    }catch(err){

      if(status){

        status.textContent=
          err.message;

        status.className=
          'form-status bad';

      }


      toast(
        err.message,
        'bad'
      );


    }finally{

      if(btn){
        btn.disabled=false;
      }

    }

  }


  $('#bookingForm')
    ?.addEventListener(
      'submit',
      e=>{

        e.preventDefault();

        submitBooking(
          e.currentTarget
        );

      }
    );


  $('#modelForm')
    ?.addEventListener(
      'submit',
      e=>{

        e.preventDefault();

        submitModel(
          e.currentTarget
        );

      }
    );


  /* =========================================================
     YAZI EDITORIAL PORTFOLIO GALLERY
     ========================================================= */

  const gallery=
    $('#work .gallery');


  if(gallery){

    /*
      الصور التي تم رفعها إلى:
      /public/assets/

      gallery-01.webp
      gallery-02.webp
      ...
      gallery-10.webp
    */

    const galleryItems=[

      {
        src:'gallery-01.webp',
        alt:'إطلالة مكياج احترافية من YAZI'
      },

      {
        src:'gallery-02.webp',
        alt:'إطلالة مكياج ناعمة من YAZI'
      },

      {
        src:'gallery-03.webp',
        alt:'إطلالة مكياج سهرة من YAZI'
      },

      {
        src:'gallery-04.webp',
        alt:'إطلالة مكياج وردية من YAZI'
      },

      {
        src:'gallery-05.webp',
        alt:'مكياج ناعم بإضاءة استوديو'
      },

      {
        src:'gallery-06.webp',
        alt:'إطلالة مكياج ناعمة ومضيئة'
      },

      {
        src:'gallery-07.webp',
        alt:'إطلالة مناسبات بطابع تراثي'
      },

      {
        src:'gallery-08.webp',
        alt:'مكياج مناسبات بتفاصيل تراثية'
      },

      {
        src:'gallery-09.webp',
        alt:'إطلالة عروس ناعمة'
      },

      {
        src:'gallery-10.webp',
        alt:'إطلالة عروس بتفاصيل فضية'
      }

    ];


    gallery.classList.add(
      'yazi-editorial-gallery'
    );


    gallery.innerHTML=
      galleryItems
        .map(
          (item,index)=>`

            <figure
              class="yazi-gallery-card"
              tabindex="0"
              role="button"
              data-gallery-index="${index}"
              aria-label="فتح الصورة ${index+1}"
            >

              <img
                src="/assets/${item.src}"
                loading="lazy"
                decoding="async"
                alt="${item.alt}"
              >

              <span
                class="yazi-gallery-hover"
                aria-hidden="true"
              >
                VIEW
              </span>

            </figure>

          `
        )
        .join('');


    /* =====================================================
       GALLERY CSS
       ===================================================== */

    const galleryStyle=
      document.createElement(
        'style'
      );


    galleryStyle.id=
      'yazi-gallery-style';


    galleryStyle.textContent=`

      /* ===============================================
         YAZI EDITORIAL GALLERY
         =============================================== */

      #work .yazi-editorial-gallery{

        max-width:1200px;

        margin:
          0
          auto;

        display:block;

        column-count:3;

        column-gap:16px;

        direction:ltr;

      }


      #work .yazi-editorial-gallery
      .yazi-gallery-card{

        width:100%;

        display:inline-block;

        position:relative;

        margin:
          0
          0
          16px;

        padding:0;

        overflow:hidden;

        border-radius:24px;

        background:#eee;

        break-inside:avoid;

        cursor:zoom-in;

        vertical-align:top;

        box-shadow:
          0
          14px
          32px
          rgba(54,35,29,.07);

        transition:
          transform .35s ease,
          box-shadow .35s ease;

      }


      #work .yazi-editorial-gallery
      .yazi-gallery-card img{

        display:block;

        width:100%;

        height:auto;

        max-width:none;

        object-fit:contain;

        transition:
          transform
          .7s
          cubic-bezier(.2,.7,.2,1),

          filter
          .35s
          ease;

      }


      #work .yazi-editorial-gallery
      .yazi-gallery-card:hover{

        transform:
          translateY(-3px);

        box-shadow:
          0
          22px
          45px
          rgba(54,35,29,.12);

      }


      #work .yazi-editorial-gallery
      .yazi-gallery-card:hover img{

        transform:
          scale(1.025);

      }


      #work .yazi-editorial-gallery
      .yazi-gallery-card:focus-visible{

        outline:
          2px
          solid
          #a76f52;

        outline-offset:
          4px;

      }


      .yazi-gallery-hover{

        position:absolute;

        left:50%;

        top:50%;

        transform:
          translate(-50%,-40%);

        display:flex;

        align-items:center;

        justify-content:center;

        width:72px;

        height:72px;

        border-radius:50%;

        color:#fff;

        background:
          rgba(25,17,14,.55);

        backdrop-filter:
          blur(8px);

        -webkit-backdrop-filter:
          blur(8px);

        border:
          1px
          solid
          rgba(255,255,255,.45);

        font-family:
          "Tajawal",
          sans-serif;

        font-size:10px;

        letter-spacing:.16em;

        opacity:0;

        pointer-events:none;

        transition:
          opacity .3s ease,
          transform .3s ease;

      }


      .yazi-gallery-card:hover
      .yazi-gallery-hover{

        opacity:1;

        transform:
          translate(-50%,-50%);

      }


      /* ===============================================
         LIGHTBOX
         =============================================== */

      .yazi-lightbox{

        position:fixed;

        inset:0;

        z-index:9999;

        display:flex;

        align-items:center;

        justify-content:center;

        padding:
          34px
          80px;

        background:
          rgba(12,9,8,.94);

        backdrop-filter:
          blur(14px);

        -webkit-backdrop-filter:
          blur(14px);

        opacity:0;

        visibility:hidden;

        pointer-events:none;

        transition:
          opacity .25s ease,
          visibility .25s ease;

      }


      .yazi-lightbox.open{

        opacity:1;

        visibility:visible;

        pointer-events:auto;

      }


      .yazi-lightbox-image{

        display:block;

        width:auto;

        height:auto;

        max-width:
          min(
            88vw,
            1200px
          );

        max-height:90vh;

        object-fit:contain;

        border-radius:16px;

        box-shadow:
          0
          30px
          100px
          rgba(0,0,0,.5);

        user-select:none;

        -webkit-user-drag:none;

      }


      .yazi-lightbox-close{

        position:absolute;

        top:22px;

        right:24px;

        width:46px;

        height:46px;

        padding:0;

        border:
          1px
          solid
          rgba(255,255,255,.4);

        border-radius:50%;

        display:grid;

        place-items:center;

        background:
          rgba(0,0,0,.28);

        backdrop-filter:
          blur(8px);

        color:#fff;

        font-size:30px;

        font-weight:200;

        line-height:1;

        cursor:pointer;

        z-index:3;

      }


      .yazi-lightbox-prev,
      .yazi-lightbox-next{

        position:absolute;

        top:50%;

        transform:
          translateY(-50%);

        width:52px;

        height:72px;

        border:0;

        border-radius:999px;

        display:grid;

        place-items:center;

        background:
          rgba(255,255,255,.08);

        color:#fff;

        font-family:Arial,sans-serif;

        font-size:42px;

        font-weight:200;

        cursor:pointer;

        transition:
          background .2s ease,
          transform .2s ease;

      }


      .yazi-lightbox-prev:hover,
      .yazi-lightbox-next:hover{

        background:
          rgba(255,255,255,.18);

      }


      .yazi-lightbox-prev{

        left:22px;

      }


      .yazi-lightbox-next{

        right:22px;

      }


      .yazi-lightbox-counter{

        position:absolute;

        left:50%;

        bottom:18px;

        transform:
          translateX(-50%);

        padding:
          6px
          12px;

        border-radius:999px;

        background:
          rgba(0,0,0,.34);

        color:
          rgba(255,255,255,.85);

        font-size:12px;

        letter-spacing:.14em;

        direction:ltr;

      }


      /* ===============================================
         TABLET
         =============================================== */

      @media(max-width:900px){

        #work .yazi-editorial-gallery{

          column-count:2;

          column-gap:12px;

        }


        #work .yazi-editorial-gallery
        .yazi-gallery-card{

          margin-bottom:12px;

          border-radius:20px;

        }


        .yazi-lightbox{

          padding:
            28px
            55px;

        }


        .yazi-lightbox-prev{

          left:10px;

        }


        .yazi-lightbox-next{

          right:10px;

        }

      }


      /* ===============================================
         MOBILE
         =============================================== */

      @media(max-width:600px){

        #work .yazi-editorial-gallery{

          column-count:1;

          column-gap:0;

        }


        #work .yazi-editorial-gallery
        .yazi-gallery-card{

          display:block;

          width:100%;

          margin:
            0
            0
            12px;

          border-radius:18px;

        }


        .yazi-gallery-hover{

          display:none;

        }


        .yazi-lightbox{

          padding:
            60px
            10px;

        }


        .yazi-lightbox-image{

          max-width:96vw;

          max-height:82vh;

          border-radius:10px;

        }


        .yazi-lightbox-close{

          top:14px;

          right:14px;

          width:42px;

          height:42px;

        }


        .yazi-lightbox-prev,
        .yazi-lightbox-next{

          width:42px;

          height:60px;

          font-size:34px;

          background:
            rgba(0,0,0,.28);

        }


        .yazi-lightbox-prev{

          left:4px;

        }


        .yazi-lightbox-next{

          right:4px;

        }


        .yazi-lightbox-counter{

          bottom:12px;

        }

      }

    `;


    document.head.appendChild(
      galleryStyle
    );


    /* =====================================================
       LIGHTBOX HTML
       ===================================================== */

    const lightbox=
      document.createElement(
        'div'
      );


    lightbox.className=
      'yazi-lightbox';


    lightbox.setAttribute(
      'role',
      'dialog'
    );


    lightbox.setAttribute(
      'aria-modal',
      'true'
    );


    lightbox.setAttribute(
      'aria-label',
      'عرض صور أعمال YAZI'
    );


    lightbox.innerHTML=`

      <button
        class="yazi-lightbox-close"
        type="button"
        aria-label="إغلاق الصورة"
      >
        ×
      </button>


      <button
        class="yazi-lightbox-prev"
        type="button"
        aria-label="الصورة السابقة"
      >
        ‹
      </button>


      <img
        class="yazi-lightbox-image"
        alt=""
      >


      <button
        class="yazi-lightbox-next"
        type="button"
        aria-label="الصورة التالية"
      >
        ›
      </button>


      <div
        class="yazi-lightbox-counter"
        aria-live="polite"
      >
      </div>

    `;


    document.body.appendChild(
      lightbox
    );


    const lightboxImage=
      $('.yazi-lightbox-image',lightbox);

    const lightboxClose=
      $('.yazi-lightbox-close',lightbox);

    const lightboxPrev=
      $('.yazi-lightbox-prev',lightbox);

    const lightboxNext=
      $('.yazi-lightbox-next',lightbox);

    const lightboxCounter=
      $('.yazi-lightbox-counter',lightbox);


    let currentGalleryIndex=0;

    let previousBodyOverflow='';


    function updateLightbox(index){

      const total=
        galleryItems.length;


      currentGalleryIndex=
        (
          index
          +
          total
        )
        %
        total;


      const item=
        galleryItems[
          currentGalleryIndex
        ];


      if(lightboxImage){

        lightboxImage.src=
          `/assets/${item.src}`;

        lightboxImage.alt=
          item.alt;

      }


      if(lightboxCounter){

        lightboxCounter.textContent=
          `${currentGalleryIndex+1} / ${total}`;

      }

    }


    function openLightbox(index){

      updateLightbox(index);


      previousBodyOverflow=
        document.body.style.overflow;


      document.body.style.overflow=
        'hidden';


      lightbox.classList.add(
        'open'
      );


      lightboxClose?.focus();

    }


    function closeLightbox(){

      lightbox.classList.remove(
        'open'
      );


      document.body.style.overflow=
        previousBodyOverflow;


      setTimeout(()=>{

        if(lightboxImage){
          lightboxImage.src='';
        }

      },250);

    }


    function previousImage(){

      updateLightbox(
        currentGalleryIndex-1
      );

    }


    function nextImage(){

      updateLightbox(
        currentGalleryIndex+1
      );

    }


    $(
      '.yazi-lightbox-close',
      lightbox
    )
      ?.addEventListener(
        'click',
        closeLightbox
      );


    lightboxPrev
      ?.addEventListener(
        'click',
        e=>{

          e.stopPropagation();

          previousImage();

        }
      );


    lightboxNext
      ?.addEventListener(
        'click',
        e=>{

          e.stopPropagation();

          nextImage();

        }
      );


    lightbox.addEventListener(
      'click',
      e=>{

        if(e.target===lightbox){
          closeLightbox();
        }

      }
    );


    $$('.yazi-gallery-card',gallery)
      .forEach(card=>{

        const index=
          Number(
            card.dataset.galleryIndex
          );


        card.addEventListener(
          'click',
          ()=>{

            openLightbox(index);

          }
        );


        card.addEventListener(
          'keydown',
          e=>{

            if(
              e.key==='Enter'
              ||
              e.key===' '
            ){

              e.preventDefault();

              openLightbox(index);

            }

          }
        );

      });


    document.addEventListener(
      'keydown',
      e=>{

        if(
          !lightbox.classList.contains(
            'open'
          )
        ){
          return;
        }


        if(e.key==='Escape'){

          closeLightbox();

        }


        if(e.key==='ArrowLeft'){

          previousImage();

        }


        if(e.key==='ArrowRight'){

          nextImage();

        }

      }
    );


    /* =====================================================
       MOBILE SWIPE
       ===================================================== */

    let touchStartX=0;
    let touchEndX=0;


    lightbox.addEventListener(
      'touchstart',
      e=>{

        touchStartX=
          e.changedTouches[0]
            .screenX;

      },
      {
        passive:true
      }
    );


    lightbox.addEventListener(
      'touchend',
      e=>{

        touchEndX=
          e.changedTouches[0]
            .screenX;


        const distance=
          touchEndX
          -
          touchStartX;


        if(
          Math.abs(distance)
          <
          50
        ){
          return;
        }


        if(distance>0){

          previousImage();

        }else{

          nextImage();

        }

      },
      {
        passive:true
      }
    );

  }


  /* =========================================================
     CHAT WIDGET
     ========================================================= */

  const chatToggle=
    $('#chatToggle');

  const chatPanel=
    $('#chatPanel');

  const chatClose=
    $('#chatClose');


  const setChat=open=>{

    if(!chatPanel){
      return;
    }


    chatPanel.hidden=
      !open;


    chatToggle
      ?.setAttribute(
        'aria-expanded',
        String(open)
      );

  };


  chatToggle
    ?.addEventListener(
      'click',
      ()=>{

        setChat(
          chatPanel?.hidden
        );

      }
    );


  chatClose
    ?.addEventListener(
      'click',
      ()=>{

        setChat(false);

      }
    );


  document.addEventListener(
    'keydown',
    e=>{

      if(e.key==='Escape'){
        setChat(false);
      }

    }
  );


})();
