(() => {
  'use strict';

  const STORAGE_KEY = 'pet_salon_save_v1';
  const DEFAULT_NAME = 'Лаки';

  const DEFAULT_STATE = {
    petName: DEFAULT_NAME,
    screen: 'start',
    soundEnabled: true,
    cleaned: {
      unibrow: false,
      eyebags: false,
      pimples: false,
    },
    accessories: {
      bow: false,
      bandana: false,
      collar: false,
    },
  };

  // DOM
  const startScreen = document.getElementById('startScreen');
  const gameScreen = document.getElementById('gameScreen');
  const petNameInput = document.getElementById('petNameInput');
  const saveHint = document.getElementById('saveHint');
  const startBtn = document.getElementById('startBtn');
  const backToStartBtn = document.getElementById('backToStartBtn');
  const petDisplayName = document.getElementById('petDisplayName');
  const collarNameText = document.getElementById('collarNameText');
  const resetBtn = document.getElementById('resetBtn');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const moodEmoji = document.getElementById('moodEmoji');
  const progressText = document.getElementById('progressText');
  const moodBanner = document.getElementById('moodBanner');
  const petContainer = document.getElementById('petContainer');
  const effectsLayer = document.getElementById('effectsLayer');
  const liveRegion = document.getElementById('liveRegion');

  const defectElements = {
    unibrow: document.getElementById('defectUnibrow'),
    eyebags: document.getElementById('defectEyebags'),
    pimples: document.getElementById('defectPimples'),
  };

  const accessoryElements = {
    bow: document.getElementById('accBow'),
    bandana: document.getElementById('accBandana'),
    collar: document.getElementById('accCollar'),
  };

  const dropZones = Array.from(document.querySelectorAll('.drop-zone'));
  const toolCards = Array.from(document.querySelectorAll('.tool-card'));
  const accButtons = Array.from(document.querySelectorAll('.acc-btn'));

  // ===== Сохранение и загрузка (localStorage) =====
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_STATE);
      const parsed = JSON.parse(raw);
      return {
        petName: typeof parsed.petName === 'string' && parsed.petName.trim() ? parsed.petName.trim() : DEFAULT_NAME,
        screen: parsed.screen === 'game' ? 'game' : 'start',
        soundEnabled: parsed.soundEnabled !== false,
        cleaned: {
          unibrow: Boolean(parsed.cleaned?.unibrow),
          eyebags: Boolean(parsed.cleaned?.eyebags),
          pimples: Boolean(parsed.cleaned?.pimples),
        },
        accessories: {
          bow: Boolean(parsed.accessories?.bow),
          bandana: Boolean(parsed.accessories?.bandana),
          collar: Boolean(parsed.accessories?.collar),
        },
      };
    } catch {
      return structuredClone(DEFAULT_STATE);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Игнорируем, если localStorage недоступен
    }
  }

  let state = loadState();

  // ===== Простой синтезатор звуков (Web Audio API) =====
  let audioCtx = null;

  function getAudioCtx() {
    if (!state.soundEnabled) return null;
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playTone({ freq = 520, endFreq = 780, duration = 0.16, type = 'sine', gain = 0.16, delay = 0 }) {
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
    if (zone === 'unibrow') {
      // Щипцы: звонкий быстрый «щипок»
      playTone({ freq: 420, endFreq: 960, duration: 0.12, type: 'triangle', gain: 0.18 });
      playTone({ freq: 720, endFreq: 1180, duration: 0.14, type: 'sine', gain: 0.14, delay: 0.08 });
    } else if (zone === 'eyebags') {
      // Патчи: мягкий освежающий блеск
      playTone({ freq: 523, endFreq: 659, duration: 0.18, type: 'sine', gain: 0.16 });
      playTone({ freq: 659, endFreq: 880, duration: 0.22, type: 'sine', gain: 0.16, delay: 0.1 });
    } else if (zone === 'pimples') {
      // Маска: пузырьки чистоты
      playTone({ freq: 340, endFreq: 680, duration: 0.12, type: 'sine', gain: 0.15 });
      playTone({ freq: 480, endFreq: 820, duration: 0.12, type: 'sine', gain: 0.15, delay: 0.09 });
      playTone({ freq: 640, endFreq: 1040, duration: 0.18, type: 'triangle', gain: 0.15, delay: 0.18 });
    }
  }

  function playVictorySound() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      playTone({ freq: n, endFreq: n * 1.02, duration: 0.24, type: 'triangle', gain: 0.17, delay: idx * 0.1 });
    });
  }

  function playWrongSound() {
    playTone({ freq: 240, endFreq: 170, duration: 0.16, type: 'sawtooth', gain: 0.08 });
  }

  function playClickSound() {
    playTone({ freq: 520, endFreq: 640, duration: 0.07, type: 'sine', gain: 0.1 });
  }

  // ===== Визуальные эффекты («что-то выходит») =====
  function spawnParticles(zone, count = 10) {
    const presets = {
      unibrow: { x: 50, y: 38, symbols: ['✨', '✂️', '💫', '⭐'] },
      eyebags: { x: 50, y: 52, symbols: ['💧', '✨', '❄️', '💎'] },
      pimples: { x: 50, y: 56, symbols: ['🫧', '✨', '🌸', '💚'] },
      victory: { x: 50, y: 45, symbols: ['💖', '✨', '⭐', '🎉', '🐾'] },
    };
    const cfg = presets[zone] || presets.victory;

    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      el.className = 'particle';
      el.textContent = cfg.symbols[i % cfg.symbols.length];
      el.style.left = `${cfg.x + (Math.random() * 26 - 13)}%`;
      el.style.top = `${cfg.y + (Math.random() * 18 - 9)}%`;
      el.style.setProperty('--dx', `${Math.round((Math.random() - 0.5) * 140)}px`);
      el.style.setProperty('--dy', `${Math.round(-30 - Math.random() * 100)}px`);
      el.style.setProperty('--rot', `${Math.round((Math.random() - 0.5) * 120)}deg`);
      effectsLayer.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }
  }

  function announce(message) {
    liveRegion.textContent = '';
    requestAnimationFrame(() => {
      liveRegion.textContent = message;
    });
  }

  // ===== Отрисовка состояния =====
  function getCleanedCount() {
    return Object.values(state.cleaned).filter(Boolean).length;
  }

  function render() {
    // Имя питомца
    const displayName = state.petName || DEFAULT_NAME;
    petDisplayName.textContent = displayName;
    collarNameText.textContent = displayName.slice(0, 10);

    // Индикатор сохранения на стартовом экране
    const count = getCleanedCount();
    const hasProgress = count > 0 || Object.values(state.accessories).some(Boolean);
    saveHint.hidden = !hasProgress;

    // Экраны
    startScreen.hidden = state.screen !== 'start';
    gameScreen.hidden = state.screen !== 'game';

    // Настроение и прогресс (0..3)
    petContainer.dataset.mood = String(count);
    petContainer.classList.toggle('is-celebrating', count === 3);
    progressText.textContent = `${count} / 3`;

    const moods = [
      { emoji: '😢', text: `${displayName} грустит… Убери монобровь, синяки и прыщи!` },
      { emoji: '😕', text: `Уже лучше! Осталось ещё 2 процедуры для ${displayName}.` },
      { emoji: '🙂', text: `${displayName} улыбается! Осталась последняя процедура!` },
      { emoji: '😻', text: `Ура! ${displayName} теперь чистый и абсолютно счастливый!` },
    ];
    moodEmoji.textContent = moods[count].emoji;
    moodBanner.textContent = moods[count].text;

    // Дефекты
    Object.entries(defectElements).forEach(([zone, el]) => {
      el.classList.toggle('is-cleaned', Boolean(state.cleaned[zone]));
    });

    // Инструменты
    toolCards.forEach((card) => {
      const target = card.dataset.target;
      const done = Boolean(state.cleaned[target]);
      card.classList.toggle('is-done', done);
    });

    // Аксессуары
    Object.entries(accessoryElements).forEach(([acc, el]) => {
      el.hidden = !state.accessories[acc];
    });
    accButtons.forEach((btn) => {
      const acc = btn.dataset.acc;
      btn.setAttribute('aria-pressed', String(Boolean(state.accessories[acc])));
    });

    // Звук
    soundToggleBtn.textContent = state.soundEnabled ? '🔊' : '🔇';
    soundToggleBtn.setAttribute('aria-pressed', String(state.soundEnabled));
    soundToggleBtn.setAttribute('aria-label', state.soundEnabled ? 'Звук включён' : 'Звук выключен');
  }

  // ===== Применение процедуры =====
  function applyProcedure(zone) {
    if (state.cleaned[zone]) return;
    state.cleaned[zone] = true;
    saveState();
    render();

    playProcedureSound(zone);
    spawnParticles(zone, 12);

    const names = {
      unibrow: 'Монобровь убрана!',
      eyebags: 'Синяки под глазами исчезли!',
      pimples: 'Прыщи очищены!',
    };
    const count = getCleanedCount();
    if (count === 3) {
      setTimeout(() => {
        playVictorySound();
        spawnParticles('victory', 20);
      }, 260);
      announce(`${names[zone]} Все процедуры выполнены, котик полностью счастлив!`);
    } else {
      announce(`${names[zone]} Прогресс: ${count} из 3.`);
    }
  }

  // ===== Перетаскивание инструментов через Pointer Events (без HTML5 Drag-and-Drop) =====
  let activeDrag = null;

  function rectsOverlap(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  function findHoveredZone(toolRect) {
    // Проверяем сначала целевую зону, затем остальные
    for (const zoneEl of dropZones) {
      const zoneRect = zoneEl.getBoundingClientRect();
      if (rectsOverlap(toolRect, zoneRect)) {
        return zoneEl;
      }
    }
    return null;
  }

  function clearZoneHighlights() {
    dropZones.forEach((z) => z.classList.remove('is-highlighted'));
  }

  function moveDraggedTool(toolEl, left, top) {
    const maxLeft = Math.max(0, window.innerWidth - toolEl.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - toolEl.offsetHeight);
    toolEl.style.left = `${Math.max(0, Math.min(left, maxLeft))}px`;
    toolEl.style.top = `${Math.max(0, Math.min(top, maxTop))}px`;
  }

  function finishDrag(toolEl) {
    if (!activeDrag || activeDrag.el !== toolEl) return;

    const { targetZone, placeholder, wasDragged } = activeDrag;
    const toolRect = toolEl.getBoundingClientRect();

    // Проверка контакта с целевой зоной при отпускании
    if (wasDragged) {
      const targetEl = dropZones.find((z) => z.dataset.zone === targetZone);
      if (targetEl && rectsOverlap(toolRect, targetEl.getBoundingClientRect())) {
        if (!state.cleaned[targetZone]) {
          applyProcedure(targetZone);
        }
      } else {
        // Если отпустили на другой (неверной) зоне котика — лёгкая реакция
        const petRect = petContainer.getBoundingClientRect();
        if (rectsOverlap(toolRect, petRect) && !state.cleaned[targetZone]) {
          playWrongSound();
          petContainer.classList.remove('is-wrong');
          void petContainer.offsetWidth;
          petContainer.classList.add('is-wrong');
        }
      }
    }

    // Возврат инструмента на место в лотке
    clearZoneHighlights();
    toolEl.classList.remove('dragging');
    toolEl.style.left = '';
    toolEl.style.top = '';
    toolEl.style.width = '';
    if (placeholder && placeholder.parentNode) {
      placeholder.remove();
    }

    activeDrag = null;
  }

  toolCards.forEach((toolEl) => {
    toolEl.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      if (activeDrag) return;

      const rect = toolEl.getBoundingClientRect();
      const placeholder = document.createElement('div');
      placeholder.style.width = `${rect.width}px`;
      placeholder.style.height = `${rect.height}px`;
      placeholder.style.flexShrink = '0';

      activeDrag = {
        el: toolEl,
        pointerId: event.pointerId,
        targetZone: toolEl.dataset.target,
        startX: event.clientX,
        startY: event.clientY,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        width: rect.width,
        placeholder,
        wasDragged: false,
      };

      toolEl.setPointerCapture(event.pointerId);
    });

    toolEl.addEventListener('pointermove', (event) => {
      if (!activeDrag || activeDrag.el !== toolEl) return;
      if (!toolEl.hasPointerCapture(event.pointerId)) return;

      const dist = Math.hypot(event.clientX - activeDrag.startX, event.clientY - activeDrag.startY);
      if (!activeDrag.wasDragged && dist < 4) return;

      if (!activeDrag.wasDragged) {
        activeDrag.wasDragged = true;
        toolEl.parentNode.insertBefore(activeDrag.placeholder, toolEl);
        toolEl.style.width = `${activeDrag.width}px`;
        toolEl.classList.add('dragging');
      }

      moveDraggedTool(toolEl, event.clientX - activeDrag.offsetX, event.clientY - activeDrag.offsetY);

      // Проверка контакта прямо во время ведения пальцем
      const toolRect = toolEl.getBoundingClientRect();
      const targetEl = dropZones.find((z) => z.dataset.zone === activeDrag.targetZone);
      clearZoneHighlights();

      if (targetEl && !state.cleaned[activeDrag.targetZone]) {
        const targetRect = targetEl.getBoundingClientRect();
        if (rectsOverlap(toolRect, targetRect)) {
          targetEl.classList.add('is-highlighted');
          // Моментальное срабатывание при контакте с нужной зоной
          applyProcedure(activeDrag.targetZone);
          if (toolEl.hasPointerCapture(event.pointerId)) {
            toolEl.releasePointerCapture(event.pointerId);
          }
          finishDrag(toolEl);
          return;
        }
      } else {
        const hovered = findHoveredZone(toolRect);
        if (hovered && !state.cleaned[hovered.dataset.zone]) {
          hovered.classList.add('is-highlighted');
        }
      }
    });

    toolEl.addEventListener('pointerup', (event) => {
      if (!activeDrag || activeDrag.el !== toolEl) return;
      if (toolEl.hasPointerCapture(event.pointerId)) {
        toolEl.releasePointerCapture(event.pointerId);
      }
      finishDrag(toolEl);
    });

    toolEl.addEventListener('lostpointercapture', () => {
      finishDrag(toolEl);
    });

    // Доступность с клавиатуры (Enter / Пробел применяют выбранный инструмент)
    toolEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const zone = toolEl.dataset.target;
        if (!state.cleaned[zone]) {
          applyProcedure(zone);
        }
      }
    });
  });

  // ===== Обработчики интерфейса =====
  petNameInput.value = state.petName === DEFAULT_NAME ? '' : state.petName;

  petNameInput.addEventListener('input', () => {
    const val = petNameInput.value.trim();
    state.petName = val || DEFAULT_NAME;
    saveState();
    petDisplayName.textContent = state.petName;
    collarNameText.textContent = state.petName.slice(0, 10);
  });

  startBtn.addEventListener('click', () => {
    playClickSound();
    const val = petNameInput.value.trim();
    state.petName = val || state.petName || DEFAULT_NAME;
    state.screen = 'game';
    saveState();
    render();
  });

  backToStartBtn.addEventListener('click', () => {
    playClickSound();
    state.screen = 'start';
    saveState();
    render();
  });

  resetBtn.addEventListener('click', () => {
    playClickSound();
    state.cleaned = {
      unibrow: false,
      eyebags: false,
      pimples: false,
    };
    saveState();
    render();
    announce('Процедуры сброшены. Можно начать заново!');
  });

  soundToggleBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    saveState();
    render();
    if (state.soundEnabled) playClickSound();
  });

  accButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      playClickSound();
      const acc = btn.dataset.acc;
      state.accessories[acc] = !state.accessories[acc];
      saveState();
      render();
    });
  });

  // Первая отрисовка
  render();
})();
