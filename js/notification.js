// notification.js - Galaxy Fit 3 & Wearable Interactive Notification System

class Fit3NotificationManager {
  constructor() {
    this.enabled = localStorage.getItem('tamapoke_fit3_notif') === 'true';
    this.lastNotifyTime = 0;
    this.checkInterval = null;
  }

  async init() {
    if ('Notification' in window && Notification.permission === 'granted') {
      this.startMonitoring();
    }
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      alert('이 브라우저는 알림을 지원하지 않습니다.');
      return false;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      this.enabled = true;
      localStorage.setItem('tamapoke_fit3_notif', 'true');
      this.startMonitoring();
      this.sendNotification(
        '갤럭시 핏 3 연동 완료! ⌚',
        '이제 손목에서 포켓몬 상태를 확인하고 돌볼 수 있습니다.',
        [
          { action: 'feed', title: '🍎 밥 주기' },
          { action: 'pet', title: '💖 쓰다듬기' }
        ]
      );
      return true;
    } else {
      this.enabled = false;
      localStorage.setItem('tamapoke_fit3_notif', 'false');
      return false;
    }
  }

  toggle() {
    if (!this.enabled) {
      this.requestPermission();
    } else {
      this.enabled = false;
      localStorage.setItem('tamapoke_fit3_notif', 'false');
      this.stopMonitoring();
    }
  }

  startMonitoring() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.checkInterval = setInterval(() => this.checkAndNotify(), 60000); // Check every minute
  }

  stopMonitoring() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.checkInterval = null;
  }

  async sendNotification(title, body, actions = []) {
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    if (!reg) return;

    const defaultActions = [
      { action: 'feed', title: '🍎 밥 주기' },
      { action: 'play', title: '⚽ 놀아주기' },
      { action: 'clean', title: '🫧 목욕하기' }
    ];

    reg.showNotification(title, {
      body: body,
      icon: 'assets/icon-192.png',
      badge: 'assets/icon-192.png',
      tag: 'tamapoke-fit3',
      renotify: true,
      vibrate: [250, 100, 250, 100, 250], // Fit 3 vibration pulse
      actions: actions.length > 0 ? actions : defaultActions,
      data: {
        timestamp: Date.now()
      }
    });
  }

  checkAndNotify() {
    if (!this.enabled || pet.isEgg()) return;
    const now = Date.now();
    // Throttle notifications so they don't spam the watch (minimum 10 minutes between automated alerts)
    if (now - this.lastNotifyTime < 10 * 60000) return;

    const name = pet.nick || getDexName(pet.speciesId, currentLang);

    if (pet.canEvolveNow()) {
      this.lastNotifyTime = now;
      this.sendNotification(
        `⭐ ${name} 진화 준비 완료!`,
        `축하합니다! ${name}이(가) 진화할 수 있습니다!`,
        [{ action: 'open', title: '📱 화면 열기' }]
      );
      return;
    }

    if (pet.fullness <= 25) {
      this.lastNotifyTime = now;
      this.sendNotification(
        `🍎 ${name}이(가) 배고파해요!`,
        `포만감: ${pet.fullness}% | 손목에서 [밥 주기]를 누르세요.`,
        [
          { action: 'feed', title: '🍎 밥 주기' },
          { action: 'play', title: '⚽ 놀아주기' }
        ]
      );
      return;
    }

    if (pet.poops > 0 || pet.hygiene <= 25) {
      this.lastNotifyTime = now;
      this.sendNotification(
        `🫧 ${name} 목욕이 필요해요!`,
        `청결도: ${pet.hygiene}% | 손목에서 [목욕하기]를 누르세요.`,
        [
          { action: 'clean', title: '🫧 목욕하기' },
          { action: 'feed', title: '🍎 밥 주기' }
        ]
      );
      return;
    }

    if (pet.joy <= 25) {
      this.lastNotifyTime = now;
      this.sendNotification(
        `😢 ${name}이(가) 외로워해요...`,
        `행복도: ${pet.joy}% | 손목에서 [놀아주기]를 누르세요.`,
        [
          { action: 'play', title: '⚽ 놀아주기' },
          { action: 'pet', title: '💖 쓰다듬기' }
        ]
      );
      return;
    }
  }

  // Manual trigger from app
  sendManualStatus() {
    if (!this.enabled) {
      this.requestPermission();
      return;
    }
    const name = pet.nick || (pet.isEgg() ? '알' : getDexName(pet.speciesId, currentLang));
    const lv = pet.level();
    this.sendNotification(
      `⌚ [TamaPoke] ${name} (Lv.${lv})`,
      `밥: ${pet.fullness}% | 기분: ${pet.joy}% | 에너지: ${pet.energy}% | 청결: ${pet.hygiene}%`,
      [
        { action: 'feed', title: '🍎 밥 주기' },
        { action: 'play', title: '⚽ 놀아주기' },
        { action: 'clean', title: '🫧 목욕하기' }
      ]
    );
  }
}

const fit3Manager = new Fit3NotificationManager();
