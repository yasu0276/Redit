# Redit

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
