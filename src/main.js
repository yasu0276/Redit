const { invoke } = window.__TAURI__.core;

const tauri = window.__TAURI__;
const editor = document.getElementById('editor'); // editor のオブジェクト
const highlighted = document.getElementById('highlighted'); // editor のオブジェクト
let currentFilePath = null;  // 保存されたファイルパスを保持する変数
let isComposing = false;

function replaceBOM(text) {
  const BOM_REPLACEMENT = '\uFFF9';
  text = text.replace(/\uFEFF/g, BOM_REPLACEMENT); // BOM を U+FFF9 に置き換え
  return text;
}

function visualizeSpaces(text) {
  let bomCount = 0;

  while (text.charCodeAt(0) === 0xFEFF) {
    bomCount++;
    text = text.substring(1);
  }

  /* 改行コードを統一 */
  text = text.replace(/\r\n/g, '\n');

  /* 空白、改行を可視化 */
  let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/ /g, '<span class="half-width-space">&nbsp;</span>')
      .replace(/　/g, '<span class="full-width-space">　</span>')
      .replace(/\t/g, '<span class="tab">&nbsp;&nbsp;&nbsp;&nbsp;</span>')  // タブを可視化
      .replace(/\n/g, '<span class="eon"> </span><br>') // タブを可視化
      .replace(/\uFFF9/g, '<span class="bom"> </span>'); // BOM を可視化

  /* BOM を可視化 */
  if (bomCount > 0) {
    let bomHtml = '';
    for (let i = 0; i < bomCount; i++) {
      bomHtml = '<span class="bom"> </span>';
    }
    html = bomHtml + html;
  }

  return html;
}

function updateText(content) {
  editor.value = replaceBOM(content);
  highlighted.innerHTML = visualizeSpaces(editor.value);
  editor.focus();  // テキストエリアにフォーカス
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

editor.addEventListener('scroll', function() {
  highlighted.scrollTop = editor.scrollTop;  // 縦スクロールの同期
  highlighted.scrollLeft = editor.scrollLeft;  // 横スクロールの同期
});

// 非同期ファイルオープン処理を呼び出す
async function openFile(path) {
  const content = await invoke("open_file", { path });
  updateText(content);
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
  updateText(editor.value);
});

// ページロード時にテキストエリアにフォーカスを当てる
document.addEventListener('DOMContentLoaded', () => {
  // 初期化
  editor.focus();

  // macOS 検出
  if (navigator.userAgent.includes("Mac OS")) {
      document.body.classList.add("macos");
  }
  // windows 検出
  if (navigator.userAgent.includes("Windows")) {
    document.body.classList.add("windows");
  }

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

      // カーソルの現在位置と選択範囲を取得
      const start = editor.selectionStart;
      const end = editor.selectionEnd;

      // 4 つの空白文字
      const spaces = "    ";

      // テキストを取得して、カーソル位置で空白を挿入
      editor.value = editor.value.slice(0, start) + spaces + editor.value.slice(end);

      // カーソル位置を 4 つの空白の後ろに移動
      editor.selectionStart = editor.selectionEnd = start + spaces.length;
      updateText(editor.value);
    }
  });

});


// 初期化時に一度同期
updateText(editor.value);