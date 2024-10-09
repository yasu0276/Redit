// Tauri の invoke 関数を使用して Rust コマンドを呼び出します
const { invoke } = window.__TAURI__.tauri;
const tauri = window.__TAURI__;
const editor = document.getElementById('editor'); // editor のオブジェクト
let currentFilePath = null;  // 保存されたファイルパスを保持する変数
let isComposing = false;

// ページロード時にテキストエリアにフォーカスを当てる
window.onload = () => {
  editor.focus();
};

function visualizeSpaces(text) {
  return text
      .replace(/ /g, '<span class="half-width-space"> </span>')
      .replace(/　/g, '<span class="full-width-space">　</span>')
      .replace(/\t/g, '<span class="tab">→</span>'); // タブを矢印で可視化
}

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
  });
});

// 非同期ファイルオープン処理を呼び出す
async function openFile(path) {
  const content = await invoke("open_file", { path });
  const visualizedText = visualizeSpaces(content);
  editor.innerHTML = visualizedText;
  currentFilePath = path;  // ファイルを開いたらパスを記憶
  updateLineNumbers();
  placeCaretAtEnd();
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


async function updateLineNumbers() {
  const content = editor.innerText;
  const lineNumbers = document.getElementById('line-numbers');
  let lineCount = await invoke("line_count", { content });

  lineNumbers.innerHTML = ''; // 行番号をクリア

  for (let i = 0; i < lineCount; i++) {
    lineNumbers.innerHTML += `<span class="line-number">${i + 1}</span>`;
  }
}

function placeCaretAtEnd() {
  editor.focus();
  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

// ドラッグイベント検知
editor.addEventListener('dragover', (event) => {
  event.preventDefault(); // デフォルトの挙動を防ぐ
  requestAnimationFrame(() => {
    // 次のフレームで画面を更新
    editor.style.cursor = 'move'; // カーソルをドラッグ中の状態に変更
  });
});

editor.addEventListener("compositionstart", () => {
  isComposing = true;
});

editor.addEventListener("compositionend", () => {
  isComposing = false;
});

editor.addEventListener('input', () => {
  // 変換処理中は何もしない
  if (isComposing == false) {
    const visualizedText = visualizeSpaces(editor.innerText);
    editor.innerHTML = visualizedText;
    updateLineNumbers();
    placeCaretAtEnd();
  }
});

editor.addEventListener("keydown", (event) => {
  const lineNumbers = document.getElementById('line-numbers');
  // フォントの拡大
  if ((event.ctrlKey || event.metaKey) && (event.key === "=" || event.key === "+")) {
    // 現在のフォントサイズを取得
    const style = window.getComputedStyle(editor);
    let fontSize = parseFloat(style.fontSize); // フォントサイズを数値に変換
    event.preventDefault(); // ブラウザのデフォルトの保存を無効化
    fontSize += 1; // フォントサイズを変更
    editor.style.fontSize = fontSize + "px";
    lineNumbers.style.fontSize = fontSize + "px";
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
    lineNumbers.style.fontSize = fontSize + "px";
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
  // Enter 入力動作を上書き
  if (event.key === 'Enter') {
    event.preventDefault(); // デフォルトのEnter動作を無効化
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);

    // <br> タグを作成して挿入
    const br = document.createElement('br');
    range.insertNode(br);

    // 改行後にカーソルを移動
    range.setStartAfter(br);
    range.setEndAfter(br);
    selection.removeAllRanges();
    selection.addRange(range);

    updateLineNumbers();
    placeCaretAtEnd();
  }
});

// 初期化
updateLineNumbers();