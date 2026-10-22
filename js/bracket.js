/* =========================================================
   BRACKET.JS — single-elimination bracket for any team count
   Storage shape (data.bracket), or null until an admin creates one:
     {
       size: N,                 // teams in the bracket (2 or more)
       seeds: [teamId x N],     // seed 1..N by array position
       results: { '<round>-<match>': {scoreA,scoreB,status,court,note} }
     }
   The bracket is padded up to the next power of two; top seeds get
   byes (they skip round 1). Who plays whom in every later round is
   DERIVED from seeds + results each time computeRounds() runs, never
   stored, so it can't drift out of sync.
   ========================================================= */
const HOOP_BRACKET_MIN = 2;
const HOOP_BRACKET_MAX = 64;

const HoopBracket = {
  emptyResult(){
    return {scoreA:0, scoreB:0, status:'upcoming', court:'', note:''};
  },

  /* Ranks teams by record (wins-losses, then wins) — same rule as the standings table. */
  rankTeams(teams){
    return [...teams].sort((a,b)=> (b.wins-b.losses) - (a.wins-a.losses) || b.wins-a.wins);
  },

  bracketSize(n){
    let p = 2;
    while(p < n) p *= 2;
    return p;
  },

  /* Standard seeding order for a bracket of size p, e.g. 8 -> [1,8,4,5,2,7,3,6]. */
  seedOrder(p){
    let order = [1,2];
    while(order.length < p){
      const n = order.length * 2;
      const next = [];
      order.forEach(s=>{ next.push(s, n + 1 - s); });
      order = next;
    }
    return order;
  },

  /* Builds a fresh bracket (wipes any recorded results) from an ordered list of team ids (seed 1 first). */
  buildFromOrderedIds(orderedIds){
    const ids = orderedIds.filter(Boolean);
    return {size: ids.length, seeds: ids, results: {}};
  },

  /* Top N teams by record. */
  createFromStandings(teams, count){
    const n = Math.max(HOOP_BRACKET_MIN, Math.min(count, teams.length, HOOP_BRACKET_MAX));
    return this.buildFromOrderedIds(this.rankTeams(teams).slice(0, n).map(t=>t.id));
  },

  /* A hand-picked set of team ids; seeding among them is still by record. */
  createFromSelection(teams, selectedIds){
    const chosen = teams.filter(t=>selectedIds.includes(t.id));
    return this.buildFromOrderedIds(this.rankTeams(chosen).map(t=>t.id));
  },

  exists(bracket){
    return !!(bracket && Array.isArray(bracket.seeds) && bracket.seeds.length >= HOOP_BRACKET_MIN);
  },

  /* Every registered team NOT in the bracket. */
  nonQualifiers(teams, bracket){
    const seeded = new Set((bracket.seeds || []).filter(Boolean));
    return this.rankTeams(teams).filter(t=>!seeded.has(t.id));
  },

  /* Winner's team id, or '' if undecided. A bye match is won by whoever is present. */
  winnerOf(match){
    if(!match) return '';
    if(match.bye) return match.teamA || match.teamB || '';
    if(match.status!=='final') return '';
    if(!match.teamA || !match.teamB) return '';
    if(match.scoreA === match.scoreB) return '';
    return match.scoreA > match.scoreB ? match.teamA : match.teamB;
  },

  roundName(roundIndex, totalRounds){
    const fromEnd = totalRounds - 1 - roundIndex;
    if(fromEnd === 0) return 'Grand Final';
    if(fromEnd === 1) return 'Semifinals';
    if(fromEnd === 2) return 'Quarterfinals';
    return 'Round of ' + Math.pow(2, fromEnd + 1);
  },

  /* Returns [{name, matches:[{key,teamA,teamB,seedA,seedB,bye,scoreA,scoreB,status,court,note}]}]. */
  computeRounds(bracket){
    const seeds = bracket.seeds || [];
    const n = seeds.length;
    const p = this.bracketSize(n);
    const totalRounds = Math.log2(p);
    const order = this.seedOrder(p);
    const seedOf = teamId => { const i = seeds.indexOf(teamId); return i>-1 ? i+1 : null; };
    const resultFor = key => Object.assign(this.emptyResult(), (bracket.results||{})[key] || {});

    const rounds = [];
    let prev = null;
    for(let r=0; r<totalRounds; r++){
      const matchCount = p / Math.pow(2, r+1);
      const matches = [];
      for(let i=0; i<matchCount; i++){
        const key = r + '-' + i;
        let teamA, teamB, seedA, seedB;
        if(r === 0){
          seedA = order[2*i]; seedB = order[2*i+1];
          teamA = seedA <= n ? seeds[seedA-1] : '';
          teamB = seedB <= n ? seeds[seedB-1] : '';
        } else {
          teamA = this.winnerOf(prev[2*i]);
          teamB = this.winnerOf(prev[2*i+1]);
          seedA = seedOf(teamA); seedB = seedOf(teamB);
        }
        const bye = (r === 0) && (!teamA || !teamB);
        matches.push(Object.assign({key, teamA, teamB, seedA, seedB, bye}, resultFor(key)));
      }
      rounds.push({name: this.roundName(r, totalRounds), matches});
      prev = matches;
    }
    return rounds;
  }
};
