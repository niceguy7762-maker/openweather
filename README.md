# 🌍 World Weather Map

世界中の天気をリアルタイムで確認できるインタラクティブ地図アプリです。

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey)
![Leaflet](https://img.shields.io/badge/Leaflet.js-1.9.4-green)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 機能

- 🗺️ 世界地図上のクリックした地点の天気をポップアップ表示
- 🌐 70カ国以上の国・都市をドロップダウンから選択（日本は47都道府県庁所在地）
- 📍 緯度・経度を直接入力して天気を表示
- 🎨 国選択時にハイライト＋ズームイン
- 🔒 APIキーはサーバーサイドのみ保持（ブラウザに非公開）

## 画面イメージ

```
┌──────────────────────────────────────────────┐
│ 🌍 World Weather Map   [OpenWeatherMapより]  │
│ [国を選択...]  [都市を選択...]               │
├──────────────────────────────────────────────┤
│                                              │
│   ・東京  ・ニューヨーク  ・ロンドン …      │
│                  （世界地図）                │
│                                          [+]│
│                                          [-]│
├──────────────────────────────────────────────┤
│ 📍 緯度・経度  [___________] [___________] [表示] │
└──────────────────────────────────────────────┘
```

## 技術スタック

| 種別 | 技術 |
|---|---|
| フロントエンド | HTML / CSS / JavaScript |
| 地図 | Leaflet.js + CartoDB Dark Matter |
| バックエンド | Node.js + Express |
| 天気データ | OpenWeatherMap API |

## クイックスタート

```bash
# 1. リポジトリをクローン
git clone https://github.com/niceguy7762-maker/openweather.git
cd openweather

# 2. .env ファイルを作成
cp .env.example .env
# .env を開いて OPENWEATHER_API_KEY にキーを設定

# 3. パッケージをインストール
npm install

# 4. サーバーを起動
npm start
```

ブラウザで `http://localhost:3000` を開く。  
APIキー未設定の場合は取得手順のガイド画面が表示されます。

## ドキュメント

- [セットアップ手順書](SETUP.md) — 初めての方向けの詳しいインストール手順
- [使用説明書](MANUAL.md) — アプリの使い方ガイド
- [仕様書](SPEC.md) — 技術仕様・アーキテクチャ詳細

## OpenWeatherMap API キーの取得

[openweathermap.org](https://openweathermap.org) で無料登録すると API キーを取得できます。  
無料プランで 1日 1,000 リクエスト・1分 60 リクエストまで利用可能です。
