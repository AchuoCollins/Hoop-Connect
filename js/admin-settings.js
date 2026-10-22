/* =========================================================
   ADMIN-SETTINGS.JS — Site settings panel
   ========================================================= */
(function(){
  const form = document.getElementById('settingsForm');
  if(!form) return;

  const FIELDS = {
    setTitle: 'title',
    setTagline: 'tagline',
    setPrimaryColor: 'primaryColor',
    setAccentColor: 'accentColor',
    setHeroTitle: 'heroTitle',
    setHeroSubtitle: 'heroSubtitle',
    setEmail: 'contactEmail',
    setPhone: 'contactPhone',
    setLocation: 'contactLocation',
    setTikTok: 'socialTikTok',
    setInstagram: 'socialInstagram',
    setMeta: 'metaDescription'
  };

  function load(){
    const d = HoopData.load();
    const s = d.site || {};
    Object.keys(FIELDS).forEach(elId=>{
      const el = document.getElementById(elId);
      if(el) el.value = s[FIELDS[elId]] || '';
    });
    if(!document.getElementById('setPrimaryColor').value) document.getElementById('setPrimaryColor').value = '#0a1f44';
    if(!document.getElementById('setAccentColor').value) document.getElementById('setAccentColor').value = '#ff7a3d';
  }

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const d = HoopData.load();
    d.site = d.site || {};
    Object.keys(FIELDS).forEach(elId=>{
      const el = document.getElementById(elId);
      if(el) d.site[FIELDS[elId]] = el.value.trim();
    });
    if(HoopData.save(d)){
      if(typeof toast === 'function') toast('Site settings saved — refresh public pages to see changes');
      else alert('Site settings saved');
    } else {
      alert("Couldn't save — storage might be full.");
    }
  });

  document.getElementById('settingsReset').addEventListener('click', ()=>{
    if(!confirm('Reset all site settings to defaults?')) return;
    const d = HoopData.load();
    d.site = {
      title: 'Hoop Connect',
      tagline: 'The home for grassroots basketball competitions',
      heroTitle: 'Every Court. Every Competition.',
      heroSubtitle: "Hoop Connect is where local basketball competitions get a home online — live scores, brackets, news and clips, all in one place. Pick a competition below to follow along.",
      contactEmail: 'media@hoopconnect.cm',
      contactPhone: '+237 6XX XXX XXX',
      contactLocation: 'Buea, Cameroon',
      socialTikTok: '#',
      socialInstagram: '#',
      metaDescription: 'Hoop Connect is the home for grassroots basketball competitions — live scores, brackets, news and clips, all in one place.',
      primaryColor: '#0a1f44',
      accentColor: '#ff7a3d'
    };
    if(HoopData.save(d)){
      load();
      if(typeof toast === 'function') toast('Settings reset');
    }
  });

  load();
})();