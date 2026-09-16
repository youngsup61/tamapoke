// TamaPoke i18n support (Default: Korean, with English & Japanese fallback)

const I18N = {
  ko: {
    // Status
    S_EVOLVING: "진화하고 있어요!",
    S_EATING: "냠냠!",
    S_LIKES: "좋아해요!",
    S_HUNGRY: "배가 고파요!",
    S_NEEDS_BATH: "목욕이 필요해요!",
    S_EXHAUSTED: "지쳤어요...",
    S_SAD: "슬퍼하고 있어요...",
    S_CHUBBY: "조금 통통해요...",
    S_IS_SHINY: "이로치다!!",
    S_HAPPY: "기분이 좋아요",

    // Endings / Ceremonies
    S_FAREWELL: "고마웠어! 안녕",
    S_RUNAWAY: "도망쳐 버렸어요...",
    S_GOODBYE: "안녕! 작별 인사를 해요...",

    // Egg
    S_EGG_HDR: "알",
    S_EGG_LEGEND: "전설의 알!?",
    S_EGG_RARE: "희귀한 알!",
    S_EGG_TOUCH: "알을 터치해 보세요...",
    S_EGG_MOVES: "알이 움직였어요!",
    S_EGG_ALMOST: "곧 태어날 것 같아요!",

    // Shared formats
    S_POKEDEX_FMT: "포켓몬 도감 %u/151",
    S_NAME_FMT: "%s%s Lv.%u",

    // Release dialog
    S_RELEASE_FMT: "%s을(를) 놓아줄까요?",
    S_YES: "예",
    S_NO: "아니오",

    // Minigame & Punching Bag
    S_HITS_FMT: "%u 타격",
    S_STR_GAIN_FMT: "공격력 +%u",
    S_NEW_RECORD: "신기록 달성!",
    S_RECORD_FMT: "기록: %u",
    S_HIT_FAST: "빠르게 연타하세요!",
    S_SCORE_FMT: "점수: %u",
    S_GREAT_JOY: "정말 즐거워요!",
    S_PLUS_JOY: "+행복도",

    // Clock / Settings
    S_SET_TIME: "시간 설정",
    S_HOUR: "시",
    S_MIN: "분",
    S_CLOCK_CANCEL: "위로 스와이프: 취소",
    S_LANG_LABEL: "언어",

    // Medals / Celebrations
    S_MEDAL_BANNER: "메달 획득!",
    S_GREAT: "대단해요!",
    S_STREAK_DAYS_FMT: "%u일 연속 돌봄!",

    // Card: Profile
    S_STREAK_FMT: "연속 %u  최고 %u",
    S_VIN: "유대감",
    S_BERRY_UNK: "열매 ???",
    S_BERRY_RED: "빨간열매",
    S_BERRY_BLUE: "파란열매",
    S_BERRY_GREEN: "초록열매",
    S_INFO_FMT: "%s   나이 %u일",
    S_RENAME_HINT: "이름을 터치해 이름 변경",

    // Card: Battle
    S_BATTLE: "배틀 스탯",
    S_STAT_ATK: "공격",
    S_STAT_DEF: "방어",
    S_STAT_SPE: "스피드",
    S_STAT_WGT: "체중",
    S_TRAIN_STR: "공격력 훈련",

    // Card: Medals
    S_MEDALS_FMT: "메달 %d/%d",
    S_BACK: "터치: 뒤로",

    // Keyboard & Gallery
    S_NAME: "이름:",
    S_DETAIL_BACK: "터치하여 뒤로 가기",

    // Stat bars
    S_BAR_FOOD: "포만감",
    S_BAR_JOY: "행복도",
    S_BAR_ENE: "에너지",
    S_BAR_HYG: "청결도",

    // Record
    S_REC_FMT: "최고 %u",

    // Card: Progress
    S_PROGRESS: "성장 진행",
    S_LVL_FMT: "Lv.%u",
    S_NEXT_LVL_FMT: "다음 레벨까지 %u분",
    S_EVO_LABEL: "진화",
    S_FINAL_FORM: "최종 진화형",
    S_EVO_READY: "진화할 준비가 되었어요!",
    S_EVO_BLOCKED: "모든 스탯이 40 이상이어야 진화",
    S_EVO_IN_FMT: "진화까지 %u 레벨",
    S_MISTAKES_FMT: "돌봄 실수: %u회",

    // Sound toggle
    S_SND_ON: "소리 켬",
    S_SND_OFF: "소리 끔",

    // Action buttons
    S_EVO_TAP: "진화하기!",
    S_FAREWELL_BTN: "%s이(가) 무언가 말하고 싶어해요...",
    S_RUNAWAY_BTN: "%s이(가) 외로워하고 있어요...",

    // Dialog decisions
    S_EVO_Q: "진화시키겠습니까?",
    S_EVO_KEEP: "현재 모습 유지",
    S_FAR_Q: "작별하시겠습니까?",
    S_FAR_GO: "작별하기",
    S_FAR_STAY: "함께 있기",

    // Starter choice
    S_CHOOSE_STARTER: "스타팅 포켓몬을 선택하세요",
    S_NO_SPRITES: "스프라이트 없음",
    S_LOAD_SPRITES: "스프라이트 로딩 중...",

    // Medals labels
    medals: [
      { name: "Lv.10", label: "레벨 10 달성", desc: "포켓몬이 레벨 10에 도달했습니다" },
      { name: "Lv.25", label: "레벨 25 달성", desc: "포켓몬이 레벨 25에 도달했습니다" },
      { name: "Lv.50", label: "레벨 50 달성", desc: "포켓몬이 레벨 50에 도달했습니다" },
      { name: "나무열매", label: "열매 발견", desc: "좋아하는 열매 맛을 찾았습니다" },
      { name: "7일 연속", label: "7일 연속 돌봄", desc: "7일 연속으로 돌보았습니다" },
      { name: "유대감", label: "깊은 유대감", desc: "유대감이 최대치에 도달했습니다" },
      { name: "최종형", label: "최종 진화", desc: "최종 진화형에 도달했습니다" },
      { name: "건강함", label: "완벽한 관리", desc: "체중 0 및 실수 없이 돌보았습니다" },
    ]
  },
  en: {
    S_EVOLVING: "Evolving!",
    S_EATING: "Yum yum!",
    S_LIKES: "It likes it!",
    S_HUNGRY: "It's hungry!",
    S_NEEDS_BATH: "Needs a bath!",
    S_EXHAUSTED: "Worn out...",
    S_SAD: "Feeling sad...",
    S_CHUBBY: "A bit chubby...",
    S_IS_SHINY: "It's SHINY!!",
    S_HAPPY: "It's happy",
    S_FAREWELL: "THANKS! Farewell",
    S_RUNAWAY: "It ran away...",
    S_GOODBYE: "Bye! Waving goodbye...",
    S_EGG_HDR: "EGG",
    S_EGG_LEGEND: "Legendary egg!?",
    S_EGG_RARE: "Rare egg!",
    S_EGG_TOUCH: "Tap the egg...",
    S_EGG_MOVES: "It moves!",
    S_EGG_ALMOST: "Almost there!",
    S_POKEDEX_FMT: "POKEDEX %u/151",
    S_NAME_FMT: "%s%s Lv.%u",
    S_RELEASE_FMT: "Release %s?",
    S_YES: "YES",
    S_NO: "NO",
    S_HITS_FMT: "%u HITS",
    S_STR_GAIN_FMT: "STR +%u",
    S_NEW_RECORD: "NEW RECORD!",
    S_RECORD_FMT: "BEST: %u",
    S_HIT_FAST: "HIT FAST!",
    S_SCORE_FMT: "SCORE: %u",
    S_GREAT_JOY: "So much fun!",
    S_PLUS_JOY: "+happiness",
    S_SET_TIME: "SET TIME",
    S_HOUR: "HOUR",
    S_MIN: "MIN",
    S_CLOCK_CANCEL: "swipe up: cancel",
    S_LANG_LABEL: "Lang",
    S_MEDAL_BANNER: "MEDAL!",
    S_GREAT: "AWESOME!",
    S_STREAK_DAYS_FMT: "%u DAY STREAK!",
    S_STREAK_FMT: "STREAK %u  best %u",
    S_VIN: "BOND",
    S_BERRY_UNK: "BERRY ???",
    S_BERRY_RED: "RED BERRY",
    S_BERRY_BLUE: "BLUE BERRY",
    S_BERRY_GREEN: "GREEN BERRY",
    S_INFO_FMT: "%s   AGE %lud",
    S_RENAME_HINT: "tap name: rename",
    S_BATTLE: "BATTLE",
    S_STAT_ATK: "ATK",
    S_STAT_DEF: "DEF",
    S_STAT_SPE: "SPD",
    S_STAT_WGT: "WGT",
    S_TRAIN_STR: "TRAIN STRENGTH",
    S_MEDALS_FMT: "MEDALS %d/%d",
    S_BACK: "tap: back",
    S_NAME: "NAME:",
    S_DETAIL_BACK: "tap to go back",
    S_BAR_FOOD: "FOOD",
    S_BAR_JOY: "JOY",
    S_BAR_ENE: "ENE",
    S_BAR_HYG: "HYG",
    S_REC_FMT: "BEST %u",
    S_PROGRESS: "PROGRESS",
    S_LVL_FMT: "Lv.%u",
    S_NEXT_LVL_FMT: "%u min to Lv.%u",
    S_EVO_LABEL: "EVOLUTION",
    S_FINAL_FORM: "Final form",
    S_EVO_READY: "Ready to evolve!",
    S_EVO_BLOCKED: "All needs >=40 to evolve",
    S_EVO_IN_FMT: "Evolves in %u lv.",
    S_MISTAKES_FMT: "Slip-ups: %u",
    S_SND_ON: "SND ON",
    S_SND_OFF: "SND OFF",
    S_EVO_TAP: "EVOLVE!",
    S_FAREWELL_BTN: "%s wants to tell you...",
    S_RUNAWAY_BTN: "%s feels abandoned...",
    S_EVO_Q: "Evolve?",
    S_EVO_KEEP: "Keep form",
    S_FAR_Q: "Say goodbye?",
    S_FAR_GO: "Goodbye",
    S_FAR_STAY: "Stay together",
    S_CHOOSE_STARTER: "Choose your starter",
    S_NO_SPRITES: "No sprites",
    S_LOAD_SPRITES: "Load sprites...",
    medals: [
      { name: "Lv.10", label: "Reach Lv.10", desc: "Pokemon reached level 10" },
      { name: "Lv.25", label: "Reach Lv.25", desc: "Pokemon reached level 25" },
      { name: "Lv.50", label: "Reach Lv.50", desc: "Pokemon reached level 50" },
      { name: "BERRY", label: "Favorite berry", desc: "Discovered favorite berry flavor" },
      { name: "7 STREAK", label: "7-day streak", desc: "Cared for 7 consecutive days" },
      { name: "BOND", label: "Max bond", desc: "Maximized affection bond" },
      { name: "TOP FORM", label: "Final form", desc: "Reached its final evolution" },
      { name: "IN SHAPE", label: "Fit companion", desc: "Weight 0 and no slip-ups" },
    ]
  }
};

let currentLang = 'ko';

function setLanguage(lang) {
  if (I18N[lang]) {
    currentLang = lang;
    localStorage.setItem('tamapoke_lang', lang);
  }
}

function initLanguage() {
  const saved = localStorage.getItem('tamapoke_lang');
  if (saved && I18N[saved]) {
    currentLang = saved;
  } else {
    currentLang = 'ko'; // 기본 한국어
  }
}

function t(key, ...args) {
  const pack = I18N[currentLang] || I18N['ko'];
  let str = pack[key] || I18N['en'][key] || key;
  if (args.length > 0) {
    for (const arg of args) {
      str = str.replace(/%[usdlu]/, arg);
    }
  }
  return str;
}
