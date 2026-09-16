// engine.js - Core Pet simulation engine matching TamaPoke pet.cpp 100%

const PET_TICK_MS = 60000; // 1 real minute = 1 in-game minute
const MINUTES_PER_LEVEL = 60;
const FAREWELL_AGE_MIN = 3 * 24 * 60; // 3 days
const RUNAWAY_TICKS = 60; // 1 hour at all zero

const CER_NONE = 0;
const CER_FAREWELL = 1;
const CER_RUNAWAY = 2;
const CER_RELEASE = 3;

const MED_LV10 = 1 << 0;
const MED_LV25 = 1 << 1;
const MED_LV50 = 1 << 2;
const MED_BERRY = 1 << 3;
const MED_STREAK7 = 1 << 4;
const MED_BOND = 1 << 5;
const MED_FINAL = 1 << 6;
const MED_FIT = 1 << 7;

function clamp100(v) {
  if (v < 0) return 0;
  if (v > 100) return 100;
  return v;
}

function dropTo(v, d, floor) {
  if (v <= floor) return v;
  return (v - floor > d) ? v - d : floor;
}

class PetEngine {
  constructor() {
    this.fullness = 80;
    this.joy = 80;
    this.energy = 80;
    this.hygiene = 100;
    this.poops = 0;
    this.weight = 0;

    this.geneAtk = 100;
    this.geneDef = 100;
    this.geneSpe = 100;
    this.trAtk = 0;
    this.trDef = 0;
    this.trSpe = 0;

    this.berryKnown = false;
    this.shiny = false;
    this.ageMinutes = 0;
    this.speciesId = -1; // -1 = egg
    this.prevSpeciesId = -1;
    this.careMistakes = 0;
    this.mistakeCooldown = 0;
    this.sleeping = false;
    this.lastSeenEpoch = 0;
    this.ceremony = CER_NONE;
    this.lastEnd = CER_NONE;

    this.dexReg = new Set();
    this.dexShinyReg = new Set();

    this.streak = 0;
    this.bestStreak = 0;
    this.lastCareDay = 0;
    this.bond = 0;
    this.nick = "";

    this.medals = 0;
    this.totalMedals = 0;
    this.newMedal = 0;
    this.gameHi = 0;
    this.strHi = 0;

    // Egg state
    this.eggTarget = 1;
    this.eggShiny = false;
    this.eggTaps = 0;
    this.starterPick = true;

    this.eatingUntil = 0;
    this.heartUntil = 0;
    this.evolvingUntil = 0;
    this.goodTicks = 0;
    this.neglectTicks = 0;
    this.lastTickTime = Date.now();
  }

  begin() {
    const data = localStorage.getItem('tamapoke_save');
    if (!data) {
      this.newEgg();
      this.starterPick = true;
    } else {
      this.load(JSON.parse(data));
      this.syncClock();
    }
    this.lastTickTime = Date.now();
  }

  newEgg() {
    this.ceremony = CER_NONE;
    this.neglectTicks = 0;
    this.weight = 0;
    this.speciesId = -1;
    this.prevSpeciesId = -1;
    this.starterPick = (this.registeredCount() === 0);
    this.eggTarget = this.pickEggSpecies();

    let shinyBase = (this.lastEnd === CER_FAREWELL ? 24 : 48) - this.careBonus();
    if (shinyBase < 8) shinyBase = 8;
    this.eggShiny = (Math.floor(Math.random() * shinyBase) === 0);

    this.eggTaps = 0;
    this.fullness = 80;
    this.joy = 80;
    this.energy = 80;
    this.hygiene = 100;
    this.poops = 0;
    this.ageMinutes = 0;
    this.careMistakes = 0;
    this.mistakeCooldown = 0;
    this.sleeping = false;
    this.save();
  }

  isEgg() {
    return this.speciesId === -1;
  }

  level() {
    if (this.isEgg()) return 0;
    let lv = 1 + Math.floor(this.ageMinutes / MINUTES_PER_LEVEL);
    return lv > 100 ? 100 : lv;
  }

  lowestStat() {
    return Math.min(this.fullness, this.joy, this.energy, this.hygiene);
  }

  careBonus() {
    let b = Math.floor(this.bond / 20) + Math.min(5, Math.floor(this.streak / 7));
    return b;
  }

  registeredCount() {
    return this.dexReg.size;
  }

  isRegistered(id) {
    return this.dexReg.has(id);
  }

  pickEggSpecies() {
    if (this.registeredCount() === 0) {
      const starters = [1, 4, 7];
      return starters[Math.floor(Math.random() * starters.length)];
    }

    let tier = R_COMUN;
    if (this.lastEnd !== CER_RUNAWAY) {
      const blessed = (this.lastEnd === CER_FAREWELL);
      const rare = (blessed ? 45 : 27) + this.careBonus();
      const leg = (this.registeredCount() >= 25) ? (blessed ? 10 : 3) + Math.floor(this.careBonus() / 3) : 0;
      const r = Math.floor(Math.random() * 100);
      if (r < leg) tier = R_LEGENDARIO;
      else if (r < leg + rare) tier = R_RARO;
    }

    const candidates = [];
    for (let d = 1; d <= DEX_COUNT; d++) {
      if (DEX_TBL[d].rarity === tier) {
        candidates.push(d);
      }
    }
    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
    return 1;
  }

  chooseStarter(id) {
    this.starterPick = false;
    this.eggTarget = id;
    this.eggShiny = false;
    this.hatch();
  }

  tapEgg() {
    if (!this.isEgg()) return;
    this.eggTaps++;
    sfxPlay(SFX_TAP);
    if (this.eggTaps >= 3 && !this.starterPick) {
      this.hatch();
    }
  }

  hatch() {
    this.speciesId = this.eggTarget;
    this.shiny = this.eggShiny;
    this.geneAtk = 90 + Math.floor(Math.random() * 21);
    this.geneDef = 90 + Math.floor(Math.random() * 21);
    this.geneSpe = 90 + Math.floor(Math.random() * 21);
    this.trAtk = 0;
    this.trDef = 0;
    this.trSpe = 0;
    this.berryKnown = false;
    this.bond = 10;
    this.nick = "";
    this.ageMinutes = 0;

    this.dexReg.add(this.speciesId);
    if (this.shiny) this.dexShinyReg.add(this.speciesId);

    sfxPlay(SFX_HATCH);
    this.save();
  }

  feedBerry(color) {
    if (this.isEgg() || this.sleeping) return;
    this.markCare();
    const fav = (this.speciesId % 3) === color;
    if (fav) {
      this.berryKnown = true;
      this.fullness = clamp100(this.fullness + 35);
      this.joy = clamp100(this.joy + 10);
      this.incBond(2);
      this.heartUntil = Date.now() + 1500;
      sfxPlay(SFX_HEART);
    } else {
      this.fullness = clamp100(this.fullness + 25);
      this.incBond(1);
      sfxPlay(SFX_EAT);
    }
    this.eatingUntil = Date.now() + 2500;
    this.save();
  }

  feedCandy() {
    if (this.isEgg() || this.sleeping) return;
    this.markCare();
    this.fullness = clamp100(this.fullness + 10);
    this.joy = clamp100(this.joy + 12);
    this.weight = clamp100(this.weight + 12);
    this.incBond(1);
    this.eatingUntil = Date.now() + 2500;
    sfxPlay(SFX_EAT);
    this.save();
  }

  cleanBath() {
    if (this.isEgg()) return;
    this.markCare();
    this.poops = 0;
    this.hygiene = 100;
    this.incBond(1);
    sfxPlay(SFX_TAP);
    this.save();
  }

  toggleLight() {
    this.sleeping = !this.sleeping;
    sfxPlay(SFX_TAP);
    this.save();
  }

  petCreature() {
    if (this.isEgg() || this.sleeping) return;
    this.joy = clamp100(this.joy + 5);
    this.incBond(1);
    this.heartUntil = Date.now() + 1500;
    sfxPlay(SFX_HEART);
    this.save();
  }

  incBond(amt) {
    this.bond = clamp100(this.bond + amt);
    this.checkMedals();
  }

  markCare() {
    const today = Math.floor(Date.now() / 86400000);
    if (this.lastCareDay !== today) {
      if (this.lastCareDay === today - 1) {
        this.streak++;
      } else {
        this.streak = 1;
      }
      if (this.streak > this.bestStreak) this.bestStreak = this.streak;
      this.lastCareDay = today;
      this.checkMedals();
    }
  }

  canEvolveNow() {
    if (this.isEgg()) return false;
    const info = DEX_TBL[this.speciesId];
    if (!info || info.evolvesTo === 0 || info.evolveLevel === 0) return false;
    const reqLevel = info.evolveLevel + this.careMistakes;
    return (this.level() >= reqLevel && this.lowestStat() >= 40);
  }

  evolve() {
    if (!this.canEvolveNow()) return;
    const info = DEX_TBL[this.speciesId];
    this.prevSpeciesId = this.speciesId;
    
    // Eevee branching
    if (this.speciesId === DEX_EEVEE) {
      const branch = [134, 135, 136];
      // pick un-registered or random
      const missing = branch.filter(id => !this.dexReg.has(id));
      this.speciesId = missing.length > 0 ? missing[0] : branch[Math.floor(Math.random() * 3)];
    } else {
      this.speciesId = info.evolvesTo;
    }

    this.dexReg.add(this.speciesId);
    if (this.shiny) this.dexShinyReg.add(this.speciesId);
    this.evolvingUntil = Date.now() + 5200;
    this.checkMedals();
    sfxPlay(SFX_EVOLVE);
    this.save();
  }

  canFarewellNow() {
    if (this.isEgg()) return false;
    const info = DEX_TBL[this.speciesId];
    return (info && info.evolvesTo === 0 && this.ageMinutes >= FAREWELL_AGE_MIN);
  }

  farewell() {
    this.ceremony = CER_FAREWELL;
    this.lastEnd = CER_FAREWELL;
    sfxPlay(SFX_BYE);
    this.save();
    setTimeout(() => this.newEgg(), 10000);
  }

  canRunawayNow() {
    return (!this.isEgg() && this.neglectTicks >= RUNAWAY_TICKS);
  }

  runaway() {
    this.ceremony = CER_RUNAWAY;
    this.lastEnd = CER_RUNAWAY;
    sfxPlay(SFX_DENY);
    this.save();
    setTimeout(() => this.newEgg(), 10000);
  }

  release() {
    this.ceremony = CER_RELEASE;
    this.lastEnd = CER_RELEASE;
    sfxPlay(SFX_BYE);
    this.save();
    setTimeout(() => this.newEgg(), 6000);
  }

  checkMedals() {
    if (this.isEgg()) return;
    let m = this.medals;
    const lv = this.level();
    if (lv >= 10) m |= MED_LV10;
    if (lv >= 25) m |= MED_LV25;
    if (lv >= 50) m |= MED_LV50;
    if (this.berryKnown) m |= MED_BERRY;
    if (this.streak >= 7) m |= MED_STREAK7;
    if (this.bond >= 100) m |= MED_BOND;

    const info = DEX_TBL[this.speciesId];
    if (info && info.evolvesTo === 0) m |= MED_FINAL;
    if (this.weight === 0 && this.careMistakes === 0 && lv >= 25) m |= MED_FIT;

    if (m !== this.medals) {
      const newlyEarned = m & (~this.medals);
      this.medals = m;
      this.totalMedals++;
      this.newMedal = newlyEarned;
      sfxPlay(SFX_MEDAL);
      this.save();
    }
  }

  update() {
    const now = Date.now();
    while (now - this.lastTickTime >= PET_TICK_MS) {
      this.lastTickTime += PET_TICK_MS;
      this.tick();
    }
  }

  tick() {
    if (this.ceremony !== CER_NONE || this.starterPick) return;
    this.ageMinutes++;

    if (this.isEgg()) {
      if (this.ageMinutes >= 3) this.hatch();
      this.save();
      return;
    }

    if (this.sleeping) {
      this.energy = clamp100(this.energy + 6);
      if (this.weight > 0 && this.ageMinutes % 3 === 0) this.weight--;
      if (this.ageMinutes % 2 === 0) {
        this.fullness = dropTo(this.fullness, 1, 30);
        this.joy = dropTo(this.joy, 1, 35);
      }
      if (this.ageMinutes % 3 === 0) this.hygiene = dropTo(this.hygiene, 1, 45);
      this.checkMedals();
      this.save();
      return;
    }

    if (this.ageMinutes % MINUTES_PER_LEVEL === 0) {
      sfxPlay(SFX_LEVEL);
    }

    this.fullness = clamp100(this.fullness - 2);
    this.energy = clamp100(this.energy - 1);
    if (this.fullness > 40 && this.poops < 3 && Math.random() < 0.15) {
      this.poops++;
    }

    this.hygiene = clamp100(this.hygiene - 1 - 4 * this.poops);
    if (this.weight > 50) this.energy = clamp100(this.energy - 1);
    if (this.weight > 0 && this.ageMinutes % 3 === 0) this.weight--;

    if (this.lowestStat() >= 40) {
      if (++this.goodTicks >= 720) {
        this.goodTicks = 0;
        if (this.trDef < 100) this.trDef++;
      }
    } else {
      this.goodTicks = 0;
    }

    let dJoy = -1;
    if (this.fullness < 30) dJoy -= 2;
    if (this.hygiene < 30) dJoy -= 2;
    this.joy = clamp100(this.joy + dJoy);

    if (this.mistakeCooldown > 0) this.mistakeCooldown--;
    if (this.lowestStat() <= 10 && this.mistakeCooldown === 0) {
      this.careMistakes++;
      this.mistakeCooldown = 60;
      if (this.bond > 1) this.bond--;
    }

    this.checkMedals();

    if (this.fullness === 0 && this.joy === 0 && this.energy === 0 && this.hygiene === 0) {
      if (this.neglectTicks < RUNAWAY_TICKS) this.neglectTicks++;
    } else {
      this.neglectTicks = 0;
    }

    this.save();
  }

  syncClock() {
    const nowSec = Math.floor(Date.now() / 1000);
    if (!this.lastSeenEpoch) {
      this.lastSeenEpoch = nowSec;
      return;
    }
    const elapsedMins = Math.floor((nowSec - this.lastSeenEpoch) / 60);
    this.lastSeenEpoch = nowSec;

    if (elapsedMins < 2 || this.ceremony !== CER_NONE || this.starterPick) {
      this.save();
      return;
    }

    const cappedMins = Math.min(elapsedMins, 14 * 24 * 60); // max 2 weeks
    for (let i = 0; i < cappedMins; i++) {
      this.ageMinutes++;
      if (this.isEgg()) {
        if (this.ageMinutes >= 3) this.hatch();
        continue;
      }
      if (this.sleeping) {
        this.energy = clamp100(this.energy + 6);
        if (this.ageMinutes % 2 === 0) {
          this.fullness = dropTo(this.fullness, 1, 30);
          this.joy = dropTo(this.joy, 1, 35);
        }
        if (this.ageMinutes % 3 === 0) this.hygiene = dropTo(this.hygiene, 1, 45);
        continue;
      }
      this.fullness = dropTo(this.fullness, 2, 15);
      this.energy = dropTo(this.energy, 1, 15);
      this.hygiene = dropTo(this.hygiene, 1, 15);
      this.joy = dropTo(this.joy, 1, 15);
    }

    if (!this.isEgg() && !this.sleeping) {
      const addedPoops = Math.floor(cappedMins / 240);
      this.poops = Math.min(3, this.poops + addedPoops);
    }

    this.save();
  }

  save() {
    this.lastSeenEpoch = Math.floor(Date.now() / 1000);
    const data = {
      fullness: this.fullness,
      joy: this.joy,
      energy: this.energy,
      hygiene: this.hygiene,
      poops: this.poops,
      weight: this.weight,
      geneAtk: this.geneAtk,
      geneDef: this.geneDef,
      geneSpe: this.geneSpe,
      trAtk: this.trAtk,
      trDef: this.trDef,
      trSpe: this.trSpe,
      berryKnown: this.berryKnown,
      shiny: this.shiny,
      ageMinutes: this.ageMinutes,
      speciesId: this.speciesId,
      prevSpeciesId: this.prevSpeciesId,
      careMistakes: this.careMistakes,
      sleeping: this.sleeping,
      lastSeenEpoch: this.lastSeenEpoch,
      ceremony: this.ceremony,
      lastEnd: this.lastEnd,
      dexReg: Array.from(this.dexReg),
      dexShinyReg: Array.from(this.dexShinyReg),
      streak: this.streak,
      bestStreak: this.bestStreak,
      lastCareDay: this.lastCareDay,
      bond: this.bond,
      nick: this.nick,
      medals: this.medals,
      totalMedals: this.totalMedals,
      gameHi: this.gameHi,
      strHi: this.strHi,
      eggTarget: this.eggTarget,
      eggShiny: this.eggShiny,
      eggTaps: this.eggTaps,
      starterPick: this.starterPick
    };
    localStorage.setItem('tamapoke_save', JSON.stringify(data));
  }

  load(d) {
    if (!d) return;
    this.fullness = d.fullness ?? 80;
    this.joy = d.joy ?? 80;
    this.energy = d.energy ?? 80;
    this.hygiene = d.hygiene ?? 100;
    this.poops = d.poops ?? 0;
    this.weight = d.weight ?? 0;
    this.geneAtk = d.geneAtk ?? 100;
    this.geneDef = d.geneDef ?? 100;
    this.geneSpe = d.geneSpe ?? 100;
    this.trAtk = d.trAtk ?? 0;
    this.trDef = d.trDef ?? 0;
    this.trSpe = d.trSpe ?? 0;
    this.berryKnown = d.berryKnown ?? false;
    this.shiny = d.shiny ?? false;
    this.ageMinutes = d.ageMinutes ?? 0;
    this.speciesId = d.speciesId ?? -1;
    this.prevSpeciesId = d.prevSpeciesId ?? -1;
    this.careMistakes = d.careMistakes ?? 0;
    this.sleeping = d.sleeping ?? false;
    this.lastSeenEpoch = d.lastSeenEpoch ?? 0;
    this.ceremony = d.ceremony ?? CER_NONE;
    this.lastEnd = d.lastEnd ?? CER_NONE;
    this.dexReg = new Set(d.dexReg || []);
    this.dexShinyReg = new Set(d.dexShinyReg || []);
    this.streak = d.streak ?? 0;
    this.bestStreak = d.bestStreak ?? 0;
    this.lastCareDay = d.lastCareDay ?? 0;
    this.bond = d.bond ?? 0;
    this.nick = d.nick ?? "";
    this.medals = d.medals ?? 0;
    this.totalMedals = d.totalMedals ?? 0;
    this.gameHi = d.gameHi ?? 0;
    this.strHi = d.strHi ?? 0;
    this.eggTarget = d.eggTarget ?? 1;
    this.eggShiny = d.eggShiny ?? false;
    this.eggTaps = d.eggTaps ?? 0;
    this.starterPick = d.starterPick ?? false;
  }
}

const pet = new PetEngine();
