// ui.js - TamaPoke 466x466 canvas renderer & mobile touch interaction system

const CANVAS_SIZE = 466;
const CX = 233, CY = 233;
const PET_GROUND = 310;

class TamaPokeUI {
  constructor() {
    this.canvas = document.getElementById('screen');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    // View states
    this.view = 'main'; // 'main', 'starter', 'card', 'pokedex', 'settings', 'minigame'
    this.cardPage = 0; // 0: profile, 1: battle, 2: medals, 3: progress
    this.pokedexPage = 0;
    this.pokedexDetail = 0; // 0: grid, >0: mon detail

    // Interaction state
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.longPressTimer = null;

    // Animation & movement
    this.petX = CX;
    this.petTargetX = CX;
    this.petAct = 0; // 0: Idle, 1: WalkL, 2: WalkR, 3: Sleep, 4: Eat
    this.actFrame = 0;
    this.lastFrameTime = 0;
    this.nextActChange = Date.now() + 3000;

    // Sub-menus
    this.feedMenuOpen = false;
    this.confirmDialog = null; // { title, text, onYes, onNo }
    this.bathBubbles = [];

    // Minigame
    this.ballX = CX;
    this.ballY = 180;
    this.ballVX = 2;
    this.ballVY = 0;
    this.gameScore = 0;
    this.gameMisses = 0;
    this.gameOver = false;

    this.initTouch();
  }

  initTouch() {
    const el = this.canvas;
    const getPos = (e) => {
      const rect = el.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const scale = CANVAS_SIZE / rect.width;
      return {
        x: (clientX - rect.left) * scale,
        y: (clientY - rect.top) * scale
      };
    };

    const onStart = (e) => {
      const pos = getPos(e);
      this.touchStartX = pos.x;
      this.touchStartY = pos.y;
      this.touchStartTime = Date.now();

      // Long press for release
      if (this.view === 'main' && !pet.isEgg()) {
        const dx = pos.x - this.petX;
        const dy = pos.y - (PET_GROUND - 40);
        if (Math.hypot(dx, dy) < 60) {
          this.longPressTimer = setTimeout(() => {
            this.showReleaseDialog();
          }, 2500);
        }
      }
    };

    const onEnd = (e) => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
      const changedTouch = e.changedTouches ? e.changedTouches[0] : e;
      const rect = el.getBoundingClientRect();
      const scale = CANVAS_SIZE / rect.width;
      const endX = (changedTouch.clientX - rect.left) * scale;
      const endY = (changedTouch.clientY - rect.top) * scale;

      const dx = endX - this.touchStartX;
      const dy = endY - this.touchStartY;
      const dist = Math.hypot(dx, dy);
      const dt = Date.now() - this.touchStartTime;

      if (dt > 2500 && this.confirmDialog) {
        // already handled by long press
        return;
      }

      // Swipe detection
      if (dist > 45 && dt < 600) {
        if (Math.abs(dy) > Math.abs(dx)) {
          if (dy < -45) this.onSwipeUp();
          else if (dy > 45) this.onSwipeDown();
        } else {
          if (dx < -45) this.onSwipeLeft();
          else if (dx > 45) this.onSwipeRight();
        }
        return;
      }

      // Tap
      if (dist < 20) {
        this.onTap(endX, endY);
      }
    };

    el.addEventListener('touchstart', onStart, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: false });
    el.addEventListener('mousedown', onStart);
    el.addEventListener('mouseup', onEnd);
  }

  onTap(x, y) {
    sfxPlay(SFX_TAP);

    // Dialog tap
    if (this.confirmDialog) {
      if (y > 270 && y < 330) {
        if (x > 100 && x < 210) {
          const cb = this.confirmDialog.onYes;
          this.confirmDialog = null;
          if (cb) cb();
          return;
        } else if (x > 250 && x < 360) {
          const cb = this.confirmDialog.onNo;
          this.confirmDialog = null;
          if (cb) cb();
          return;
        }
      }
      return;
    }

    // Starter pick view
    if (this.view === 'starter' || pet.starterPick) {
      const starters = [1, 4, 7];
      for (let i = 0; i < 3; i++) {
        const sy = 120 + i * 85;
        if (y >= sy && y <= sy + 75 && x >= 80 && x <= 386) {
          pet.chooseStarter(starters[i]);
          this.view = 'main';
          return;
        }
      }
      return;
    }

    // Pokedex view
    if (this.view === 'pokedex') {
      if (this.pokedexDetail > 0) {
        // Tap anywhere to return to grid
        this.pokedexDetail = 0;
        return;
      }
      // Tap on grid cell
      const startDex = this.pokedexPage * 16 + 1;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const idx = startDex + r * 4 + c;
          if (idx <= DEX_COUNT) {
            const cx = 90 + c * 72;
            const cy = 100 + r * 65;
            if (Math.hypot(x - cx, y - cy) < 32) {
              if (pet.isRegistered(idx)) {
                this.pokedexDetail = idx;
              }
              return;
            }
          }
        }
      }
      // Back area tap
      if (y > 380) {
        this.view = 'main';
      }
      return;
    }

    // Card view tap to exit or rename
    if (this.view === 'card') {
      if (y > 380) {
        this.view = 'main';
        return;
      }
      // Tap to switch page
      this.cardPage = (this.cardPage + 1) % 4;
      return;
    }

    // Settings view tap
    if (this.view === 'settings') {
      // Language switch button tap
      if (y >= 230 && y <= 280 && x >= 140 && x <= 326) {
        const nextLang = currentLang === 'ko' ? 'en' : 'ko';
        setLanguage(nextLang);
        return;
      }
      // Sound switch tap
      if (y >= 290 && y <= 340 && x >= 140 && x <= 326) {
        soundManager.enabled = !soundManager.enabled;
        return;
      }
      if (y > 370) {
        this.view = 'main';
        return;
      }
      return;
    }

    // Minigame tap
    if (this.view === 'minigame') {
      if (this.gameOver) {
        this.view = 'main';
        return;
      }
      // Bounce ball if tapped near ball
      const d = Math.hypot(x - this.ballX, y - this.ballY);
      if (d < 55) {
        this.ballVY = -8.5 - Math.random() * 2;
        this.ballVX = (this.ballX - x) * 0.25;
        this.gameScore++;
        sfxPlay(SFX_PLAY);
      }
      return;
    }

    // Main view
    if (this.view === 'main') {
      // Evolution button CTA
      if (pet.canEvolveNow() && y >= 170 && y <= 234 && x >= 105 && x <= 361) {
        this.confirmDialog = {
          title: t('S_EVO_Q'),
          text: t('S_EVO_TAP'),
          onYes: () => pet.evolve(),
          onNo: () => {}
        };
        return;
      }

      // Farewell CTA
      if (pet.canFarewellNow() && y >= 170 && y <= 234 && x >= 105 && x <= 361) {
        this.confirmDialog = {
          title: t('S_FAR_Q'),
          text: t('S_FAREWELL_BTN', pet.nick || getDexName(pet.speciesId, currentLang)),
          onYes: () => pet.farewell(),
          onNo: () => {}
        };
        return;
      }

      // Runaway CTA
      if (pet.canRunawayNow() && y >= 170 && y <= 234 && x >= 105 && x <= 361) {
        this.confirmDialog = {
          title: t('S_RUNAWAY'),
          text: t('S_RUNAWAY_BTN', pet.nick || getDexName(pet.speciesId, currentLang)),
          onYes: () => pet.runaway(),
          onNo: () => pet.petCreature()
        };
        return;
      }

      // Feed submenu
      if (this.feedMenuOpen) {
        // 4 choices: Berry Red, Blue, Green, Candy
        for (let i = 0; i < 4; i++) {
          const bx = 110 + i * 65;
          const by = 310;
          if (Math.hypot(x - bx, y - by) < 28) {
            if (i < 3) pet.feedBerry(i);
            else pet.feedCandy();
            this.feedMenuOpen = false;
            return;
          }
        }
        this.feedMenuOpen = false;
        return;
      }

      // Bottom 4 buttons
      const buttons = [
        { cx: 140, cy: 390, action: 'feed' },
        { cx: 202, cy: 404, action: 'play' },
        { cx: 264, cy: 404, action: 'light' },
        { cx: 326, cy: 390, action: 'bath' }
      ];

      for (const btn of buttons) {
        if (Math.hypot(x - btn.cx, y - btn.cy) < 28) {
          if (btn.action === 'feed') {
            this.feedMenuOpen = !this.feedMenuOpen;
          } else if (btn.action === 'play') {
            this.startMinigame();
          } else if (btn.action === 'light') {
            pet.toggleLight();
          } else if (btn.action === 'bath') {
            this.startBath();
          }
          return;
        }
      }

      // Creature tap
      if (pet.isEgg()) {
        const dx = x - CX, dy = y - (PET_GROUND - 30);
        if (Math.hypot(dx, dy) < 50) {
          pet.tapEgg();
        }
      } else {
        const dx = x - this.petX, dy = y - (PET_GROUND - 40);
        if (Math.hypot(dx, dy) < 55) {
          pet.petCreature();
        }
      }
    }
  }

  onSwipeUp() {
    if (this.view === 'main') {
      this.view = 'card';
      this.cardPage = 0;
      sfxPlay(SFX_TAP);
    } else if (this.view === 'settings') {
      this.view = 'main';
      sfxPlay(SFX_TAP);
    }
  }

  onSwipeDown() {
    if (this.view === 'main') {
      this.view = 'settings';
      sfxPlay(SFX_TAP);
    } else if (this.view === 'card') {
      this.view = 'main';
      sfxPlay(SFX_TAP);
    }
  }

  onSwipeLeft() {
    if (this.view === 'main') {
      this.view = 'pokedex';
      this.pokedexPage = 0;
      sfxPlay(SFX_TAP);
    } else if (this.view === 'pokedex') {
      if (this.pokedexPage < 9) {
        this.pokedexPage++;
        sfxPlay(SFX_TAP);
      }
    } else if (this.view === 'card') {
      this.cardPage = (this.cardPage + 1) % 4;
      sfxPlay(SFX_TAP);
    }
  }

  onSwipeRight() {
    if (this.view === 'pokedex') {
      if (this.pokedexPage > 0) {
        this.pokedexPage--;
        sfxPlay(SFX_TAP);
      } else {
        this.view = 'main';
        sfxPlay(SFX_TAP);
      }
    } else if (this.view === 'card') {
      this.cardPage = (this.cardPage + 3) % 4;
      sfxPlay(SFX_TAP);
    }
  }

  showReleaseDialog() {
    const name = pet.nick || getDexName(pet.speciesId, currentLang);
    this.confirmDialog = {
      title: t('S_RELEASE_FMT', name),
      text: t('S_GOODBYE'),
      onYes: () => pet.release(),
      onNo: () => {}
    };
  }

  startMinigame() {
    if (pet.isEgg() || pet.sleeping) return;
    this.view = 'minigame';
    this.ballX = CX;
    this.ballY = 160;
    this.ballVX = 2.5;
    this.ballVY = -2;
    this.gameScore = 0;
    this.gameMisses = 0;
    this.gameOver = false;
  }

  startBath() {
    pet.cleanBath();
    this.bathBubbles = [];
    for (let i = 0; i < 16; i++) {
      this.bathBubbles.push({
        x: CX - 60 + Math.random() * 120,
        y: PET_GROUND - 10 - Math.random() * 70,
        r: 6 + Math.random() * 14,
        speed: 0.8 + Math.random() * 1.5
      });
    }
    setTimeout(() => {
      this.bathBubbles = [];
    }, 2800);
  }

  render() {
    pet.update();
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Circular clipping
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, 226, 0, Math.PI * 2);
    ctx.clip();

    // Night or Day background
    const hour = new Date().getHours();
    const isNight = hour >= 20 || hour < 7 || pet.sleeping;
    ctx.fillStyle = isNight ? '#141828' : '#f2efe1';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    if (isNight) {
      // Draw Stars
      ctx.fillStyle = '#ffffff';
      const stars = [[120,140],[330,120],[370,210],[95,230],[280,90],[160,95]];
      for (const [sx, sy] of stars) {
        ctx.fillRect(sx, sy, 2, 2);
      }
    }

    // Ground line
    ctx.fillStyle = isNight ? '#2a2f45' : '#d8d2bd';
    ctx.fillRect(50, PET_GROUND, 366, 2);

    if (pet.starterPick || this.view === 'starter') {
      this.renderStarterChoice();
    } else if (this.view === 'pokedex') {
      this.renderPokedex();
    } else if (this.view === 'card') {
      this.renderCard();
    } else if (this.view === 'settings') {
      this.renderSettings();
    } else if (this.view === 'minigame') {
      this.renderMinigame();
    } else {
      this.renderMain(isNight);
    }

    // Dialog overlay
    if (this.confirmDialog) {
      this.renderDialog();
    }

    ctx.restore();
  }

  renderMain(isNight) {
    const ctx = this.ctx;
    const ink = isNight ? '#d8dcf0' : '#2a2a36';

    // Top status bars
    this.renderTopBars(isNight);

    // Poops
    for (let i = 0; i < pet.poops; i++) {
      const px = 100 + i * 32;
      const py = PET_GROUND - 16;
      ctx.fillStyle = '#8a5524';
      ctx.beginPath();
      ctx.arc(px, py, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4a2504';
      ctx.fillRect(px - 2, py - 6, 4, 3);
    }

    // Render Pet or Egg
    if (pet.isEgg()) {
      this.renderEgg(ink);
    } else {
      this.renderCreature();
    }

    // Bath bubbles
    if (this.bathBubbles.length > 0) {
      ctx.fillStyle = 'rgba(210, 240, 255, 0.75)';
      ctx.strokeStyle = '#ffffff';
      for (const b of this.bathBubbles) {
        b.y -= b.speed;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // Status message at bottom
    ctx.fillStyle = ink;
    ctx.font = 'bold 15px "Pretendard", "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    let status = this.getStatusText();
    ctx.fillText(status, CX, 356);

    // Action buttons (Feed, Play, Light, Bath)
    this.renderButtons(isNight);

    // Feed popup menu
    if (this.feedMenuOpen) {
      this.renderFeedMenu();
    }

    // CTAs (Evolution, Farewell, Runaway)
    if (pet.canEvolveNow()) {
      this.renderCTA(t('S_EVO_TAP'), '#e8503a');
    } else if (pet.canFarewellNow()) {
      this.renderCTA(t('S_FAREWELL_BTN', pet.nick || getDexName(pet.speciesId, currentLang)), '#d4a017');
    } else if (pet.canRunawayNow()) {
      this.renderCTA(t('S_RUNAWAY_BTN', pet.nick || getDexName(pet.speciesId, currentLang)), '#5a5a6e');
    }
  }

  getStatusText() {
    if (pet.evolvingUntil > Date.now()) return t('S_EVOLVING');
    if (this.bathBubbles.length > 0) return '치카치카 목욕 중!';
    if (pet.sleeping) return 'Zzz...';
    if (pet.eatingUntil > Date.now()) return t('S_EATING');
    if (pet.heartUntil > Date.now()) return t('S_LIKES');
    if (pet.fullness < 25) return t('S_HUNGRY');
    if (pet.hygiene < 25) return t('S_NEEDS_BATH');
    if (pet.energy < 25) return t('S_EXHAUSTED');
    if (pet.joy < 25) return t('S_SAD');
    if (pet.weight > 60) return t('S_CHUBBY');
    if (pet.shiny && pet.ageMinutes < 15) return t('S_IS_SHINY');
    return t('S_HAPPY');
  }

  renderTopBars(isNight) {
    const ctx = this.ctx;
    const ink = isNight ? '#d8dcf0' : '#2a2a36';

    // Name & Level
    const name = pet.nick || (pet.isEgg() ? t('S_EGG_HDR') : getDexName(pet.speciesId, currentLang));
    const lvText = pet.isEgg() ? '' : ` Lv.${pet.level()}`;
    ctx.fillStyle = ink;
    ctx.font = 'bold 16px "Pretendard", "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${name}${lvText}`, CX, 58);

    // 4 Need bars: FOOD, JOY, ENE, HYG
    const labels = [t('S_BAR_FOOD'), t('S_BAR_JOY'), t('S_BAR_ENE'), t('S_BAR_HYG')];
    const vals = [pet.fullness, pet.joy, pet.energy, pet.hygiene];
    const colors = ['#e8503a', '#e8a23c', '#58b868', '#4f93c4'];

    const barW = 66, barH = 7, startX = CX - 146;
    for (let i = 0; i < 4; i++) {
      const bx = startX + i * 75;
      const by = 68;

      ctx.fillStyle = isNight ? '#888da8' : '#777777';
      ctx.font = '10px "Pretendard", sans-serif';
      ctx.fillText(labels[i], bx + barW / 2, by + 9);

      // Track
      ctx.fillStyle = isNight ? '#252a3d' : '#d8d2bd';
      ctx.fillRect(bx, by + 12, barW, barH);

      // Fill
      ctx.fillStyle = colors[i];
      const fw = (vals[i] / 100) * barW;
      ctx.fillRect(bx, by + 12, fw, barH);
    }
  }

  renderEgg(ink) {
    const ctx = this.ctx;
    const bob = Math.sin(Date.now() / 250) * (pet.eggTaps > 0 ? 4 : 2);
    const ey = PET_GROUND - 48 + bob;

    ctx.fillStyle = '#faf8e8';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.ellipse(CX, ey, 26, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cracks
    if (pet.eggTaps >= 1) {
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(CX - 8, ey - 6);
      ctx.lineTo(CX, ey - 14);
      ctx.lineTo(CX + 6, ey - 8);
      ctx.stroke();
    }
    if (pet.eggTaps >= 2) {
      ctx.beginPath();
      ctx.moveTo(CX + 5, ey + 4);
      ctx.lineTo(CX + 14, ey + 10);
      ctx.stroke();
    }
  }

  renderCreature() {
    const ctx = this.ctx;
    const monData = pakLoader.loadMon(pet.speciesId, pet.shiny);

    // Walk / Idle behavior
    const now = Date.now();
    if (now > this.nextActChange) {
      if (pet.sleeping) {
        this.petAct = 3; // Sleep
      } else if (pet.eatingUntil > now) {
        this.petAct = 4; // Eat
      } else {
        const r = Math.random();
        if (r < 0.45) {
          this.petAct = 0; // Idle
        } else if (r < 0.72) {
          this.petAct = 1; // WalkL
          this.petTargetX = Math.max(150, this.petX - (30 + Math.random() * 50));
        } else {
          this.petAct = 2; // WalkR
          this.petTargetX = Math.min(316, this.petX + (30 + Math.random() * 50));
        }
      }
      this.nextActChange = now + 2000 + Math.random() * 2500;
    }

    // Step toward target
    if (this.petAct === 1 && this.petX > this.petTargetX) {
      this.petX -= 0.6;
    } else if (this.petAct === 2 && this.petX < this.petTargetX) {
      this.petX += 0.6;
    }

    if (!monData) {
      // Fallback placeholder circle if sprite not yet loaded
      ctx.fillStyle = '#58b868';
      ctx.beginPath();
      ctx.arc(this.petX, PET_GROUND - 35, 30, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    let act = monData.acts.get(this.petAct) || monData.acts.get(0);
    if (!act || act.frames.length === 0) {
      act = monData.acts.get(0);
    }

    if (act && act.frames.length > 0) {
      const totalFrames = act.frames.length;
      const frameIndex = Math.floor((now / 150) % totalFrames);
      const fr = act.frames[frameIndex];

      const scale = 2.4;
      const sw = fr.w * scale;
      const sh = fr.h * scale;
      const sx = this.petX - sw / 2;
      const sy = PET_GROUND - fr.lowestRow * scale;

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(fr.canvas, sx, sy, sw, sh);
    }

    // Heart over head
    if (pet.heartUntil > now) {
      ctx.fillStyle = '#f08aa4';
      ctx.font = '22px sans-serif';
      ctx.fillText('♥', this.petX, PET_GROUND - 85);
    }
  }

  renderButtons(isNight) {
    const ctx = this.ctx;
    const ink = isNight ? '#d8dcf0' : '#2a2a36';

    const btns = [
      { cx: 140, cy: 390, icon: '🍎' },
      { cx: 202, cy: 404, icon: '⚽' },
      { cx: 264, cy: 404, icon: '🌙' },
      { cx: 326, cy: 390, icon: '🫧' }
    ];

    for (let i = 0; i < btns.length; i++) {
      const b = btns[i];
      const off = pet.sleeping && i !== 2;

      ctx.fillStyle = off ? (isNight ? '#202436' : '#e4dfcf') : (isNight ? '#2e354f' : '#ffffff');
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(b.cx, b.cy, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.icon, b.cx, b.cy + 1);
    }
    ctx.textBaseline = 'alphabetic';
  }

  renderFeedMenu() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = '#2a2a36';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(85, 275, 296, 68, 16);
    ctx.fill();
    ctx.stroke();

    const items = [
      { label: '🔴', sub: '빨강' },
      { label: '🔵', sub: '파랑' },
      { label: '🟢', sub: '초록' },
      { label: '🍬', sub: '사탕' }
    ];

    for (let i = 0; i < 4; i++) {
      const bx = 110 + i * 65;
      const by = 305;
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(items[i].label, bx, by);
      ctx.fillStyle = '#333';
      ctx.font = '10px "Pretendard", sans-serif';
      ctx.fillText(items[i].sub, bx, by + 22);
    }
  }

  renderCTA(text, color) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(110, 180, 246, 52, 14);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px "Pretendard", "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, CX, 212);
  }

  renderDialog() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#2a2a36';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(70, 150, 326, 170, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1b1b25';
    ctx.font = 'bold 17px "Pretendard", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.confirmDialog.title, CX, 195);

    ctx.fillStyle = '#555555';
    ctx.font = '13px "Pretendard", sans-serif';
    ctx.fillText(this.confirmDialog.text, CX, 230);

    // Yes button
    ctx.fillStyle = '#e8503a';
    ctx.beginPath();
    ctx.roundRect(100, 260, 110, 42, 10);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(t('S_YES'), 155, 287);

    // No button
    ctx.fillStyle = '#999999';
    ctx.beginPath();
    ctx.roundRect(250, 260, 110, 42, 10);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(t('S_NO'), 305, 287);
  }

  renderStarterChoice() {
    const ctx = this.ctx;
    ctx.fillStyle = '#2a2a36';
    ctx.font = 'bold 18px "Pretendard", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('S_CHOOSE_STARTER'), CX, 75);

    const starters = [1, 4, 7];
    for (let i = 0; i < 3; i++) {
      const id = starters[i];
      const entry = DEX_TBL[id];
      const sy = 120 + i * 85;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = entry.accent;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(80, sy, 306, 75, 14);
      ctx.fill();
      ctx.stroke();

      // Sprite preview
      const monData = pakLoader.loadMon(id, false);
      if (monData && monData.acts.get(0)) {
        const fr = monData.acts.get(0).frames[0];
        ctx.drawImage(fr.canvas, 95, sy + 10, 55, 55);
      }

      ctx.fillStyle = '#2a2a36';
      ctx.font = 'bold 17px "Pretendard", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(getDexName(id, currentLang), 165, sy + 38);

      ctx.fillStyle = '#777777';
      ctx.font = '12px sans-serif';
      ctx.fillText(`No.${String(id).padStart(3, '0')}`, 165, sy + 58);
    }
  }

  renderPokedex() {
    const ctx = this.ctx;
    if (this.pokedexDetail > 0) {
      this.renderPokedexDetail();
      return;
    }

    ctx.fillStyle = '#2a2a36';
    ctx.font = 'bold 16px "Pretendard", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${t('S_POKEDEX_FMT', pet.registeredCount())} (페이지 ${this.pokedexPage + 1}/10)`, CX, 60);

    const startDex = this.pokedexPage * 16 + 1;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const idx = startDex + r * 4 + c;
        if (idx > DEX_COUNT) break;

        const cx = 90 + c * 72;
        const cy = 100 + r * 65;
        const reg = pet.isRegistered(idx);

        ctx.fillStyle = reg ? '#ffffff' : '#e0ded6';
        ctx.strokeStyle = '#2a2a36';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(cx - 30, cy - 24, 60, 54, 8);
        ctx.fill();
        ctx.stroke();

        if (reg) {
          const monData = pakLoader.loadMon(idx, false);
          if (monData && monData.acts.get(0)) {
            const fr = monData.acts.get(0).frames[0];
            ctx.drawImage(fr.canvas, cx - 20, cy - 22, 40, 40);
          }
          ctx.fillStyle = '#333';
          ctx.font = '9px sans-serif';
          ctx.fillText(String(idx).padStart(3, '0'), cx, cy + 24);
        } else {
          ctx.fillStyle = '#999';
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText('?', cx, cy + 4);
          ctx.font = '9px sans-serif';
          ctx.fillText(String(idx).padStart(3, '0'), cx, cy + 24);
        }
      }
    }

    ctx.fillStyle = '#666';
    ctx.font = '12px "Pretendard", sans-serif';
    ctx.fillText('좌우 스와이프: 페이지 이동  |  하단 터치: 닫기', CX, 395);
  }

  renderPokedexDetail() {
    const ctx = this.ctx;
    const id = this.pokedexDetail;
    const entry = DEX_TBL[id];

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(75, 75, 316, 316, 20);
    ctx.fill();
    ctx.strokeStyle = entry.accent;
    ctx.lineWidth = 4;
    ctx.stroke();

    const monData = pakLoader.loadMon(id, false);
    if (monData && monData.acts.get(0)) {
      const fr = monData.acts.get(0).frames[0];
      ctx.drawImage(fr.canvas, CX - 50, 95, 100, 100);
    }

    ctx.fillStyle = '#2a2a36';
    ctx.font = 'bold 20px "Pretendard", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`No.${String(id).padStart(3, '0')} ${getDexName(id, currentLang)}`, CX, 225);

    ctx.fillStyle = '#666666';
    ctx.font = '13px "Pretendard", sans-serif';
    ctx.fillText(`체력: ${entry.bHp}  공격: ${entry.bAtk}  방어: ${entry.bDef}  스피드: ${entry.bSpe}`, CX, 260);

    if (entry.evolvesTo > 0) {
      ctx.fillText(`Lv.${entry.evolveLevel}에 ${getDexName(entry.evolvesTo, currentLang)}(으)로 진화`, CX, 290);
    } else {
      ctx.fillText(t('S_FINAL_FORM'), CX, 290);
    }

    ctx.fillStyle = '#888';
    ctx.font = '12px sans-serif';
    ctx.fillText(t('S_DETAIL_BACK'), CX, 360);
  }

  renderCard() {
    const ctx = this.ctx;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(75, 75, 316, 316, 20);
    ctx.fill();
    ctx.strokeStyle = '#2a2a36';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#2a2a36';
    ctx.font = 'bold 16px "Pretendard", sans-serif';
    ctx.textAlign = 'center';

    const pages = [t('S_STREAK_FMT', pet.streak, pet.bestStreak), t('S_BATTLE'), t('S_MEDALS_FMT', (pet.medals ? 1 : 0), 8), t('S_PROGRESS')];
    ctx.fillText(pages[this.cardPage], CX, 105);

    if (this.cardPage === 0) {
      // Profile
      ctx.font = '14px "Pretendard", sans-serif';
      ctx.fillText(`${t('S_VIN')}: ${pet.bond}/100`, CX, 150);
      ctx.fillText(`${t('S_INFO_FMT', '', Math.floor(pet.ageMinutes / 1440))}`, CX, 185);
      const favColor = pet.speciesId % 3;
      const bName = pet.berryKnown ? (favColor === 0 ? t('S_BERRY_RED') : favColor === 1 ? t('S_BERRY_BLUE') : t('S_BERRY_GREEN')) : t('S_BERRY_UNK');
      ctx.fillText(`선호 열매: ${bName}`, CX, 220);
      ctx.fillText(`체중: ${pet.weight} kg`, CX, 255);
    } else if (this.cardPage === 1) {
      // Battle Stats
      const entry = DEX_TBL[pet.speciesId] || DEX_TBL[1];
      const atk = Math.floor(entry.bAtk * (pet.geneAtk / 100) + pet.level() + pet.trAtk);
      const def = Math.floor(entry.bDef * (pet.geneDef / 100) + pet.level() + pet.trDef);
      const spe = Math.floor(entry.bSpe * (pet.geneSpe / 100) + pet.level() + pet.trSpe);
      ctx.font = '14px "Pretendard", sans-serif';
      ctx.fillText(`${t('S_STAT_ATK')}: ${atk} (유전자 ${pet.geneAtk}%)`, CX, 155);
      ctx.fillText(`${t('S_STAT_DEF')}: ${def} (유전자 ${pet.geneDef}%)`, CX, 195);
      ctx.fillText(`${t('S_STAT_SPE')}: ${spe} (유전자 ${pet.geneSpe}%)`, CX, 235);
    } else if (this.cardPage === 2) {
      // Medals
      ctx.font = '12px "Pretendard", sans-serif';
      const mList = I18N[currentLang].medals;
      for (let i = 0; i < 4; i++) {
        const has1 = (pet.medals & (1 << i)) !== 0;
        const has2 = (pet.medals & (1 << (i + 4))) !== 0;
        ctx.fillStyle = has1 ? '#e8503a' : '#aaa';
        ctx.fillText(`[${has1 ? '★' : ' '}] ${mList[i].name}`, 145, 145 + i * 35);
        ctx.fillStyle = has2 ? '#e8503a' : '#aaa';
        ctx.fillText(`[${has2 ? '★' : ' '}] ${mList[i + 4].name}`, 265, 145 + i * 35);
      }
    } else if (this.cardPage === 3) {
      // Progress
      const info = DEX_TBL[pet.speciesId];
      ctx.font = '14px "Pretendard", sans-serif';
      ctx.fillText(t('S_LVL_FMT', pet.level()), CX, 150);
      const nextMin = MINUTES_PER_LEVEL - (pet.ageMinutes % MINUTES_PER_LEVEL);
      ctx.fillText(t('S_NEXT_LVL_FMT', nextMin, pet.level() + 1), CX, 185);
      if (info && info.evolvesTo > 0) {
        const leftLv = Math.max(0, (info.evolveLevel + pet.careMistakes) - pet.level());
        ctx.fillText(t('S_EVO_IN_FMT', leftLv), CX, 220);
      } else {
        ctx.fillText(t('S_FINAL_FORM'), CX, 220);
      }
      ctx.fillText(t('S_MISTAKES_FMT', pet.careMistakes), CX, 255);
    }

    ctx.fillStyle = '#888';
    ctx.font = '12px sans-serif';
    ctx.fillText('탭: 다음 페이지  |  하단 터치: 닫기', CX, 360);
  }

  renderSettings() {
    const ctx = this.ctx;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(75, 75, 316, 316, 20);
    ctx.fill();
    ctx.strokeStyle = '#2a2a36';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#2a2a36';
    ctx.font = 'bold 18px "Pretendard", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('S_SET_TIME'), CX, 110);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(timeStr, CX, 160);

    // Language switch button
    ctx.fillStyle = '#4f93c4';
    ctx.beginPath();
    ctx.roundRect(130, 210, 206, 46, 10);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px "Pretendard", sans-serif';
    ctx.fillText(`${t('S_LANG_LABEL')}: ${currentLang === 'ko' ? '한국어 (KO)' : 'English (EN)'}`, CX, 238);

    // Sound toggle button
    ctx.fillStyle = soundManager.enabled ? '#58b868' : '#888888';
    ctx.beginPath();
    ctx.roundRect(130, 270, 206, 46, 10);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(soundManager.enabled ? t('S_SND_ON') : t('S_SND_OFF'), CX, 298);

    ctx.fillStyle = '#888';
    ctx.font = '12px sans-serif';
    ctx.fillText('위로 스와이프하여 돌아가기', CX, 360);
  }

  renderMinigame() {
    const ctx = this.ctx;
    // Ball physics
    this.ballVY += 0.28; // gravity
    this.ballX += this.ballVX;
    this.ballY += this.ballVY;

    // Walls
    if (this.ballX < 120) { this.ballX = 120; this.ballVX *= -1; }
    if (this.ballX > 346) { this.ballX = 346; this.ballVX *= -1; }

    // Floor miss
    if (this.ballY > PET_GROUND) {
      this.gameMisses++;
      if (this.gameMisses >= 3) {
        this.gameOver = true;
        pet.playResult(this.gameScore);
      } else {
        this.ballY = 160;
        this.ballVY = -4;
      }
    }

    ctx.fillStyle = '#2a2a36';
    ctx.font = 'bold 16px "Pretendard", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`점수: ${this.gameScore}  미스: ${this.gameMisses}/3`, CX, 70);

    // Pokeball drawing
    const bx = this.ballX, by = this.ballY, br = 18;
    ctx.fillStyle = '#e8503a';
    ctx.beginPath();
    ctx.arc(bx, by, br, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#2a2a36';
    ctx.fillRect(bx - br, by - 2, br * 2, 4);
    ctx.beginPath();
    ctx.arc(bx, by, 5, 0, Math.PI * 2);
    ctx.fill();

    // Pet below tracking
    const monData = pakLoader.loadMon(pet.speciesId, false);
    if (monData && monData.acts.get(0)) {
      const fr = monData.acts.get(0).frames[0];
      ctx.drawImage(fr.canvas, this.ballX - 35, PET_GROUND - 65, 70, 70);
    }

    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(80, 150, 306, 120);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px "Pretendard", sans-serif';
      ctx.fillText('게임 오버!', CX, 195);
      ctx.font = '14px "Pretendard", sans-serif';
      ctx.fillText(`최종 점수: ${this.gameScore}점 (터치하여 종료)`, CX, 230);
    }
  }
}
