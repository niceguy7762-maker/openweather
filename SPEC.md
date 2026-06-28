# World Weather Map 仕様書

## 概要

OpenWeatherMap API を使用したインタラクティブな世界天気地図アプリ。  
世界地図上の任意の地点をクリック、または国・都市・緯度経度を指定して、リアルタイムの天気情報をポップアップ表示する。

---

## 技術スタック

| 種別 | 使用技術 |
|---|---|
| フロントエンド | HTML / CSS / JavaScript（バニラ） |
| 地図ライブラリ | Leaflet.js 1.9.4（CDN） |
| 地図タイル | CartoDB Dark Matter（API キー不要） |
| 国境データ | world-atlas 2（TopoJSON） + topojson-client 3（CDN） |
| バックエンド | Node.js + Express |
| 天気データ | OpenWeatherMap Current Weather API |
| レート制限 | express-rate-limit |

---

## ファイル構成

```
/
├── server.js           Express サーバー（APIプロキシ・ルーティング）
├── package.json
├── package-lock.json
├── .env                OPENWEATHER_API_KEY を記載（git管理外）
├── .gitignore
├── CLAUDE.md           Claude Code 向け開発ガイド
├── SPEC.md             本仕様書
├── SETUP.md            利用者向けセットアップ手順書
└── public/
    ├── index.html      地図アプリ本体
    ├── setup.html      APIキー未設定時のセットアップ案内ページ
    ├── app.js          地図・天気の全ロジック
    ├── style.css       全スタイル（ダーク＋グラスモーフィズム）
    ├── countries.js    国メタデータ（70カ国以上）
    └── cities.js       都市データ（国別・ISOコードキー）
```

---

## アーキテクチャ

### リクエストフロー

```
ブラウザ
  │
  ├─ GET /           → server.js がルーティング
  │                      APIキーあり  → index.html（地図）
  │                      APIキーなし  → setup.html（案内）
  │
  ├─ GET /api/weather?lat=X&lon=Y
  │       → server.js が OpenWeatherMap API にプロキシ
  │             APIキーはサーバー側のみ保持（ブラウザに露出しない）
  │
  └─ GET /app.js, /style.css 等
          → express.static で public/ を配信
```

### APIキー管理

- APIキーはサーバー側の `.env` ファイルのみに保存
- ブラウザ（クライアント）には一切送信しない
- 起動時にサーバーがキーの有無を確認し、未設定なら `setup.html` を表示

### 起動フロー

```
npm start
  └─ server.js 起動
       └─ .env に API_KEY あり → GET / で index.html を配信
       └─ .env に API_KEY なし → GET / で setup.html を配信（取得手順を案内）
```

### セキュリティ対策

| 対策 | 実装 |
|---|---|
| APIキー隠蔽 | サーバー側 `.env` のみ保持。ブラウザ非公開 |
| レート制限 | 1IP・1時間60リクエストまで（express-rate-limit） |
| 入力バリデーション | lat（−90〜90）・lon（−180〜180）の数値・範囲チェック |
| パストラバーサル防止 | `path.join(__dirname, ...)` でファイルパスを固定 |
| Git流出防止 | `.env` と `node_modules/` を `.gitignore` で除外 |

---

## 機能一覧

### 1. セットアップ案内ページ（setup.html）

- `.env` に API キーが未設定の場合にサーバーが自動表示
- OpenWeatherMap のアカウント登録〜APIキー取得手順を6ステップで案内
- `.env` への記述方法・サーバー再起動手順を表示
- APIキーを `.env` に設定してサーバーを再起動すると地図画面に切り替わる

### 2. インタラクティブ地図（index.html）

- **CartoDB Dark Matter** タイルのダークテーマ地図
- ズームイン/アウト（右下ボタン、またはマウスホイール）
- ズームレベル 2〜18
- 世界一周スクロール対応（`worldCopyJump: true`）

### 3. 都市マーカー表示

- ワールドビュー時：世界30主要都市のラベルを表示
- 国選択時：その国の都市ラベルに切り替え
- マーカーは `divIcon` による CSS テキストラベル＋ドット

### 4. 国選択ドロップダウン

- 70カ国以上から選択（日本が先頭、以降あいうえお順）
- 選択すると：
  - TopoJSON データを使いその国を水色でハイライト
  - 国の境界に合わせてズームイン（`fitBounds`）
  - 都市ドロップダウンが有効化され、その国の都市一覧を表示

### 5. 都市選択ドロップダウン

- 国選択後に有効化
- 日本は 47 都道府県庁所在地すべてを収録
- 都市選択でズームレベル 10 にズームイン＋天気表示

### 6. 緯度経度入力

- 緯度・経度を数値入力して「表示」ボタンを押す
- 入力した地点に PIN を立ててズームイン＋天気表示
- Enter キーでも実行可能
- バリデーション：緯度 −90〜90、経度 −180〜180（クライアント・サーバー両方）

### 7. 地図クリック

- 任意の地点をクリックして PIN を立て天気を表示

### 8. 天気ポップアップ

表示項目：

| 項目 | 内容 |
|---|---|
| 現地時刻 | 現在の現地時間（`timezone` オフセットから算出） |
| 地点名・国コード | 選択都市名または API レスポンスの地名 |
| 天気アイコン | OpenWeatherMap 公式アイコン（@2x） |
| 天気の概況 | 日本語（例：晴れ、小雨） |
| 気温 | 現在気温（°C） |
| データ更新時点 | OWM がデータを更新した現地時刻（秒まで表示） |
| 体感温度 | feels_like（°C） |
| 湿度 | % |
| 気圧 | hPa |
| 風速 | m/s |
| 風向 | 16方位（北・北北東・北東 … など） |
| 突風 | m/s（データがある場合） |
| 雲量 | % |
| 視程 | km |
| 降水量 | mm/1h（降水がある場合のみ） |
| 降雪量 | mm/1h（降雪がある場合のみ） |
| 日の出 | 現地時刻（HH:MM） |
| 日の入り | 現地時刻（HH:MM） |
| 緯度・経度 | 小数点4桁 |

> **注意：** `temp_max` / `temp_min` はその日の最高・最低気温ではなく、観測グリッド内の計算上の誤差幅であるため非表示とした。

### 9. OpenWeatherMap 説明モーダル

- コントロールパネルの「このデータはOpenWeatherMapから取得しました」をクリックで開く
- OWMの概要・提供データ・無料プラン制限・公式サイトリンクを表示
- ✕ ボタンまたは背景クリックで閉じる

---

## データファイル

### countries.js

```javascript
const COUNTRIES = [
  { name:"日本", iso:392, bounds:[[24.0,122.9],[45.5,153.9]] },
  // ...
];
```

- `iso`：ISO 3166-1 数値コード（TopoJSON の `id` と紐付け）
- `bounds`：`[[南緯,西経],[北緯,東経]]`（`fitBounds` に使用）

### cities.js

```javascript
const CITIES_BY_ISO = {
  392: [ // 日本
    { name:"札幌", prefecture:"北海道", lat:43.0642, lon:141.3469 },
    // ...
  ],
};
```

- キーは ISO 数値コード
- 日本のみ `prefecture`（都道府県名）フィールドを持つ

---

## OpenWeatherMap API

### サーバーからのリクエスト

```
GET https://api.openweathermap.org/data/2.5/weather
  ?lat={緯度}
  &lon={経度}
  &appid={APIキー}   ← サーバー側のみ
  &units=metric      ← 温度を °C で取得
  &lang=ja           ← 天気概況を日本語で取得
```

### 主なレスポンスフィールド

| フィールド | 内容 |
|---|---|
| `dt` | データ更新時刻（Unix秒・UTC） |
| `timezone` | UTC からのオフセット（秒） |
| `main.temp` | 現在気温 |
| `main.feels_like` | 体感温度 |
| `main.humidity` | 湿度 |
| `main.pressure` | 気圧 |
| `wind.speed` | 風速 |
| `wind.deg` | 風向（度） |
| `wind.gust` | 突風 |
| `clouds.all` | 雲量 |
| `visibility` | 視程（メートル） |
| `sys.sunrise` | 日の出（Unix秒・UTC） |
| `sys.sunset` | 日の入り（Unix秒・UTC） |
| `rain['1h']` | 過去1時間降水量 |
| `snow['1h']` | 過去1時間降雪量 |

### 無料プラン制限

- 1分あたり 60 リクエスト
- 1日あたり 1,000 リクエスト
- データ更新頻度：約 10〜15 分ごと

---

## 開発コマンド

```bash
npm install      # 依存パッケージのインストール
npm start        # サーバー起動（本番）
npm run dev      # サーバー起動（ファイル変更時に自動再起動）

# サーバーの停止
Ctrl + C                   # フォアグラウンド実行時
kill $(lsof -ti :3000)     # バックグラウンド実行時
```

---

## 設計上の注意点

- `will-change: transform` / `transform: translateZ(0)` を `.control-panel` に適用すると新しいスタッキングコンテキストが生成され、ネイティブ `<select>` のドロップダウンが表示されなくなるため使用禁止。
- Leaflet の地図初期化は `requestAnimationFrame` 内で行い、`map.invalidateSize()` を 100ms 後に実行してコンテナサイズを正確に認識させる。
- `backdrop-filter: blur()` はタイル読み込み中に再描画コストが高いため使用しない。
- APIキーはサーバーサイドのみに保持し、ブラウザの localStorage には保存しない（外部公開時のキー漏洩防止）。
