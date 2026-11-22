(() => {
  'use strict';

  const STATIONS = [
    {
      id: 'off',
      freq: 'OFF',
      name: 'Радио выкл',
      short: 'Выкл',
      emoji: '🔇',
      genre: 'Тишина',
      streams: [],
    },
    {
      id: 'kpop',
      freq: '107.7 FM',
      name: 'Kawaii Pop',
      short: 'Kawaii',
      emoji: '🎀',
      genre: 'Девчачий поп',
      streams: [
        'https://kathy.torontocast.com:3060/stream',
        'https://stream.zeno.fm/bgblhk5vv5uuv',
        'https://0n-pop.radionetz.de/0n-pop.mp3',
      ],
    },
    {
      id: 'lofi',
      freq: '98.4 FM',
      name: 'FluxFM Chillhop',
      short: 'Lo-Fi',
      emoji: '☕',
      genre: 'Chillhop',
      streams: [
        'https://streams.fluxfm.de/Chillhop/mp3-128/',
        'https://listen.reyfm.de/lofi_320kbps.mp3',
      ],
    },
    {
      id: 'spa',
      freq: '101.2 FM',
      name: '0N Relax',
      short: 'Спа',
      emoji: '🫧',
      genre: 'Спа-релакс',
      streams: [
        'https://0n-relax.radionetz.de/0n-relax.mp3',
        'https://0n-chillout.radionetz.de/0n-chillout.mp3',
        'https://streams.fluxfm.de/chillout/mp3-128/',
      ],
    },
    {
      id: 'jazz',
      freq: '103.5 FM',
      name: 'Radio Swiss Jazz',
      short: 'Джаз',
      emoji: '🎷',
      genre: 'Живой джаз',
      streams: [
        'https://stream.srg-ssr.ch/m/rsj/mp3_128',
        'https://0n-jazz.radionetz.de/0n-jazz.mp3',
      ],
    },
    {
      id: 'classic',
      freq: '92.1 FM',
      name: 'Radio Swiss Classic',
      short: 'Классик',
      emoji: '🎻',
      genre: 'Оркестр',
      streams: [
        'https://stream.srg-ssr.ch/m/rsc_de/mp3_128',
        'https://0n-klassik.radionetz.de/0n-klassik.mp3',
      ],
    },
  ];

  let ctx = null;
  let audioEl = null;
  let currentStationId = 'off';
  let currentStreamIdx = 0;
  let volume = 1;
  let muted = false;
  let status = 'off'; // 'off' | 'connecting' | 'live' | 'error'
  let connectTimer = null;
  let metaTimer = null;
  let nowPlaying = { artist: '', track: '', raw: '' };
  const statusListeners = new Set();
  const trackListeners = new Set();

  function emitStatus(nextStatus) {
    status = nextStatus;
    statusListeners.forEach((fn) => {
      try { fn(status, getStation(currentStationId)); } catch {}
    });
  }

  function emitTrack() {
    trackListeners.forEach((fn) => {
      try { fn({ ...nowPlaying }, getStation(currentStationId)); } catch {}
    });
  }

  async function fetchNowPlaying(stId) {
    if (!stId || stId === 'off') {
      nowPlaying = { artist: '', track: '', raw: '' };
      emitTrack();
      return;
    }
    try {
      const resp = await fetch(`/api/nowplaying?station=${encodeURIComponent(stId)}`, { cache: 'no-store' });
      if (!resp.ok) return;
      const data = await resp.json();
      if (stId !== currentStationId) return;
      nowPlaying = {
        artist: data.artist || '',
        track: data.track || '',
        raw: data.raw || '',
      };
      emitTrack();
    } catch {
      // Статический запуск без server.py — оставляем название станции
    }
  }

  function startMetaPolling(stId) {
    clearInterval(metaTimer);
    nowPlaying = { artist: '', track: '', raw: '' };
    emitTrack();
    if (!stId || stId === 'off') return;
    if (window.location.hostname.endsWith('github.io')) return;
    fetchNowPlaying(stId);
    metaTimer = window.setInterval(() => fetchNowPlaying(currentStationId), 25000);
  }

  function getStation(id = currentStationId) {
    return STATIONS.find((x) => x.id === id) || STATIONS[0];
  }

  function ensureContext() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function ensureAudioEl() {
    if (audioEl) return audioEl;
    audioEl = new Audio();
    audioEl.preload = 'none';
    audioEl.playsInline = true;
    audioEl.volume = muted ? 0 : volume;

    audioEl.addEventListener('playing', () => {
      clearTimeout(connectTimer);
      if (currentStationId !== 'off') emitStatus('live');
    });

    audioEl.addEventListener('waiting', () => {
      if (currentStationId !== 'off') emitStatus('connecting');
    });

    audioEl.addEventListener('error', () => {
      if (muted || currentStationId === 'off') return;
      tryNextFailover();
    });

    return audioEl;
  }

  function stopStream() {
    clearTimeout(connectTimer);
    if (!audioEl) return;
    try {
      audioEl.pause();
      audioEl.removeAttribute('src');
      audioEl.load();
    } catch {}
  }

  function tryNextFailover() {
    const st = getStation(currentStationId);
    if (!st.streams || st.streams.length === 0) return;
    currentStreamIdx += 1;
    if (currentStreamIdx < st.streams.length) {
      playCurrentStreamUrl();
    } else {
      emitStatus('error');
    }
  }

  function playCurrentStreamUrl() {
    const st = getStation(currentStationId);
    if (!st.streams || !st.streams[currentStreamIdx]) {
      emitStatus('error');
      return;
    }
    const el = ensureAudioEl();
    clearTimeout(connectTimer);
    emitStatus('connecting');

    el.src = st.streams[currentStreamIdx];
    el.muted = muted;
    el.volume = muted ? 0 : volume;
    if (muted) {
      el.pause();
      return;
    }
    const p = el.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        // Автовоспроизведение заблокировано до первого касания — запустим в unlock()
      });
    }

    // Если поток не заиграл за 7 секунд — пробуем резервный сервер
    connectTimer = window.setTimeout(() => {
      if (!muted && currentStationId !== 'off' && status === 'connecting') {
        tryNextFailover();
      }
    }, 7000);
  }

  function updateAudioVolume() {
    if (muted) {
      // На iOS Safari полностью останавливаем поток, чтобы звук пропал мгновенно
      if (audioEl) audioEl.muted = true;
      stopStream();
      if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
      return;
    }
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    if (audioEl) {
      audioEl.muted = false;
      audioEl.volume = volume;
    }
    if (currentStationId !== 'off') {
      playCurrentStreamUrl();
    }
  }

  // Короткий радио-шипок настройки частоты (как в GTA)
  function playStaticBurst() {
    const c = ensureContext();
    if (!c || muted) return;
    const duration = 0.14;
    const bufferSize = Math.floor(c.sampleRate * duration);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.45));
    }
    const noise = c.createBufferSource();
    noise.buffer = buffer;

    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 1.4;

    const g = c.createGain();
    g.gain.value = Math.min(0.18, volume * 0.35);

    noise.connect(filter);
    filter.connect(g);
    g.connect(c.destination);
    noise.start();
  }

  window.PetSalonRadio = {
    STATIONS,
    getStation,
    getCurrentId() {
      return currentStationId;
    },
    getStatus() {
      return status;
    },
    getNowPlaying() {
      return { ...nowPlaying };
    },
    onStatusChange(fn) {
      statusListeners.add(fn);
      return () => statusListeners.delete(fn);
    },
    onTrackChange(fn) {
      trackListeners.add(fn);
      return () => trackListeners.delete(fn);
    },
    setStation(id, { withStatic = true, autoplay = true } = {}) {
      const target = STATIONS.find((x) => x.id === id) ? id : 'off';
      currentStationId = target;
      currentStreamIdx = 0;
      if (withStatic) playStaticBurst();
      if (target === 'off') {
        stopStream();
        startMetaPolling('off');
        emitStatus('off');
      } else if (autoplay) {
        playCurrentStreamUrl();
        startMetaPolling(target);
      } else {
        emitStatus('connecting');
        startMetaPolling(target);
      }
      return getStation(target);
    },
    nextStation() {
      const idx = STATIONS.findIndex((x) => x.id === currentStationId);
      const next = STATIONS[(idx + 1) % STATIONS.length];
      return this.setStation(next.id, { withStatic: true, autoplay: true });
    },
    setVolume(v) {
      volume = Math.max(0, Math.min(1, Number(v) || 0));
      updateAudioVolume();
    },
    setMuted(isMuted) {
      muted = Boolean(isMuted);
      updateAudioVolume();
    },
    unlock() {
      ensureContext();
      if (muted || currentStationId === 'off') return;
      const el = ensureAudioEl();
      el.muted = false;
      if (el.paused) {
        if (!el.src) {
          playCurrentStreamUrl();
        } else {
          el.play().catch(() => {});
        }
      }
    },
  };
})();
