// Tauri の invoke 関数を使用して Rust コマンドを呼び出します
const { invoke } = window.__TAURI__.tauri;
let currentFilePath = null;  // 保存されたファイルパスを保持する変数

async function openFile() {
  const path = await window.__TAURI__.dialog.open();
  if (path) {
    const content = await invoke("open_file", { path });
    document.getElementById("editor").value = content;
    currentFilePath = path;  // ファイルを開いたらパスを記憶
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
    openFile(); // ファイルを開く関数を呼び出す
  }
});