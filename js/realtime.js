/* =========================================================
   REALTIME.JS — subscribe to Supabase changes and re-render
   public pages live. Skipped on admin pages.
   ========================================================= */
function hoopInitRealtime(){
  if(!hoopSB || !hoopSB.channel) return;
  if(document.body.classList.contains('admin-page')) return;

  hoopSB
    .channel('hoop_data_public')
    .on('postgres_changes',
        { event: '*', schema: 'public', table: 'hoop_data' },
        (payload) => {
          if(!payload || !payload.new || !payload.new.payload) return;
          const p = payload.new.payload;
          if(!Array.isArray(p.competitions)) return;

          // Refresh the in-memory cache so any hoopRenderAll() call
          // reads the fresh data
          if(typeof HoopData !== 'undefined' && HoopData._updateCache){
            HoopData._updateCache(p);
          }

          // Re-render everything on the page
          if(typeof hoopRenderAll === 'function') hoopRenderAll();
          if(typeof hoopRenderWatch === 'function') hoopRenderWatch();

          // Optional: tiny visual cue so viewers know something updated
          const ind = document.getElementById('liveIndicator');
          if(ind){
            ind.style.opacity = '1';
            setTimeout(()=>{ ind.style.opacity = '0'; }, 800);
          }
        })
    .subscribe();
}