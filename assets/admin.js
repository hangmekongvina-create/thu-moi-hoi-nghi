(()=> {
const $=id=>document.getElementById(id);
const cfg=()=>({owner:$('owner').value.trim(),repo:$('repo').value.trim(),branch:$('branch').value.trim()||'main',token:$('token').value.trim()});
const msg=(id,s,ok=true)=>{const e=$(id);e.textContent=s;e.style.color=ok?'#16845c':'#b42318'};
const api=async(path,options={})=>{const c=cfg();return fetch(`https://api.github.com/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}/contents/${path}`,{...options,headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+c.token,'X-GitHub-Api-Version':'2022-11-28',...(options.headers||{})}})};
async function check(){const c=cfg();if(!c.owner||!c.repo||!c.token)throw Error('Nhập GitHub username, repository và token.');const r=await fetch(`https://api.github.com/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}`,{headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+c.token}});if(!r.ok)throw Error('Không truy cập được repository. Kiểm tra username, tên repo và token.');const d=await r.json();if(d.private)throw Error('Repository đang ở chế độ Private. Hãy chuyển sang Public để dùng GitHub Pages miễn phí.');return 'Kết nối thành công: '+d.full_name};
const slug=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const fileB64=f=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.onerror=()=>reject(Error('Không đọc được file '+f.name));r.readAsDataURL(f)});
async function put(path,content,message){let sha;const old=await api(path);if(old.ok){const d=await old.json();sha=d.sha}const body={message,content,branch:cfg().branch};if(sha)body.sha=sha;const r=await api(path,{method:'PUT',body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw Error(d.message||'GitHub từ chối upload '+path);return d}
async function upload(path,f){if(f.size>18*1024*1024)throw Error('File '+f.name+' lớn hơn 18 MB. Hãy nén file trước khi upload.');return put(path,await fileB64(f),'Add invitation asset: '+path)}
$('testConnection').onclick=async()=>{msg('connectStatus','Đang kiểm tra…');try{msg('connectStatus',await check())}catch(e){msg('connectStatus',e.message,false)}};
$('eventTitle').addEventListener('input',()=>{if(!$('eventId').dataset.manual)$('eventId').value=slug($('eventTitle').value)});
$('eventId').addEventListener('input',()=>{$('eventId').dataset.manual='1';$('eventId').value=slug($('eventId').value)});
$('publish').onclick=async()=>{
 const b=$('publish');b.disabled=true;$('publishedResult').hidden=true;msg('publishStatus','Đang chuẩn bị xuất bản…');
 try{
  await check();
  const title=$('eventTitle').value.trim(),id=slug($('eventId').value||title),pdf=$('pdf').files[0],images=[...$('pages').files],cover=$('cover').files[0],music=$('music').files[0];
  if(!title||!id)throw Error('Vui lòng nhập tên sự kiện và mã thư mời.');
  if(!pdf&&!images.length)throw Error('Hãy chọn PDF hoặc ít nhất một ảnh trang.');
  if(pdf&&images.length)msg('publishStatus','Bạn đã chọn cả PDF và ảnh: hệ thống sẽ lưu cả hai, khách xem PDF trước.');
  const dir='invitations/'+id+'/',data={id,title,subtitle:$('subtitle').value.trim(),cover:null,pdf:null,pages:[],music:null,updatedAt:new Date().toISOString()};
  if(cover){const ext=cover.name.split('.').pop().toLowerCase();data.cover=dir+'cover.'+ext;await upload(data.cover,cover)}
  if(pdf){data.pdf=dir+'invitation.pdf';await upload(data.pdf,pdf)}
  if(images.length){for(let i=0;i<images.length;i++){const f=images[i],ext=f.name.split('.').pop().toLowerCase(),path=dir+'page-'+String(i+1).padStart(2,'0')+'.'+ext;await upload(path,f);data.pages.push(path)}}
  if(music){data.music=dir+'background.mp3';await upload(data.music,music)}
  await put('data/invitations/'+id+'.json',btoa(unescape(encodeURIComponent(JSON.stringify(data,null,2)))),'Publish invitation '+id);
  const base=location.href.slice(0,location.href.lastIndexOf('/')+1),url=base+'invite.html?id='+encodeURIComponent(id);
  $('publishedResult').hidden=false;$('publishedResult').innerHTML='<strong>Đã gửi dữ liệu lên GitHub.</strong><p><a target="_blank" rel="noopener" href="'+url+'">'+url+'</a></p><button id="copyInvitationLink" class="btn btn-secondary">SAO CHÉP ĐƯỜNG LINK</button>';
  $('copyInvitationLink').onclick=async()=>{await navigator.clipboard.writeText(url);msg('publishStatus','Đã sao chép link.')};
  msg('publishStatus','Xuất bản thành công. GitHub Pages có thể cần 1–5 phút để cập nhật.');
 }catch(e){msg('publishStatus',e.message,false)}finally{b.disabled=false}
};
})();