(() => {
  'use strict';

  const DATA = window.PET_SALON_DATA;
  if (Array.isArray(window.PET_SALON_CHARACTERS_50) && window.PET_SALON_CHARACTERS_50.length) {
    DATA.CHAPTERS = window.PET_SALON_CHARACTERS_50;
  }
  if (Array.isArray(window.PET_SALON_STORY_CHAPTERS_10) && window.PET_SALON_STORY_CHAPTERS_10.length) {
    DATA.STORY_CHAPTERS = window.PET_SALON_STORY_CHAPTERS_10;
  }
  if (Array.isArray(window.PET_SALON_WARDROBE_50) && window.PET_SALON_WARDROBE_50.length) {
    DATA.ACCESSORIES = window.PET_SALON_WARDROBE_50;
  }
  const BEHAVIORS = window.PET_SALON_BEHAVIORS || {};
  const PROBLEMS_POOL = window.PET_SALON_PROBLEMS_100 || [];
  const STORAGE_KEY = 'pet_salon_save_v2';
  const BACKUP_STORAGE_KEY = 'pet_salon_save_v2_bak';
  const SESSION_STORAGE_KEY = 'pet_salon_session_v2';
  const SAVE_LOGS_KEY = 'pet_salon_save_logs_v1';
  const MAX_SAVE_LOGS = 50;
  const DEFAULT_NAME = 'Лаки';

  function logSaveEvent(reason, extra = {}) {
    const entry = {
      ts: new Date().toISOString(),
      reason,
      ...extra,
    };
    console.info('[PetSalon][Save]', entry.ts, reason, extra);
    try {
      const prev = JSON.parse(localStorage.getItem(SAVE_LOGS_KEY) || '[]');
      const next = Array.isArray(prev) ? prev.slice(-(MAX_SAVE_LOGS - 1)) : [];
      next.push(entry);
      localStorage.setItem(SAVE_LOGS_KEY, JSON.stringify(next));
    } catch {
      // ignore log storage errors
    }
  }

  window.PetSalonLogs = {
    get() {
      try {
        return JSON.parse(localStorage.getItem(SAVE_LOGS_KEY) || '[]');
      } catch {
        return [];
      }
    },
    clear() {
      try {
        localStorage.removeItem(SAVE_LOGS_KEY);
      } catch {}
    },
  };

  function getTodayKey() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  function createDefaultState() {
    const today = getTodayKey();
    return {
      version: 2,
      updatedAt: new Date().toISOString(),
      screen: 'start',
      soundEnabled: true,
      radio: {
        station: 'lofi',
        volume: 0.45,
      },
      player: {
        customPetName: DEFAULT_NAME,
        onboarded: false,
        coins: 40,
        stars: 0,
      },
      campaign: {
        chapterIndex: 0,
        loopCount: 0,
        cleaned: {},
        scrubProgress: {},
        usedGuestTools: [],
        currentProblemIds: [],
        recentProblemIds: [],
        chapterCompleted: false,
        tipClaimed: false,
        chestsClaimed: [],
      },
      inventory: {
        tools: ['tweezers', 'patches', 'mask'],
        decor: ['wall_peach', 'chairs_classic'],
        accessories: ['bow', 'bandana', 'collar', 'sweater_pink'],
        equippedDecor: { wall: 'peach', chairs: 'classic', plant: 'off', garland: 'off' },
        equippedAccessories: [],
        accessoryColors: {},
      },
      daily: {
        streak: 0,
        lastClaimDate: null,
      },
      quests: {
        date: today,
        progress: { procedures: 0, clients: 0, accessories: 0 },
        claimed: [],
      },
      achievementsClaimed: [],
      stats: {
        proceduresDone: 0,
        clientsServed: 0,
      },
    };
  }

  function normalizeState(raw) {
    const base = createDefaultState();
    if (!raw || typeof raw !== 'object') return base;
    const s = {
      ...base,
      ...raw,
      radio: { ...base.radio, ...(raw.radio || {}) },
      player: { ...base.player, ...(raw.player || {}) },
      campaign: {
        ...base.campaign,
        ...(raw.campaign || {}),
        cleaned: { ...(raw.campaign?.cleaned || {}) },
        scrubProgress: { ...(raw.campaign?.scrubProgress || {}) },
        usedGuestTools: Array.isArray(raw.campaign?.usedGuestTools) ? raw.campaign.usedGuestTools : [],
        currentProblemIds: Array.isArray(raw.campaign?.currentProblemIds) ? raw.campaign.currentProblemIds : [],
        recentProblemIds: Array.isArray(raw.campaign?.recentProblemIds) ? raw.campaign.recentProblemIds : [],
        chestsClaimed: Array.isArray(raw.campaign?.chestsClaimed) ? raw.campaign.chestsClaimed : [],
      },
      inventory: {
        ...base.inventory,
        ...(raw.inventory || {}),
        equippedDecor: { ...base.inventory.equippedDecor, ...(raw.inventory?.equippedDecor || {}) },
        equippedAccessories: Array.isArray(raw.inventory?.equippedAccessories) ? raw.inventory.equippedAccessories : [],
        accessoryColors: { ...(raw.inventory?.accessoryColors || {}) },
      },
      daily: { ...base.daily, ...(raw.daily || {}) },
      quests: {
        ...base.quests,
        ...(raw.quests || {}),
        progress: { ...base.quests.progress, ...(raw.quests?.progress || {}) },
        claimed: Array.isArray(raw.quests?.claimed) ? raw.quests.claimed : [],
      },
      achievementsClaimed: Array.isArray(raw.achievementsClaimed) ? raw.achievementsClaimed : [],
      stats: { ...base.stats, ...(raw.stats || {}) },
    };

    // Сброс ежедневных заданий при смене календарного дня
    const today = getTodayKey();
    if (s.quests.date !== today) {
      s.quests = { date: today, progress: { procedures: 0, clients: 0, accessories: 0 }, claimed: [] };
    }
    // Гарантируем стартовый свитер даже в старых сохранениях
    if (!s.inventory.accessories.includes('sweater_pink')) {
      s.inventory.accessories.push('sweater_pink');
    }

    // После первого ввода имени и старта сразу открываем салон без возврата на стартовый экран
    const hasStarted = Boolean(s.player.onboarded) || s.stats.proceduresDone > 0 || s.player.coins !== 40;
    s.player.onboarded = hasStarted;
    s.screen = hasStarted ? 'game' : 'start';
    return s;
  }

  function getSafeStorage(kind) {
    try {
      const s = window[kind];
      if (!s) return null;
      return s;
    } catch {
      return null;
    }
  }

  function tryParseStorage(kind, key) {
    try {
      const storage = getSafeStorage(kind);
      if (!storage) return null;
      const raw = storage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function loadState() {
    const candidates = [
      tryParseStorage('localStorage', STORAGE_KEY),
      tryParseStorage('sessionStorage', SESSION_STORAGE_KEY),
      tryParseStorage('localStorage', BACKUP_STORAGE_KEY),
    ].filter(Boolean);

    if (candidates.length === 0) return createDefaultState();

    // Берём самое свежее валидное сохранение по updatedAt
    candidates.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    const loaded = normalizeState(candidates[0]);
    logSaveEvent('load', {
      clientIndex: loaded.campaign.chapterIndex + 1,
      coins: loaded.player.coins,
      stars: loaded.player.stars,
    });
    return loaded;
  }

  let state = loadState();
  let activeShopTab = 'tools';
  let activeWardrobeSlot = 'all';
  let activeDockMode = 'care'; // 'care' | 'style'
  let resetConfirmTimer = null;
  let lastSavedJson = '';
  let lastScrubSaveAt = 0;

  function saveState({ force = false, reason = 'action' } = {}) {
    state.updatedAt = new Date().toISOString();
    const json = JSON.stringify(state);
    if (!force && json === lastSavedJson) return;
    lastSavedJson = json;
    let savedOk = true;
    try {
      localStorage.setItem(STORAGE_KEY, json);
      localStorage.setItem(BACKUP_STORAGE_KEY, json);
    } catch (err) {
      savedOk = false;
      console.warn('[PetSalon][Save] localStorage error:', err);
    }
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, json);
    } catch {
      // ignore sessionStorage errors
    }
    logSaveEvent(reason, {
      ok: savedOk,
      client: (state.campaign.chapterIndex % DATA.CHAPTERS.length) + 1,
      coins: state.player.coins,
      stars: state.player.stars,
      cleaned: Object.values(state.campaign.cleaned || {}).filter(Boolean).length,
      radio: state.radio?.station || 'off',
    });
  }

  // ===== DOM =====
  const phoneShell = document.getElementById('salonApp');
  const startScreen = document.getElementById('startScreen');
  const gameScreen = document.getElementById('gameScreen');
  const petNameInput = document.getElementById('petNameInput');
  const petNameField = document.getElementById('petNameField');
  const saveHint = document.getElementById('saveHint');
  const startBtn = document.getElementById('startBtn');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const coinsCount = document.getElementById('coinsCount');
  const starsCount = document.getElementById('starsCount');
  const chapterBadge = document.getElementById('chapterBadge');
  const petDisplayName = document.getElementById('petDisplayName');
  const behaviorBadge = document.getElementById('behaviorBadge');
  const dynamicWardrobeLayer = document.getElementById('dynamicWardrobeLayer');
  const moodEmoji = document.getElementById('moodEmoji');
  const moodProgressFill = document.getElementById('moodProgressFill');
  const progressText = document.getElementById('progressText');
  const storyBubble = document.getElementById('storyBubble');
  const storyTitle = document.getElementById('storyTitle');
  const storyText = document.getElementById('storyText');
  const problemsList = document.getElementById('problemsList');
  const wishPill = document.getElementById('wishPill');
  const gestureHint = document.getElementById('gestureHint');
  const scrubMeter = document.getElementById('scrubMeter');
  const scrubLabel = document.getElementById('scrubLabel');
  const scrubFill = document.getElementById('scrubFill');
  const salonStage = document.getElementById('salonStage');
  const petContainer = document.getElementById('petContainer');
  const activeToolDock = document.getElementById('activeToolDock');
  const activeToolSprite = document.getElementById('activeToolSprite');
  const effectsLayer = document.getElementById('effectsLayer');
  const completeBar = document.getElementById('completeBar');
  const nextClientBtn = document.getElementById('nextClientBtn');
  const toolsTray = document.getElementById('toolsTray');
  const accessoriesStrip = document.getElementById('accessoriesStrip');
  const dockModeCare = document.getElementById('dockModeCare');
  const dockModeStyle = document.getElementById('dockModeStyle');
  const styleModeDot = document.getElementById('styleModeDot');
  const radioDialog = document.getElementById('radioDialog');
  const questsDot = document.getElementById('questsDot');
  const dailyDot = document.getElementById('dailyDot');
  const liveRegion = document.getElementById('liveRegion');

  const decorPlant = document.getElementById('decorPlant');
  const decorGarland = document.getElementById('decorGarland');
  const chairVisitorLeft = document.getElementById('chairVisitorLeft');
  const chairVisitorRight = document.getElementById('chairVisitorRight');
  const furStopLight = document.getElementById('furStopLight');
  const furStopDark = document.getElementById('furStopDark');
  const earsCat = document.getElementById('earsCat');
  const earsDog = document.getElementById('earsDog');
  const earsRaccoon = document.getElementById('earsRaccoon');
  const earsBunny = document.getElementById('earsBunny');
  const earsFox = document.getElementById('earsFox');
  const earsPanda = document.getElementById('earsPanda');
  const earsBear = document.getElementById('earsBear');
  const earsHamster = document.getElementById('earsHamster');
  const raccoonMask = document.getElementById('raccoonMask');
  const pandaSpots = document.getElementById('pandaSpots');

  const shopDialog = document.getElementById('shopDialog');
  const shopList = document.getElementById('shopList');
  const shopTabBtns = Array.from(document.querySelectorAll('[data-shop-tab]'));
  const questsBody = document.getElementById('questsBody');
  const dailyBody = document.getElementById('dailyBody');
  const chaptersBody = document.getElementById('chaptersBody');

  const radioWheel = document.getElementById('radioWheel');
  const radioCenterIco = document.getElementById('radioCenterIco');
  const radioCenterName = document.getElementById('radioCenterName');
  const radioCenterFreq = document.getElementById('radioCenterFreq');
  const radioCenterGenre = document.getElementById('radioCenterGenre');
  const radioToast = document.getElementById('radioToast');
  const radioToastIco = document.getElementById('radioToastIco');
  const radioToastName = document.getElementById('radioToastName');
  const radioToastFreq = document.getElementById('radioToastFreq');
  const headerNowPlaying = document.getElementById('headerNowPlaying');
  const npIcon = document.getElementById('npIcon');
  const npText = document.getElementById('npText');

  const defectElements = {
    unibrow: document.getElementById('defectUnibrow'),
    eyebags: document.getElementById('defectEyebags'),
    pimples: document.getElementById('defectPimples'),
    dirt: document.getElementById('defectDirt'),
    tangles: document.getElementById('defectTangles'),
    wet: document.getElementById('defectWet'),
  };

  const dropZones = Array.from(document.querySelectorAll('.drop-zone'));

  // ===== Web Audio API =====
  let audioCtx = null;

  function getAudioCtx() {
    if (!state.soundEnabled) return null;
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    return audioCtx;
  }

  function playTone({ freq = 520, endFreq = 780, duration = 0.14, type = 'sine', gain = 0.14, delay = 0 }) {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + duration);
    vol.gain.setValueAtTime(0.001, now);
    vol.gain.linearRampToValueAtTime(gain, now + 0.02);
    vol.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(vol);
    vol.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function playProcedureSound(zone) {
    const map = {
      unibrow: [420, 960],
      eyebags: [520, 820],
      pimples: [360, 740],
      dirt: [300, 620],
      tangles: [480, 700],
      wet: [600, 920],
    };
    const [f1, f2] = map[zone] || [450, 800];
    playTone({ freq: f1, endFreq: f2, duration: 0.13, type: 'triangle' });
    playTone({ freq: f2 * 0.85, endFreq: f2 * 1.15, duration: 0.14, type: 'sine', delay: 0.08 });
  }

  function playVictorySound() {
    [523.25, 659.25, 783.99, 1046.5].forEach((n, i) => {
      playTone({ freq: n, endFreq: n * 1.02, duration: 0.22, type: 'triangle', gain: 0.16, delay: i * 0.09 });
    });
  }

  function playClick() { playTone({ freq: 540, endFreq: 660, duration: 0.06, gain: 0.09 }); }
  function playWrong() { playTone({ freq: 230, endFreq: 165, duration: 0.14, type: 'sawtooth', gain: 0.07 }); }
  function playScrubTick(pct) {
    const f = 360 + Math.round((pct / 100) * 340);
    playTone({ freq: f, endFreq: f + 70, duration: 0.055, type: 'sine', gain: 0.06 });
  }

  function spawnParticles(zone, count = 11) {
    const presets = {
      unibrow: ['✨', '✂️', '💫'],
      eyebags: ['💧', '✨', '❄️'],
      pimples: ['🫧', '✨', '🌸'],
      dirt: ['🧼', '🫧', '✨'],
      tangles: ['🪮', '✨', '🌟'],
      wet: ['💨', '✨', '☁️'],
      victory: ['💖', '✨', '⭐', '🎉', '🐾'],
    };
    const symbols = presets[zone] || presets.victory;
    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      el.className = 'particle';
      el.textContent = symbols[i % symbols.length];
      el.style.left = `${50 + (Math.random() * 34 - 17)}%`;
      el.style.top = `${48 + (Math.random() * 24 - 12)}%`;
      el.style.setProperty('--dx', `${Math.round((Math.random() - 0.5) * 120)}px`);
      el.style.setProperty('--dy', `${Math.round(-25 - Math.random() * 90)}px`);
      el.style.setProperty('--rot', `${Math.round((Math.random() - 0.5) * 120)}deg`);
      effectsLayer.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }
  }

  function announce(msg) {
    liveRegion.textContent = '';
    requestAnimationFrame(() => { liveRegion.textContent = msg; });
  }

  // ===== Текущий клиент и тематическая глава =====
  function getCurrentClientIndex() {
    return state.campaign.chapterIndex % DATA.CHAPTERS.length;
  }

  function getCurrentChapter() {
    return DATA.CHAPTERS[getCurrentClientIndex()];
  }

  function getCurrentStoryChapter() {
    const idx = getCurrentClientIndex();
    return DATA.STORY_CHAPTERS.find((sc) => idx >= sc.startIndex && idx < sc.startIndex + sc.count) || DATA.STORY_CHAPTERS[0];
  }

  function getStepInStoryChapter() {
    const idx = getCurrentClientIndex();
    const sc = getCurrentStoryChapter();
    return (idx - sc.startIndex) + 1;
  }

  function getCurrentPetName() {
    const ch = getCurrentChapter();
    return ch.useCustomName ? (state.player.customPetName || DEFAULT_NAME) : ch.name;
  }

  function shuffleCopy(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function generateProblemsForVisitor(ch) {
    if (!PROBLEMS_POOL.length) return [];
    const allZones = ['unibrow', 'eyebags', 'pimples', 'dirt', 'tangles', 'wet'];
    const starterZones = ['unibrow', 'eyebags', 'pimples'];

    // Для 1-го клиента — 3 стартовые зоны; для остальных 49 — максимально разнообразные сочетания (от 2 до 6 зон)
    const desiredCount = ch.id === 1
      ? 3
      : Math.min(allZones.length, Math.max(2, ch.problemCount || ch.defects.length));
    const candidateZones = ch.id === 1
      ? shuffleCopy(starterZones)
      : shuffleCopy(allZones).slice(0, desiredCount);

    const recent = new Set(state.campaign.recentProblemIds || []);
    const picked = [];

    candidateZones.forEach((zone) => {
      const byZone = PROBLEMS_POOL.filter((p) => p.zone === zone);
      const fresh = byZone.filter((p) => !recent.has(p.id));
      const source = fresh.length ? fresh : byZone;
      const choice = source[Math.floor(Math.random() * source.length)];
      if (choice) {
        picked.push(choice);
        recent.add(choice.id);
      }
    });

    state.campaign.currentProblemIds = picked.map((p) => p.id);
    state.campaign.recentProblemIds = Array.from(recent).slice(-36);
    return picked;
  }

  function getActiveProblems() {
    const ch = getCurrentChapter();
    if (!PROBLEMS_POOL.length) {
      return ch.defects.map((z, idx) => ({ id: `f${idx}`, name: z, zone: z, emoji: '✨' }));
    }
    let list = (state.campaign.currentProblemIds || [])
      .map((id) => PROBLEMS_POOL.find((p) => p.id === id))
      .filter(Boolean);
    if (!list.length) {
      list = generateProblemsForVisitor(ch);
    }
    return list;
  }

  function getProblemByZone(zone) {
    return getActiveProblems().find((p) => p.zone === zone) || null;
  }

  function getRequiredDefects() {
    return getActiveProblems().map((p) => p.zone);
  }

  function getCleanedProgress() {
    const req = getRequiredDefects();
    const done = req.filter((z) => Boolean(state.campaign.cleaned[z])).length;
    return { done, total: req.length };
  }

  function checkWishTip() {
    const ch = getCurrentChapter();
    if (!ch.wish || state.campaign.tipClaimed) return;
    if (state.inventory.equippedAccessories.includes(ch.wish.accessoryId)) {
      state.campaign.tipClaimed = true;
      state.player.coins += ch.wish.tipCoins;
      playVictorySound();
      spawnParticles('victory', 12);
      announce(`Пожелание выполнено! Получено +${ch.wish.tipCoins} монет чаевых.`);
    }
  }

  function getClientReward(ch) {
    const usedGuest = (state.campaign.usedGuestTools || []).length > 0;
    if (!usedGuest) {
      return { coins: ch.rewardCoins, stars: ch.rewardStars, usedGuest: false };
    }
    return {
      coins: Math.max(10, Math.round(ch.rewardCoins * 0.65)),
      stars: Math.max(0, ch.rewardStars - 1),
      usedGuest: true,
    };
  }

  // ===== Применение процедуры =====
  function applyProcedure(zone) {
    const req = getRequiredDefects();
    if (!req.includes(zone) || state.campaign.cleaned[zone]) return;

    const tool = Object.values(DATA.TOOLS).find((t) => t.zone === zone);
    if (tool && !state.inventory.tools.includes(tool.id)) {
      if (!state.campaign.usedGuestTools.includes(zone)) {
        state.campaign.usedGuestTools.push(zone);
      }
    }

    state.campaign.cleaned[zone] = true;
    state.stats.proceduresDone += 1;
    state.quests.progress.procedures += 1;

    playProcedureSound(zone);
    spawnParticles(zone, 11);

    const { done, total } = getCleanedProgress();
    if (done === total && !state.campaign.chapterCompleted) {
      const ch = getCurrentChapter();
      const sc = getCurrentStoryChapter();
      const reward = getClientReward(ch);
      state.campaign.chapterCompleted = true;
      state.player.coins += reward.coins;
      state.player.stars += reward.stars;
      state.stats.clientsServed += 1;
      state.quests.progress.clients += 1;

      const chestKey = `loop${state.campaign.loopCount}_ch${sc.id}`;
      if (ch.isChapterFinale && !state.campaign.chestsClaimed.includes(chestKey)) {
        state.campaign.chestsClaimed.push(chestKey);
        state.player.coins += sc.chestCoins;
        state.player.stars += sc.chestStars;
        announce(`Финал ${sc.title} пройден! Сундук главы: +${sc.chestCoins} монет и +${sc.chestStars} звёзд!`);
      } else {
        announce(`Все процедуры выполнены! Получено ${reward.coins} монет.`);
      }

      setTimeout(() => {
        playVictorySound();
        spawnParticles('victory', ch.isChapterFinale ? 26 : 18);
      }, 220);
    }

    saveState();
    render();
  }

  // ===== Выбор инструмента сбоку от персонажа и тактильное вождение пальцем по мордочке =====
  let selectedToolId = null;
  let stagePointerActive = false;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let wrongMoveAccum = 0;
  let lastScrubFxAt = 0;
  let vanishTimer = null;

  const TOOL_OFFSET_X = -34; // Сдвиг левее пальца (~35px)
  const TOOL_OFFSET_Y = -36; // Сдвиг выше пальца (~35px)

  const SCRUB_CONFIG = {
    unibrow: { target: 240, label: 'Убираем монобровь…' },
    eyebags: { target: 240, label: 'Освежаем патчами…' },
    pimples: { target: 270, label: 'Наносим маску…' },
    dirt:    { target: 320, label: 'Смываем пеной…' },
    tangles: { target: 320, label: 'Расчёсываем шерсть…' },
    wet:     { target: 320, label: 'Сушим феном…' },
  };

  function getToolSvg(toolId) {
    const svgs = {
      tweezers: `<svg viewBox="0 0 64 64" width="54" height="54">
        <path class="tweezer-arm-top" d="M48 14 L14 40 L18 44 L49 18 Z" fill="#9aa5b1" stroke="#475569" stroke-width="2.5" stroke-linejoin="round"/>
        <path class="tweezer-arm-bottom" d="M48 14 L24 50 L29 52 L50 18 Z" fill="#cbd5e1" stroke="#475569" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="48" cy="15" r="5" fill="#c9386b"/>
      </svg>`,
      patches: `<svg viewBox="0 0 64 64" width="54" height="54">
        <path d="M6 28 Q19 48 32 30 Q19 35 6 28 Z" fill="#72efdd" stroke="#1f7a52" stroke-width="2.5"/>
        <path d="M32 30 Q45 48 58 28 Q45 35 32 30 Z" fill="#72efdd" stroke="#1f7a52" stroke-width="2.5"/>
        <circle cx="18" cy="34" r="2.3" fill="#ffffff"/>
        <circle cx="46" cy="34" r="2.3" fill="#ffffff"/>
      </svg>`,
      mask: `<svg viewBox="0 0 64 64" width="54" height="54">
        <ellipse cx="32" cy="34" rx="23" ry="20" fill="#a7f3d0" stroke="#1f7a52" stroke-width="2.8"/>
        <ellipse cx="23" cy="30" rx="4.5" ry="3.2" fill="#ffffff"/>
        <ellipse cx="41" cy="30" rx="4.5" ry="3.2" fill="#ffffff"/>
        <path d="M24 42 Q32 47 40 42" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
        <circle cx="15" cy="21" r="3" fill="#d1fae5"/>
      </svg>`,
      sponge: `<svg viewBox="0 0 64 64" width="54" height="54">
        <rect x="12" y="18" width="40" height="28" rx="10" fill="#ffd166" stroke="#b07b09" stroke-width="2.8"/>
        <circle cx="22" cy="28" r="2.5" fill="#e6a825"/>
        <circle cx="34" cy="35" r="3" fill="#e6a825"/>
        <circle cx="43" cy="26" r="2.2" fill="#e6a825"/>
        <circle class="foam-bubble" cx="15" cy="17" r="6" fill="#ffffff" stroke="#a6e3e9" stroke-width="2"/>
        <circle class="foam-bubble" cx="25" cy="13" r="4.5" fill="#ffffff" stroke="#a6e3e9" stroke-width="1.8"/>
        <circle class="foam-bubble" cx="48" cy="17" r="5" fill="#ffffff" stroke="#a6e3e9" stroke-width="2"/>
      </svg>`,
      comb: `<svg viewBox="0 0 64 64" width="54" height="54">
        <rect x="10" y="16" width="44" height="12" rx="6" fill="#ff8fab" stroke="#a62452" stroke-width="2.5"/>
        <path d="M16 28 V48 M22 28 V48 M28 28 V48 M34 28 V48 M40 28 V48 M46 28 V48" stroke="#a62452" stroke-width="3.2" stroke-linecap="round"/>
      </svg>`,
      dryer: `<svg viewBox="0 0 64 64" width="54" height="54">
        <path class="wind-line" d="M4 22 H14 M2 30 H14 M5 38 H14" stroke="#6cc4ff" stroke-width="3" stroke-linecap="round"/>
        <rect x="18" y="16" width="34" height="22" rx="11" fill="#c77dff" stroke="#6c3483" stroke-width="2.6"/>
        <rect x="38" y="34" width="11" height="20" rx="5" fill="#e0aaff" stroke="#6c3483" stroke-width="2.5"/>
        <circle cx="42" cy="27" r="4" fill="#ffffff" opacity="0.7"/>
      </svg>`,
    };
    return svgs[toolId] || '';
  }

  function resetScrubVisuals() {
    state.campaign.scrubProgress = {};
    scrubMeter.hidden = true;
    scrubFill.style.width = '0%';
    Object.values(defectElements).forEach((el) => { el.style.opacity = ''; });
  }

  function clearZoneHighlights() {
    dropZones.forEach((z) => z.classList.remove('is-highlighted', 'is-hint'));
  }

  function hideActiveTool({ vanish = false } = {}) {
    selectedToolId = null;
    stagePointerActive = false;
    scrubMeter.hidden = true;
    clearZoneHighlights();
    salonStage.classList.remove('has-active-tool');
    activeToolDock.classList.remove('is-following', 'is-working');
    activeToolDock.style.left = '';
    activeToolDock.style.top = '';

    clearTimeout(vanishTimer);
    if (vanish && !activeToolDock.hidden) {
      activeToolDock.classList.add('is-vanishing');
      vanishTimer = window.setTimeout(() => {
        activeToolDock.classList.remove('is-vanishing');
        activeToolDock.hidden = true;
      }, 310);
    } else {
      activeToolDock.classList.remove('is-vanishing');
      activeToolDock.hidden = true;
    }
    renderToolsTray();
  }

  function selectTool(toolId) {
    const tool = DATA.TOOLS[toolId];
    if (!tool) return;
    if (state.campaign.cleaned[tool.zone]) return;

    if (selectedToolId === toolId) {
      hideActiveTool({ vanish: false });
      return;
    }

    clearTimeout(vanishTimer);
    selectedToolId = toolId;
    wrongMoveAccum = 0;
    salonStage.classList.add('has-active-tool');
    activeToolDock.classList.remove('is-following', 'is-working', 'is-vanishing');
    activeToolDock.style.left = '';
    activeToolDock.style.top = '';
    activeToolDock.dataset.tool = toolId;
    activeToolSprite.innerHTML = getToolSvg(toolId);
    activeToolDock.hidden = false;

    playClick();
    if (gestureHint && state.stats.proceduresDone === 0) {
      gestureHint.hidden = false;
    }
    renderToolsTray();
    announce(`Выбран инструмент: ${tool.name}. Водите пальцем по нужной зоне питомца.`);
  }

  function rectsOverlap(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  function positionActiveToolAtPointer(clientX, clientY) {
    const x = Math.max(28, Math.min(window.innerWidth - 28, clientX + TOOL_OFFSET_X));
    const y = Math.max(28, Math.min(window.innerHeight - 28, clientY + TOOL_OFFSET_Y));
    activeToolDock.style.left = `${x}px`;
    activeToolDock.style.top = `${y}px`;
    return { x, y };
  }

  function stopStageRubbing() {
    if (!stagePointerActive) return;
    stagePointerActive = false;
    wrongMoveAccum = 0;
    scrubMeter.hidden = true;
    clearZoneHighlights();
    activeToolDock.classList.remove('is-following', 'is-working');
    activeToolDock.style.left = '';
    activeToolDock.style.top = '';
    saveState();
  }

  function handleStagePointerContact(clientX, clientY, stepDist) {
    if (!selectedToolId) return;
    const tool = DATA.TOOLS[selectedToolId];
    if (!tool || state.campaign.cleaned[tool.zone]) return;

    const { x, y } = positionActiveToolAtPointer(clientX, clientY);
    const tipRect = { left: x - 24, right: x + 24, top: y - 24, bottom: y + 24 };
    const zone = tool.zone;
    const targetEl = dropZones.find((z) => z.dataset.zone === zone);
    const petRect = petContainer.getBoundingClientRect();

    clearZoneHighlights();

    if (targetEl && rectsOverlap(tipRect, targetEl.getBoundingClientRect())) {
      wrongMoveAccum = 0;
      if (gestureHint) gestureHint.hidden = true;
      targetEl.classList.add('is-highlighted');
      activeToolDock.classList.add('is-working');

      const cfg = SCRUB_CONFIG[zone] || { target: 260, label: 'Очищаем…' };
      const activeProb = getProblemByZone(zone);
      const gain = Math.max(2.2, Math.min(10, stepDist * 0.42));
      const sp = state.campaign.scrubProgress;
      sp[zone] = Math.min(cfg.target, (sp[zone] || 0) + gain);
      const pct = Math.min(100, Math.round((sp[zone] / cfg.target) * 100));

      scrubMeter.hidden = false;
      scrubLabel.textContent = `${activeProb ? activeProb.name : cfg.label} · ${pct}%`;
      scrubFill.style.width = `${pct}%`;

      const defEl = defectElements[zone];
      if (defEl) defEl.style.opacity = String(Math.max(0.22, 1 - (pct / 100) * 0.78));

      const now = performance.now();
      if (now - lastScrubFxAt > 130) {
        lastScrubFxAt = now;
        spawnParticles(zone, 2);
        playScrubTick(pct);
      }
      if (now - lastScrubSaveAt > 400) {
        lastScrubSaveAt = now;
        saveState({ reason: 'scrub' });
      }

      if (pct >= 100) {
        if (defEl) defEl.style.opacity = '';
        delete sp[zone];
        applyProcedure(zone);
        hideActiveTool({ vanish: true });
      }
    } else {
      activeToolDock.classList.remove('is-working');
      scrubMeter.hidden = true;
      if (rectsOverlap(tipRect, petRect)) {
        wrongMoveAccum += stepDist;
        if (wrongMoveAccum > 85) {
          wrongMoveAccum = 0;
          playWrong();
          const defEl = defectElements[zone];
          if (defEl) {
            defEl.classList.remove('is-nudge');
            void defEl.offsetWidth;
            defEl.classList.add('is-nudge');
          }
        }
      }
    }
  }

  salonStage.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || !selectedToolId) return;
    if (event.target.closest('button')) return;

    stagePointerActive = true;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    wrongMoveAccum = 0;
    activeToolDock.classList.add('is-following');
    salonStage.setPointerCapture(event.pointerId);
    handleStagePointerContact(event.clientX, event.clientY, 5);
  });

  salonStage.addEventListener('pointermove', (event) => {
    if (!stagePointerActive || !selectedToolId) return;
    if (!salonStage.hasPointerCapture(event.pointerId)) return;

    const stepDist = Math.hypot(event.clientX - lastPointerX, event.clientY - lastPointerY);
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    handleStagePointerContact(event.clientX, event.clientY, stepDist);
  });

  salonStage.addEventListener('pointerup', (event) => {
    if (!stagePointerActive) return;
    if (salonStage.hasPointerCapture(event.pointerId)) {
      salonStage.releasePointerCapture(event.pointerId);
    }
    stopStageRubbing();
  });

  salonStage.addEventListener('lostpointercapture', () => stopStageRubbing());

  function bindToolButton(toolEl) {
    toolEl.addEventListener('click', () => {
      selectTool(toolEl.dataset.tool);
    });

    toolEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        applyProcedure(toolEl.dataset.target);
        if (selectedToolId === toolEl.dataset.tool) hideActiveTool({ vanish: true });
      }
    });
  }

  // ===== Рендер инструментов, аксессуаров, магазина, заданий, бонусов =====
  function renderToolsTray() {
    const req = getRequiredDefects();
    toolsTray.innerHTML = '';

    req.forEach((zone) => {
      const tool = Object.values(DATA.TOOLS).find((t) => t.zone === zone);
      if (!tool) return;
      const owned = state.inventory.tools.includes(tool.id);
      const done = Boolean(state.campaign.cleaned[zone]);

      const btn = document.createElement('button');
      btn.type = 'button';
      const isSelected = selectedToolId === tool.id && !done;
      btn.className = `tool-card${done ? ' is-done' : ''}${!owned ? ' is-guest' : ''}${isSelected ? ' is-selected' : ''}`;
      btn.dataset.tool = tool.id;
      btn.dataset.target = zone;
      btn.dataset.guest = String(!owned);
      btn.disabled = done;
      btn.setAttribute('aria-disabled', String(done));
      btn.setAttribute('aria-pressed', String(isSelected));
      btn.setAttribute(
        'aria-label',
        done
          ? `${tool.name}: выполнено`
          : owned
            ? `${tool.name}: выберите и проведите по питомцу, или нажмите Enter`
            : `${tool.name} (гостевой инструмент: бесплатно с уменьшенной наградой)`
      );
      btn.innerHTML = `
        ${!owned && !done ? '<span class="tool-guest-tag" aria-hidden="true">Гость</span>' : ''}
        <span class="tool-emoji" aria-hidden="true">${tool.emoji}</span>
        <span class="tool-label">${tool.name}</span>
        <span class="tool-badge" aria-hidden="true">✓</span>
      `;
      bindToolButton(btn);
      toolsTray.appendChild(btn);
    });
  }

  function equipOrCycleAccessoryColor(accId) {
    const item = DATA.ACCESSORIES.find((a) => a.id === accId);
    if (!item) return;
    const equipped = state.inventory.equippedAccessories.includes(accId);
    if (equipped) {
      // Повторное нажатие на надетую вещь циклически меняет её цвет (10 вариантов: 0..9 -> 0)
      const prev = Number(state.inventory.accessoryColors?.[accId] || 0);
      state.inventory.accessoryColors[accId] = (prev + 1) % 10;
      spawnParticles('victory', 4);
    } else {
      if (item.slot) {
        state.inventory.equippedAccessories = state.inventory.equippedAccessories.filter((id) => {
          const existing = DATA.ACCESSORIES.find((a) => a.id === id);
          return !existing || existing.slot !== item.slot;
        });
      }
      state.inventory.equippedAccessories.push(accId);
      state.quests.progress.accessories += 1;
      checkWishTip();
    }
  }

  function unequipAccessory(accId) {
    state.inventory.equippedAccessories = state.inventory.equippedAccessories.filter((id) => id !== accId);
  }

  function renderWardrobeSvg(petName) {
    if (!dynamicWardrobeLayer || typeof window.renderWardrobeItemSvg !== 'function') return;
    const order = { body: 1, neck: 2, eyes: 3, head: 4, flair: 5 };
    const equippedItems = state.inventory.equippedAccessories
      .map((id) => DATA.ACCESSORIES.find((a) => a.id === id))
      .filter(Boolean)
      .sort((a, b) => (order[a.slot] || 9) - (order[b.slot] || 9));
    dynamicWardrobeLayer.innerHTML = equippedItems
      .map((item) => {
        const colorIdx = state.inventory.accessoryColors?.[item.id] || 0;
        return window.renderWardrobeItemSvg(item, petName, colorIdx);
      })
      .join('');
  }

  function getShortAccessoryName(acc) {
    const words = String(acc.name || '').trim().split(/\s+/);
    if (words.length <= 1) return words[0] || '';
    const adjRe = /(ый|ий|ой|ая|яя|ое|ее|ые|ие)$/i;
    if (adjRe.test(words[0]) && words[1]) {
      return words[1].charAt(0).toUpperCase() + words[1].slice(1);
    }
    return words[0];
  }

  function renderAccessoriesStrip() {
    accessoriesStrip.innerHTML = '';
    DATA.ACCESSORIES.filter((a) => state.inventory.accessories.includes(a.id)).forEach((acc) => {
      const equipped = state.inventory.equippedAccessories.includes(acc.id);
      const colorIdx = state.inventory.accessoryColors?.[acc.id] || 0;
      const swatch = typeof window.getWardrobeVariantColors === 'function'
        ? window.getWardrobeVariantColors(acc, colorIdx).c1
        : acc.c1;

      const wrap = document.createElement('span');
      wrap.className = 'acc-item-wrap';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'acc-btn';
      btn.setAttribute('aria-pressed', String(equipped));
      const shortLabel = getShortAccessoryName(acc);
      btn.title = equipped ? `Цвет ${colorIdx + 1}/10 — нажмите ещё раз, чтобы сменить цвет` : `Надеть ${acc.name}`;
      btn.innerHTML = `${acc.emoji} ${shortLabel}${equipped ? ` <small>${colorIdx + 1}/10</small>` : ''}<span class="acc-color-dot" style="background:${swatch}" aria-hidden="true"></span>`;
      btn.addEventListener('click', () => {
        playClick();
        equipOrCycleAccessoryColor(acc.id);
        saveState();
        render();
      });
      wrap.appendChild(btn);

      if (equipped) {
        const rm = document.createElement('button');
        rm.type = 'button';
        rm.className = 'acc-unequip-btn';
        rm.setAttribute('aria-label', `Снять ${acc.name}`);
        rm.textContent = '×';
        rm.addEventListener('click', () => {
          playClick();
          unequipAccessory(acc.id);
          saveState();
          render();
        });
        wrap.appendChild(rm);
      }

      accessoriesStrip.appendChild(wrap);
    });

    const moreBtn = document.createElement('button');
    moreBtn.type = 'button';
    moreBtn.className = 'acc-btn acc-more-btn';
    moreBtn.textContent = `👗 Все (${DATA.ACCESSORIES.length})`;
    moreBtn.addEventListener('click', () => {
      playClick();
      activeShopTab = 'accessories';
      renderShop();
      shopDialog.showModal();
    });
    accessoriesStrip.appendChild(moreBtn);
  }

  function renderShop() {
    shopTabBtns.forEach((b) => {
      const active = b.dataset.shopTab === activeShopTab;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', String(active));
    });

    shopList.innerHTML = '';

    if (activeShopTab === 'tools') {
      Object.values(DATA.TOOLS).forEach((tool) => {
        const owned = state.inventory.tools.includes(tool.id);
        const card = document.createElement('div');
        card.className = 'list-card';
        card.innerHTML = `
          <div class="list-card-info">
            <div class="list-card-title">${tool.emoji} ${tool.name}</div>
            <div class="list-card-desc">${owned ? tool.desc : `${tool.desc} · 100% монет и все ⭐`}</div>
          </div>
        `;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = owned ? 'btn-pill' : 'btn-pill btn-primary';
        btn.disabled = owned || state.player.coins < tool.price;
        btn.textContent = owned ? 'Куплено ✓' : `Купить · ${tool.price}💰`;
        btn.addEventListener('click', () => {
          if (owned || state.player.coins < tool.price) return;
          state.player.coins -= tool.price;
          state.inventory.tools.push(tool.id);
          playVictorySound();
          saveState();
          render();
          renderShop();
        });
        card.appendChild(btn);
        shopList.appendChild(card);
      });
    } else if (activeShopTab === 'decor') {
      DATA.DECOR.forEach((item) => {
        const owned = state.inventory.decor.includes(item.id);
        const equipped = state.inventory.equippedDecor[item.slot] === item.value;
        const card = document.createElement('div');
        card.className = 'list-card';
        card.innerHTML = `
          <div class="list-card-info">
            <div class="list-card-title">${item.name}</div>
            <div class="list-card-desc">${item.desc}</div>
          </div>
        `;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = equipped ? 'btn-pill btn-mint' : owned ? 'btn-pill' : 'btn-pill btn-primary';
        btn.disabled = !owned && state.player.coins < item.price;
        btn.textContent = equipped ? 'Активно ✓' : owned ? 'Выбрать' : `${item.price}💰`;
        btn.addEventListener('click', () => {
          playClick();
          if (!owned) {
            if (state.player.coins < item.price) return;
            state.player.coins -= item.price;
            state.inventory.decor.push(item.id);
          }
          state.inventory.equippedDecor[item.slot] = item.value;
          saveState();
          render();
          renderShop();
        });
        card.appendChild(btn);
        shopList.appendChild(card);
      });
    } else {
      const slots = [
        { id: 'all', label: `Все (${DATA.ACCESSORIES.length})` },
        { id: 'owned', label: `✓ Мои (${state.inventory.accessories.length})` },
        { id: 'head', label: '👑 Голова' },
        { id: 'eyes', label: '🕶️ Очки' },
        { id: 'neck', label: '🧣 Шея' },
        { id: 'body', label: '👗 Одежда' },
        { id: 'flair', label: '🪽 Магия' },
      ];
      const filterRow = document.createElement('div');
      filterRow.className = 'wardrobe-filter-row';
      slots.forEach((sl) => {
        const fb = document.createElement('button');
        fb.type = 'button';
        fb.className = `filter-pill${activeWardrobeSlot === sl.id ? ' is-active' : ''}`;
        fb.textContent = sl.label;
        fb.addEventListener('click', () => {
          playClick();
          activeWardrobeSlot = sl.id;
          renderShop();
        });
        filterRow.appendChild(fb);
      });
      shopList.appendChild(filterRow);

      const wishedId = getCurrentChapter().wish?.accessoryId;
      let filtered = activeWardrobeSlot === 'all'
        ? DATA.ACCESSORIES.slice()
        : activeWardrobeSlot === 'owned'
          ? DATA.ACCESSORIES.filter((a) => state.inventory.accessories.includes(a.id))
          : DATA.ACCESSORIES.filter((a) => a.slot === activeWardrobeSlot);

      // Закрепляем наверху вещь, которую просит текущий гость
      if (wishedId) {
        filtered.sort((a, b) => (b.id === wishedId ? 1 : 0) - (a.id === wishedId ? 1 : 0));
      }

      filtered.forEach((acc) => {
        const owned = state.inventory.accessories.includes(acc.id);
        const equipped = state.inventory.equippedAccessories.includes(acc.id);
        const isWished = acc.id === wishedId;
        const card = document.createElement('div');
        card.className = `list-card${isWished ? ' wish-shop-card' : ''}`;
        card.innerHTML = `
          <div class="list-card-info">
            <div class="list-card-title">${acc.emoji} ${acc.name}<span class="rarity-tag rarity-${acc.rarity}">${acc.rarityLabel}</span></div>
            <div class="list-card-desc">${isWished ? '💭 Хочет текущий гость! · ' : ''}${owned ? 'В твоём гардеробе' : 'Открывает новый образ для питомцев'}</div>
          </div>
        `;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = equipped ? 'btn-pill btn-mint' : owned ? 'btn-pill' : 'btn-pill btn-primary';
        btn.disabled = !owned && state.player.coins < acc.price;
        btn.textContent = equipped ? 'Надето ✓' : owned ? 'Надеть' : `${acc.price}💰`;
        btn.addEventListener('click', () => {
          playClick();
          if (!owned) {
            if (state.player.coins < acc.price) return;
            state.player.coins -= acc.price;
            state.inventory.accessories.push(acc.id);
            equipOrCycleAccessoryColor(acc.id);
          } else if (equipped) {
            unequipAccessory(acc.id);
          } else {
            equipOrCycleAccessoryColor(acc.id);
          }
          saveState();
          render();
          renderShop();
        });
        card.appendChild(btn);
        shopList.appendChild(card);
      });
    }
  }

  function hasClaimableQuestsOrAchievements() {
    const qReady = DATA.DAILY_QUESTS.some((q) => !state.quests.claimed.includes(q.id) && (state.quests.progress[q.type] || 0) >= q.target);
    const aReady = DATA.ACHIEVEMENTS.some((a) => !state.achievementsClaimed.includes(a.id) && a.check(state));
    return qReady || aReady;
  }

  function renderQuests() {
    questsBody.innerHTML = '<div class="section-heading">Ежедневные задания</div>';
    DATA.DAILY_QUESTS.forEach((q) => {
      const val = Math.min(q.target, state.quests.progress[q.type] || 0);
      const claimed = state.quests.claimed.includes(q.id);
      const ready = !claimed && val >= q.target;
      const card = document.createElement('div');
      card.className = 'list-card';
      card.innerHTML = `
        <div class="list-card-info">
          <div class="list-card-title">${q.title}</div>
          <div class="list-card-desc">Прогресс: ${val} / ${q.target} · Награда: +${q.reward}💰</div>
        </div>
      `;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = ready ? 'btn-pill btn-mint' : 'btn-pill';
      btn.disabled = !ready;
      btn.textContent = claimed ? 'Забрано ✓' : ready ? `Забрать +${q.reward}` : `${val}/${q.target}`;
      btn.addEventListener('click', () => {
        if (!ready) return;
        state.quests.claimed.push(q.id);
        state.player.coins += q.reward;
        playVictorySound();
        saveState();
        render();
        renderQuests();
      });
      card.appendChild(btn);
      questsBody.appendChild(card);
    });

    const achHead = document.createElement('div');
    achHead.className = 'section-heading';
    achHead.textContent = 'Достижения';
    questsBody.appendChild(achHead);

    DATA.ACHIEVEMENTS.forEach((a) => {
      const claimed = state.achievementsClaimed.includes(a.id);
      const ready = !claimed && a.check(state);
      const card = document.createElement('div');
      card.className = 'list-card';
      card.innerHTML = `
        <div class="list-card-info">
          <div class="list-card-title">🏆 ${a.title}</div>
          <div class="list-card-desc">${a.desc} · <span class="nowrap">+${a.reward}💰</span></div>
        </div>
      `;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = ready ? 'btn-pill btn-mint' : 'btn-pill';
      btn.disabled = !ready;
      btn.textContent = claimed ? 'Готово ✓' : ready ? `Забрать +${a.reward}` : 'В процессе';
      btn.addEventListener('click', () => {
        if (!ready) return;
        state.achievementsClaimed.push(a.id);
        state.player.coins += a.reward;
        playVictorySound();
        saveState();
        render();
        renderQuests();
      });
      card.appendChild(btn);
      questsBody.appendChild(card);
    });
  }

  function isDailyAvailable() {
    return state.daily.lastClaimDate !== getTodayKey();
  }

  function renderDaily() {
    const canClaim = isDailyAvailable();
    const nextDayIdx = state.daily.streak % 7;
    const reward = DATA.DAILY_REWARDS[nextDayIdx];

    dailyBody.innerHTML = `
      <p class="save-note">Заходи в салон каждый день и собирай награды! Текущая серия: <strong>${state.daily.streak} дн.</strong></p>
      <div class="daily-grid">
        ${DATA.DAILY_REWARDS.map((r, i) => {
          const claimed = i < (state.daily.streak % 7) || (!canClaim && i === ((state.daily.streak - 1) % 7));
          const isToday = canClaim && i === nextDayIdx;
          return `<div class="daily-day${claimed ? ' is-claimed' : ''}${isToday ? ' is-today' : ''}">
            <div>${r.label}</div>
            <div>+${r.coins}💰</div>
          </div>`;
        }).join('')}
      </div>
    `;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = canClaim ? 'btn-pill btn-primary' : 'btn-pill';
    btn.style.width = '100%';
    btn.disabled = !canClaim;
    btn.textContent = canClaim ? `Забрать бонус дня (+${reward.coins}💰)` : 'Сегодня бонус уже получен ✓';
    btn.addEventListener('click', () => {
      if (!canClaim) return;
      state.daily.lastClaimDate = getTodayKey();
      state.daily.streak += 1;
      state.player.coins += reward.coins;
      playVictorySound();
      saveState();
      render();
      renderDaily();
    });
    dailyBody.appendChild(btn);
  }

  function renderChaptersMap() {
    if (!chaptersBody) return;
    const currentIdx = getCurrentClientIndex();
    const currentSc = getCurrentStoryChapter();
    chaptersBody.innerHTML = '';

    DATA.STORY_CHAPTERS.forEach((sc) => {
      const completedInChapter = Math.max(
        0,
        Math.min(
          sc.count,
          currentIdx > sc.startIndex + sc.count - 1
            ? sc.count
            : currentIdx < sc.startIndex
              ? 0
              : (currentIdx - sc.startIndex) + (state.campaign.chapterCompleted ? 1 : 0)
        )
      );
      const pct = Math.round((completedInChapter / sc.count) * 100);
      const chestKey = `loop${state.campaign.loopCount}_ch${sc.id}`;
      const chestOpened = state.campaign.chestsClaimed.includes(chestKey);

      const card = document.createElement('div');
      card.className = `chapter-map-card${sc.id === currentSc.id ? ' is-current' : ''}`;

      const clients = DATA.CHAPTERS.slice(sc.startIndex, sc.startIndex + sc.count);
      const tagsHtml = clients.map((c, offset) => {
        const absIdx = sc.startIndex + offset;
        const isDone = absIdx < currentIdx || (absIdx === currentIdx && state.campaign.chapterCompleted);
        const isActive = absIdx === currentIdx;
        const label = c.useCustomName ? (state.player.customPetName || DEFAULT_NAME) : c.name;
        const prefix = c.isChapterFinale ? '👑 ' : isDone ? '✓ ' : '';
        return `<span class="chapter-client-tag${isDone ? ' is-done' : ''}${isActive ? ' is-active' : ''}">${prefix}${label}</span>`;
      }).join('');

      card.innerHTML = `
        <div class="chapter-map-head">
          <div>
            <div class="chapter-map-title">${sc.title}</div>
            <div class="chapter-map-sub">${sc.subtitle}</div>
          </div>
          <span class="stat-chip chip-chapter">Пройдено ${completedInChapter}/${sc.count}</span>
        </div>
        <div class="chapter-progress-bar">
          <div class="chapter-progress-fill" style="width: ${pct}%"></div>
        </div>
        <div class="chapter-clients-row">${tagsHtml}</div>
        <div class="chapter-chest-row">
          ${chestOpened ? '✅ Сундук главы получен!' : `🎁 Финальный сундук: +${sc.chestCoins}💰 · +${sc.chestStars}⭐`}
        </div>
      `;
      chaptersBody.appendChild(card);
    });
  }

  function buildMiniVisitorSvg(ch) {
    const earsMap = {
      cat: `<path d="M26 42 L20 14 L42 28 Z" fill="${ch.furDark}" stroke="#6b4e38" stroke-width="3" stroke-linejoin="round"/>
            <path d="M74 42 L80 14 L58 28 Z" fill="${ch.furDark}" stroke="#6b4e38" stroke-width="3" stroke-linejoin="round"/>`,
      dog: `<ellipse cx="20" cy="52" rx="10" ry="20" transform="rotate(14 20 52)" fill="${ch.furDark}" stroke="#6b4e38" stroke-width="3"/>
            <ellipse cx="80" cy="52" rx="10" ry="20" transform="rotate(-14 80 52)" fill="${ch.furDark}" stroke="#6b4e38" stroke-width="3"/>`,
      raccoon: `<circle cx="28" cy="28" r="10" fill="#7d818c" stroke="#4f525c" stroke-width="3"/>
                <circle cx="72" cy="28" r="10" fill="#7d818c" stroke="#4f525c" stroke-width="3"/>`,
      bunny: `<ellipse cx="36" cy="20" rx="8" ry="19" transform="rotate(-10 36 20)" fill="${ch.furLight}" stroke="#6b4e38" stroke-width="3"/>
              <ellipse cx="64" cy="20" rx="8" ry="19" transform="rotate(10 64 20)" fill="${ch.furLight}" stroke="#6b4e38" stroke-width="3"/>`,
      fox: `<path d="M24 42 L14 12 L44 26 Z" fill="#e07a3a" stroke="#6b3b1c" stroke-width="3" stroke-linejoin="round"/>
            <path d="M76 42 L86 12 L56 26 Z" fill="#e07a3a" stroke="#6b3b1c" stroke-width="3" stroke-linejoin="round"/>`,
      panda: `<circle cx="26" cy="28" r="11" fill="#2b2d34" stroke="#18191e" stroke-width="3"/>
              <circle cx="74" cy="28" r="11" fill="#2b2d34" stroke="#18191e" stroke-width="3"/>`,
      bear: `<circle cx="26" cy="28" r="11" fill="${ch.furDark}" stroke="#6b4e38" stroke-width="3"/>
             <circle cx="74" cy="28" r="11" fill="${ch.furDark}" stroke="#6b4e38" stroke-width="3"/>`,
      hamster: `<circle cx="30" cy="30" r="8" fill="${ch.furDark}" stroke="#6b4e38" stroke-width="3"/>
                <circle cx="70" cy="30" r="8" fill="${ch.furDark}" stroke="#6b4e38" stroke-width="3"/>`,
    };
    const mask = ch.species === 'raccoon'
      ? `<ellipse cx="38" cy="50" rx="10" ry="8" fill="#5b5f6b" opacity="0.5"/><ellipse cx="62" cy="50" rx="10" ry="8" fill="#5b5f6b" opacity="0.5"/>`
      : ch.species === 'panda'
        ? `<ellipse cx="38" cy="50" rx="9" ry="7" fill="#2b2d34" opacity="0.72"/><ellipse cx="62" cy="50" rx="9" ry="7" fill="#2b2d34" opacity="0.72"/>`
        : '';
    return `<svg viewBox="0 0 100 100" width="68" height="68" aria-hidden="true">
      <ellipse cx="50" cy="86" rx="26" ry="18" fill="${ch.furDark}" stroke="#6b4e38" stroke-width="3"/>
      ${earsMap[ch.species] || earsMap.cat}
      <ellipse cx="50" cy="52" rx="30" ry="27" fill="${ch.furLight}" stroke="#6b4e38" stroke-width="3"/>
      ${mask}
      <circle cx="38" cy="50" r="4.2" fill="#2d2320"/>
      <circle cx="62" cy="50" r="4.2" fill="#2d2320"/>
      <circle cx="36.5" cy="48.5" r="1.4" fill="#ffffff"/>
      <circle cx="60.5" cy="48.5" r="1.4" fill="#ffffff"/>
      <polygon points="47,57 53,57 50,61" fill="#eb8a9b"/>
      <path d="M44 66 Q50 62 56 66" fill="none" stroke="#6b4e38" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`;
  }

  function renderChairVisitors() {
    const idx = getCurrentClientIndex();
    const next1 = DATA.CHAPTERS[(idx + 1) % DATA.CHAPTERS.length];
    const next2 = DATA.CHAPTERS[(idx + 2) % DATA.CHAPTERS.length];
    if (chairVisitorLeft) {
      chairVisitorLeft.innerHTML = buildMiniVisitorSvg(next1);
      chairVisitorLeft.title = `В очереди: ${next1.name}`;
    }
    if (chairVisitorRight) {
      chairVisitorRight.innerHTML = buildMiniVisitorSvg(next2);
      chairVisitorRight.title = `Далее: ${next2.name}`;
    }
  }

  // ===== Основная отрисовка =====
  function render() {
    const ch = getCurrentChapter();
    const sc = getCurrentStoryChapter();
    const stepInChapter = getStepInStoryChapter();
    const petName = getCurrentPetName();
    const { done, total } = getCleanedProgress();

    // Темы интерьера
    phoneShell.dataset.wall = state.inventory.equippedDecor.wall;
    phoneShell.dataset.chairs = state.inventory.equippedDecor.chairs;
    decorPlant.hidden = state.inventory.equippedDecor.plant !== 'on';
    decorGarland.hidden = state.inventory.equippedDecor.garland !== 'on';

    // Экраны
    startScreen.hidden = state.screen !== 'start';
    gameScreen.hidden = state.screen !== 'game';

    // Стартовая подсказка сохранения и адаптация экрана для вернувшихся игроков
    const hasProgress = state.stats.proceduresDone > 0 || state.player.coins !== 40;
    saveHint.hidden = !hasProgress;
    if (hasProgress) {
      saveHint.textContent = `Сохранено: Глава ${sc.id} (${stepInChapter}/${sc.count}) · 💰 ${state.player.coins} · ⭐ ${state.player.stars}`;
    }
    startBtn.textContent = hasProgress ? 'ПРОДОЛЖИТЬ' : 'НАЧАТЬ';
    if (petNameField) {
      petNameField.hidden = !ch.useCustomName;
    }

    // Режим нижней панели (Уход / Образ)
    const isCare = activeDockMode === 'care';
    toolsTray.hidden = !isCare;
    accessoriesStrip.hidden = isCare;
    dockModeCare?.classList.toggle('is-active', isCare);
    dockModeCare?.setAttribute('aria-selected', String(isCare));
    dockModeStyle?.classList.toggle('is-active', !isCare);
    dockModeStyle?.setAttribute('aria-selected', String(!isCare));
    if (styleModeDot) {
      const wishPending = Boolean(ch.wish && !state.campaign.tipClaimed);
      styleModeDot.hidden = !(wishPending && isCare);
    }

    // Шапка
    coinsCount.textContent = String(state.player.coins);
    starsCount.textContent = String(state.player.stars);
    chapterBadge.textContent = `Гл. ${sc.id} · ${stepInChapter}/${sc.count}`;
    petDisplayName.textContent = petName;

    // Вид питомца, окрас и поведение (характер)
    furStopLight.setAttribute('stop-color', ch.furLight);
    furStopDark.setAttribute('stop-color', ch.furDark);
    earsCat.toggleAttribute('hidden', ch.species !== 'cat');
    earsDog.toggleAttribute('hidden', ch.species !== 'dog');
    earsRaccoon.toggleAttribute('hidden', ch.species !== 'raccoon');
    earsBunny.toggleAttribute('hidden', ch.species !== 'bunny');
    earsFox.toggleAttribute('hidden', ch.species !== 'fox');
    earsPanda.toggleAttribute('hidden', ch.species !== 'panda');
    earsBear?.toggleAttribute('hidden', ch.species !== 'bear');
    earsHamster?.toggleAttribute('hidden', ch.species !== 'hamster');
    raccoonMask.toggleAttribute('hidden', ch.species !== 'raccoon');
    pandaSpots.toggleAttribute('hidden', ch.species !== 'panda');

    const beh = BEHAVIORS[ch.behavior];
    petContainer.dataset.behavior = ch.behavior || 'shy';
    if (behaviorBadge) {
      behaviorBadge.hidden = !beh;
      if (beh) behaviorBadge.textContent = `${beh.emoji} ${beh.label}`;
    }

    // Настроение (0..3)
    const ratio = total > 0 ? done / total : 1;
    const moodLevel = done === 0 ? 0 : done === total ? 3 : ratio < 0.6 ? 1 : 2;
    petContainer.dataset.mood = String(moodLevel);
    petContainer.classList.toggle('is-celebrating', done === total);
    progressText.textContent = `${done} / ${total}`;
    moodEmoji.textContent = ['😢', '😕', '🙂', '😻'][moodLevel];
    if (moodProgressFill) {
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      moodProgressFill.style.width = `${pct}%`;
      moodProgressFill.classList.toggle('is-complete', done === total && total > 0);
    }

    if (ch.isChapterFinale) {
      storyTitle.hidden = false;
      storyTitle.textContent = '👑 VIP';
    } else {
      storyTitle.hidden = true;
      storyTitle.textContent = '';
    }
    const behReaction = beh && done > 0 && done < total
      ? `«${beh.reactions[(done - 1) % beh.reactions.length]}»`
      : null;
    storyText.hidden = false;
    storyText.classList.toggle('is-complete', done === total);
    if (done === total) {
      const reward = getClientReward(ch);
      if (ch.isChapterFinale) {
        storyText.textContent = `🎉 +${reward.coins}💰 + сундук`;
      } else if (reward.usedGuest) {
        storyText.textContent = `Готово! +${reward.coins}💰`;
      } else {
        storyText.textContent = `Ура! +${reward.coins}💰 и +${reward.stars}⭐`;
      }
    } else if (behReaction) {
      storyText.textContent = behReaction;
    } else {
      storyText.textContent = 'Выбери инструмент';
    }

    if (problemsList) {
      const probs = getActiveProblems();
      problemsList.innerHTML = probs.map((p) => {
        const isDone = Boolean(state.campaign.cleaned[p.zone]);
        return `<span class="problem-chip${isDone ? ' is-done' : ''}">${isDone ? '✓' : p.emoji} ${p.name}</span>`;
      }).join('');
    }

    if (ch.wish) {
      const fulfilled = state.campaign.tipClaimed || state.inventory.equippedAccessories.includes(ch.wish.accessoryId);
      wishPill.hidden = false;
      wishPill.classList.toggle('is-fulfilled', fulfilled);
      wishPill.innerHTML = fulfilled
        ? `<span class="wish-text">✅ Пожелание выполнено!</span><span class="wish-reward">+${ch.wish.tipCoins}💰</span>`
        : `<span class="wish-text">💭 «${ch.wish.text}»</span><span class="wish-reward">+${ch.wish.tipCoins}💰</span>`;
    } else {
      wishPill.hidden = true;
    }

    completeBar.hidden = done !== total;

    // Дефекты (восстанавливаем и частичное протирание после возврата из фона)
    const activeZones = getRequiredDefects();
    Object.entries(defectElements).forEach(([zone, el]) => {
      const active = activeZones.includes(zone);
      const cleaned = active && Boolean(state.campaign.cleaned[zone]);
      el.classList.toggle('is-inactive', !active);
      el.classList.toggle('is-cleaned', cleaned);
      if (active && !cleaned) {
        const cfg = SCRUB_CONFIG[zone];
        const partial = state.campaign.scrubProgress?.[zone] || 0;
        if (cfg && partial > 0) {
          const pct = Math.min(100, (partial / cfg.target) * 100);
          el.style.opacity = String(Math.max(0.22, 1 - (pct / 100) * 0.78));
        } else {
          el.style.opacity = '';
        }
      } else {
        el.style.opacity = '';
      }
    });

    // Аксессуары и одежда на питомце (50 элементов)
    renderWardrobeSvg(petName);

    // Звук и индикаторы
    soundToggleBtn.textContent = state.soundEnabled ? '🔊' : '🔇';
    soundToggleBtn.setAttribute('aria-pressed', String(state.soundEnabled));
    questsDot.hidden = !hasClaimableQuestsOrAchievements();
    dailyDot.hidden = !isDailyAvailable();

    renderToolsTray();
    renderAccessoriesStrip();
    renderChairVisitors();
  }

  // ===== События интерфейса =====
  petNameInput.value = state.player.customPetName === DEFAULT_NAME ? '' : state.player.customPetName;

  petNameInput.addEventListener('input', () => {
    state.player.customPetName = petNameInput.value.trim() || DEFAULT_NAME;
    saveState();
    const nm = getCurrentPetName();
    petDisplayName.textContent = nm;
    renderWardrobeSvg(nm);
  });

  startBtn.addEventListener('click', () => {
    playClick();
    state.player.customPetName = petNameInput.value.trim() || state.player.customPetName || DEFAULT_NAME;
    state.player.onboarded = true;
    state.screen = 'game';
    saveState({ reason: 'start' });
    render();
  });

  // Переключение режима нижней панели (Уход / Образ)
  [dockModeCare, dockModeStyle].forEach((btn) => {
    btn?.addEventListener('click', () => {
      playClick();
      activeDockMode = btn.dataset.dockMode === 'style' ? 'style' : 'care';
      if (activeDockMode === 'style') hideActiveTool({ vanish: false });
      render();
    });
  });

  // Закрытие всех <dialog> по тапу на затемнённый фон (backdrop)
  document.querySelectorAll('dialog.sheet-dialog').forEach((dlg) => {
    dlg.addEventListener('click', (event) => {
      if (event.target === dlg && dlg.open) {
        dlg.close();
      }
    });
  });

  let isTransitioningClient = false;

  nextClientBtn.addEventListener('click', () => {
    if (isTransitioningClient) return;
    isTransitioningClient = true;
    playClick();
    hideActiveTool({ vanish: false });
    resetScrubVisuals();
    completeBar.hidden = true;

    // Фаза 1: плавный уход текущего клиента, скрытие карточки и выход гостя из левого кресла
    storyBubble?.classList.add('is-switching');
    petContainer.classList.remove('is-celebrating', 'is-arriving');
    petContainer.classList.add('is-leaving');
    chairVisitorLeft?.classList.add('is-coming-forward');
    chairVisitorRight?.classList.add('is-shifting-left');

    window.setTimeout(() => {
      state.campaign.chapterIndex += 1;
      if (state.campaign.chapterIndex >= DATA.CHAPTERS.length) {
        state.campaign.chapterIndex = 0;
        state.campaign.loopCount += 1;
      }
      state.campaign.cleaned = {};
      state.campaign.usedGuestTools = [];
      state.campaign.chapterCompleted = false;
      state.campaign.tipClaimed = false;
      state.inventory.equippedAccessories = [];
      generateProblemsForVisitor(getCurrentChapter());
      saveState({ reason: 'next_client' });

      petContainer.classList.remove('is-leaving');
      chairVisitorLeft?.classList.remove('is-coming-forward');
      chairVisitorRight?.classList.remove('is-shifting-left');

      // Фаза 2: плавное появление нового клиента, карточки и посадка нового гостя в правое кресло
      render();
      void petContainer.offsetWidth;
      petContainer.classList.add('is-arriving');
      chairVisitorRight?.classList.add('is-seating');
      requestAnimationFrame(() => {
        storyBubble?.classList.remove('is-switching');
      });

      window.setTimeout(() => {
        petContainer.classList.remove('is-arriving');
        chairVisitorRight?.classList.remove('is-seating');
        isTransitioningClient = false;
      }, 580);
    }, 520);
  });

  soundToggleBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    if (audioCtx) {
      if (!state.soundEnabled && audioCtx.state === 'running') audioCtx.suspend().catch(() => {});
      if (state.soundEnabled && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    }
    if (window.PetSalonRadio) window.PetSalonRadio.setMuted(!state.soundEnabled);
    saveState({ reason: 'sound_toggle' });
    render();
    if (state.soundEnabled) playClick();
  });

  // ===== GTA-радиостанция салона =====
  const RADIO = window.PetSalonRadio;
  let radioToastTimer = null;

  function showRadioToast(st) {
    if (!st || !radioToast || radioDialog?.open) return;
    radioToastIco.textContent = st.emoji;
    radioToastName.textContent = st.name;
    radioToastFreq.textContent = `${st.freq} · ${st.genre}`;
    radioToast.hidden = false;
    clearTimeout(radioToastTimer);
    radioToastTimer = window.setTimeout(() => {
      radioToast.hidden = true;
    }, 2200);
  }

  function renderRadioWheel() {
    if (!RADIO || !radioWheel) return;
    const currentId = state.radio.station || 'off';
    const current = RADIO.getStation(currentId);

    radioCenterIco.textContent = current.emoji;
    radioCenterName.textContent = current.name;
    radioCenterFreq.textContent = current.freq;
    radioCenterGenre.textContent = current.genre;

    radioWheel.querySelectorAll('.wheel-node').forEach((n) => n.remove());
    const radius = 100;
    const cx = 138;
    const cy = 138;

    RADIO.STATIONS.forEach((st, idx) => {
      const angle = (-Math.PI / 2) + (idx * 2 * Math.PI) / RADIO.STATIONS.length;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `wheel-node${st.id === currentId ? ' is-active' : ''}`;
      btn.style.left = `${x}px`;
      btn.style.top = `${y}px`;
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(st.id === currentId));
      btn.setAttribute('aria-label', `${st.name} (${st.freq})`);
      btn.innerHTML = `<span class="wheel-node-ico" aria-hidden="true">${st.emoji}</span><span class="wheel-node-label">${st.short || st.name.split(' ')[0]}</span>`;
      btn.addEventListener('click', () => {
        state.radio.station = st.id;
        const chosen = RADIO.setStation(st.id, { withStatic: true, autoplay: true });
        saveState();
        renderRadioWheel();
        showRadioToast(chosen);
      });
      btn.setAttribute('tabindex', st.id === currentId ? '0' : '-1');
      btn.addEventListener('keydown', (event) => {
        if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) return;
        event.preventDefault();
        const dir = (event.key === 'ArrowRight' || event.key === 'ArrowDown') ? 1 : -1;
        const nextIdx = (idx + dir + RADIO.STATIONS.length) % RADIO.STATIONS.length;
        const nextSt = RADIO.STATIONS[nextIdx];
        state.radio.station = nextSt.id;
        const chosen = RADIO.setStation(nextSt.id, { withStatic: true, autoplay: true });
        saveState();
        renderRadioWheel();
        showRadioToast(chosen);
        radioWheel.querySelector('.wheel-node.is-active')?.focus();
      });
      radioWheel.appendChild(btn);
    });
  }

  function updateHeaderNowPlaying(info, st) {
    if (!headerNowPlaying || !st) return;
    if (st.id === 'off') {
      headerNowPlaying.classList.add('is-empty');
      return;
    }
    headerNowPlaying.classList.remove('is-empty');
    npIcon.textContent = st.emoji;
    if (info && info.artist) {
      npText.textContent = info.track
        ? `${info.artist} — ${info.track}`
        : info.artist;
    } else {
      npText.textContent = `${st.name} · ${st.freq}`;
    }
  }

  if (RADIO) {
    // Миграция старых id станций
    if (state.radio.station === 'pop') state.radio.station = 'kpop';
    if (state.radio.station === 'night') state.radio.station = 'jazz';

    RADIO.onTrackChange((info, st) => updateHeaderNowPlaying(info, st));

    const radioVolumeSlider = document.getElementById('radioVolumeSlider');
    const radioVolIcon = document.getElementById('radioVolIcon');
    const radioVolValue = document.getElementById('radioVolValue');

    function applyRadioVolumeUi(vol01) {
      const clamped = Math.max(0, Math.min(1, Number.isFinite(vol01) ? vol01 : 0.65));
      const pct = Math.round(clamped * 100);
      RADIO.setVolume(clamped);
      if (radioVolumeSlider) {
        radioVolumeSlider.value = String(pct);
        radioVolumeSlider.style.setProperty('--vol-pct', `${pct}%`);
      }
      if (radioVolValue) radioVolValue.textContent = `${pct}%`;
      if (radioVolIcon) {
        radioVolIcon.textContent = pct === 0 ? '🔇' : pct <= 35 ? '🔈' : pct <= 70 ? '🔉' : '🔊';
      }
    }

    const savedVol = typeof state.radio.volume === 'number' ? state.radio.volume : 0.65;
    applyRadioVolumeUi(savedVol);

    if (radioVolumeSlider) {
      radioVolumeSlider.addEventListener('input', () => {
        const vol01 = Number(radioVolumeSlider.value) / 100;
        state.radio.volume = vol01;
        applyRadioVolumeUi(vol01);
      });
      radioVolumeSlider.addEventListener('change', () => {
        saveState();
      });
    }

    RADIO.setMuted(!state.soundEnabled);
    const initSt = RADIO.setStation(state.radio.station || 'kpop', { withStatic: false, autoplay: false });
    updateHeaderNowPlaying(RADIO.getNowPlaying(), initSt);

    document.querySelectorAll('[commandfor="radioDialog"]').forEach((el) => {
      if (el.getAttribute('command') === 'show-modal') {
        el.addEventListener('click', () => {
          renderRadioWheel();
        });
      }
    });

    // Разблокировка Web Audio после первого касания (iPhone Safari)
    window.addEventListener('pointerdown', () => RADIO.unlock(), { once: true });
    renderRadioWheel();
  }

  // Вкладки магазина и обновление содержимого при открытии модалок
  shopTabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      playClick();
      activeShopTab = btn.dataset.shopTab;
      renderShop();
      shopList.scrollTop = 0;
    });
  });

  document.querySelectorAll('[commandfor="shopDialog"]').forEach((el) => {
    if (el.getAttribute('command') === 'show-modal') el.addEventListener('click', renderShop);
  });
  document.querySelectorAll('[commandfor="questsDialog"]').forEach((el) => {
    if (el.getAttribute('command') === 'show-modal') el.addEventListener('click', renderQuests);
  });
  document.querySelectorAll('[commandfor="dailyDialog"]').forEach((el) => {
    if (el.getAttribute('command') === 'show-modal') el.addEventListener('click', renderDaily);
  });
  document.querySelectorAll('[commandfor="chaptersDialog"]').forEach((el) => {
    if (el.getAttribute('command') === 'show-modal') el.addEventListener('click', renderChaptersMap);
  });

  // Гарантированный офлайн-фолбэк для кнопок commandfor, если браузер не поддерживает Invoker Commands
  if (!('commandForElement' in HTMLButtonElement.prototype)) {
    document.querySelectorAll('button[commandfor][command]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.getAttribute('commandfor'));
        if (!target || target.tagName !== 'DIALOG') return;
        const cmd = btn.getAttribute('command');
        if (cmd === 'show-modal' && !target.open) target.showModal();
        if (cmd === 'close' && target.open) target.close();
      });
    });
  }

  // ===== Непрерывное фоновое автосохранение с логированием =====
  window.setInterval(() => {
    saveState({ force: true, reason: 'heartbeat' });
  }, 5000);

  // Критично для iOS Safari: сохраняем при сворачивании, заморозке и выгрузке
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      saveState({ force: true, reason: 'visibilitychange:hidden' });
      if (RADIO) RADIO.setMuted(true);
    } else if (document.visibilityState === 'visible') {
      if (RADIO) {
        RADIO.setMuted(!state.soundEnabled);
        RADIO.unlock();
      }
      logSaveEvent('visibilitychange:visible', {
        client: (state.campaign.chapterIndex % DATA.CHAPTERS.length) + 1,
      });
    }
  });

  window.addEventListener('pagehide', () => saveState({ force: true, reason: 'pagehide' }));
  window.addEventListener('freeze', () => saveState({ force: true, reason: 'freeze' }));
  window.addEventListener('beforeunload', () => saveState({ force: true, reason: 'beforeunload' }));
  window.addEventListener('pageshow', () => {
    render();
  });

  saveState({ force: true, reason: 'init' });
  render();
})();
