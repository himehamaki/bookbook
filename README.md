# bookbook
個人利用向けのローカル保存型「本棚Webアプリ」です。日本の小説を中心に、著者名から作品候補を時系列で並べて取り込む機能を含みます。

## 機能概要

- **本棚管理**: 本の追加・削除・進捗管理（ページ数入力）
- **ステータス自動判定**: 未読 / 読書中 / 読了 を currentPage から自動算出
- **著者検索・取り込み**: 著者名を入力して作品候補を出版年順に表示。選択して一括登録できます
- **重複整理**: 同一タイトルに単行本と文庫版がある場合、単行本を優先して文庫版を除外
- **ローカル保存**: データはすべてブラウザの `localStorage` に保存（サーバー不要）

## ローカル実行手順

```bash
# リポジトリのクローン
git clone https://github.com/himehamaki/bookbook.git
cd bookbook

# 依存パッケージのインストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

### 本番ビルド

```bash
npm run build
npm run start
```

## 使い方

### 本を手動で追加

1. 右上の「本を追加」ボタンをクリック
2. タイトル・著者名・総ページ数を入力して「追加する」

### 著者から取り込む

1. 「著者から取り込む」ボタンをクリック
2. 著者名（例: `東野圭吾`）を入力して「検索」
3. 候補が出版年の昇順で表示されます。不要な作品のチェックを外して「○件を取り込む」

### 進捗を更新する

本棚一覧のページ数欄（例: `0 / 320`）をクリックすると編集モードになります。
現在ページを入力して ✓ を押すと、ステータスが自動更新されます。

| currentPage | ステータス |
|---|---|
| 0 | 未読 |
| 1 〜 totalPages-1 | 読書中 |
| totalPages 以上 | 読了 |

## データソースと制約

### Google Books API

- 著者検索には [Google Books API](https://developers.google.com/books/docs/v1/reference/volumes/list) を使用しています
- **無料・非商用利用前提**。APIキー不要（公開エンドポイント）
- `langRestrict=ja` で日本語書籍を優先取得
- **初版年**: APIの `publishedDate` フィールドを年に正規化して代用します（初版特定は困難）
- **単行本/文庫の判定**: タイトルや出版社名に「文庫」が含まれる場合を文庫と判定するヒューリスティックです。誤判定の可能性があります
- **網羅性**: Google Books の収録状況に依存します。古い作品や絶版本は取得できないことがあります

### localStorage

- データはブラウザの `localStorage` に `bookbook_shelf` キーで保存されます
- ブラウザをまたいだ同期は行いません
- localStorage が破損した場合は空の本棚として安全に初期化されます

## 技術スタック

- [Next.js](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)