const BODY_TYPES = {
  sedan: 'Седан', suv: 'Внедорожник', hatchback: 'Хэтчбек',
  universal: 'Универсал', liftback: 'Лифтбек', minivan: 'Минивэн',
  coupe: 'Купе', compactvan: 'Компактвэн', pickup: 'Пикап',
  minibus: 'Микроавтобус', microvan: 'Микровэн',
};
const DRIVE_TYPES = { front: 'Передний', rear: 'Задний', full_4wd: 'Полный 4WD' };
const GEARBOX = { manual: 'Механика', automatic: 'Автомат', robot: 'Робот', variator: 'Вариатор' };
const COLORS = {
  white: 'Белый', black: 'Чёрный', silver: 'Серебристый', gray: 'Серый',
  red: 'Красный', blue: 'Синий', green: 'Зелёный', brown: 'Коричневый',
  beige: 'Бежевый', gold: 'Золотой', orange: 'Оранжевый', yellow: 'Жёлтый',
  purple: 'Фиолетовый', bordeaux: 'Бордовый',
};

function formatPrice(p) {
  return p ? p.toLocaleString('ru-RU') + ' ₽' : 'Цена по запросу';
}
function formatMileage(m) {
  if (!m && m !== 0) return '—';
  if (m < 1000) return m + ' км';
  return (m / 1000).toFixed(0) + ' тыс. км';
}
function engineLiters(cc) {
  return cc ? (cc / 1000).toFixed(1) + ' л' : '—';
}

const API_URL = window.location.hostname === 'localhost'
  ? ''
  : 'https://planeta-avto-api.pristuppoevgenij.workers.dev';

const params = new URLSearchParams(location.search);
const vehicleId = params.get('id');

let currentPhotoIdx = 0;
let photos = [];

async function loadVehicle() {
  const page = document.getElementById('car-page');
  if (!vehicleId) { page.innerHTML = '<div class="loading">Авто не указано</div>'; return; }

  try {
    const res = await fetch(`${API_URL}/api/vehicles/${vehicleId}`);
    const data = await res.json();
    if (!data.data) throw new Error('Не найдено');
    renderVehicle(data.data);
  } catch (e) {
    page.innerHTML = `<div class="loading" style="color:#e53e3e">Ошибка загрузки.<br><small>${e.message}</small></div>`;
  }
}

function renderVehicle(v) {
  document.title = `${v.brand?.name || ''} ${v.model?.name || ''} ${v.year || ''} — Планета Авто`;
  photos = v.photos || [];
  const name = `${v.brand?.name || ''} ${v.model?.name || ''}`.trim();

  const specs = [
    { label: 'Год выпуска', value: v.year || '—' },
    { label: 'Пробег', value: formatMileage(v.mileage) },
    { label: 'Кузов', value: BODY_TYPES[v.bodyType] || v.bodyType || '—' },
    { label: 'Двигатель', value: engineLiters(v.engineVolume) },
    { label: 'КПП', value: GEARBOX[v.gearboxType] || v.gearboxType || '—' },
    { label: 'Привод', value: DRIVE_TYPES[v.driveType] || v.driveType || '—' },
    { label: 'Цвет', value: COLORS[v.bodyColor] || v.bodyColor || '—' },
    { label: 'Владельцев', value: v.ownersCount ? v.ownersCount + ' чел.' : '—' },
  ];

  const page = document.getElementById('car-page');
  page.innerHTML = `
    ${photos.length > 0 ? `
    <div class="gallery-wrap">
      <img class="gallery-main-photo" id="gallery-main" src="${photos[0].url}" alt="${name}">
      <div class="gallery-counter" id="gallery-counter">1 / ${photos.length}</div>
      ${photos.length > 1 ? `
        <button class="gallery-nav prev" onclick="changePhoto(-1)">‹</button>
        <button class="gallery-nav next" onclick="changePhoto(1)">›</button>
      ` : ''}
    </div>
    ${photos.length > 1 ? `
    <div class="gallery-thumbs" id="gallery-thumbs">
      ${photos.map((p, i) => `<img class="gallery-thumb ${i===0?'active':''}" src="${p.url}" onclick="setPhoto(${i})" loading="lazy">`).join('')}
    </div>` : ''}
    ` : `<div class="car-photo-placeholder" style="aspect-ratio:16/9">🚗</div>`}

    <div class="car-detail">
      <div class="car-detail-name">${name}</div>
      <div class="car-detail-year">${v.year || ''} · ${BODY_TYPES[v.bodyType] || ''}</div>
      <div class="car-detail-price">${formatPrice(v.price)}</div>

      <div class="specs-grid">
        ${specs.map(s => `
          <div class="spec-item">
            <div class="spec-label">${s.label}</div>
            <div class="spec-value">${s.value}</div>
          </div>`).join('')}
      </div>

      ${v.description ? `
      <div class="desc-block">
        <h3>Описание</h3>
        <div class="desc-text collapsed" id="desc-text">${escHtml(v.description)}</div>
        <button class="btn-more-text" id="desc-toggle" onclick="toggleDesc()">Читать полностью</button>
      </div>` : ''}

      <div class="cta-block">
        <h3>Узнать о машине</h3>
        <p>Оставьте заявку — перезвоним в течение 15 минут</p>
        <div class="cta-form" id="cta-form">
          <input class="cta-input" type="text" id="cta-name" placeholder="Ваше имя" autocomplete="name">
          <input class="cta-input" type="tel" id="cta-phone" placeholder="Телефон +7 (___) ___-__-__" autocomplete="tel">
          <button class="btn-cta" onclick="submitForm('${vehicleId}', '${escHtml(name)}')">Перезвоните мне</button>
          <div class="cta-disclaimer">Нажимая кнопку, вы соглашаетесь на обработку персональных данных</div>
        </div>
      </div>

    </div>
  `;

  setupSwipe();
}

function changePhoto(dir) {
  setPhoto((currentPhotoIdx + dir + photos.length) % photos.length);
}

function setPhoto(idx) {
  currentPhotoIdx = idx;
  document.getElementById('gallery-main').src = photos[idx].url;
  document.getElementById('gallery-counter').textContent = `${idx + 1} / ${photos.length}`;
  const thumbs = document.querySelectorAll('.gallery-thumb');
  thumbs.forEach((t, i) => t.classList.toggle('active', i === idx));
  thumbs[idx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

function setupSwipe() {
  const el = document.querySelector('.gallery-wrap');
  if (!el || photos.length < 2) return;
  let startX = 0;
  el.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  el.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) changePhoto(dx < 0 ? 1 : -1);
  });
}

function toggleDesc() {
  const el = document.getElementById('desc-text');
  const btn = document.getElementById('desc-toggle');
  el.classList.toggle('collapsed');
  btn.textContent = el.classList.contains('collapsed') ? 'Читать полностью' : 'Свернуть';
}

function submitForm(carId, carName) {
  const name = document.getElementById('cta-name').value.trim();
  const phone = document.getElementById('cta-phone').value.trim();
  if (!name) { showToast('Введите ваше имя'); return; }
  if (!phone || phone.length < 6) { showToast('Введите номер телефона'); return; }

  // Здесь можно подключить реальную отправку (email, CRM, Telegram-бот)
  console.log('Заявка:', { name, phone, carId, carName });

  document.getElementById('cta-form').innerHTML = `
    <div class="form-success">Заявка принята! Перезвоним вам в ближайшее время.</div>
  `;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

loadVehicle();
