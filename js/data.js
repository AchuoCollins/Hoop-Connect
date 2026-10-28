/* =========================================================
   DATA.JS — Supabase-backed data store
   Requires: @supabase/supabase-js + js/config.js loaded first.
   ========================================================= */
const HOOP_STORAGE_KEY = 'hoopconnect_data_v1';
const HOOP_ACTIVE_COMP_KEY = 'hoopconnect_active_comp';

const { createClient } = supabase;
const hoopSB = createClient(HOOP_SUPABASE_URL, HOOP_SUPABASE_ANON_KEY);

const HOOP_DEFAULT_SITE = {
  title: 'Hoop Connect',
  tagline: 'The home for grassroots basketball competitions',
  heroTitle: 'Every Court. Every Competition.',
  heroSubtitle: "Hoop Connect is where local basketball competitions get a home online — live scores, brackets, news and clips, all in one place. Pick a competition below to follow along.",

  /* Footer: ONE phone number, +237 + 9 digits */
  footerPhone: '+237 6XX XXX XXX',

  /* Used on the Contact page */
  contactEmail: 'media@hoopconnect.cm',
  contactLocation: 'Buea, Cameroon',

  socialTikTok: '#',
  socialInstagram: '#',
  metaDescription: 'Hoop Connect is the home for grassroots basketball competitions — live scores, brackets, news and clips, all in one place.',
  primaryColor: '#0a1f44',
  accentColor: '#ff7a3d',

  /* Editable page intros */
  aboutIntro: "Hoop Connect is a home for grassroots basketball competitions to run their season online — live scores as they happen, a real bracket, team rosters, news write-ups, and courtside clips, without needing their own website built from scratch.",
  aboutHowItWorks: "An organizer manages their competition's teams, schedule, live scores and bracket from one dashboard. As games are played, the site updates — standings recalculate, bracket winners advance, and the live ticker reflects what's happening on court.",
  aboutBehindIt: "Hoop Connect started as a way to give the Molyko Basketball Challenge a proper live-scores presence, and grew into a platform other local competitions can use too. If you run a tournament and want it featured here, get in touch.",
  donateIntro: "Hoop Connect is built to keep grassroots basketball visible — live scores, brackets and highlights for competitions that wouldn't otherwise have a website. If that's worth supporting, here's how.",
  contactIntro: "Questions about a specific competition — scores, teams, schedule — are best sent to that competition directly. For anything about Hoop Connect itself, the platform, or getting a competition featured, reach us here."
};

const HOOP_DEFAULT_MBC = {
  id: 'mbc',
  name: 'Molyko Basketball Challenge',
  season: 'Season 03',
  tagline: "Buea's home-grown basketball tournament",
  description: "Buea's home-grown basketball tournament — men's and women's divisions, live scores, a full bracket, and courtside clips.",
  coverImg: 'images/mbc-cover.jpeg',
  active: true,
  socials: { tiktok:'', instagram:'', x:'', youtube:'', facebook:'' },
  teams: [
    {id:'MK', name:'Molyko Kings',     color:'#0a1f44', wins:0, losses:0, city:'Molyko', logo:'', players:[]},
    {id:'CH', name:'Campus Heat',      color:'#1e6bff', wins:0, losses:0, city:'Molyko', logo:'', players:[]},
    {id:'BB', name:'Buea Ballers',     color:'#dc2626', wins:0, losses:0, city:'Buea', logo:'', players:[]},
    {id:'VU', name:'Vets United',      color:'#7c3aed', wins:0, losses:0, city:'Molyko', logo:'', players:[]},
    {id:'RF', name:'Rookies FC',       color:'#ea580c', wins:0, losses:0, city:'Molyko', logo:'', players:[]},
    {id:'LL', name:'Limbe Lions',      color:'#059669', wins:0, losses:0, city:'Limbe', logo:'', players:[]},
    {id:'M4', name:'Mile 4 Mavs',      color:'#db2777', wins:0, losses:0, city:'Mile 4', logo:'', players:[]},
    {id:'DB', name:'Down Beach Dawgs', color:'#475569', wins:0, losses:0, city:'Down Beach', logo:'', players:[]},
    {id:'SB', name:'Soppo Ballers',    color:'#b91c1c', wins:0, losses:0, city:'Soppo', logo:'', players:[]},
    {id:'BC', name:'Bonduma Crew',     color:'#0891b2', wins:0, losses:0, city:'Bonduma', logo:'', players:[]}
  ],
  games: [],
  news: [
    {id:'n1', cat:'recaps', featured:true, kicker:'MBC Recap · Semifinals',
     title:'From 18 Down to Overtime: The Comeback That Shook Molyko',
     body:'Down by 18 at the half, Buea Ballers flipped the script with a 32–10 third quarter — capped by a buzzer-beater from captain Enow "The Engine" Tanyi. A semifinal for the history books.',
     img:'https://image.qwenlm.ai/public_source/4e63b6e8-d362-4f85-8178-95d0826c425e/1d9dee80a-a304-4484-9a6b-feae973b7c93.png',
     dur:'2:12', views:12400, likes:842, dislikes:24, comments:128},
    {id:'n2', cat:'highlights', kicker:'Molyko Kings · #23',
     title:'Ankle-Breaker in the Paint — The Move of the Night',
     img:'https://image.qwenlm.ai/public_source/4e63b6e8-d362-4f85-8178-95d0826c425e/1f247a209-331a-4ddf-9f2d-7139f1dab4e6.png',
     dur:'0:42', views:8200, likes:612, dislikes:15, comments:44},
    {id:'n3', cat:'recaps', kicker:'Semifinal · Court A',
     title:'Swish City: Top 10 Shots from Last Night',
     img:'https://image.qwenlm.ai/public_source/4e63b6e8-d362-4f85-8178-95d0826c425e/16a1d25d9-5a57-4d55-a879-a4d8b108404a.png',
     dur:'1:18', views:15700, likes:1100, dislikes:31, comments:92},
    {id:'n4', cat:'team', kicker:'Rookies FC · Feature',
     title:'From the Streets of Molyko to the Semifinals',
     img:'https://image.qwenlm.ai/public_source/4e63b6e8-d362-4f85-8178-95d0826c425e/1ee07f4a1-a13c-465f-9de9-6ba3cd95ca65.png',
     dur:'2:04', views:5400, likes:388, dislikes:9, comments:27},
    {id:'n5', cat:'highlights', kicker:'Campus Heat · #7',
     title:'Posterized: The Dunk That Silenced the Crowd',
     img:'https://image.qwenlm.ai/public_source/4e63b6e8-d362-4f85-8178-95d0826c425e/17eaac1f9-52b7-4ee3-a281-89bdeb92f383.png',
     dur:'0:58', views:22100, likes:2300, dislikes:41, comments:176},
    {id:'n6', cat:'team', kicker:'Vets United · Sideline',
     title:"Coach's Corner: Why Vets United Trust the Grind",
     img:'https://image.qwenlm.ai/public_source/4e63b6e8-d362-4f85-8178-95d0826c425e/1a800d45e-9587-449f-a7e9-7be280fcbf82.png',
     dur:'1:36', views:4100, likes:240, dislikes:6, comments:19}
  ],
  clips: [
    {id:'c1', size:'tall', cap:'The Flight — #23 Takes Off', views:48200, likes:3100, dislikes:45, comments:210, img:'https://image.qwenlm.ai/public_source/4e63b6e8-d362-4f85-8178-95d0826c425e/13c55563c-e3eb-4923-9e0a-cbe829b34841.png', sourceUrl:''},
    {id:'c2', size:'',     cap:'Nothing But Net', views:12800, likes:940, dislikes:18, comments:62, img:'https://image.qwenlm.ai/public_source/4e63b6e8-d362-4f85-8178-95d0826c425e/16a1d25d9-5a57-4d55-a879-a4d8b108404a.png', sourceUrl:''},
    {id:'c3', size:'',     cap:'Crossover > Bucket', views:22100, likes:1650, dislikes:22, comments:88, img:'https://image.qwenlm.ai/public_source/4e63b6e8-d362-4f85-8178-95d0826c425e/17eaac1f9-52b7-4ee3-a281-89bdeb92f383.png', sourceUrl:''},
    {id:'c4', size:'',     cap:'Handle Check', views:9400, likes:710, dislikes:12, comments:38, img:'https://image.qwenlm.ai/public_source/4e63b6e8-d362-4f85-8178-95d0826c425e/1f247a209-331a-4ddf-9f2d-7139f1dab4e6.png', sourceUrl:''},
    {id:'c5', size:'wide', cap:'Molyko at Golden Hour', views:31600, likes:2400, dislikes:33, comments:145, img:'https://image.qwenlm.ai/public_source/4e63b6e8-d362-4f85-8178-95d0826c425e/1ee07f4a1-a13c-465f-9de9-6ba3cd95ca65.png', sourceUrl:''},
    {id:'c6', size:'',     cap:'Team Energy', views:18900, likes:1420, dislikes:21, comments:96, img:'https://image.qwenlm.ai/public_source/4e63b6e8-d362-4f85-8178-95d0826c425e/1d9dee80a-a304-4484-9a6b-feae973b7c93.png', sourceUrl:''},
    {id:'c7', size:'',     cap:'One Team. One Dream.', views:7200, likes:520, dislikes:8, comments:29, img:'https://image.qwenlm.ai/public_source/4e63b6e8-d362-4f85-8178-95d0826c425e/129dc4dce-ebba-4514-86ff-4ab5e097f9be.png', sourceUrl:''},
    {id:'c8', size:'',     cap:"Coach's Corner", views:5800, likes:410, dislikes:7, comments:24, img:'https://image.qwenlm.ai/public_source/4e63b6e8-d362-4f85-8178-95d0826c425e/1a800d45e-9587-449f-a7e9-7be280fcbf82.png', sourceUrl:''},
    {id:'c9', size:'',     cap:'The Prize Awaits', views:41300, likes:2900, dislikes:38, comments:190, img:'https://image.qwenlm.ai/public_source/4e63b6e8-d362-4f85-8178-95d0826c425e/141447302-14bb-4a0a-8e74-9f417d1b9689.png', sourceUrl:''}
  ],
  bracket: null,
  watch: {title:'', url:'', tiktokUrl:'', live:false, description:''}
};

const HOOP_DEFAULTS = {
  site: HOOP_DEFAULT_SITE,
  competitions: [HOOP_DEFAULT_MBC]
};

/* Cache so we can serve sync reads after an async fetch completes. */
let hoopCache = null;
let hoopReadyPromise = null;

async function hoopFetchRemote(){
  try{
    const { data, error } = await hoopSB
      .from('hoop_data')
      .select('payload')
      .eq('id', 'singleton')
      .maybeSingle();
    if(error){ console.error('[HoopData] fetch:', error); return null; }
    if(!data || !data.payload || !Array.isArray(data.payload.competitions)) return null;
    return {
      site: Object.assign({}, HOOP_DEFAULT_SITE, data.payload.site || {}),
      competitions: data.payload.competitions
    };
  }catch(e){
    console.error('[HoopData] fetch exception:', e);
    return null;
  }
}

const HoopData = {
  /* Call this once on page load, then load() returns the data synchronously. */
  ready(){
    if(hoopReadyPromise) return hoopReadyPromise;
    hoopReadyPromise = (async ()=>{
      const remote = await hoopFetchRemote();
      hoopCache = remote || JSON.parse(JSON.stringify(HOOP_DEFAULTS));
      return hoopCache;
    })();
    return hoopReadyPromise;
  },

  /* Synchronous. Before ready() completes, returns defaults. */
  load(){
    if(!hoopCache) this.ready();
    return hoopCache || JSON.parse(JSON.stringify(HOOP_DEFAULTS));
  },

  /* Async. Writes to Supabase + updates the local cache. */
  async save(payload){
    hoopCache = payload;
    try{
      const { error } = await hoopSB
        .from('hoop_data')
        .upsert({ id:'singleton', payload, updated_at:new Date().toISOString() }, { onConflict:'id' });
      if(error){ console.error('[HoopData] save:', error); return false; }
      return true;
    }catch(e){
      console.error('[HoopData] save exception:', e);
      return false;
    }
  },

  /* Called by realtime when a new payload arrives from Supabase.
     Updates the cache without a network request so the next load()
     returns fresh data. */
  _updateCache(payload){
    if(!payload || !Array.isArray(payload.competitions)) return;
    hoopCache = {
      site: Object.assign({}, HOOP_DEFAULT_SITE, payload.site || {}),
      competitions: payload.competitions
    };
  },

  async resetToDefaults(){
    const fresh = JSON.parse(JSON.stringify(HOOP_DEFAULTS));
    return this.save(fresh);
  },

  getCompetition(data, id){
    if(!data || !Array.isArray(data.competitions)) return null;
    if(!id) return data.competitions[0] || null;
    return data.competitions.find(c=>c.id===id) || null;
  },

  activeCompetitionId(){
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('id');
    if(fromUrl) return fromUrl;
    try{
      const stored = localStorage.getItem(HOOP_ACTIVE_COMP_KEY);
      if(stored) return stored;
    }catch(e){}
    return null;
  },

  setActiveCompetitionId(id){
    try{ localStorage.setItem(HOOP_ACTIVE_COMP_KEY, id); }catch(e){}
  },

  activeCompetition(data){
    const id = this.activeCompetitionId();
    const comp = this.getCompetition(data, id);
    if(comp) return comp;
    const firstActive = (data.competitions || []).find(c=>c.active) || (data.competitions||[])[0];
    return firstActive || null;
  },

  teamById(teams, id){
    return (teams||[]).find(t=>t.id===id) || {id:id, name:id, color:'#6b7280', wins:0, losses:0};
  },

  uid(prefix){
    return prefix + '_' + Date.now().toString(36) + Math.floor(Math.random()*1000).toString(36);
  }
};

/* Image upload helper for admin. */
async function hoopUploadImage(file, prefix){
  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  const path = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
  const { error } = await hoopSB.storage.from('media').upload(path, file, { upsert:false });
  if(error) throw error;
  const { data } = hoopSB.storage.from('media').getPublicUrl(path);
  return data.publicUrl;
}