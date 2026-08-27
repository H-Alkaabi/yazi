(()=>{
  'use strict';
  const dialog=document.querySelector('.lightbox');
  const image=dialog?.querySelector('img');
  const caption=dialog?.querySelector('figcaption');
  const items=[...document.querySelectorAll('.portfolio-item')];
  let current=0;

  const show=index=>{
    current=(index+items.length)%items.length;
    const source=items[current].querySelector('img');
    image.src=source.src;
    image.alt=source.alt;
    caption.textContent=`${current+1} / ${items.length}`;
  };
  const open=index=>{show(index);dialog.showModal()};
  items.forEach((item,index)=>item.addEventListener('click',()=>open(index)));
  dialog?.querySelector('.lightbox-close').addEventListener('click',()=>dialog.close());
  dialog?.querySelector('.lightbox-prev').addEventListener('click',()=>show(current-1));
  dialog?.querySelector('.lightbox-next').addEventListener('click',()=>show(current+1));
  dialog?.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
  addEventListener('keydown',event=>{
    if(!dialog?.open)return;
    if(event.key==='ArrowRight')show(current-1);
    if(event.key==='ArrowLeft')show(current+1);
  });
})();
