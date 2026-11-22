(() => {
  'use strict';

  const BEHAVIORS = {
    shy:       { id: 'shy',       label: 'Стеснительный', emoji: '🥺', reactions: ['Ой, спасибо… уже не так страшно!', 'Как аккуратно, мур…', 'Мне так приятно!'] },
    playful:   { id: 'playful',   label: 'Игривый',       emoji: '😜', reactions: ['Хе-хе, щекотно!', 'Ура, давай ещё!', 'Класс! Я как новенький!'] },
    sleepy:    { id: 'sleepy',    label: 'Сонный',        emoji: '😴', reactions: ['Ммм… зеваю от релакса…', 'Так уютно, сейчас усну…', 'Ззз… спасибо…'] },
    diva:      { id: 'diva',      label: 'Модник',        emoji: '💅', reactions: ['О да, достойно обложки!', 'Именно так, идеально!', 'Зеркало, я иду!'] },
    curious:   { id: 'curious',   label: 'Любопытный',    emoji: '🧐', reactions: ['Ого, а что это за штука?', 'Интересно работает!', 'Вау, как чисто стало!'] },
    energetic: { id: 'energetic', label: 'Непоседа',      emoji: '⚡', reactions: ['Огонь! Быстро и круто!', 'Ещё, ещё, мне нравится!', 'Йухуу! Сияю!'] },
    grumpy:    { id: 'grumpy',    label: 'Ворчун',        emoji: '😤', reactions: ['Хм… ну ладно, неплохо.', 'Ладно-ладно, ты мастер!', 'Признаю, мне нравится!'] },
    dreamy:    { id: 'dreamy',    label: 'Мечтатель',     emoji: '☁️', reactions: ['Как в мягком облачке…', 'Словно в сказке…', 'Какая лёгкость…'] },
  };

  const STORY_CHAPTERS = [
    { id: 1,  title: 'Глава 1: Открытие салона',     subtitle: 'Первые гости и знакомство',       startIndex: 0,  count: 5, chestCoins: 120, chestStars: 5 },
    { id: 2,  title: 'Глава 2: Лесной спа-курорт',   subtitle: 'Гости из парка и леса',           startIndex: 5,  count: 5, chestCoins: 160, chestStars: 6 },
    { id: 3,  title: 'Глава 3: Дождливый уикенд',    subtitle: 'Сушка, пена и уют',               startIndex: 10, count: 5, chestCoins: 200, chestStars: 7 },
    { id: 4,  title: 'Глава 4: Городские модники',   subtitle: 'Подготовка к фотосессиям',        startIndex: 15, count: 5, chestCoins: 240, chestStars: 8 },
    { id: 5,  title: 'Глава 5: Весенний карнавал',   subtitle: 'Цветочные образы и блеск',        startIndex: 20, count: 5, chestCoins: 280, chestStars: 9 },
    { id: 6,  title: 'Глава 6: Сладкая кофейня',     subtitle: 'Пушистые любители десертов',      startIndex: 25, count: 5, chestCoins: 320, chestStars: 10 },
    { id: 7,  title: 'Глава 7: Летний пикник',       subtitle: 'После пляжа, травы и ягод',       startIndex: 30, count: 5, chestCoins: 360, chestStars: 11 },
    { id: 8,  title: 'Глава 8: Осенний уют',         subtitle: 'Тёплый уход и расчёсывание',      startIndex: 35, count: 5, chestCoins: 400, chestStars: 12 },
    { id: 9,  title: 'Глава 9: Зимняя сказка',       subtitle: 'Спа после снега и мороза',        startIndex: 40, count: 5, chestCoins: 450, chestStars: 14 },
    { id: 10, title: 'Глава 10: Звёздный VIP-бал',   subtitle: 'Гранд-финал 50 гостей!',          startIndex: 45, count: 5, chestCoins: 600, chestStars: 20 },
  ];

  // [name, species, behavior, furLight, furDark, problemCount, wishAcc, story]
  const ROSTER = [
    // Глава 1 (1–5)
    ['Лаки',      'cat',     'shy',       '#fff4e6', '#e8c7a3', 3, 'bow',     'Первый гость салона! Помоги малышу почувствовать себя увереннее.'],
    ['Плюша',     'cat',     'diva',      '#ffe8cc', '#f0a868', 4, 'collar',  'Рыжая модница спешит на фотосессию и ждёт безупречный уход.'],
    ['Марсель',   'dog',     'playful',   '#f6e2c8', '#d4a373', 4, 'bandana', 'Озорной щенок пробежал через весь парк и готов к спа!'],
    ['Снежка',    'cat',     'dreamy',    '#ffffff', '#e4e8f0', 4, 'wreath',  'Белоснежная мечтательница попала под мелкий дождик.'],
    ['Бандит',    'raccoon', 'energetic', '#dfe3eb', '#9fa6b5', 5, 'glasses', 'Финал Главы 1! Енот-непоседа прибежал прямо с приключений.'],
    // Глава 2 (6–10)
    ['Зефирка',   'bunny',   'shy',       '#fff0f5', '#f4c6d7', 3, 'bow',     'Нежная зайка проснулась рано и стесняется своего вида.'],
    ['Рыжик',     'fox',     'curious',   '#ffdfbe', '#e88b48', 4, 'bandana', 'Любопытный лисёнок заглянул узнать, как работает твой салон.'],
    ['Бамбук',    'panda',   'sleepy',    '#ffffff', '#e8ecee', 4, 'wreath',  'Сонный панда мечтает о самом спокойном спа на свете.'],
    ['Мишутка',   'bear',    'grumpy',    '#eed6bd', '#b88b62', 3, 'collar',  'Мишка-ворчун не любит расчёсываться, но ты его растопишь!'],
    ['Луна',      'cat',     'diva',      '#ede9f7', '#b8a8d8', 5, 'glasses', 'Финал Главы 2! Дымчатая красавица готовится к вечернему балу.'],
    // Глава 3 (11–15)
    ['Карамель',  'dog',     'playful',   '#fff1d6', '#e2ab62', 3, 'collar',  'Золотистый корги прыгал по лужам и смеётся от радости.'],
    ['Хомка',     'hamster', 'energetic', '#fff2dd', '#e7b57c', 2, 'bow',     'Крошка-хомячок прибежал на быстрый экспресс-уход!'],
    ['Хлоя',      'bunny',   'dreamy',    '#ffffff', '#eadfd5', 4, 'wreath',  'Белая крольчиха любит ароматные маски и мягкий фен.'],
    ['Фокс',      'fox',     'curious',   '#ffecd1', '#d9753b', 5, 'glasses', 'Хитрый лис проверяет каждый инструмент салона.'],
    ['Арчи',      'dog',     'energetic', '#e9d3be', '#a67653', 6, 'bandana', 'Финал Главы 3! Щенок-чемпион после дождливого марафона.'],
    // Глава 4 (16–20)
    ['Моти',      'panda',   'sleepy',    '#fff8f2', '#e3dcd5', 3, 'bow',     'Милая панда сладко зевает и просит бережного ухода.'],
    ['Персик',    'cat',     'diva',      '#ffe6d5', '#f2a97e', 4, 'collar',  'Персиковый котик-блогер готовит новый пост для друзей.'],
    ['Бублик',    'hamster', 'playful',   '#ffe9c9', '#d89b5b', 3, 'bandana', 'Пухленький хомячок объелся печенья и испачкал щёчки!'],
    ['Гризли',    'bear',    'grumpy',    '#dec7b2', '#9b714e', 5, 'glasses', 'Серьёзный мишка делает вид, что зашёл случайно.'],
    ['Коко',      'bunny',   'diva',      '#f7e9dc', '#cca889', 5, 'crown',   'Финал Главы 4! Шоколадная зайка идёт на показ мод.'],
    // Глава 5 (21–25)
    ['Клевер',    'bunny',   'curious',   '#eefaf0', '#b7dfc0', 3, 'wreath',  'Весенний кролик собирал цветы на полянке.'],
    ['Искра',     'fox',     'energetic', '#ffe0cc', '#eb6d3a', 4, 'bandana', 'Огненная лисичка не может усидеть на месте!'],
    ['Тучка',     'cat',     'shy',       '#e9edf5', '#a9b5cc', 3, 'bow',     'Серый котёнок боится грома и ищет уюта в твоём кресле.'],
    ['Шустрик',   'raccoon', 'playful',   '#e3e6ed', '#8e96a8', 5, 'glasses', 'Енот-шутник принёс полный набор лесных сюрпризов.'],
    ['Флора',     'cat',     'dreamy',    '#fff0f7', '#e8a5c4', 6, 'wreath',  'Финал Главы 5! Королева весеннего карнавала.'],
    // Глава 6 (26–30)
    ['Латте',     'dog',     'sleepy',    '#f5e5d5', '#c9a27c', 3, 'collar',  'Кофейный щенок обожает тёплый воздух фена.'],
    ['Маффин',    'hamster', 'curious',   '#fff1de', '#dfa770', 2, 'bow',     'Любопытный хомячок из кондитерской на экспресс-спа.'],
    ['Какао',     'bear',    'shy',       '#e3ccb8', '#9c6e4b', 4, 'bandana', 'Шоколадный мишка пролил чашку какао на шерсть.'],
    ['Ваниль',    'cat',     'diva',      '#fffcf2', '#ebd9b4', 4, 'collar',  'Кремовая кошечка требует идеальный блеск шерсти.'],
    ['Тирамису',  'panda',   'dreamy',    '#f7efe6', '#d1bfa9', 5, 'crown',   'Финал Главы 6! Главный дегустатор сладкой кофейни.'],
    // Глава 7 (31–35)
    ['Сэнди',     'dog',     'energetic', '#fff0cf', '#e0b05e', 4, 'glasses', 'Щенок вернулся с пляжа — пора смыть песок!'],
    ['Малинка',   'bunny',   'playful',   '#ffe8f0', '#eb9cb8', 3, 'bow',     'Зайка собирала ягоды и вся перемазалась.'],
    ['Бриз',      'cat',     'dreamy',    '#e8f6ff', '#a8d1ea', 4, 'bandana', 'Голубоглазый котик после прогулки у фонтана.'],
    ['Рокки',     'raccoon', 'grumpy',    '#dcdde2', '#7e8391', 5, 'glasses', 'Ворчливый енот уверен, что ему нужен только отдых.'],
    ['Солнышко',  'fox',     'diva',      '#fff3cc', '#f0b643', 6, 'wreath',  'Финал Главы 7! Звезда летнего пикника.'],
    // Глава 8 (36–40)
    ['Каштан',    'bear',    'sleepy',    '#e6cab2', '#a36b43', 4, 'collar',  'Осенний мишка готовится к уютной спячке.'],
    ['Орешек',    'hamster', 'curious',   '#f5dfc5', '#c9935b', 3, 'bandana', 'Хомячок прятал орешки и насобирал листьев.'],
    ['Клён',      'fox',     'playful',   '#ffe0c7', '#d96934', 4, 'collar',  'Лисёнок прыгал в кучу осенних листьев!'],
    ['Дымка',     'cat',     'shy',       '#ebedf2', '#9ea6b8', 4, 'bow',     'Тихая дымчатая кошечка любит нежную расчёску.'],
    ['Янтарь',    'dog',     'grumpy',    '#f5d9b5', '#c7813e', 5, 'glasses', 'Финал Главы 8! Благородный пёс с непростым характером.'],
    // Глава 9 (41–45)
    ['Снежок',    'bunny',   'energetic', '#ffffff', '#dce8f5', 3, 'bow',     'Белый кролик наигрался в снежки!'],
    ['Умка',      'bear',    'curious',   '#f7fbff', '#cfe0f0', 4, 'bandana', 'Полярный мишка впервые в тёплом салоне.'],
    ['Льдинка',   'cat',     'diva',      '#eef6ff', '#b5d2f2', 5, 'crown',   'Снежная принцесса обожает сияние и стиль.'],
    ['Пряник',    'hamster', 'sleepy',    '#f7dec0', '#c78c52', 3, 'collar',  'Уютный зимний хомячок греется после прогулки.'],
    ['Поляр',     'panda',   'dreamy',    '#f5f9fc', '#cfdbe6', 6, 'wreath',  'Финал Главы 9! Хранитель зимней сказки.'],
    // Глава 10 (46–50)
    ['Вельвет',   'cat',     'diva',      '#f4e6fa', '#c29ad6', 5, 'glasses', 'Бархатная кошечка готовится к красной дорожке.'],
    ['Граф',      'dog',     'grumpy',    '#ebe1d5', '#a69079', 5, 'collar',  'Аристократичный пёс доверяет только лучшим мастерам.'],
    ['Звёздочка', 'fox',     'energetic', '#fff2d9', '#f0a243', 5, 'wreath',  'Звёздная лисичка сияет ярче всех на балу!'],
    ['Жемчуг',    'bunny',   'dreamy',    '#fffaf5', '#e8d7ca', 6, 'bow',     'Предпоследний VIP-гость сезона в полном спа!'],
    ['Муся VIP',  'cat',     'diva',      '#fff7d6', '#f2c97d', 6, 'crown',   'Гранд-финал 50 гостей! Королевский образ для главной звезды!'],
  ];

  const ALL_ZONES = ['unibrow', 'eyebags', 'pimples', 'dirt', 'tangles', 'wet'];

  const CHARACTERS = ROSTER.map((row, idx) => {
    const [name, species, behavior, furLight, furDark, problemCount, wishAcc, story] = row;
    const id = idx + 1;
    const isChapterFinale = id % 5 === 0;
    const wishTexts = {
      bow: 'Хочу бантик для фото!',
      collar: 'Хочу ошейник с именем!',
      bandana: 'Хочу стильную бандану!',
      glasses: 'Хочу крутые очки!',
      wreath: 'Мечтаю о цветочном венке!',
      crown: 'Хочу корону на праздник!',
    };
    const baseReward = 55 + Math.min(280, idx * 6) + (isChapterFinale ? 40 : 0);
    const tipCoins = 25 + Math.floor(idx / 5) * 10 + (isChapterFinale ? 15 : 0);
    const rewardStars = isChapterFinale ? 3 + Math.floor(idx / 10) : 1 + Math.floor(idx / 15);

    return {
      id,
      useCustomName: id === 1,
      name,
      species,
      behavior,
      furLight,
      furDark,
      problemCount,
      defects: id === 1 ? ['unibrow', 'eyebags', 'pimples'] : ALL_ZONES.slice(0, problemCount),
      isChapterFinale,
      title: isChapterFinale
        ? `Финал Главы ${Math.ceil(id / 5)} · ${name}`
        : `Гость ${id} · ${name}`,
      story,
      wish: {
        accessoryId: wishAcc,
        text: wishTexts[wishAcc] || 'Хочу красивый аксессуар!',
        tipCoins,
      },
      rewardCoins: baseReward,
      rewardStars,
    };
  });

  window.PET_SALON_BEHAVIORS = BEHAVIORS;
  window.PET_SALON_STORY_CHAPTERS_10 = STORY_CHAPTERS;
  window.PET_SALON_CHARACTERS_50 = CHARACTERS;
})();
