(async()=>{
const $=id=>document.getElementById(id),id=new URLSearchParams(location.search).get('id');
const fail=m=>{$('loading').hidden=true;$('errorBox').hidden=false;$('errorBox').textContent=m};
if(!id){fail('Đường link chưa có mã thư mời.');return}
const root=new URL('.',location.href).href;
try{
 const response=await fetch(root+'data/invitations/'+encodeURIComponent(id)+'.json');
 if(!response.ok)throw Error('Không tìm thấy thư mời. Hãy kiểm tra lại đường link hoặc thử lại sau vài phút.');
 const data=await response.json(),asset=p=>new URL(p,root).href;
 $('introTitle').textContent=data.title||'Trân trọng kính mời';$('introSubtitle').textContent=data.subtitle||'Sự hiện diện của Quý khách là niềm vinh hạnh của chúng tôi.';
 const pages=[];
 if(data.pdf){
  pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const doc=await pdfjsLib.getDocument(asset(data.pdf)).promise;
  for(let n=1;n<=doc.numPages;n++){const page=await doc.getPage(n),scale=Math.min(2,1200/page.getViewport({scale:1}).width),vp=page.getViewport({scale}),canvas=document.createElement('canvas');canvas.width=Math.ceil(vp.width);canvas.height=Math.ceil(vp.height);await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;const node=document.createElement('div');node.className='page';node.appendChild(canvas);pages.push(node)}
 }else{
  for(const p of data.pages||[]){const node=document.createElement('div');node.className='page';const img=document.createElement('img');img.src=asset(p);img.alt='Nội dung thư mời';node.appendChild(img);pages.push(node)}
 }
 if(!pages.length)throw Error('Thư mời chưa có trang nội dung.');
 if(data.music){$('backgroundMusic').src=asset(data.music);$('soundToggle').hidden=false;$('soundToggle').onclick=()=>{const a=$('backgroundMusic');if(a.paused){a.play().then(()=>$('soundToggle').innerHTML='♫ <span>TẮT NHẠC</span>').catch(()=>{})}else{a.pause();$('soundToggle').innerHTML='♫ <span>BẬT NHẠC</span>'}}}
 $('loading').hidden=true;$('intro').hidden=false;
 $('openInvitation').onclick=()=>{
  $('intro').hidden=true;$('reader').hidden=false;
  if(data.music)$('backgroundMusic').play().then(()=>$('soundToggle').innerHTML='♫ <span>TẮT NHẠC</span>').catch(()=>{});
  const width=Math.max(260,Math.min(520,Math.floor(window.innerWidth*.43))),height=Math.max(360,Math.min(720,Math.floor(window.innerHeight*.72)));
  const flip=new St.PageFlip($('book'),{width,height,size:'stretch',minWidth:260,maxWidth:650,minHeight:360,maxHeight:900,showCover:false,drawShadow:true,flippingTime:850,usePortrait:true,autoSize:true});
  flip.loadFromHTML(pages);
  const refresh=()=>{$('pageCount').textContent=(flip.getCurrentPageIndex()+1)+' / '+flip.getPageCount()};
  flip.on('flip',refresh);refresh();$('previous').onclick=()=>flip.flipPrev();$('next').onclick=()=>flip.flipNext();
  $('fullscreen').onclick=()=>{if(!document.fullscreenElement)$('reader').requestFullscreen?.();else document.exitFullscreen?.()};
  window.addEventListener('resize',()=>flip.update());
 };
}catch(e){fail(e.message||'Không thể mở thư mời.')}
})();