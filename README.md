# Redit

## 概要
Tauri で開発したテキストエディターです。「半角空白」、「全角空白」、「Tab」を必ず別の色で可視化して表示するようにしています。

## 動作デモ
https://github.com/user-attachments/assets/16dd47c6-7ade-4f9a-a4df-889c85152360



## 環境構築

[Rust 公式のページ](https://www.rust-lang.org/ja/tools/install)を参考に Rust をインストールしてください。
すでに Rust をインストールしている場合は Ver.1.74 以降に更新が必要です。以下のコマンド等を使用して更新してください。
```
rustup update
```

次に以下のコマンドを実行して Tauri の開発環境に必要なものをインストールしてください。

```
cargo install create-tauri-app && cargo install tauri-cli
```

ビルド、実行の際は以下のコマンドを実行してください。
```
cargo tauri dev
```

## IDE のセットアップ

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
