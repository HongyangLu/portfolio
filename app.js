document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('cancel',event=>{event.preventDefault();event.stopImmediatePropagation();},true));
const dialogs = document.querySelectorAll('dialog');
document.querySelectorAll('[data-open]').forEach(button => {
  button.addEventListener('click', () => {
    const dialog = document.getElementById(button.dataset.open);
    if (dialog.id === 'tongue-atlas' || dialog.classList.contains('other-project')) {
      document.querySelectorAll('#work .book-project').forEach(panel => panel.hidden = panel !== dialog);
      const info = dialog.querySelector('.book-information');
      if (info) info.scrollTop = 0;
      dialog.hidden = false;
      document.getElementById('work').classList.add('show-book');
      return;
    }
    const frame = dialog.querySelector('iframe');
    if (frame && !frame.src) frame.src = frame.dataset.src;
    dialog.showModal();
    const projectScroll = dialog.querySelector('.project-detail-scroll');
    if (projectScroll) projectScroll.scrollTop = 0;
  });
});
dialogs.forEach(dialog => {
  dialog.querySelector('.close').addEventListener('click', () => dialog.id === 'contact' ? closeContact() : dialog.close());

});
function updateClock() {
  const now = new Date();
  document.getElementById('year').textContent = now.getFullYear();
  document.getElementById('clock').textContent = new Intl.DateTimeFormat('en-GB', {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(now);
  document.getElementById('clock').dateTime = now.toISOString();
}
updateClock();
setInterval(updateClock, 30000);

const music = document.getElementById('bgm');
const soundControl = document.querySelector('.sound-control');
const soundToggle = document.getElementById('sound-toggle');
const soundPanel = document.getElementById('sound-panel');
const volume = document.getElementById('music-volume');
music.volume = .35;
let musicContext, musicGain, musicSource, musicLoading;
let musicPlaying = false;
let musicHasStarted = false;
music.addEventListener('playing', () => { musicHasStarted = true; });
let musicStartedAt = 0;
let musicUserVolume = music.volume;
let videoDucking = false;
const playingProjectFilms = new Set();
let musicFadeFrame = 0;
let musicFadeTarget = music.volume;
function syncMusic() {
  const target = musicUserVolume * ((videoDucking || playingProjectFilms.size) ? .15 : 1);
  soundControl.classList.toggle('is-playing', (musicPlaying || !music.paused) && musicUserVolume > 0);
  // Volume events emitted by the fade must not restart it.
  if (Math.abs(target - musicFadeTarget) < .00001) return;
  musicFadeTarget = target;
  cancelAnimationFrame(musicFadeFrame);
  const from = music.volume;
  const duration = target < from ? 1000 : 1800;
  const started = performance.now();
  if (musicGain) musicGain.gain.cancelScheduledValues(musicContext.currentTime);
  function fade(now) {
    const progress = Math.min(1, (now - started) / duration);
    const eased = progress * progress * (3 - 2 * progress);
    const value = from + (target - from) * eased;
    music.volume = value;
    if (musicGain) musicGain.gain.setValueAtTime(value, musicContext.currentTime);
    musicFadeFrame = progress < 1 ? requestAnimationFrame(fade) : 0;
  }
  musicFadeFrame = requestAnimationFrame(fade);
}
async function startMusic() {
  try { await music.play(); } catch {}
  syncMusic();
}
['play', 'pause', 'volumechange'].forEach(event => music.addEventListener(event, syncMusic));
soundToggle.addEventListener('click', () => {
  soundPanel.hidden = !soundPanel.hidden;
  soundToggle.setAttribute('aria-expanded', String(!soundPanel.hidden));
  if (!musicHasStarted && music.paused) startMusic();
});
volume.addEventListener('input', () => {
  musicUserVolume = Number(volume.value) / 100;
  syncMusic();
  document.getElementById('volume-value').textContent = `${volume.value}%`;
  if (!musicHasStarted && music.paused) startMusic();
});
document.addEventListener('click', event => {
  if (!soundControl.contains(event.target)) {
    soundPanel.hidden = true;
    soundToggle.setAttribute('aria-expanded', 'false');
    if (!musicHasStarted && music.paused) startMusic();
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !soundPanel.hidden) {
    soundPanel.hidden = true;
    soundToggle.setAttribute('aria-expanded', 'false');
    soundToggle.focus();
  }
});
startMusic();

const contactDialog = document.getElementById('contact');
const holoStage = contactDialog.querySelector('.holo-stage');
const holoTilt = contactDialog.querySelector('.holo-tilt');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let contactCloseTimer;
function resetTilt() {
  holoTilt.style.setProperty('--tilt-x', '0deg');
  holoTilt.style.setProperty('--tilt-y', '0deg');
}
function closeContact() {
  if (!contactDialog.open || contactDialog.classList.contains('is-closing')) return;
  resetCardDrag();
  contactDialog.classList.add('is-closing');
  resetTilt();
  contactCloseTimer = setTimeout(() => contactDialog.close(), reducedMotion.matches ? 0 : 240);
}
holoStage.addEventListener('pointermove', event => {
  if (reducedMotion.matches || event.pointerType === 'touch' || contactDialog.classList.contains('is-closing')) return;
  const box = holoStage.getBoundingClientRect();
  const x = Math.max(-1, Math.min(1, (event.clientX - box.left) / box.width * 2 - 1));
  const y = Math.max(-1, Math.min(1, (event.clientY - box.top) / box.height * 2 - 1));
  holoTilt.style.setProperty('--tilt-x', `${-y * 6}deg`);
  holoTilt.style.setProperty('--tilt-y', `${x * 6}deg`);
});
holoStage.addEventListener('pointerleave', resetTilt);

contactDialog.addEventListener('cancel', event => {
  event.preventDefault();
  closeContact();
});
contactDialog.addEventListener('close', () => {
  clearTimeout(contactCloseTimer);
  contactDialog.classList.remove('is-closing');
  resetTilt();
});
const envelope = contactDialog.querySelector('.envelope-stage');
let envelopeAnimating = false;
function toggleEnvelope() {
  if (envelopeAnimating || contactDialog.classList.contains('is-closing')) return;
  resetCardDrag();
  const open = !envelope.classList.contains('is-open');
  envelope.classList.remove('just-extracted');
  envelopeAnimating = !reducedMotion.matches;
  envelope.classList.toggle('is-returning', !open && envelopeAnimating);
  envelope.classList.toggle('is-open', open);
  envelope.setAttribute('aria-expanded', String(open));
  envelope.setAttribute('aria-label', open ? '点击收回名片' : '点击抽出名片');
}
envelope.addEventListener('click', toggleEnvelope);
envelope.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    toggleEnvelope();
  }
});
envelope.addEventListener('animationend', event => {
  if (event.animationName === 'photo-letter-out') {
    envelopeAnimating = false;
    envelope.classList.add('just-extracted');

  } else if (event.animationName === 'photo-letter-in') {
    envelopeAnimating = false;
    envelope.classList.remove('is-returning');
  } else if (event.animationName === 'extracted-flicker') {
    envelope.classList.remove('just-extracted');
  }
});
contactDialog.addEventListener('close', () => {
  envelopeAnimating = false;
  envelope.classList.remove('is-open', 'is-returning', 'just-extracted');
  envelope.setAttribute('aria-expanded', 'false');
  envelope.setAttribute('aria-label', '点击抽出名片');
});


// Drag the extracted card independently of the envelope animation.
const draggableCard = contactDialog.querySelector('.letter-card');
let cardDrag = null;
let cardOffset = {x:0,y:0};
let returnAlignment;
let suppressCardClick = false;
function resetCardDrag() {
  if (returnAlignment) { returnAlignment.cancel(); returnAlignment = null; }
  if (cardDrag && draggableCard.hasPointerCapture(cardDrag.id)) draggableCard.releasePointerCapture(cardDrag.id);
  cardDrag = null;
  cardOffset = {x:0,y:0};
  draggableCard.style.translate = '0px 0px';
  draggableCard.classList.remove('is-dragging');
}
draggableCard.addEventListener('pointerdown', event => {
  if (event.button !== 0 || !envelope.classList.contains('is-open') || envelopeAnimating || contactDialog.classList.contains('is-closing')) return;
  event.preventDefault();
  event.stopPropagation();
  const box = draggableCard.getBoundingClientRect();
  cardDrag = {id:event.pointerId,x:event.clientX,y:event.clientY,ox:cardOffset.x,oy:cardOffset.y,box};
  draggableCard.setPointerCapture(event.pointerId);
  draggableCard.classList.add('is-dragging');
});
draggableCard.addEventListener('pointermove', event => {
  if (!cardDrag || event.pointerId !== cardDrag.id) return;
  event.stopPropagation();
  const dx = Math.max(12-cardDrag.box.left,Math.min(innerWidth-12-cardDrag.box.right,event.clientX-cardDrag.x));
  const dy = Math.max(12-cardDrag.box.top,Math.min(innerHeight-12-cardDrag.box.bottom,event.clientY-cardDrag.y));
  cardOffset = {x:cardDrag.ox+dx,y:cardDrag.oy+dy};
  draggableCard.style.translate = cardOffset.x+'px '+cardOffset.y+'px';
});
function endCardDrag(event) {
  if (!cardDrag || event.pointerId !== cardDrag.id) return;
  const moved = Math.hypot(event.clientX-cardDrag.x,event.clientY-cardDrag.y) > 5;
  const cardBox = draggableCard.getBoundingClientRect();
  const envelopeBox = envelope.getBoundingClientRect();
  const nearMouth = Math.abs(cardBox.left+cardBox.width/2-(envelopeBox.left+envelopeBox.width/2)) < envelopeBox.width*.36
    && Math.abs(cardBox.top+cardBox.height/2-(envelopeBox.top+envelopeBox.height*.59)) < envelopeBox.height*.2;
  cardDrag = null;
  draggableCard.classList.remove('is-dragging');
  if (draggableCard.hasPointerCapture(event.pointerId)) draggableCard.releasePointerCapture(event.pointerId);
  if (event.type === 'pointerup' && moved && nearMouth) {
    const from = cardOffset.x+'px '+cardOffset.y+'px';
    suppressCardClick = true;
    toggleEnvelope();
    if (!reducedMotion.matches) returnAlignment = draggableCard.animate(
      [{translate:from},{translate:'0px 0px'}],
      {duration:560,easing:'cubic-bezier(.22,.75,.24,1)'}
    );
  }
}
['pointerup','pointercancel','lostpointercapture'].forEach(type => draggableCard.addEventListener(type,endCardDrag));
draggableCard.addEventListener('click', event => {
  if (suppressCardClick || envelope.classList.contains('is-open') || envelopeAnimating) event.stopPropagation();
  suppressCardClick = false;
});
contactDialog.addEventListener('close',resetCardDrag);

const lab = document.getElementById('experiments');
const labViewer = lab.querySelector('.lab-viewer');
lab.querySelectorAll('[data-lab-image]').forEach(screen => screen.addEventListener('click', () => {
  labViewer.querySelector('img').src = screen.dataset.labImage;
  labViewer.hidden = false;
  labViewer.querySelector('button').focus();
}));
lab.querySelector('.lab-back').addEventListener('click', () => { labViewer.hidden = true; });
lab.addEventListener('close', () => { labViewer.hidden = true; });
lab.addEventListener('cancel', event => { if (!labViewer.hidden) { event.preventDefault(); labViewer.hidden = true; } });

lab.querySelectorAll('[data-lab-section]').forEach(button=>button.addEventListener('click',()=>{
 const value=button.dataset.labSection;
 lab.querySelectorAll('[data-lab-panel]').forEach(panel=>panel.hidden=panel.dataset.labPanel!==value);
 lab.querySelectorAll('[data-lab-section]').forEach(item=>{const active=item===button;item.classList.toggle('is-selected',active);if(active)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current');});
 lab.querySelector('.lab-content').scrollTop=0;
}));

document.querySelector('.desktop').inert = false;
// Shared media controls preserve the layout and each gallery position.
(()=>{
 const detail=document.getElementById('tongue-atlas'),gallery=detail.querySelector('.book-gallery');
 const tracks={book:gallery.querySelector('.book-track'),physical:gallery.querySelector('.physical-track')};
 const film=gallery.querySelector('.film-panel'),video=film.querySelector('video');
 const prev=gallery.querySelector('.book-prev'),next=gallery.querySelector('.book-next'),counter=gallery.querySelector('.book-counter');
 const tabs=gallery.querySelectorAll('[data-media]');let mode='book';
 function update(){const t=tracks[mode];if(!t){counter.textContent='FILM';prev.disabled=next.disabled=true;return;}const i=Math.round(t.scrollLeft/Math.max(1,t.clientWidth));counter.textContent=String(i+1).padStart(2,'0')+' / '+String(t.children.length).padStart(2,'0');prev.disabled=i===0;next.disabled=i>=t.children.length-1;}
 function go(n){const t=tracks[mode];if(t)t.scrollTo({left:Math.max(0,Math.min(t.children.length-1,n))*t.clientWidth,behavior:reducedMotion.matches?'instant':'smooth'});}
 function change(value){video.pause();mode=value;Object.entries(tracks).forEach(([key,t])=>t.hidden=key!==mode);film.hidden=mode!=='film';tabs.forEach(b=>b.setAttribute('aria-selected',String(b.dataset.media===mode)));update();}
 tabs.forEach(b=>b.addEventListener('click',()=>change(b.dataset.media)));
 Object.values(tracks).forEach(t=>{let drag=null;t.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.button!==0)return;drag={x:e.clientX,left:t.scrollLeft};t.classList.add('is-dragging');t.setPointerCapture(e.pointerId);});t.addEventListener('pointermove',e=>{if(drag)t.scrollLeft=drag.left+drag.x-e.clientX;});function release(){if(!drag)return;drag=null;t.classList.remove('is-dragging');go(Math.round(t.scrollLeft/t.clientWidth));}t.addEventListener('pointerup',release);t.addEventListener('pointercancel',release);t.addEventListener('scroll',update,{passive:true});t.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();go(Math.round(t.scrollLeft/t.clientWidth)+(e.key==='ArrowRight'?1:-1));}});});
 prev.addEventListener('click',()=>{const t=tracks[mode];if(t)go(Math.round(t.scrollLeft/t.clientWidth)-1);});next.addEventListener('click',()=>{const t=tracks[mode];if(t)go(Math.round(t.scrollLeft/t.clientWidth)+1);});
 document.querySelector('[data-open="tongue-atlas"]').addEventListener('click',()=>{change('book');tracks.book.scrollLeft=0;detail.querySelector('.book-information').scrollTop=0;update();});
 new MutationObserver(()=>{if(detail.hidden)video.pause();}).observe(detail,{attributes:true,attributeFilter:['hidden']});
 document.getElementById('work').addEventListener('close',()=>video.pause());
})();

const workWindow = document.getElementById('work');
const bookDetail = document.getElementById('tongue-atlas');
function returnToWork(){workWindow.querySelectorAll('.book-project').forEach(panel=>panel.hidden=true);workWindow.classList.remove('show-book');}
bookDetail.querySelector('.close').addEventListener('click',returnToWork);
workWindow.addEventListener('close',returnToWork);
workWindow.addEventListener('cancel',event=>{if(workWindow.classList.contains('show-book')){event.preventDefault();returnToWork();}});
// Select projects from the sidebar without leaving Selected Work.
(()=>{
 const work=document.getElementById('work');
 const buttons=work.querySelectorAll('.work-nav-item');
 function select(value){
  buttons.forEach(b=>{const active=b.dataset.project===value;b.classList.toggle('is-selected',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  work.querySelectorAll('.project').forEach(p=>p.classList.remove('nav-highlight'));
 }
 buttons.forEach(button=>button.addEventListener('click',()=>{
  const value=button.dataset.project;select(value);
  if(value==='4'){work.querySelector('[data-open="tongue-atlas"]').click();return;}
  returnToWork();select(value);
  const scroller=work.querySelector('.work-scroll');
  if(value==='all'){scroller.scrollTop=0;return;}
  work.querySelector('[data-open="project-'+value+'"]').click();
 }));
 work.querySelector('[data-open="tongue-atlas"]').addEventListener('click',()=>select('4'));
 bookDetail.querySelector('.close').addEventListener('click',()=>select('all'));
 work.addEventListener('close',()=>select('all'));
 work.addEventListener('cancel',()=>{if(bookDetail.hidden)select('all');});
})();

// Keep the user's BGM setting while lowering it during the film.
const projectFilm = document.querySelector('.film-panel video');
if (projectFilm) {
 const updateDucking = () => { videoDucking = !projectFilm.paused && !projectFilm.ended && !projectFilm.error; syncMusic(); };
 ['play', 'pause', 'ended', 'emptied', 'error'].forEach(event => projectFilm.addEventListener(event, updateDucking));
}

(()=>{const documents={"script":{"title":"Shaped Emotion / 剧本","first":1,"pages":["assets/lab-docs/script/page-1.webp","assets/lab-docs/script/page-2.webp","assets/lab-docs/script/page-3.webp","assets/lab-docs/script/page-4.webp","assets/lab-docs/script/page-5.webp","assets/lab-docs/script/page-6.webp"]},"initial":{"title":"Shaped Emotion / 初版分镜","first":1,"pages":["assets/lab-docs/initial/page-1.webp","assets/lab-docs/initial/page-2.webp","assets/lab-docs/initial/page-3.webp","assets/lab-docs/initial/page-4.webp","assets/lab-docs/initial/page-5.webp","assets/lab-docs/initial/page-6.webp","assets/lab-docs/initial/page-7.webp"]},"revised":{"title":"Shaped Emotion / 后期修订分镜","first":7,"pages":["assets/lab-docs/revised/page-07.webp","assets/lab-docs/revised/page-08.webp","assets/lab-docs/revised/page-09.webp","assets/lab-docs/revised/page-10.webp","assets/lab-docs/revised/page-11.webp","assets/lab-docs/revised/page-12.webp","assets/lab-docs/revised/page-13.webp","assets/lab-docs/revised/page-14.webp","assets/lab-docs/revised/page-15.webp","assets/lab-docs/revised/page-16.webp","assets/lab-docs/revised/page-17.webp"]},"intimacy-script":{"title":"Intimacy Error-Free / 剧本","first":1,"pages":["assets/intimacy-docs/script/page-1.webp","assets/intimacy-docs/script/page-2.webp","assets/intimacy-docs/script/page-3.webp","assets/intimacy-docs/script/page-4.webp","assets/intimacy-docs/script/page-5.webp","assets/intimacy-docs/script/page-6.webp","assets/intimacy-docs/script/page-7.webp","assets/intimacy-docs/script/page-8.webp"]},"intimacy-storyboard":{"title":"Intimacy Error-Free / 分镜故事板","first":1,"pages":["assets/intimacy-docs/storyboard/page-01.webp","assets/intimacy-docs/storyboard/page-02.webp","assets/intimacy-docs/storyboard/page-03.webp","assets/intimacy-docs/storyboard/page-04.webp","assets/intimacy-docs/storyboard/page-05.webp","assets/intimacy-docs/storyboard/page-06.webp","assets/intimacy-docs/storyboard/page-07.webp","assets/intimacy-docs/storyboard/page-08.webp","assets/intimacy-docs/storyboard/page-09.webp","assets/intimacy-docs/storyboard/page-10.webp","assets/intimacy-docs/storyboard/page-11.webp","assets/intimacy-docs/storyboard/page-12.webp","assets/intimacy-docs/storyboard/page-13.webp"]}};const lab=document.getElementById('experiments'),reader=lab.querySelector('.lab-document-reader'),pages=reader.querySelector('.lab-document-pages');function closeReader(){reader.hidden=true;}lab.querySelectorAll('[data-lab-document]').forEach(button=>button.addEventListener('click',()=>{const doc=documents[button.dataset.labDocument];reader.querySelector('.lab-document-title').textContent=doc.title;pages.replaceChildren(...doc.pages.map((src,i)=>{const img=document.createElement('img');img.src=src;img.alt=doc.title+' / 原文件第 '+(doc.first+i)+' 页';img.loading=i?'lazy':'eager';return img;}));reader.hidden=false;pages.scrollTop=0;}));reader.querySelector('.lab-document-back').addEventListener('click',closeReader);lab.querySelectorAll('[data-lab-section]').forEach(b=>b.addEventListener('click',closeReader));lab.addEventListener('close',closeReader);lab.addEventListener('cancel',e=>{if(!reader.hidden){e.preventDefault();closeReader();}});})();

workWindow.querySelectorAll('.other-project .project-back').forEach(button=>button.addEventListener('click',()=>{returnToWork();workWindow.querySelectorAll('.work-nav-item').forEach(item=>{const active=item.dataset.project==='all';item.classList.toggle('is-selected',active);if(active)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current');});}));
workWindow.querySelectorAll('.other-project').forEach(panel=>{const trigger=workWindow.querySelector('[data-open="'+panel.id+'"]');trigger.addEventListener('click',()=>workWindow.querySelectorAll('.work-nav-item').forEach(item=>{const active=item.dataset.project===panel.id.replace('project-','');item.classList.toggle('is-selected',active);if(active)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current');}));});

// Native MP4 players: no external player dependency.
(()=>{
 document.querySelectorAll('.other-project').forEach(detail=>{
  const panel=detail.querySelector('.project-video-panel'),track=detail.querySelector('.book-track'),tabs=detail.querySelectorAll('[data-project-media]'),video=panel.querySelector('video');
  function update(){if(!video.paused&&!video.ended&&!video.error&&!detail.hidden&&!panel.hidden)playingProjectFilms.add(detail.id);else playingProjectFilms.delete(detail.id);syncMusic();}
  function stop(){video.pause();update();}
  function select(mode){const film=mode==='video';track.hidden=film;panel.hidden=!film;tabs.forEach(b=>b.setAttribute('aria-selected',String(b.dataset.projectMedia===mode)));if(!film)stop();else {if(video.preload==='none'){video.preload='metadata';video.load();}video.play().catch(()=>{update();});}}
  ['play','pause','ended','emptied','error'].forEach(event=>video.addEventListener(event,update));
  tabs.forEach(b=>b.addEventListener('click',()=>select(b.dataset.projectMedia)));
  new MutationObserver(()=>{if(detail.hidden)stop();else select('video');}).observe(detail,{attributes:true,attributeFilter:['hidden']});document.getElementById('work').addEventListener('close',stop);
 });
})();

// Enlarge videos inside the project window, without browser fullscreen.
document.querySelectorAll('#work video').forEach(video=>{
 const panel=video.parentElement;
 const button=document.createElement('button');button.type='button';button.className='video-window-expand';button.textContent='⛶';button.setAttribute('aria-label','在项目窗口内放大视频');
 const close=document.createElement('button');close.type='button';close.className='video-window-close';close.textContent='×';close.setAttribute('aria-label','退出视频放大');close.hidden=true;
 function collapse(){panel.classList.remove('video-window-expanded');close.hidden=true;button.hidden=false;}
 button.addEventListener('click',()=>{panel.classList.add('video-window-expanded');button.hidden=true;close.hidden=false;});close.addEventListener('click',collapse);
 panel.append(button,close);video.addEventListener('dblclick',e=>{e.preventDefault();e.stopPropagation();});
 const detail=video.closest('.book-project');new MutationObserver(()=>{if(detail.hidden)collapse();}).observe(detail,{attributes:true,attributeFilter:['hidden']});
 document.getElementById('work').addEventListener('close',collapse);
});

// Consistent two-row player controls: volume / expand / more above the timeline.
document.querySelectorAll('#work video').forEach(video=>{
 video.controls=false;const panel=video.parentElement,expand=panel.querySelector('.video-window-expand');
 const controls=document.createElement('div');controls.className='project-player-controls';
 controls.innerHTML='<div class="player-upper"><button class="player-play" aria-label="播放">▶</button><span class="player-time">0:00 / 0:00</span><div class="player-right"><button class="player-volume" aria-label="静音">♪</button><input class="player-volume-slider" type="range" min="0" max="1" step="0.05" value="1" aria-label="视频音量"><button class="player-more" aria-label="更多视频选项" aria-expanded="false">⋮</button></div></div><input class="player-seek" type="range" min="0" max="1000" value="0" aria-label="视频播放进度"><div class="player-menu" hidden><label>播放速度 <select aria-label="播放速度"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label></div>';
 const right=controls.querySelector('.player-right'),more=controls.querySelector('.player-more');right.insertBefore(expand,more);panel.append(controls);
 const play=controls.querySelector('.player-play'),seek=controls.querySelector('.player-seek'),time=controls.querySelector('.player-time'),volume=controls.querySelector('.player-volume'),slider=controls.querySelector('.player-volume-slider'),menu=controls.querySelector('.player-menu');
 const speakerIcon = muted => '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M3 9v6h4l5 4V5L7 9H3z"/>'+(muted?'<path d="m16 9 5 6m0-6-5 6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>':'<path d="M15 8.5a5 5 0 0 1 0 7m3-10a9 9 0 0 1 0 13" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>')+'</svg>';
 volume.innerHTML=speakerIcon(video.muted||video.volume===0);
 const format=s=>{s=Number.isFinite(s)?Math.floor(s):0;return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
 function update(){play.textContent=video.paused?'▶':'Ⅱ';play.setAttribute('aria-label',video.paused?'播放':'暂停');time.textContent=format(video.currentTime)+' / '+format(video.duration);seek.value=video.duration?video.currentTime/video.duration*1000:0;}
 play.addEventListener('click',()=>{if(video.paused)video.play().catch(()=>{});else video.pause();});['play','pause','timeupdate','loadedmetadata','ended'].forEach(e=>video.addEventListener(e,update));
 seek.addEventListener('input',()=>{if(Number.isFinite(video.duration))video.currentTime=Number(seek.value)/1000*video.duration;});volume.addEventListener('click',()=>{video.muted=!video.muted;});slider.addEventListener('input',()=>{video.volume=Number(slider.value);video.muted=false;});video.addEventListener('volumechange',()=>{volume.innerHTML=speakerIcon(video.muted||video.volume===0);volume.setAttribute('aria-label',video.muted?'取消静音':'静音');slider.value=video.muted?0:video.volume;});more.addEventListener('click',()=>{menu.hidden=!menu.hidden;more.setAttribute('aria-expanded',String(!menu.hidden));});controls.querySelector('select').addEventListener('change',e=>{video.playbackRate=Number(e.target.value);menu.hidden=true;more.setAttribute('aria-expanded','false');});update();
});

// Project outcome galleries: drag, keyboard or arrows.
document.querySelectorAll('.other-project').forEach(detail=>{const track=detail.querySelector('.book-track'),counter=detail.querySelector('.book-controls>span'),buttons=detail.querySelectorAll('.outcome-arrows button');let drag=null;function go(n){track.scrollTo({left:Math.max(0,Math.min(track.children.length-1,n))*track.clientWidth,behavior:reducedMotion.matches?'instant':'smooth'});}function index(){return Math.round(track.scrollLeft/Math.max(1,track.clientWidth));}function update(){counter.textContent=String(index()+1).padStart(2,'0')+' / '+String(track.children.length).padStart(2,'0');buttons[0].disabled=index()===0;buttons[1].disabled=index()===track.children.length-1;}buttons.forEach((b,i)=>b.addEventListener('click',()=>go(index()+(i?1:-1))));track.addEventListener('scroll',update,{passive:true});track.tabIndex=0;track.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();go(index()+(e.key==='ArrowRight'?1:-1));}});track.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.button!==0)return;drag={x:e.clientX,left:track.scrollLeft};track.setPointerCapture(e.pointerId);track.classList.add('is-dragging');});track.addEventListener('pointermove',e=>{if(drag)track.scrollLeft=drag.left+drag.x-e.clientX;});function release(){if(!drag)return;drag=null;track.classList.remove('is-dragging');go(index());}track.addEventListener('pointerup',release);track.addEventListener('pointercancel',release);update();});

(()=>{const verses=[["Verse 1","The city wears a violet glow\nI’m heading where the night roads go\nA thousand windows, none like mine\nI draw my own in liquid light\nThey told me, “Wait until you’re sure”\nI leave my shadow at the door\nMy hands still shake, my eyes stay clear\nI take a breath and meet the fear"],["Pre-Chorus","What looked so tall across the room\nIs only standing in my shoes\nI let it speak, then let it fade\nThere’s room for every choice I make"],["Chorus","I wanna meet the unknown\nLet the night unfold\nWith a soft heart, steady hands\nI can learn a different dance\nLet tomorrow change the view\nI’ll make something of it, too\nEvery turn I never planned\nI’ll take its hand, I’ll take its hand"],["Verse 2","The girl I was would love this view\nThe silver streets, the something new\nI keep her wonder close to me\nAnd give her room to disagree\nNo borrowed voice, no perfect skin\nI like the shape I’m growing in\nSome doors stay closed; I walk on by\nThere’s more than one way through the night"],["Pre-Chorus","I used to turn before the edge\nAnd live inside my “not quite yet”\nNow every step into the blue\nMakes room for something I can do"],["Chorus","I wanna meet the unknown\nLet the night unfold\nWith a soft heart, steady hands\nI can learn a different dance\nLet tomorrow change the view\nI’ll make something of it, too\nEvery turn I never planned\nI’ll take its hand, I’ll take its hand"],["Bridge","Hello, fear\nYou look smaller here\nFace to face\nI can give you space\nCome on, fate\nYou can lead a while\nWhen the road bends\nI might like the ride"],["Final Chorus","I wanna meet the unknown\nLet the night unfold\nWith a soft heart, steady hands\nI can learn a different dance\nLet tomorrow change the view\nI’ll make something of it, too\nEvery turn I never planned\nI’ll take its hand, I’ll take its hand"],["Outro","Something strange, something new\nViolet fading into blue\nI take a breath, the windows glow\nThere’s more of me I get to know"]],lines=verses.flatMap(v=>v[1].split('\n'));const bar=document.querySelector('.work-musicbar'),viewport=bar.querySelector('.work-lyric-lines'),full=bar.querySelector('.work-lyrics-full'),play=bar.querySelector('.work-music-play'),slider=bar.querySelector('input');lines.forEach(text=>{const p=document.createElement('p');p.textContent=text;viewport.append(p);});for(const [title,body]of verses){const heading=document.createElement('h4');heading.textContent=title;full.append(heading);body.split('\n').forEach(text=>{const p=document.createElement('p');p.textContent=text;full.append(p);});}let active=-1;function tick(){const length=musicSource?.buffer?.duration||music.duration;const position=musicSource?Math.max(0,musicContext.currentTime-musicStartedAt)%length:music.currentTime;const i=Number.isFinite(length)?Math.min(lines.length-1,Math.floor(position/length*lines.length)):0;if(i!==active){viewport.style.transform='translateY('+(-i*24)+'px)';active=i;}play.textContent=(musicSource?musicContext.state==='running':!music.paused)?'Ⅱ':'▶';slider.value=musicUserVolume*100;}setInterval(tick,250);play.addEventListener('click',()=>{if(musicSource){if(musicContext.state==='running')musicContext.suspend();else musicContext.resume();}else if(!music.paused)music.pause();else startMusic();tick();});slider.addEventListener('input',()=>{musicUserVolume=Number(slider.value)/100;volume.value=slider.value;document.getElementById('volume-value').textContent=slider.value+'%';syncMusic();});const toggle=bar.querySelector('.lyrics-toggle');toggle.addEventListener('click',()=>{full.hidden=!full.hidden;toggle.setAttribute('aria-expanded',String(!full.hidden));});})();

(()=>{
 const bar=document.querySelector('.work-musicbar'),play=bar.querySelector('.work-music-play'),title=bar.querySelector('.work-track-title'),lyric=bar.querySelector('.work-lyric-viewport'),vol=bar.querySelector('.work-music-volume'),toggle=bar.querySelector('.lyrics-toggle');
 const transport=document.createElement('div');transport.className='reference-transport';
 function icon(label,symbol,action){const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',label);b.textContent=symbol;b.addEventListener('click',action);return b;}
 function restart(){if(musicSource){musicStartedAt=musicContext.currentTime;musicSource.stop();musicSource=null;musicPlaying=false;startMusic();}else{music.currentTime=0;}}
 transport.append(icon('随机播放（单曲）','⤨',()=>{}),icon('从头播放','⏮',restart),play,icon('从头播放','⏭',restart),icon('单曲循环','↻',()=>{}));
 const center=document.createElement('div');center.className='reference-now-playing';const cover=document.createElement('img');cover.src='assets/meet-unknown-cover.webp';cover.alt='Meet the Unknown 封面';cover.className='reference-album-cover';
 const progress=document.createElement('div');progress.className='reference-song-progress';progress.innerHTML='<div class="reference-progress-line"><i></i></div><div class="reference-song-times"><span>0:00</span><span>0:00</span></div>';
 center.append(cover,title,progress);bar.prepend(transport,center);const volText=vol.firstChild;if(volText?.nodeType===3)volText.textContent='';vol.prepend(document.createTextNode('◖'));vol.append(document.createTextNode('◗'));toggle.hidden=true;lyric.classList.add('reference-separate-lyric');
 const format=s=>{s=Number.isFinite(s)?Math.floor(s):0;return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};setInterval(()=>{const total=musicSource?.buffer?.duration||music.duration;const current=musicSource?Math.max(0,musicContext.currentTime-musicStartedAt)%total:music.currentTime;progress.querySelector('i').style.width=(Number.isFinite(total)?current/total*100:0)+'%';const times=progress.querySelectorAll('span');times[0].textContent=format(current);times[1].textContent=format(total);},250);
})();

(()=>{
 const bar=document.querySelector('.work-musicbar');const paths=[
 '<path d="M3 6h3c5 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 4-3 6-6s4-6 6-6h3m-4-4 4 4-4 4"/>',
 '<path fill="currentColor" stroke="none" d="M3 12 12 5v14zm9 0 9-7v14z"/>',
 '',
 '<path fill="currentColor" stroke="none" d="m21 12-9-7v14zm-9 0L3 5v14z"/>',
 '<path d="M19 7a7 7 0 0 0-12-2L4 8m0-5v5h5M5 17a7 7 0 0 0 12 2l3-3m0 5v-5h-5"/>'
 ];const svg=body=>'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+body+'</svg>';
 bar.querySelectorAll('.reference-transport button').forEach((b,i)=>{if(i!==2)b.innerHTML=svg(paths[i]);});
 const play=bar.querySelector('.work-music-play');function update(){const playing=musicSource?musicContext.state==='running':!music.paused;play.innerHTML=svg(playing?'<path stroke-width="4" d="M8 4v16M16 4v16"/>':'<path fill="currentColor" stroke="none" d="m6 3 15 9-15 9z"/>');}new MutationObserver(()=>{if(!play.querySelector('svg'))update();}).observe(play,{childList:true});update();
 const vol=bar.querySelector('.work-music-volume');vol.childNodes.forEach(n=>{if(n.nodeType===3)n.textContent='';});const low=document.createElement('span'),high=document.createElement('span');low.innerHTML=svg('<path d="M4 9h4l6-5v16l-6-5H4z"/>');high.innerHTML=svg('<path d="M2 9h4l6-5v16l-6-5H2zM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>');vol.prepend(low);vol.append(high);
})();

// Share the same live music header across every desktop window.
(()=>{
 const original=document.querySelector('#work>.work-musicbar');
 for(const id of ['about','resume','contact','experiments']){
  const dialog=document.getElementById(id),bar=original.cloneNode(true);bar.classList.add('shared-musicbar');bar.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));dialog.querySelector('.titlebar').after(bar);
  const sourceButtons=original.querySelectorAll('.reference-transport button');bar.querySelectorAll('.reference-transport button').forEach((b,i)=>b.addEventListener('click',()=>sourceButtons[i].click()));
  const slider=bar.querySelector('.work-music-volume input'),sourceSlider=original.querySelector('.work-music-volume input');slider.addEventListener('input',()=>{sourceSlider.value=slider.value;sourceSlider.dispatchEvent(new Event('input',{bubbles:true}));});
  setInterval(()=>{bar.querySelector('.work-music-play').innerHTML=original.querySelector('.work-music-play').innerHTML;bar.querySelector('.reference-song-progress').innerHTML=original.querySelector('.reference-song-progress').innerHTML;if(document.activeElement!==slider)slider.value=sourceSlider.value;},250);
 }
 const sidebar=document.querySelector('.lab-sidebar');sidebar.append(document.querySelector('.sidebar-signature').cloneNode(true));sidebar.querySelectorAll('[data-lab-section]').forEach((button,i)=>{const dot=button.querySelector('span');dot.textContent='';dot.className='lab-color-dot';dot.style.background=['#ef827d','#8bc77e','#b28ade'][i];});
})();

// Mobile autoplay may be blocked by low-power mode. Always retain the poster.
(()=>{const bg=document.querySelector('.homepage-background');if(!bg)return;bg.muted=true;bg.defaultMuted=true;function resume(){if(bg.paused)bg.play().catch(()=>{});}document.addEventListener('pointerdown',resume,{passive:true});document.addEventListener('touchstart',resume,{passive:true});document.addEventListener('visibilitychange',()=>{if(!document.hidden)resume();});resume();})();

// Media feedback: never leave a blank viewer while content downloads.
(()=>{
 const watched=new WeakSet();
 function indicator(host){host.classList.add('loading-host');const box=document.createElement('div');box.className='media-loading';box.setAttribute('role','status');box.innerHTML='<span class="ios-spinner" aria-hidden="true">'+Array.from({length:12},(_,i)=>'<i style="--i:'+i+'"></i>').join('')+'</span><span class="loading-message">正在加载…</span><button type="button" hidden>重试</button>';host.append(box);return box;}
 function watchImage(img){if(watched.has(img))return;watched.add(img);let host=img.closest('.book-slide,.lab-card');if(!host){if(!img.closest('.lab-document-pages,.resume-pages,.lab-viewer'))return;host=document.createElement('div');host.className='document-image-host';img.before(host);host.append(img);}const box=indicator(host),message=box.querySelector('.loading-message'),retry=box.querySelector('button');function update(){box.hidden=img.complete&&img.naturalWidth>0;}img.addEventListener('load',update);img.addEventListener('error',()=>{box.hidden=false;box.classList.add('load-failed');message.textContent='图片未能加载';retry.hidden=false;});retry.addEventListener('click',e=>{e.stopPropagation();box.classList.remove('load-failed');message.textContent='正在加载…';retry.hidden=true;const src=img.src;img.removeAttribute('src');img.src=src;});update();}
 function watchVideo(video){if(watched.has(video))return;watched.add(video);const host=video.parentElement,box=indicator(host),message=box.querySelector('.loading-message'),retry=box.querySelector('button');const show=()=>{if(!video.error){box.hidden=false;box.classList.remove('load-failed');message.textContent='正在加载…';retry.hidden=true;}};['loadstart','waiting','stalled'].forEach(e=>video.addEventListener(e,show));['canplay','playing','loadeddata'].forEach(e=>video.addEventListener(e,()=>box.hidden=true));video.addEventListener('error',()=>{box.hidden=false;box.classList.add('load-failed');message.textContent='视频未能加载，请重试';retry.hidden=false;});retry.addEventListener('click',()=>{show();video.load();video.play().catch(()=>{});});box.hidden=video.readyState>=2;}
 function scan(){document.querySelectorAll('dialog img').forEach(watchImage);document.querySelectorAll('#work video').forEach(watchVideo);}
 scan();new MutationObserver(records=>{if(records.some(r=>r.addedNodes.length))scan();}).observe(document.body,{childList:true,subtree:true});
 document.querySelectorAll('.work-track-title').forEach(title=>{const status=document.createElement('small');status.className='music-load-status';status.setAttribute('role','status');title.append(status);function update(){status.textContent=music.error?'音乐加载失败，点击播放重试':!music.paused&&music.readyState<3?'音乐正在加载…':music.paused&&music.readyState<2?'点击播放音乐':'';}['loadstart','waiting','canplay','playing','pause','error'].forEach(e=>music.addEventListener(e,update));update();});
})();
