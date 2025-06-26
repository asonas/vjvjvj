# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

オーディオリアクティブなWebベースVJアプリケーション。veda.jsライブラリを使用してWebGLシェーダーでリアルタイム音声可視化を実現。

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プレビューサーバー
npm run preview

# 依存関係インストール
npm install
```

## アーキテクチャ

### コア構成
- **Vite + TypeScript**: モダンなビルド環境
- **veda.js**: Three.jsベースのシェーダーアートフレームワーク
- **WebGL**: リアルタイムグラフィックス描画

### ディレクトリ構造
```
├── src/
│   └── main.ts          # メインアプリケーション
├── vedajs/              # veda.jsライブラリ（サブモジュール）
├── index.html           # HTMLエントリーポイント
├── vite.config.ts       # Viteビルド設定
└── tsconfig.json        # TypeScript設定
```

### 主要機能
1. **オーディオ入力**: Web Audio APIでマイク音声取得
2. **FFT解析**: リアルタイム周波数スペクトラム分析
3. **シェーダー描画**: GLSL フラグメントシェーダーでビジュアル生成
4. **リアルタイム処理**: 60fps音声反応ビジュアル

### veda.js統合
- `vite.config.ts`でaliasを設定してローカルライブラリを参照
- Three.js v0.135.0との互換性を維持
- WebGLレンダラーとオーディオローダーを自動初期化

### 開発時の注意点
- ブラウザのマイクアクセス許可が必要
- HTTPSまたはlocalhostでのみ動作（セキュリティ制約）
- WebGLサポートブラウザが必須

## シェーダー開発

### ユニフォーム変数
- `time`: 経過時間
- `resolution`: キャンバス解像度
- `volume`: 音量レベル
- `spectrum[16]`: 16バンド周波数スペクトラム

### 基本シェーダー構造
```glsl
precision mediump float;
uniform float time;
uniform vec2 resolution;
uniform float volume;
uniform float spectrum[16];

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
    // シェーダーコード
    gl_FragColor = vec4(color, 1.0);
}
```