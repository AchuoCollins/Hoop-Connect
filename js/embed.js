/* =========================================================
   EMBED.JS — resolves a pasted social-media link to a preview
   thumbnail, without needing a backend.
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

  /* Instagram post/reel/tv -> shortcode. Returns '' if it's not a post/reel URL. */
  extractInstagramId(url){
    /* Handles:
         https://www.instagram.com/p/<code>/
         https://www.instagram.com/reel/<code>/
         https://www.instagram.com/tv/<code>/
       and the /reels/ or /share/ variants by ignoring them. */
    const m = (url||'').match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
    return m ? m[1] : '';
  },

  /* True if the URL is a valid Instagram post/reel/tv link. */
  isInstagramUrl(url){
    url = (url||'').trim();
    let host;
    try{ host = new URL(url).hostname; }
    catch(e){ return false; }
    if(!/(^|\.)instagram\.com$/.test(host)) return false;
    return !!this.extractInstagramId(url);
  },

  /* TikTok video link -> its cover image. Tries to save a permanent copy. */
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

  /* Instagram post/reel link -> preview image.
     Instagram's thumbnail URLs are CDN-signed and expire quickly, so we
     save a permanent base64 copy whenever possible. If the fetch fails
     (Instagram sometimes blocks CORS), the admin is told to upload a
     cover image instead. */
  async resolveInstagramThumbnail(url){
    url = (url||'').trim();
    if(!this.isInstagramUrl(url)){
      throw new Error('Paste a valid Instagram post, reel or TV link.');
    }
    let res;
    try{
      res = await fetch('https://noembed.com/embed?url=' + encodeURIComponent(url));
    }catch(e){
      throw new Error("Couldn't reach the preview service \u2014 check your connection, or upload a cover image.");
    }
    if(!res.ok){
      throw new Error("Couldn't fetch a preview for that Instagram link \u2014 upload a cover image instead.");
    }
    const json = await res.json();
    if(json.error || !json.thumbnail_url){
      throw new Error('Instagram returned no preview for that link \u2014 upload a cover image instead.');
    }

    /* Try to persist the CDN image as a data URL so it doesn't expire. */
    let dataUrl = '';
    try{
      const blob = await (await fetch(json.thumbnail_url)).blob();
      dataUrl = await new Promise((ok, fail)=>{ const fr = new FileReader(); fr.onload = ()=>ok(fr.result); fr.onerror = fail; fr.readAsDataURL(blob); });
    }catch(e){ dataUrl = ''; }

    return {thumbnail: dataUrl || json.thumbnail_url, sourceUrl: url, persisted: !!dataUrl};
  },

  /* Unified entry point — dispatches based on the URL's host. */
  async resolveThumbnail(url){
    url = (url||'').trim();
    if(!url) throw new Error('Paste a link first.');
    try{ new URL(url); }
    catch(e){ throw new Error("That doesn't look like a valid URL."); }

    const ytId = this.extractYouTubeId(url);
    if(ytId){
      return {thumbnail: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`, sourceUrl: url};
    }

    if(this.isInstagramUrl(url)){
      return this.resolveInstagramThumbnail(url);
    }

    /* Fallback: noembed works for many platforms */
    let res;
    try{
      res = await fetch('https://noembed.com/embed?url=' + encodeURIComponent(url));
    }catch(e){
      throw new Error("Couldn't reach the preview service \u2014 check your connection.");
    }
    if(!res.ok) throw new Error("Couldn't fetch a preview for that link.");
    const json = await res.json();
    if(json.error) throw new Error("This platform doesn't support link previews here \u2014 try uploading an image instead.");
    if(!json.thumbnail_url) throw new Error('No preview image was found for that link.');
    return {thumbnail: json.thumbnail_url, sourceUrl: url};
  }
};