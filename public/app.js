// Все данные загружаются один раз, фильтрация на клиенте
let allVehicles = [];
let filtered = [];
let displayCount = 20;

const BODY_TYPES = {
  sedan: 'Седан', suv: 'Внедорожник', hatchback: 'Хэтчбек',
  universal: 'Универсал', liftback: 'Лифтбек', minivan: 'Минивэн',
  coupe: 'Купе', compactvan: 'Компактвэн', pickup: 'Пикап',
  minibus: 'Микроавтобус', microvan: 'Микровэн',
};
const DRIVE_TYPES = { front: 'Передний', rear: 'Задний', full_4wd: 'Полный 4WD' };
const GEARBOX = { manual: 'Механика', automatic: 'Автомат', robot: 'Робот', variator: 'Вариатор' };

function formatPrice(p) {
  return p ? p.toLocaleString('ru-RU') + ' ₽' : 'Цена по запросу';
}

function formatMileage(m) {
  if (!m && m !== 0) return '—';
  if (m < 1000) return m + ' км';
  return (m / 1000).toFixed(0) + ' тыс. км';
}

function engineLiters(cc) {
  return cc ? (cc / 1000).toFixed(1) + ' л' : '';
}

async function loadAllVehicles() {
  const grid = document.getElementById('cars-grid');
  try {
    const res = await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageSize: 1000 }),
    });
    const data = await res.json();
    allVehicles = data.data?.vehicles || [];

    document.getElementById('total-count').textContent = allVehicles.length;
    populateBrands();
    populateYears();
    applyFilters();
  } catch (e) {
    grid.innerHTML = `<div class="loading" style="grid-column:span 2; color:#e53e3e">Ошибка загрузки данных.<br>Проверьте подключение к интернету.</div>`;
  }
}

function populateBrands() {
  const sel = document.getElementById('filter-brand');
  const brands = {};
  allVehicles.forEach(v => { if (v.brand?.id) brands[v.brand.id] = v.brand.name; });
  const sorted = Object.entries(brands).sort((a, b) => a[1].localeCompare(b[1], 'ru'));
  sorted.forEach(([id, name]) => {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = name;
    sel.appendChild(opt);
  });
}

function populateYears() {
  const years = [...new Set(allVehicles.map(v => v.year).filter(Boolean))].sort((a, b) => b - a);
  ['filter-year-from', 'filter-year-to'].forEach(id => {
    const sel = document.getElementById(id);
    years.forEach(y => {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      sel.appendChild(opt);
    });
  });
}

function getFilters() {
  return {
    brand: document.getElementById('filter-brand').value,
    body: document.getElementById('filter-body').value,
    yearFrom: +document.getElementById('filter-year-from').value || 0,
    yearTo: +document.getElementById('filter-year-to').value || 9999,
    priceFrom: +document.getElementById('filter-price-from').value || 0,
    priceTo: +document.getElementById('filter-price-to').value || Infinity,
    gearbox: document.getElementById('filter-gearbox').value,
    drive: document.getElementById('filter-drive').value,
    sort: document.getElementById('sort-select').value,
  };
}

function applyFilters() {
  const f = getFilters();
  displayCount = 20;

  filtered = allVehicles.filter(v => {
    if (f.brand && String(v.brand?.id) !== f.brand) return false;
    if (f.body && v.bodyType !== f.body) return false;
    if (f.yearFrom && v.year < f.yearFrom) return false;
    if (f.yearTo < 9999 && v.year > f.yearTo) return false;
    if (f.priceFrom && v.price < f.priceFrom) return false;
    if (f.priceTo < Infinity && v.price > f.priceTo) return false;
    if (f.gearbox && v.gearboxType !== f.gearbox) return false;
    if (f.drive && v.driveType !== f.drive) return false;
    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    if (f.sort === 'price_asc') return (a.price || 0) - (b.price || 0);
    if (f.sort === 'price_desc') return (b.price || 0) - (a.price || 0);
    if (f.sort === 'year_desc') return (b.year || 0) - (a.year || 0);
    if (f.sort === 'year_asc') return (a.year || 0) - (b.year || 0);
    if (f.sort === 'mileage_asc') return (a.mileage || 999999) - (b.mileage || 999999);
    return 0;
  });

  document.getElementById('result-count').textContent = `Найдено: ${filtered.length}`;
  renderCars();
}

function resetFilters() {
  ['filter-brand','filter-body','filter-year-from','filter-year-to','filter-gearbox','filter-drive'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('filter-price-from').value = '';
  document.getElementById('filter-price-to').value = '';
  applyFilters();
}

function renderCars() {
  const grid = document.getElementById('cars-grid');
  const wrap = document.getElementById('load-more-wrap');
  const slice = filtered.slice(0, displayCount);

  if (slice.length === 0) {
    grid.innerHTML = `<div class="loading" style="grid-column:span 2">
      <div style="font-size:40px">🔍</div>
      Ничего не найдено.<br><small>Попробуйте изменить фильтры</small>
    </div>`;
    wrap.style.display = 'none';
    return;
  }

  grid.innerHTML = slice.map(v => carCard(v)).join('');
  wrap.style.display = filtered.length > displayCount ? 'block' : 'none';
}

function carCard(v) {
  const photo = v.photos?.[0]?.url || null;
  const name = `${v.brand?.name || ''} ${v.model?.name || ''}`.trim();
  const yearKm = [v.year, v.mileage ? formatMileage(v.mileage) : null].filter(Boolean).join(' · ');
  const body = BODY_TYPES[v.bodyType] || v.bodyType || '';

  return `<a class="car-card" href="car.html?id=${v.id}">
    ${photo
      ? `<img class="car-photo" src="${photo}" alt="${name}" loading="lazy">`
      : `<div class="car-photo-placeholder">🚗</div>`}
    <div class="car-info">
      <div class="car-name">${name}</div>
      <div class="car-year-km">${yearKm}</div>
      <div class="car-price">${formatPrice(v.price)}</div>
      ${body ? `<div class="car-badge">${body}</div>` : ''}
    </div>
  </a>`;
}

function loadMore() {
  displayCount += 20;
  renderCars();
}

loadAllVehicles();
