// ── OWM 説明モーダル ─────────────────────────────────────────
document.getElementById('owm-credit-btn').addEventListener('click', () => {
  document.getElementById('owm-modal-overlay').classList.remove('hidden');
});
document.getElementById('owm-modal-close').addEventListener('click', () => {
  document.getElementById('owm-modal-overlay').classList.add('hidden');
});
document.getElementById('owm-modal-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
});

// ── 地図初期化 ───────────────────────────────────────────────
requestAnimationFrame(() => initMap());

let map, worldMarkersGroup, countryMarkersGroup, countryHighlight, currentPopup, customPinMarker, worldTopoData;

function initMap() {
  map = L.map('map', {
    center: [20, 10], zoom: 2, minZoom: 2, maxZoom: 18,
    zoomControl: false, worldCopyJump: true
  });

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd', maxZoom: 19
  }).addTo(map);

  worldMarkersGroup   = L.layerGroup();
  countryMarkersGroup = L.layerGroup();
  countryHighlight    = null;
  currentPopup        = null;
  customPinMarker     = null;

  const WORLD_MARKERS = [
    { name:"東京",            lat:35.6762,  lon:139.6503  },
    { name:"北京",            lat:39.9042,  lon:116.4074  },
    { name:"上海",            lat:31.2304,  lon:121.4737  },
    { name:"ソウル",          lat:37.5665,  lon:126.9780  },
    { name:"バンコク",        lat:13.7563,  lon:100.5018  },
    { name:"ニューデリー",    lat:28.6139,  lon:77.2090   },
    { name:"ムンバイ",        lat:19.0760,  lon:72.8777   },
    { name:"ドバイ",          lat:25.2048,  lon:55.2708   },
    { name:"イスタンブール",  lat:41.0082,  lon:28.9784   },
    { name:"モスクワ",        lat:55.7558,  lon:37.6173   },
    { name:"ロンドン",        lat:51.5074,  lon:-0.1278   },
    { name:"パリ",            lat:48.8566,  lon:2.3522    },
    { name:"ベルリン",        lat:52.5200,  lon:13.4050   },
    { name:"マドリード",      lat:40.4168,  lon:-3.7038   },
    { name:"ローマ",          lat:41.9028,  lon:12.4964   },
    { name:"カイロ",          lat:30.0444,  lon:31.2357   },
    { name:"ラゴス",          lat:6.5244,   lon:3.3792    },
    { name:"ナイロビ",        lat:-1.2921,  lon:36.8219   },
    { name:"ヨハネスブルク",  lat:-26.2041, lon:28.0473   },
    { name:"ニューヨーク",    lat:40.7128,  lon:-74.0060  },
    { name:"ロサンゼルス",    lat:34.0522,  lon:-118.2437 },
    { name:"シカゴ",          lat:41.8781,  lon:-87.6298  },
    { name:"メキシコシティ",  lat:19.4326,  lon:-99.1332  },
    { name:"サンパウロ",      lat:-23.5505, lon:-46.6333  },
    { name:"ブエノスアイレス",lat:-34.6037, lon:-58.3816  },
    { name:"シドニー",        lat:-33.8688, lon:151.2093  },
    { name:"シンガポール",    lat:1.3521,   lon:103.8198  },
    { name:"ジャカルタ",      lat:-6.2088,  lon:106.8456  },
    { name:"クアラルンプール",lat:3.1390,   lon:101.6869  },
    { name:"リヤド",          lat:24.7136,  lon:46.6753   },
  ];
  WORLD_MARKERS.forEach(c => addCityMarker(c, worldMarkersGroup));
  worldMarkersGroup.addTo(map);

  setTimeout(() => map.invalidateSize(), 100);

  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
    .then(r => r.json())
    .then(d => { worldTopoData = d; })
    .catch(() => {});

  const countrySelect = document.getElementById('country-select');
  const citySelect    = document.getElementById('city-select');

  COUNTRIES.forEach((country, i) => {
    const opt = document.createElement('option');
    opt.value = i; opt.textContent = country.name;
    countrySelect.appendChild(opt);
  });

  countrySelect.addEventListener('change', () => {
    const val = countrySelect.value;
    citySelect.innerHTML = '<option value="">都市を選択...</option>';
    if (!val) {
      citySelect.disabled = true;
      clearHighlight();
      showWorldMarkers();
      return;
    }
    const country = COUNTRIES[parseInt(val)];
    const cities  = CITIES_BY_ISO[country.iso] || [];
    cities.forEach((city, j) => {
      const opt = document.createElement('option');
      opt.value = j;
      opt.textContent = city.prefecture ? `${city.name}（${city.prefecture}）` : city.name;
      citySelect.appendChild(opt);
    });
    citySelect.disabled = false;
    highlightCountry(country);
    showCountryMarkers(country);
  });

  citySelect.addEventListener('change', () => {
    const cIdx = countrySelect.value, dIdx = citySelect.value;
    if (!cIdx || !dIdx) return;
    const city = (CITIES_BY_ISO[COUNTRIES[parseInt(cIdx)].iso] || [])[parseInt(dIdx)];
    if (!city) return;
    map.setView([city.lat, city.lon], 10);
    showWeather(city.lat, city.lon, city.name);
  });

  document.getElementById('btn-pin').addEventListener('click', goToLatLon);
  document.getElementById('input-lon').addEventListener('keydown', e => { if (e.key === 'Enter') goToLatLon(); });

  map.on('click', e => {
    placePin(e.latlng.lat, e.latlng.lng);
    showWeather(e.latlng.lat, e.latlng.lng);
  });
}

// ── 緯度・経度 PIN ────────────────────────────────────────────
function goToLatLon() {
  const lat = parseFloat(document.getElementById('input-lat').value);
  const lon = parseFloat(document.getElementById('input-lon').value);
  if (isNaN(lat) || isNaN(lon))  { alert('緯度・経度を数値で入力してください。'); return; }
  if (lat < -90 || lat > 90)     { alert('緯度は -90〜90 の範囲で入力してください。'); return; }
  if (lon < -180 || lon > 180)   { alert('経度は -180〜180 の範囲で入力してください。'); return; }
  placePin(lat, lon);
  map.setView([lat, lon], 10);
  showWeather(lat, lon);
}

function placePin(lat, lon) {
  if (customPinMarker) map.removeLayer(customPinMarker);
  const icon = L.divIcon({
    className: 'custom-pin',
    html: `<svg width="32" height="46" viewBox="0 0 32 46" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.16 0 0 7.16 0 16c0 11.84 14.4 28.6 15.02 29.32a1.3 1.3 0 0 0 1.96 0C17.6 44.6 32 27.84 32 16 32 7.16 24.84 0 16 0z" fill="#f44336"/>
      <circle cx="16" cy="16" r="7" fill="white"/>
    </svg>`,
    iconSize: [32, 46],
    iconAnchor: [16, 46]
  });
  customPinMarker = L.marker([lat, lon], { icon }).addTo(map);
}

// ── 国ハイライト ──────────────────────────────────────────────
function highlightCountry(country) {
  clearHighlight();
  if (worldTopoData) {
    const geo      = topojson.feature(worldTopoData, worldTopoData.objects.countries);
    const features = geo.features.filter(f => String(f.id) === String(country.iso));
    if (features.length) {
      countryHighlight = L.geoJSON(
        { type: 'FeatureCollection', features },
        { style: { fillColor: '#4dd0e1', fillOpacity: 0.22, color: '#4dd0e1', weight: 2, opacity: 0.8 } }
      ).addTo(map);
    }
  }
  map.fitBounds(country.bounds, { padding: [50, 50], maxZoom: 8 });
}

function clearHighlight() {
  if (countryHighlight) { map.removeLayer(countryHighlight); countryHighlight = null; }
}

// ── マーカー表示切替 ──────────────────────────────────────────
function showWorldMarkers() {
  countryMarkersGroup.remove();
  if (!map.hasLayer(worldMarkersGroup)) worldMarkersGroup.addTo(map);
}

function showCountryMarkers(country) {
  worldMarkersGroup.remove();
  countryMarkersGroup.clearLayers();
  (CITIES_BY_ISO[country.iso] || []).forEach(c => addCityMarker(c, countryMarkersGroup));
  countryMarkersGroup.addTo(map);
}

function addCityMarker(city, group) {
  const label = city.name;
  const icon  = L.divIcon({
    className: 'city-label',
    html: `<div class="city-marker"><div class="city-dot"></div><span class="city-name">${label}</span></div>`,
    iconSize: [0, 0], iconAnchor: [3, 4]
  });
  L.marker([city.lat, city.lon], { icon, title: label })
    .on('click', e => { L.DomEvent.stopPropagation(e); showWeather(city.lat, city.lon, label); })
    .addTo(group);
}

// ── 天気取得・表示 ────────────────────────────────────────────
async function showWeather(lat, lon, label = null) {
  if (currentPopup) map.closePopup(currentPopup);

  const popup = L.popup({ className: 'weather-popup', maxWidth: 320, closeButton: true, autoClose: false })
    .setLatLng([lat, lon])
    .setContent('<div class="pw-loading"><div class="pw-spinner"></div><span>天気情報を取得中...</span></div>')
    .openOn(map);
  currentPopup = popup;

  try {
    const url = `/api/weather?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`;
    const res  = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    if (data.cod && data.cod !== 200) throw new Error(data.message);
    if (popup.isOpen()) popup.setContent(buildPopupHTML(data, label, lat, lon));
  } catch (err) {
    if (popup.isOpen())
      popup.setContent(`<div class="pw-error">⚠️ 天気情報を取得できませんでした<br><small>${err.message}</small></div>`);
  }
}

function buildPopupHTML(d, label, lat, lon) {
  const name      = label || d.name || '不明な場所';
  const country   = d.sys?.country ? `<span class="pw-country">${d.sys.country}</span>` : '';
  const temp      = Math.round(d.main.temp);
  const feelsLike = Math.round(d.main.feels_like);
  const desc      = d.weather[0].description;
  const icon      = d.weather[0].icon;
  const humidity  = d.main.humidity;
  const pressure  = d.main.pressure;
  const windSpd   = d.wind.speed;
  const windDeg   = d.wind.deg != null ? degToDir(d.wind.deg) : '—';
  const gust      = d.wind.gust  != null ? `${d.wind.gust} m/s` : '—';
  const clouds    = d.clouds?.all != null ? `${d.clouds.all}%` : '—';
  const vis       = d.visibility  != null ? `${(d.visibility / 1000).toFixed(1)} km` : '—';
  const sunrise   = d.sys?.sunrise ? toLocalTime(d.sys.sunrise, d.timezone) : '—';
  const sunset    = d.sys?.sunset  ? toLocalTime(d.sys.sunset,  d.timezone) : '—';
  const rain1h    = d.rain?.['1h'] != null ? `${d.rain['1h']} mm` : null;
  const snow1h    = d.snow?.['1h'] != null ? `${d.snow['1h']} mm` : null;
  const dataTime  = d.dt != null && d.timezone != null ? toLocalDateTime(d.dt, d.timezone, true) : '—';
  const nowLocal  = d.timezone != null ? toLocalDateTime(Math.floor(Date.now() / 1000), d.timezone) : '—';

  return `
    <div class="pw-card">
      <div class="pw-now"><span class="pw-now-label">現地時刻</span>${nowLocal}</div>
      <div class="pw-header">
        <div>
          <div class="pw-city">${name}${country}</div>
          <div class="pw-desc">${desc}</div>
        </div>
        <img class="pw-icon" src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}">
      </div>
      <div class="pw-temp-row">
        <div class="pw-temp">${temp}<span class="pw-unit">°C</span></div>
        <div class="pw-datatime">${dataTime}<span class="pw-datatime-label">時点</span></div>
      </div>
      <div class="pw-temp-range">体感 ${feelsLike}°</div>
      <div class="pw-grid">
        <div class="pw-stat"><div class="pw-stat-label">湿度</div><div class="pw-stat-val">${humidity}%</div></div>
        <div class="pw-stat"><div class="pw-stat-label">気圧</div><div class="pw-stat-val">${pressure} hPa</div></div>
        <div class="pw-stat"><div class="pw-stat-label">風速</div><div class="pw-stat-val">${windSpd} m/s</div></div>
        <div class="pw-stat"><div class="pw-stat-label">風向</div><div class="pw-stat-val">${windDeg}</div></div>
        <div class="pw-stat"><div class="pw-stat-label">突風</div><div class="pw-stat-val">${gust}</div></div>
        <div class="pw-stat"><div class="pw-stat-label">雲量</div><div class="pw-stat-val">${clouds}</div></div>
        <div class="pw-stat"><div class="pw-stat-label">視程</div><div class="pw-stat-val">${vis}</div></div>
        ${rain1h ? `<div class="pw-stat"><div class="pw-stat-label">降水量(1h)</div><div class="pw-stat-val">${rain1h}</div></div>` : ''}
        ${snow1h ? `<div class="pw-stat"><div class="pw-stat-label">降雪量(1h)</div><div class="pw-stat-val">${snow1h}</div></div>` : ''}
      </div>
      <div class="pw-sun"><span><span class="pw-sun-label">日の出</span>${sunrise}</span><span><span class="pw-sun-label">日の入り</span>${sunset}</span></div>
      <div class="pw-coords">
        <span><span class="pw-coords-label">緯度</span>${lat.toFixed(4)}</span>
        <span><span class="pw-coords-label">経度</span>${lon.toFixed(4)}</span>
      </div>
    </div>`;
}

function degToDir(deg) {
  const dirs = ['北','北北東','北東','東北東','東','東南東','南東','南南東','南','南南西','南西','西南西','西','西北西','北西','北北西'];
  return dirs[Math.round(deg / 22.5) % 16];
}

function toLocalTime(unix, tz) {
  const d = new Date((unix + tz) * 1000);
  return `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;
}

function toLocalDateTime(unix, tz, showSec = false) {
  const d = new Date((unix + tz) * 1000);
  const M = d.getUTCMonth() + 1;
  const D = d.getUTCDate();
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  const s = String(d.getUTCSeconds()).padStart(2, '0');
  return showSec ? `${M}/${D} ${h}:${m}:${s}` : `${M}/${D} ${h}:${m}`;
}
