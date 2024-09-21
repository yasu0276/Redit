// Tauri の invoke 関数を使用して Rust コマンドを呼び出します
const { invoke } = window.__TAURI__.tauri;
const tauri = window.__TAURI__;
let currentFilePath = null;  // 保存されたファイルパスを保持する変数

// ページロード時にテキストエリアにフォーカスを当てる
window.onload = () => {
  document.getElementById("editor").focus();
};

// ドラッグイベント検知
editor.addEventListener('dragover', (event) => {
  event.preventDefault(); // デフォルトの挙動を防ぐ
  requestAnimationFrame(() => {
    // 次のフレームで画面を更新
    editor.style.cursor = 'move'; // カーソルをドラッグ中の状態に変更
  });
});

// Rust 側のドロップイベント検知 ( 本来は javascript 側を使うべきだが Rust 側でないとイベント検知不可のため )
tauri.event.listen("tauri://file-drop", (event) => {
  const paths = event.payload;
  const editor = document.getElementById("editor");
  if (paths) { 
    openFile(paths[0]);
  }
  requestAnimationFrame(() => {
    // ドロップ後に描画更新
    editor.style.cursor = 'text'; // 通常のカーソルに戻す
    editor.setSelectionRange(0, 0);
  });
});

// 非同期ファイルオープン処理を呼び出す
async function openFile(path) {
  const content = await invoke("open_file", { path });
  const editor = document.getElementById("editor");
  editor.value = content;
  currentFilePath = path;  // ファイルを開いたらパスを記憶
}

async function openFileDialog() {
  const path = await window.__TAURI__.dialog.open();
  if (path) {
    openFile(path);
  }
}

async function saveFile() {
  const content = document.getElementById("editor").value;

  // すでにファイルが保存されている場合は上書き保存
  if (currentFilePath) {
    await invoke("save_file", { path: currentFilePath, content });
  } else {
    // ファイル保存ダイアログを表示して保存先を指定
    const path = await window.__TAURI__.dialog.save();
    if (path) {
      currentFilePath = path;  // ファイルパスを記憶
      await invoke("save_file", { path, content });
    }
  }
}

// Ctrl + S を監視する
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "s") {
    event.preventDefault(); // ブラウザのデフォルトの保存を無効化
    saveFile(); // ファイル保存関数を呼び出す
  }
});

// Ctrl + O を監視する
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "o") {
    event.preventDefault(); // ブラウザのデフォルトの動作を防ぐ
    openFileDialog(); // ファイルを開く関数を呼び出す
  }
});