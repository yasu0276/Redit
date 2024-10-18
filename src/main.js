// Tauri の invoke 関数を使用して Rust コマンドを呼び出します
const { invoke } = window.__TAURI__.tauri;
const tauri = window.__TAURI__;
const editor = document.getElementById('editor'); // editor のオブジェクト
const highlighted = document.getElementById('highlighted'); // editor のオブジェクト
let currentFilePath = null;  // 保存されたファイルパスを保持する変数
let isComposing = false;

function visualizeSpaces(text) {
  const hasBOM = text.charCodeAt(0) === 0xFEFF;

  if (hasBOM) {
    text = text.substring(1);
  }

  /* 改行コードを統一 */
  text = text.replace(/\r\n/g, '\n');

  /* 空白、改行を可視化 */
  let html = text
      .replace(/ /g, '<span class="half-width-space"> </span>')
      .replace(/　/g, '<span class="full-width-space">　</span>')
      .replace(/\t/g, '<span class="tab">→</span>') // タブを矢印で可視化
      .replace(/\n/g, '<span class="eon">←</span><br>') // タブを矢印で可視化


  /* BOM を可視化 */
  if (hasBOM){
    html = '<span class="bom">BOM</span>' + html;
  }

  return html;
}

// Rust 側のドロップイベント検知 ( 本来は javascript 側を使うべきだが Rust 側でないとイベント検知不可のため )
tauri.event.listen("tauri://file-drop", (event) => {
  const paths = event.payload;
  if (paths) {
    openFile(paths[0]);
  }
  requestAnimationFrame(() => {
    // ドロップ後に描画更新
    editor.style.cursor = 'text'; // 通常のカーソルに戻す
    highlighted.style.cursor = 'text'; // 通常のカーソルに戻す
  });
});

// 非同期ファイルオープン処理を呼び出す
async function openFile(path) {
  const content = await invoke("open_file", { path });
  editor.value = content;
  highlighted.innerHTML = visualizeSpaces(editor.value);
  currentFilePath = path;  // ファイルを開いたらパスを記憶
}

async function openFileDialog() {
  const path = await window.__TAURI__.dialog.open();
  if (path) {
    openFile(path);
  }
}

async function saveFile() {
  const content = editor.innerText;

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

// ドラッグイベント検知
editor.addEventListener('dragover', (event) => {
  event.preventDefault(); // デフォルトの挙動を防ぐ
  requestAnimationFrame(() => {
    // 次のフレームで画面を更新
    editor.style.cursor = 'move'; // カーソルをドラッグ中の状態に変更
    highlighted.style.cursor = 'move'; // カーソルをドラッグ中の状態に変更
  });
});

editor.addEventListener('input', () => {
  const visualizedText = visualizeSpaces(editor.value);
  highlighted.innerHTML = visualizedText;
});

// ページロード時にテキストエリアにフォーカスを当てる
document.addEventListener('DOMContentLoaded', () => {
  // 初期化
  editor.focus();

  editor.addEventListener("keydown", (event) => {

    // フォントの拡大
    if ((event.ctrlKey || event.metaKey) && (event.key === "=" || event.key === "+")) {
      // 現在のフォントサイズを取得
      const style = window.getComputedStyle(editor);
      let fontSize = parseFloat(style.fontSize); // フォントサイズを数値に変換
      event.preventDefault(); // ブラウザのデフォルトの保存を無効化
      fontSize += 1; // フォントサイズを変更
      editor.style.fontSize = fontSize + "px";
      highlighted.style.fontSize = fontSize + "px";
    }

    // フォントの縮小
    if ((event.ctrlKey || event.metaKey) && event.key === "-") {
      // 現在のフォントサイズを取得
      const style = window.getComputedStyle(editor);
      let fontSize = parseFloat(style.fontSize); // フォントサイズを数値に変換
      event.preventDefault(); // ブラウザのデフォルトの保存を無効化
      fontSize -= 1; // フォントサイズを変更
      if (fontSize < 5) {
        fontSize = 5;
      }
      editor.style.fontSize = fontSize + "px";
      highlighted.style.fontSize = fontSize + "px";
    }

    // ファイルオープンのためのファイルダイアログを開く
    if ((event.ctrlKey || event.metaKey) && event.key === "o") {
      event.preventDefault(); // ブラウザのデフォルトの動作を防ぐ
      openFileDialog(); // ファイルを開く関数を呼び出す
    }

    // ファイルセーブのためのファイルダイアログを開く
    if ((event.ctrlKey || event.metaKey) && event.key === "s") {
      event.preventDefault(); // ブラウザのデフォルトの保存を無効化
      saveFile(); // ファイル保存関数を呼び出す
    }

    if (event.key === 'Tab') {
      event.preventDefault();  // タブキーのデフォルト動作を無効化

      // カーソル位置の取得
      const start = editor.selectionStart;
      const end = editor.selectionEnd;

      // テキストにタブ文字を挿入
      editor.value = editor.value.substring(0, start) + '\t' + editor.value.substring(end);

      // カーソル位置をタブの後ろに移動
      editor.selectionStart = editor.selectionEnd = start + 1;
      const visualizedText = visualizeSpaces(editor.value);
      highlighted.innerHTML = visualizedText;
    }
  });

});
