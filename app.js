(() => {
 'use strict';
 const videos=[...document.querySelectorAll('.video')],players=new Map();let apiPromise;
 const status=(box,message)=>{box.querySelector('.video-status').textContent=message;};
 function loadAPI(){
  if(window.YT?.Player)return Promise.resolve();
  if(apiPromise)return apiPromise;
  apiPromise=new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(new Error('timeout')),15000);
   window.onYouTubeIframeAPIReady=()=>{clearTimeout(timer);resolve();};
   const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';
   script.onerror=()=>{clearTimeout(timer);reject(new Error('network'));};
   document.head.appendChild(script);
  }).catch(error=>{apiPromise=undefined;throw error;});
  return apiPromise;
 }
 function stillCurrent(entry){return players.get(entry.id)===entry&&entry.iframe.isConnected;}
 function visibleInDeck(box){return !deck||box.closest('.page').classList.contains('current');}
 function renderCover(box,index){
  const screen=box.querySelector('.video-screen');
  const button=document.createElement('button');button.type='button';button.className='video-cover';
  button.setAttribute('aria-label',`Phát ${box.dataset.title}`);
  const thumbnail=document.createElement('img');thumbnail.alt='';thumbnail.loading='lazy';
  thumbnail.src=`https://i.ytimg.com/vi/${box.dataset.video}/hqdefault.jpg`;
  thumbnail.addEventListener('error',()=>{thumbnail.style.visibility='hidden';});
  const play=document.createElement('span');play.className='play-symbol';play.setAttribute('aria-hidden','true');play.textContent='▶';
  button.append(thumbnail,play);screen.replaceChildren(button);status(box,'');
  button.addEventListener('click',()=>openVideo(box,index));
 }
 function pauseEntry(entry){
  if(entry.player?.pauseVideo){try{entry.player.pauseVideo();return;}catch{}}
  players.delete(entry.id);entry.iframe.remove();renderCover(entry.box,entry.index);
 }
 function openVideo(box,index){
  if(location.protocol==='file:'){
   status(box,'YouTube cần địa chỉ trang web để phát nhúng. Mở bản GitHub Pages hoặc chọn “Mở YouTube”.');return;
  }
  for(const entry of [...players.values()])pauseEntry(entry);
  const id=box.dataset.video,iframe=document.createElement('iframe');
  iframe.id=`youtube-player-${index}`;
  iframe.title=`YouTube: ${box.dataset.title}`;
  iframe.width='640';iframe.height='360';iframe.allowFullscreen=true;
  iframe.referrerPolicy='strict-origin-when-cross-origin';
  iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
  const params=new URLSearchParams({enablejsapi:'1',autoplay:'1',playsinline:'1',rel:'0',origin:location.origin});
  iframe.src=`https://www.youtube-nocookie.com/embed/${id}?${params}`;
  const entry={id,index,box,iframe,player:null};players.set(id,entry);
  box.querySelector('.video-screen').replaceChildren(iframe);
  status(box,'Nếu video chưa chạy, bấm Play trong khung.');
  loadAPI().then(()=>{
   if(!stillCurrent(entry))return;
   entry.player=new YT.Player(iframe,{
    events:{
     onReady:event=>{
      if(!stillCurrent(entry))return;
      if(visibleInDeck(box))event.target.playVideo();else event.target.pauseVideo();
     },
     onStateChange:event=>{
      if(!stillCurrent(entry))return;
      box.dataset.playerState=String(event.data);
      if(event.data===YT.PlayerState.PLAYING){
       if(!visibleInDeck(box)){event.target.pauseVideo();return;}
       status(box,'');
       for(const other of [...players.values()])if(other!==entry)pauseEntry(other);
      }
     },
     onAutoplayBlocked:()=>{if(stillCurrent(entry))status(box,'Bấm Play trong khung YouTube để bắt đầu.');},
     onError:event=>{
      if(!stillCurrent(entry))return;
      const messages={
       153:'YouTube chưa nhận được địa chỉ trang nhúng. Hãy mở link GitHub Pages trong Chrome/Edge/Safari, hoặc chọn “Mở YouTube”.',
       101:'Chủ video không cho phát nhúng. Chọn “Mở YouTube” để xem.',
       150:'Chủ video không cho phát nhúng. Chọn “Mở YouTube” để xem.',
       100:'Video đã bị gỡ hoặc chuyển sang riêng tư. Chọn “Mở YouTube” để kiểm tra.',
       5:'Trình duyệt chưa phát được video này. Thử tải lại trang hoặc chọn “Mở YouTube”.'
      };
      status(box,`Lỗi ${event.data}: ${messages[event.data]||'Chọn “Mở YouTube” để xem video.'}`);
     }
    }
   });
  }).catch(()=>{
   if(stillCurrent(entry))status(box,'Bấm Play trong khung. Nếu video bị chặn, chọn “Mở YouTube”.');
  });
 }
 videos.forEach((box,index)=>{
  box.innerHTML=`<div class="video-screen"></div><div class="video-bar"><span>${box.dataset.channel}</span><a href="https://www.youtube.com/watch?v=${box.dataset.video}" target="_blank" rel="noopener">Mở YouTube ↗</a></div><p class="video-status" role="status"></p>`;
  renderCover(box,index);
 });
 const pages=[...document.querySelectorAll('.page')],controls=document.getElementById('deck-controls'),present=document.getElementById('present');let slide=0,deck=false;
 function stopPlayers(){for(const entry of [...players.values()])pauseEntry(entry);}
 function show(n){slide=Math.max(0,Math.min(pages.length-1,n));pages.forEach((p,i)=>p.classList.toggle('current',i===slide));document.getElementById('page-number').textContent=`${String(slide+1).padStart(2,'0')} / ${String(pages.length).padStart(2,'0')}`;document.getElementById('prev').disabled=slide===0;document.getElementById('next').disabled=slide===pages.length-1;history.replaceState(null,'',`#${pages[slide].id}`);stopPlayers();window.scrollTo({top:0,behavior:'instant'});}
 function enter(){deck=true;document.body.classList.add('deck');controls.hidden=false;present.textContent='Đang trình chiếu';const index=pages.findIndex(p=>p.id===location.hash.slice(1));show(index<0?0:index);}
 function leave(){deck=false;document.body.classList.remove('deck');controls.hidden=true;present.textContent='Trình chiếu';pages[slide].scrollIntoView({behavior:'instant'});}
 present.addEventListener('click',()=>deck?leave():enter());document.getElementById('exit').addEventListener('click',leave);document.getElementById('prev').addEventListener('click',()=>show(slide-1));document.getElementById('next').addEventListener('click',()=>show(slide+1));
 document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{if(!deck)return;const idx=pages.findIndex(p=>`#${p.id}`===a.getAttribute('href'));if(idx>=0){e.preventDefault();show(idx);}}));
 document.addEventListener('keydown',e=>{if(!deck||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();show(slide+1);}if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();show(slide-1);}if(e.key==='Escape')leave();});
 if(location.protocol==='file:')document.getElementById('local-help').hidden=false;
})();
