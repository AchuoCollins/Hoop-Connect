/* =========================================================
   EMBED.JS — resolves a pasted social-media link to a preview
   thumbnail, without needing a backend.
   - YouTube: direct thumbnail URL pattern, no network request.
   - Everything else: noembed.com, a free public oEmbed proxy
     that works over CORS for many platforms (Vimeo, TikTok,
     SoundCloud, etc). Instagram/Facebook block oEmbed without
     an authenticated app, so those will fail here — the admin
     UI tells the user to upload an image instead in that case.
   ========================================================= */
const HoopEmbed = {
  extractYouTubeId(url){
    const patterns = [
      /youtu\.be\/([\w-]{11})/,
      /youtube\.com\/watch\?v=([\w-]{11})/,
      /youtube\.com\/shorts\/([\w-]{11})/,
      /youtube\.com\/embed\/([\w-]{11})/,
      /youtube\.com\/live\/([\w-]{11})/
    ];
    for(const re of patterns){
      const m = url.match(re);
      if(m) return m[1];
    }
    return null;
  },

  /* Recorded TikTok video -> numeric id (TikTok lives/profiles can't be embedded). */
  extractTikTokVideoId(url){
    const m = (url||'').match(/tiktok\.com\/@[^\/]+\/video\/(\d+)/);
    return m ? m[1] : null;
  },

  /* TikTok video link -> its cover image. Tries to save a permanent copy (TikTok's own
     image links expire after a few days); persisted=false means only the temporary link was kept. */
  async resolveTikTokThumbnail(url){
    url = (url||'').trim();
    let host;
    try{ host = new URL(url).hostname; }
    catch(e){ throw new Error("That doesn't look like a valid URL."); }
    if(!/(^|\.)tiktok\.com$/.test(host)) throw new Error('Only TikTok links are supported for videos.');
    let res;
    try{ res = await fetch('https://noembed.com/embed?url=' + encodeURIComponent(url)); }
    catch(e){ throw new Error("Couldn't reach the preview service \u2014 check your connection, or upload a cover image."); }
    if(!res.ok) throw new Error("Couldn't fetch a preview for that link \u2014 upload a cover image instead.");
    const json = await res.json();
    if(json.error || !json.thumbnail_url) throw new Error('TikTok returned no preview for that link \u2014 upload a cover image instead.');
    let dataUrl = '';
    try{
      const blob = await (await fetch(json.thumbnail_url)).blob();
      dataUrl = await new Promise((ok, fail)=>{ const fr = new FileReader(); fr.onload = ()=>ok(fr.result); fr.onerror = fail; fr.readAsDataURL(blob); });
    }catch(e){ dataUrl = ''; }
    return {thumbnail: dataUrl || json.thumbnail_url, sourceUrl: url, persisted: !!dataUrl};
  },

  async resolveThumbnail(url){
    url = (url||'').trim();
    if(!url) throw new Error('Paste a link first.');
    try{ new URL(url); }
    catch(e){ throw new Error("That doesn't look like a valid URL."); }

    const ytId = this.extractYouTubeId(url);
    if(ytId){
      return {thumbnail: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`, sourceUrl: url};
    }

    let res;
    try{
      res = await fetch('https://noembed.com/embed?url=' + encodeURIComponent(url));
    }catch(e){
      throw new Error("Couldn't reach the preview service — check your connection.");
    }
    if(!res.ok) throw new Error("Couldn't fetch a preview for that link.");
    const json = await res.json();
    if(json.error) throw new Error("This platform doesn't support link previews here — try uploading an image instead.");
    if(!json.thumbnail_url) throw new Error('No preview image was found for that link.');
    return {thumbnail: json.thumbnail_url, sourceUrl: url};
  }
};
