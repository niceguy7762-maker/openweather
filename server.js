require('dotenv').config();
const express   = require('express');
const axios     = require('axios');
const path      = require('path');
const rateLimit = require('express-rate-limit');

const app     = express();
const API_KEY = process.env.OPENWEATHER_API_KEY;

// レート制限：1つのIPから1時間に60回まで
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'リクエストが多すぎます。1時間後に再試行してください。' }
});
app.use('/api/', limiter);

// 静的ファイル（index.html の自動配信は無効化して手動ルーティングで制御）
app.use(express.static('public', { index: false }));

// ルート：APIキー未設定ならセットアップ画面、設定済みなら地図
app.get('/', (req, res) => {
  if (!API_KEY) {
    res.sendFile(path.join(__dirname, 'public', 'setup.html'));
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

app.get('/api/weather', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  if (!isFinite(lat) || !isFinite(lon))        return res.status(400).json({ error: '緯度・経度は数値で指定してください' });
  if (lat < -90  || lat > 90)                  return res.status(400).json({ error: '緯度は -90〜90 の範囲で指定してください' });
  if (lon < -180 || lon > 180)                 return res.status(400).json({ error: '経度は -180〜180 の範囲で指定してください' });
  if (!API_KEY)                                return res.status(503).json({ error: 'サーバーに API キーが設定されていません' });

  try {
    const { data } = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { lat, lon, appid: API_KEY, units: 'metric', lang: 'ja' }
    });
    res.json(data);
  } catch (err) {
    const status  = err.response?.status  || 500;
    const message = err.response?.data?.message || '天気データの取得に失敗しました';
    res.status(status).json({ error: message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  if (!API_KEY) {
    console.warn('⚠️  .env に OPENWEATHER_API_KEY が設定されていません。セットアップ画面を表示します。');
  }
  console.log(`サーバー起動: http://localhost:${PORT}`);
});
