(() => {
  'use strict';

  // 50 уникальных элементов одежды и аксессуаров по 5 слотам (head, eyes, neck, body, flair)
  const WARDROBE = [
    // ===== ГОЛОВА (12) =====
    { id: 'bow',          slot: 'head',  shape: 'bow',     c1: '#ff6b9d', c2: '#ffd166', name: 'Бантик розовый',   emoji: '🎀', rarity: 'common',    rarityLabel: 'Обычный',     price: 0,   starter: true },
    { id: 'bow_mint',     slot: 'head',  shape: 'bow',     c1: '#52b788', c2: '#ffe066', name: 'Бантик мятный',    emoji: '🎀', rarity: 'common',    rarityLabel: 'Обычный',     price: 25,  starter: false },
    { id: 'bow_star',     slot: 'head',  shape: 'bow',     c1: '#9d4edd', c2: '#ffd166', name: 'Бантик звёздный',  emoji: '⭐', rarity: 'rare',      rarityLabel: 'Редкий',      price: 45,  starter: false },
    { id: 'crown',        slot: 'head',  shape: 'crown',   c1: '#ffd166', c2: '#ff5d8f', name: 'Мини-корона',      emoji: '👑', rarity: 'epic',      rarityLabel: 'Эпический',   price: 120, starter: false },
    { id: 'crown_rose',   slot: 'head',  shape: 'crown',   c1: '#ff9ebb', c2: '#ffffff', name: 'Розовая тиара',    emoji: '👑', rarity: 'epic',      rarityLabel: 'Эпический',   price: 135, starter: false },
    { id: 'wreath',       slot: 'head',  shape: 'wreath',  c1: '#52b788', c2: '#ff9ebb', name: 'Венок весенний',   emoji: '🌸', rarity: 'epic',      rarityLabel: 'Эпический',   price: 90,  starter: false },
    { id: 'wreath_autumn',slot: 'head',  shape: 'wreath',  c1: '#d97706', c2: '#f59e0b', name: 'Осенний венок',    emoji: '🍁', rarity: 'rare',      rarityLabel: 'Редкий',      price: 75,  starter: false },
    { id: 'beret_red',    slot: 'head',  shape: 'beret',   c1: '#e63946', c2: '#8f1d28', name: 'Красный берет',    emoji: '🎨', rarity: 'rare',      rarityLabel: 'Редкий',      price: 60,  starter: false },
    { id: 'beret_lilac',  slot: 'head',  shape: 'beret',   c1: '#b892ff', c2: '#6c4ab6', name: 'Лиловый берет',    emoji: '💜', rarity: 'rare',      rarityLabel: 'Редкий',      price: 65,  starter: false },
    { id: 'beanie_cozy',  slot: 'head',  shape: 'beanie',  c1: '#f4a261', c2: '#fff3e6', name: 'Уютная бини',      emoji: '🧶', rarity: 'common',    rarityLabel: 'Обычный',     price: 40,  starter: false },
    { id: 'cap_sport',    slot: 'head',  shape: 'cap',     c1: '#3a86ff', c2: '#ffffff', name: 'Спорт-кепка',      emoji: '🧢', rarity: 'common',    rarityLabel: 'Обычный',     price: 45,  starter: false },
    { id: 'wizard_hat',   slot: 'head',  shape: 'wizard',  c1: '#4a306d', c2: '#ffd166', name: 'Шляпа звездочёта', emoji: '🧙', rarity: 'legendary', rarityLabel: 'Легендарный', price: 180, starter: false },

    // ===== ОЧКИ И ЛИЦО (8) =====
    { id: 'glasses',        slot: 'eyes', shape: 'shades',  c1: '#2b2d42', c2: '#ffd166', name: 'Солнечные очки',    emoji: '🕶️', rarity: 'rare',      rarityLabel: 'Редкий',      price: 55,  starter: false },
    { id: 'glasses_heart',  slot: 'eyes', shape: 'hearts',  c1: '#ff5d8f', c2: '#ffccd5', name: 'Очки-сердечки',     emoji: '🩷', rarity: 'epic',      rarityLabel: 'Эпический',   price: 85,  starter: false },
    { id: 'glasses_round',  slot: 'eyes', shape: 'round',   c1: '#6c4e31', c2: '#e8f4f8', name: 'Круглые очки',      emoji: '👓', rarity: 'common',    rarityLabel: 'Обычный',     price: 35,  starter: false },
    { id: 'glasses_star',   slot: 'eyes', shape: 'stars',   c1: '#f59e0b', c2: '#fef08a', name: 'Звёздные очки',     emoji: '⭐', rarity: 'epic',      rarityLabel: 'Эпический',   price: 95,  starter: false },
    { id: 'glasses_cat',    slot: 'eyes', shape: 'shades',  c1: '#9d4edd', c2: '#ff8fab', name: 'Кошачьи очки',      emoji: '😎', rarity: 'rare',      rarityLabel: 'Редкий',      price: 65,  starter: false },
    { id: 'glasses_cyber',  slot: 'eyes', shape: 'visor',   c1: '#00bbf9', c2: '#9b5de5', name: 'Кибер-визор',       emoji: '🥽', rarity: 'legendary', rarityLabel: 'Легендарный', price: 150, starter: false },
    { id: 'monocle',        slot: 'eyes', shape: 'monocle', c1: '#d4a017', c2: '#e0f7fa', name: 'Монокль',           emoji: '🧐', rarity: 'rare',      rarityLabel: 'Редкий',      price: 70,  starter: false },
    { id: 'blush_stickers', slot: 'eyes', shape: 'stickers',c1: '#ffd166', c2: '#ff6b9d', name: 'Наклейки-звёзды',   emoji: '✨', rarity: 'common',    rarityLabel: 'Обычный',     price: 30,  starter: false },

    // ===== ШЕЯ И ВОРОТНИКИ (12) =====
    { id: 'bandana',        slot: 'neck', shape: 'bandana', c1: '#52b788', c2: '#d8f3dc', name: 'Бандана мятная',    emoji: '🧣', rarity: 'common',    rarityLabel: 'Обычный',     price: 0,   starter: true },
    { id: 'bandana_red',    slot: 'neck', shape: 'bandana', c1: '#e63946', c2: '#ffe5ec', name: 'Бандана алая',      emoji: '🧣', rarity: 'common',    rarityLabel: 'Обычный',     price: 25,  starter: false },
    { id: 'bandana_denim',  slot: 'neck', shape: 'bandana', c1: '#457b9d', c2: '#f1faee', name: 'Бандана джинсовая', emoji: '🧣', rarity: 'common',    rarityLabel: 'Обычный',     price: 30,  starter: false },
    { id: 'collar',         slot: 'neck', shape: 'collar',  c1: '#e63946', c2: '#ffd166', name: 'Ошейник с именем',  emoji: '🏷️', rarity: 'rare',      rarityLabel: 'Редкий',      price: 0,   starter: true },
    { id: 'collar_pink',    slot: 'neck', shape: 'collar',  c1: '#ff6b9d', c2: '#ffe5ec', name: 'Розовый ошейник',   emoji: '🏷️', rarity: 'rare',      rarityLabel: 'Редкий',      price: 45,  starter: false },
    { id: 'collar_gold',    slot: 'neck', shape: 'collar',  c1: '#d4a017', c2: '#fff3b0', name: 'Золотой ошейник',   emoji: '🏷️', rarity: 'epic',      rarityLabel: 'Эпический',   price: 95,  starter: false },
    { id: 'scarf_winter',   slot: 'neck', shape: 'scarf',   c1: '#e76f51', c2: '#f4a261', name: 'Зимний шарф',       emoji: '🧣', rarity: 'common',    rarityLabel: 'Обычный',     price: 40,  starter: false },
    { id: 'scarf_rainbow',  slot: 'neck', shape: 'scarf',   c1: '#ff595e', c2: '#ffca3a', name: 'Радужный шарф',     emoji: '🌈', rarity: 'epic',      rarityLabel: 'Эпический',   price: 90,  starter: false },
    { id: 'bowtie_classic', slot: 'neck', shape: 'bowtie',  c1: '#2b2d42', c2: '#ef233c', name: 'Бабочка-галстук',   emoji: '🎀', rarity: 'common',    rarityLabel: 'Обычный',     price: 35,  starter: false },
    { id: 'bowtie_gold',    slot: 'neck', shape: 'bowtie',  c1: '#f59e0b', c2: '#fef08a', name: 'Золотая бабочка',   emoji: '✨', rarity: 'rare',      rarityLabel: 'Редкий',      price: 60,  starter: false },
    { id: 'pearls',         slot: 'neck', shape: 'pearls',  c1: '#ffffff', c2: '#e2e8f0', name: 'Жемчужные бусы',    emoji: '🤍', rarity: 'epic',      rarityLabel: 'Эпический',   price: 105, starter: false },
    { id: 'bell_ribbon',    slot: 'neck', shape: 'bell',    c1: '#ff8fab', c2: '#ffd166', name: 'Лента с бубенцом',  emoji: '🔔', rarity: 'common',    rarityLabel: 'Обычный',     price: 35,  starter: false },

    // ===== ОДЕЖДА НА ТЕЛЬЦЕ (12) =====
    { id: 'sweater_pink',   slot: 'body', shape: 'sweater', c1: '#ff8fab', c2: '#ffe5ec', name: 'Розовый свитер',    emoji: '👚', rarity: 'common',    rarityLabel: 'Обычный',     price: 0,   starter: true },
    { id: 'sweater_mint',   slot: 'body', shape: 'sweater', c1: '#74c69d', c2: '#d8f3dc', name: 'Мятный свитер',     emoji: '🧶', rarity: 'common',    rarityLabel: 'Обычный',     price: 45,  starter: false },
    { id: 'sweater_stripe', slot: 'body', shape: 'stripe',  c1: '#3a86ff', c2: '#ffffff', name: 'Тельняшка',         emoji: '👕', rarity: 'common',    rarityLabel: 'Обычный',     price: 50,  starter: false },
    { id: 'hoodie_peach',   slot: 'body', shape: 'hoodie',  c1: '#ffaf87', c2: '#fff1e6', name: 'Персиковое худи',   emoji: '🧥', rarity: 'rare',      rarityLabel: 'Редкий',      price: 65,  starter: false },
    { id: 'hoodie_lilac',   slot: 'body', shape: 'hoodie',  c1: '#b892ff', c2: '#f3e8ff', name: 'Лавандовое худи',   emoji: '🧥', rarity: 'rare',      rarityLabel: 'Редкий',      price: 70,  starter: false },
    { id: 'dress_polka',    slot: 'body', shape: 'dress',   c1: '#ff5d8f', c2: '#ffffff', name: 'Платье в горошек',  emoji: '👗', rarity: 'rare',      rarityLabel: 'Редкий',      price: 75,  starter: false },
    { id: 'dress_princess', slot: 'body', shape: 'dress',   c1: '#c77dff', c2: '#ffd166', name: 'Платье принцессы',  emoji: '👗', rarity: 'epic',      rarityLabel: 'Эпический',   price: 125, starter: false },
    { id: 'overalls_denim', slot: 'body', shape: 'overalls',c1: '#457b9d', c2: '#ffd166', name: 'Комбинезон джинс',  emoji: '👖', rarity: 'rare',      rarityLabel: 'Редкий',      price: 80,  starter: false },
    { id: 'cape_hero',      slot: 'body', shape: 'cape',    c1: '#e63946', c2: '#ffd166', name: 'Плащ супергероя',   emoji: '🦸', rarity: 'epic',      rarityLabel: 'Эпический',   price: 115, starter: false },
    { id: 'cape_royal',     slot: 'body', shape: 'cape',    c1: '#7209b7', c2: '#ffd166', name: 'Королевская мантия',emoji: '👑', rarity: 'legendary', rarityLabel: 'Легендарный', price: 190, starter: false },
    { id: 'vest_fluffy',    slot: 'body', shape: 'sweater', c1: '#f4e2d8', c2: '#c9a27c', name: 'Пушистая жилетка',  emoji: '🦺', rarity: 'common',    rarityLabel: 'Обычный',     price: 55,  starter: false },
    { id: 'kimono_sakura',  slot: 'body', shape: 'kimono',  c1: '#ffb3c6', c2: '#fb6f92', name: 'Кимоно сакуры',     emoji: '👘', rarity: 'legendary', rarityLabel: 'Легендарный', price: 175, starter: false },

    // ===== МАГИЯ И ДЕКОР ОБРАЗА (6) =====
    { id: 'wings_angel',    slot: 'flair', shape: 'wings',  c1: '#ffffff', c2: '#dbeafe', name: 'Крылышки ангела',   emoji: '🪽', rarity: 'epic',      rarityLabel: 'Эпический',   price: 130, starter: false },
    { id: 'wings_fairy',    slot: 'flair', shape: 'wings',  c1: '#fbcfe8', c2: '#a5f3fc', name: 'Крылья феи',        emoji: '🧚', rarity: 'legendary', rarityLabel: 'Легендарный', price: 165, starter: false },
    { id: 'halo_gold',      slot: 'flair', shape: 'halo',   c1: '#ffd166', c2: '#fff3b0', name: 'Золотой нимб',      emoji: '😇', rarity: 'legendary', rarityLabel: 'Легендарный', price: 160, starter: false },
    { id: 'aura_hearts',    slot: 'flair', shape: 'hearts', c1: '#ff5d8f', c2: '#ff9ebb', name: 'Аура сердечек',     emoji: '💖', rarity: 'epic',      rarityLabel: 'Эпический',   price: 110, starter: false },
    { id: 'aura_stars',     slot: 'flair', shape: 'stars',  c1: '#ffd166', c2: '#fef08a', name: 'Звёздное сияние',   emoji: '✨', rarity: 'epic',      rarityLabel: 'Эпический',   price: 115, starter: false },
    { id: 'flower_ear',     slot: 'flair', shape: 'flower', c1: '#ff6b9d', c2: '#ffd166', name: 'Цветок у ушка',     emoji: '🌺', rarity: 'common',    rarityLabel: 'Обычный',     price: 30,  starter: false },
  ];

  // 10 уникальных цветовых стилей (вариант 0 = оригинальная палитра вещи + 9 стилизованных тем со сдвигом под каждый слот)
  const SLOT_PALETTES = {
    head: [
      ['#ff6b9d', '#ffe5ec'], ['#40b883', '#fef08a'], ['#9d6bff', '#ede2ff'],
      ['#ffb703', '#fff3b0'], ['#3a86ff', '#dbeafe'], ['#d62828', '#ffd6e0'],
      ['#fb8500', '#ffedd5'], ['#2b2d42', '#ff8fab'], ['#d4a017', '#ffffff'],
    ],
    eyes: [
      ['#ff5d8f', '#ffd6e0'], ['#00b4d8', '#caf0f8'], ['#7209b7', '#f72585'],
      ['#f59e0b', '#fef3c7'], ['#10b981', '#d1fae5'], ['#ef4444', '#fde047'],
      ['#1e293b', '#38bdf8'], ['#ec4899', '#a855f7'], ['#92400e', '#fde68a'],
    ],
    neck: [
      ['#e63946', '#ffd166'], ['#2a9d8f', '#e9c46a'], ['#8338ec', '#ffbe0b'],
      ['#ff006e', '#ffffff'], ['#3a86ff', '#a2d2ff'], ['#fb5607', '#ffea00'],
      ['#52b788', '#d8f3dc'], ['#2b2d42', '#ef233c'], ['#c99700', '#fff7d6'],
    ],
    body: [
      ['#ff8fab', '#fff0f5'], ['#52b788', '#e9f9f0'], ['#8b5cf6', '#f3e8ff'],
      ['#f59e0b', '#fef3c7'], ['#3b82f6', '#dbeafe'], ['#e11d48', '#ffe4e6'],
      ['#f97316', '#ffedd5'], ['#334155', '#38bdf8'], ['#ca8a04', '#fef9c3'],
    ],
    flair: [
      ['#ff6b9d', '#ffd6e0'], ['#60a5fa', '#dbeafe'], ['#c084fc', '#f3e8ff'],
      ['#fbbf24', '#fef3c7'], ['#34d399', '#d1fae5'], ['#f43f5e', '#ffe4e6'],
      ['#fb923c', '#ffedd5'], ['#22d3ee', '#e0f2fe'], ['#eab308', '#ffffff'],
    ],
  };

  function getItemVariantColors(item, colorIndex = 0) {
    const idx = ((Number(colorIndex) || 0) % 10 + 10) % 10;
    if (idx === 0) return { c1: item.c1, c2: item.c2, index: 0 };
    const slotList = SLOT_PALETTES[item.slot] || SLOT_PALETTES.body;
    // Индивидуальный сдвиг по хэшу id вещи, чтобы у каждого элемента был свой порядок оттенков
    let hash = 0;
    for (let i = 0; i < item.id.length; i++) hash = (hash * 31 + item.id.charCodeAt(i)) % 9;
    const [c1, c2] = slotList[(idx - 1 + hash) % slotList.length];
    return { c1, c2, index: idx };
  }

  function renderItemSvg(item, petName = 'Лаки', colorIndex = 0) {
    const { shape } = item;
    const { c1, c2 } = getItemVariantColors(item, colorIndex);
    const safeName = String(petName || 'Лаки').slice(0, 10).replace(/[<>&"]/g, '');

    switch (shape) {
      case 'bow':
        return `<g>
          <path d="M88 92 C66 76, 62 110, 86 102 Z" fill="${c1}" stroke="#5c2a3a" stroke-width="2.8"/>
          <path d="M98 92 C118 72, 126 104, 100 102 Z" fill="${c1}" stroke="#5c2a3a" stroke-width="2.8"/>
          <circle cx="93" cy="97" r="7.5" fill="${c2}" stroke="#5c2a3a" stroke-width="2.2"/>
        </g>`;
      case 'crown':
        return `<g>
          <path d="M124 84 L132 50 L150 68 L160 44 L170 68 L188 50 L196 84 Z" fill="${c1}" stroke="#8a6210" stroke-width="3" stroke-linejoin="round"/>
          <circle cx="160" cy="70" r="5" fill="${c2}"/>
          <circle cx="140" cy="74" r="3.2" fill="#4cc9f0"/>
          <circle cx="180" cy="74" r="3.2" fill="#4cc9f0"/>
        </g>`;
      case 'wreath':
        return `<g>
          <path d="M104 94 Q160 72 216 94" fill="none" stroke="${c1}" stroke-width="7" stroke-linecap="round"/>
          <circle cx="122" cy="87" r="8" fill="${c2}" stroke="#ffffff" stroke-width="2"/>
          <circle cx="160" cy="80" r="9" fill="#ffd166" stroke="#ffffff" stroke-width="2"/>
          <circle cx="198" cy="87" r="8" fill="${c2}" stroke="#ffffff" stroke-width="2"/>
        </g>`;
      case 'beret':
        return `<g>
          <ellipse cx="164" cy="76" rx="54" ry="20" transform="rotate(-8 164 76)" fill="${c1}" stroke="${c2}" stroke-width="3"/>
          <path d="M162 56 Q166 46 172 52" fill="none" stroke="${c2}" stroke-width="4" stroke-linecap="round"/>
        </g>`;
      case 'beanie':
        return `<g>
          <path d="M108 98 Q160 36 212 98 Z" fill="${c1}" stroke="#7a4c28" stroke-width="3"/>
          <rect x="104" y="88" width="112" height="16" rx="8" fill="${c2}" stroke="#7a4c28" stroke-width="2.5"/>
          <circle cx="160" cy="48" r="11" fill="${c2}" stroke="#7a4c28" stroke-width="2.5"/>
        </g>`;
      case 'cap':
        return `<g>
          <path d="M106 94 Q160 44 214 94 Z" fill="${c1}" stroke="#1d3557" stroke-width="3"/>
          <path d="M104 92 Q160 78 232 96 Q170 104 104 92 Z" fill="${c2}" stroke="#1d3557" stroke-width="2.5"/>
        </g>`;
      case 'wizard':
        return `<g>
          <path d="M122 92 L160 22 L198 92 Z" fill="${c1}" stroke="#231438" stroke-width="3" stroke-linejoin="round"/>
          <ellipse cx="160" cy="92" rx="64" ry="11" fill="${c1}" stroke="#231438" stroke-width="3"/>
          <text x="160" y="72" text-anchor="middle" font-size="18" fill="${c2}">★</text>
        </g>`;
      case 'shades':
        return `<g>
          <rect x="96" y="138" width="52" height="28" rx="12" fill="${c1}" fill-opacity="0.9" stroke="${c2}" stroke-width="3.2"/>
          <rect x="172" y="138" width="52" height="28" rx="12" fill="${c1}" fill-opacity="0.9" stroke="${c2}" stroke-width="3.2"/>
          <line x1="148" y1="150" x2="172" y2="150" stroke="${c2}" stroke-width="4"/>
        </g>`;
      case 'hearts':
        return `<g>
          <path d="M122 168 C100 156, 98 136, 114 138 C120 139, 122 145, 122 145 C122 145, 124 139, 130 138 C146 136, 144 156, 122 168 Z" fill="${c1}" fill-opacity="0.86" stroke="${c2}" stroke-width="2.5"/>
          <path d="M198 168 C176 156, 174 136, 190 138 C196 139, 198 145, 198 145 C198 145, 200 139, 206 138 C222 136, 220 156, 198 168 Z" fill="${c1}" fill-opacity="0.86" stroke="${c2}" stroke-width="2.5"/>
          <line x1="142" y1="148" x2="178" y2="148" stroke="${c2}" stroke-width="3.5"/>
        </g>`;
      case 'round':
        return `<g>
          <circle cx="122" cy="152" r="22" fill="${c2}" fill-opacity="0.35" stroke="${c1}" stroke-width="3.5"/>
          <circle cx="198" cy="152" r="22" fill="${c2}" fill-opacity="0.35" stroke="${c1}" stroke-width="3.5"/>
          <line x1="144" y1="152" x2="176" y2="152" stroke="${c1}" stroke-width="3.5"/>
        </g>`;
      case 'stars':
        return `<g>
          <text x="122" y="166" text-anchor="middle" font-size="42" fill="${c1}" stroke="${c2}" stroke-width="1.5">★</text>
          <text x="198" y="166" text-anchor="middle" font-size="42" fill="${c1}" stroke="${c2}" stroke-width="1.5">★</text>
          <line x1="142" y1="150" x2="178" y2="150" stroke="${c1}" stroke-width="3.5"/>
        </g>`;
      case 'visor':
        return `<g>
          <rect x="92" y="138" width="136" height="28" rx="14" fill="${c1}" fill-opacity="0.72" stroke="${c2}" stroke-width="3.5"/>
          <line x1="106" y1="148" x2="214" y2="148" stroke="#ffffff" stroke-width="3" opacity="0.6" stroke-linecap="round"/>
        </g>`;
      case 'monocle':
        return `<g>
          <circle cx="198" cy="152" r="22" fill="${c2}" fill-opacity="0.35" stroke="${c1}" stroke-width="3.5"/>
          <path d="M218 164 Q226 194 212 222" fill="none" stroke="${c1}" stroke-width="2.5" stroke-dasharray="3 3"/>
        </g>`;
      case 'stickers':
        return `<g>
          <text x="98" y="182" text-anchor="middle" font-size="16" fill="${c1}">★</text>
          <text x="222" y="182" text-anchor="middle" font-size="16" fill="${c2}">♥</text>
        </g>`;
      case 'bandana':
        return `<g>
          <path d="M104 226 Q160 244 216 226 L160 282 Z" fill="${c1}" stroke="#3d2a1c" stroke-width="3" stroke-linejoin="round"/>
          <circle cx="144" cy="246" r="4" fill="${c2}"/>
          <circle cx="176" cy="246" r="4" fill="${c2}"/>
          <circle cx="160" cy="260" r="4.5" fill="${c2}"/>
        </g>`;
      case 'collar':
        return `<g>
          <path d="M106 222 Q160 242 214 222" fill="none" stroke="${c1}" stroke-width="12" stroke-linecap="round"/>
          <path d="M160 232 L140 223 L143 242 Z" fill="#ff8fab" stroke="#7a2845" stroke-width="2"/>
          <path d="M160 232 L180 223 L177 242 Z" fill="#ff8fab" stroke="#7a2845" stroke-width="2"/>
          <circle cx="160" cy="232" r="4.8" fill="${c2}" stroke="#7a2845" stroke-width="1.8"/>
          <rect x="132" y="242" width="56" height="22" rx="11" fill="${c2}" stroke="#8a6210" stroke-width="2.4"/>
          <text x="160" y="257" text-anchor="middle" font-size="11" font-weight="800" fill="#5c3a00" font-family="system-ui, sans-serif">${safeName}</text>
        </g>`;
      case 'scarf':
        return `<g>
          <path d="M102 222 Q160 246 218 222 Q222 238 214 244 Q160 264 106 244 Q98 238 102 222 Z" fill="${c1}" stroke="#6b3026" stroke-width="2.8"/>
          <rect x="176" y="238" width="20" height="44" rx="8" fill="${c2}" stroke="#6b3026" stroke-width="2.5"/>
        </g>`;
      case 'bowtie':
        return `<g>
          <path d="M160 234 L132 220 L134 248 Z" fill="${c1}" stroke="${c2}" stroke-width="2.6" stroke-linejoin="round"/>
          <path d="M160 234 L188 220 L186 248 Z" fill="${c1}" stroke="${c2}" stroke-width="2.6" stroke-linejoin="round"/>
          <circle cx="160" cy="234" r="7" fill="${c2}"/>
        </g>`;
      case 'pearls':
        return `<g>
          ${[112, 128, 144, 160, 176, 192, 208].map((x, i) => {
            const y = 224 + Math.sin((i / 6) * Math.PI) * 18;
            return `<circle cx="${x}" cy="${y.toFixed(1)}" r="6" fill="${c1}" stroke="${c2}" stroke-width="2"/>`;
          }).join('')}
        </g>`;
      case 'bell':
        return `<g>
          <path d="M108 224 Q160 242 212 224" fill="none" stroke="${c1}" stroke-width="8" stroke-linecap="round"/>
          <circle cx="160" cy="242" r="10" fill="${c2}" stroke="#8a6210" stroke-width="2.4"/>
          <line x1="154" y1="245" x2="166" y2="245" stroke="#8a6210" stroke-width="2"/>
        </g>`;
      case 'sweater':
        return `<g>
          <path d="M98 234 Q160 250 222 234 Q236 270 226 302 L94 302 Q84 270 98 234 Z" fill="${c1}" stroke="#5c3a28" stroke-width="3"/>
          <path d="M114 268 Q160 278 206 268" fill="none" stroke="${c2}" stroke-width="6" stroke-linecap="round"/>
        </g>`;
      case 'stripe':
        return `<g>
          <path d="M98 234 Q160 250 222 234 Q236 270 226 302 L94 302 Q84 270 98 234 Z" fill="${c2}" stroke="#2b4c7e" stroke-width="3"/>
          <path d="M96 254 H224 M94 272 H226 M95 290 H225" stroke="${c1}" stroke-width="6"/>
        </g>`;
      case 'hoodie':
        return `<g>
          <path d="M96 232 Q160 252 224 232 Q238 272 226 304 L94 304 Q82 272 96 232 Z" fill="${c1}" stroke="#5c3a28" stroke-width="3"/>
          <rect x="132" y="268" width="56" height="24" rx="10" fill="${c2}" stroke="#5c3a28" stroke-width="2.2"/>
          <line x1="146" y1="240" x2="146" y2="262" stroke="${c2}" stroke-width="3" stroke-linecap="round"/>
          <line x1="174" y1="240" x2="174" y2="262" stroke="${c2}" stroke-width="3" stroke-linecap="round"/>
        </g>`;
      case 'dress':
        return `<g>
          <path d="M104 234 Q160 250 216 234 L236 306 Q160 318 84 306 Z" fill="${c1}" stroke="#7a2845" stroke-width="3" stroke-linejoin="round"/>
          <circle cx="132" cy="272" r="5" fill="${c2}"/>
          <circle cx="160" cy="284" r="5.5" fill="${c2}"/>
          <circle cx="188" cy="272" r="5" fill="${c2}"/>
        </g>`;
      case 'overalls':
        return `<g>
          <path d="M102 246 H218 L226 304 H94 Z" fill="${c1}" stroke="#1d3557" stroke-width="3"/>
          <rect x="112" y="226" width="14" height="32" rx="4" fill="${c1}" stroke="#1d3557" stroke-width="2.4"/>
          <rect x="194" y="226" width="14" height="32" rx="4" fill="${c1}" stroke="#1d3557" stroke-width="2.4"/>
          <circle cx="119" cy="252" r="4" fill="${c2}"/>
          <circle cx="201" cy="252" r="4" fill="${c2}"/>
        </g>`;
      case 'cape':
        return `<g>
          <path d="M100 228 Q160 244 220 228 L244 306 Q160 318 76 306 Z" fill="${c1}" fill-opacity="0.92" stroke="${c2}" stroke-width="3.5" stroke-linejoin="round"/>
          <circle cx="160" cy="236" r="8" fill="${c2}"/>
        </g>`;
      case 'kimono':
        return `<g>
          <path d="M98 232 L160 264 L222 232 L232 304 H88 Z" fill="${c1}" stroke="#8f2d52" stroke-width="3"/>
          <rect x="96" y="272" width="128" height="16" rx="4" fill="${c2}" stroke="#8f2d52" stroke-width="2.2"/>
        </g>`;
      case 'wings':
        return `<g>
          <path d="M84 246 C34 206, 26 266, 74 282 C52 276, 54 294, 88 286 Z" fill="${c1}" stroke="${c2}" stroke-width="3"/>
          <path d="M236 246 C286 206, 294 266, 246 282 C268 276, 266 294, 232 286 Z" fill="${c1}" stroke="${c2}" stroke-width="3"/>
        </g>`;
      case 'halo':
        return `<ellipse cx="160" cy="46" rx="42" ry="11" fill="none" stroke="${c1}" stroke-width="6"/>`;
      case 'hearts':
        return `<g font-size="20">
          <text x="58" y="130" fill="${c1}">💖</text>
          <text x="242" y="136" fill="${c2}">💗</text>
          <text x="246" y="206" fill="${c1}">💖</text>
        </g>`;
      case 'stars':
        return `<g font-size="20">
          <text x="56" y="124" fill="${c1}">✨</text>
          <text x="244" y="128" fill="${c2}">⭐</text>
          <text x="54" y="208" fill="${c2}">✨</text>
        </g>`;
      case 'flower':
        return `<g>
          <circle cx="226" cy="94" r="10" fill="${c1}" stroke="#ffffff" stroke-width="2"/>
          <circle cx="226" cy="94" r="4" fill="${c2}"/>
        </g>`;
      default:
        return '';
    }
  }

  window.PET_SALON_WARDROBE_50 = WARDROBE;
  window.renderWardrobeItemSvg = renderItemSvg;
  window.getWardrobeVariantColors = getItemVariantColors;
})();
