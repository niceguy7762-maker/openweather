# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive world map showing real-time weather for any clicked location, built with Leaflet.js + OpenWeatherMap API.

## Commands

```bash
npm install    # 初回セットアップ
npm start      # サーバー起動 → http://localhost:3000
npm run dev    # nodemon で起動（ファイル変更時に自動再起動）
```

## Architecture

```
server.js          Express サーバー。/api/weather?lat=X&lon=Y を受け取り
                   OpenWeatherMap API へプロキシ。API キーはここのみ保持。
public/
  index.html       アプリシェル（Leaflet.js を CDN から読み込み）
  app.js           マップ初期化・都市マーカー・クリックハンドラー・ポップアップ描画
  style.css        ダーク + グラスモーフィズムテーマ（Leaflet デフォルトを上書き）
```

**重要な設計判断:**
- API キーはサーバーサイドのみ（ブラウザに露出しない）
- 天気データ: metric 単位 (°C)、日本語レスポンス (`lang=ja`)
- マップタイル: CartoDB Dark Matter（API キー不要）
- 都市ラベルは Leaflet `divIcon` で実装

## Environment

`.env` に `OPENWEATHER_API_KEY=<your_key>` を設定すること。
