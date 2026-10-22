/* =========================================================
   ENGAGEMENT.JS — like/dislike interactions for news & clips.
   Reads from the active competition; null-safe.
   ========================================================= */
const HOOP_ENGAGEMENT_KEY = 'hoopconnect_engagement_v1';

const HoopEngagement = {
  load(){
    try{
      const raw = localStorage.getItem(HOOP_ENGAGEMENT_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return {likes: (parsed && parsed.likes) || {}, dislikes: (parsed && parsed.dislikes) || {}};
    }catch(e){
      return {likes:{}, dislikes:{}};
    }
  },
  save(state){
    try{ localStorage.setItem(HOOP_ENGAGEMENT_KEY, JSON.stringify(state)); }catch(e){}
  },
  hasLiked(key){ return !!this.load().likes[key]; },
  hasDisliked(key){ return !!this.load().dislikes[key]; }
};

function hoopFindEngageItem(data, key){
  const sep = key.indexOf(':');
  const type = key.slice(0, sep);
  const id = key.slice(sep+1);
  const comp = HoopData.activeCompetition(data);
  if(!comp) return null;
  const arr = type==='news' ? comp.news : type==='clip' ? comp.clips : null;
  return arr ? (arr.find(x=>x.id===id) || null) : null;
}

document.addEventListener('click', (e)=>{
  const likeBtn = e.target.closest('[data-engage-like]');
  const dislikeBtn = e.target.closest('[data-engage-dislike]');
  if(!likeBtn && !dislikeBtn) return;
  e.preventDefault();
  const isLike = !!likeBtn;
  const key = isLike ? likeBtn.dataset.engageLike : dislikeBtn.dataset.engageDislike;

  const data = HoopData.load();
  const item = hoopFindEngageItem(data, key);
  if(!item) return;
  const state = HoopEngagement.load();
  const likedNow = !!state.likes[key];
  const dislikedNow = !!state.dislikes[key];

  if(isLike){
    if(likedNow){
      item.likes = Math.max(0, (item.likes||0)-1);
      delete state.likes[key];
    } else {
      item.likes = (item.likes||0)+1;
      state.likes[key] = true;
      if(dislikedNow){ item.dislikes = Math.max(0,(item.dislikes||0)-1); delete state.dislikes[key]; }
    }
  } else {
    if(dislikedNow){
      item.dislikes = Math.max(0, (item.dislikes||0)-1);
      delete state.dislikes[key];
    } else {
      item.dislikes = (item.dislikes||0)+1;
      state.dislikes[key] = true;
      if(likedNow){ item.likes = Math.max(0,(item.likes||0)-1); delete state.likes[key]; }
    }
  }

  HoopData.save(data);
  HoopEngagement.save(state);

  document.querySelectorAll('[data-engage-like="'+CSS.escape(key)+'"]').forEach(b=>{
    const span = b.querySelector('span');
    if(span) span.textContent = hoopFormatCount(item.likes);
    if(b.classList) b.classList.toggle('active', !!state.likes[key]);
  });
  document.querySelectorAll('[data-engage-dislike="'+CSS.escape(key)+'"]').forEach(b=>{
    const span = b.querySelector('span');
    if(span) span.textContent = hoopFormatCount(item.dislikes||0);
    if(b.classList) b.classList.toggle('active', !!state.dislikes[key]);
  });
});