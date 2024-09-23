// Tauri の invoke 関数を使用して Rust コマンドを呼び出します
const { invoke } = window.__TAURI__.tauri;
const tauri = window.__TAURI__;
let currentFilePath = null;  // 保存されたファイルパスを保持する変数

// ページロード時にテキストエリアにフォーカスを当てる
window.onload = () => {
  document.getElementById("editor").focus();
};

function visualizeSpaces(text) {
  return text
      .replace(/ /g, '<span class="half-width-space"> </span>')
      .replace(/　/g, '<span class="full-width-space">　</span>')
      .replace(/\t/g, '<span class="tab">→</span>'); // タブを矢印で可視化
}

function saveCaretPosition(context) {
  let selection = window.getSelection();
  let range = selection.getRangeAt(0);
  let preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(context);
  preCaretRange.setEnd(range.endContainer, range.endOffset);
  return preCaretRange.toString().length; // カーソル位置を文字数として保存
}

function restoreCaretPosition(context, position) {
  let nodeStack = [context], node, charCount = 0, foundStart = false, stop = false;
  let range = document.createRange();
  let sel = window.getSelection();

  range.setStart(context, 0);
  range.collapse(true);

  while (!stop && (node = nodeStack.pop())) {
      if (node.nodeType === 3) { // テキストノード
          let nextCharCount = charCount + node.length;
          if (!foundStart && position <= nextCharCount) {
              range.setStart(node, position - charCount);
              range.setEnd(node, position - charCount);
              foundStart = true;
              stop = true;
          }
          charCount = nextCharCount;
      } else {
          let i = node.childNodes.length;
          while (i--) {
              nodeStack.push(node.childNodes[i]);
          }
      }
  }

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
  const editor = document.getElementById("editor");
  const visualizedText = visualizeSpaces(content);
  editor.innerHTML = visualizedText;
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

function placeCaretAtEnd(el) {
  el.focus();
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function updateLineNumbers() {
  const editor = document.getElementById('editor');
  const lineNumbers = document.getElementById('line-numbers');
  const text = editor.innerText; // エディターのテキストを取得
  const lines = text.split('\n'); // 改行で分割

  // 文字数がある行をカウント
  let lineCount = lines.length;
  if (text.length > 0 && text[text.length - 1] !== '\n') {
    lineCount++; // 最後に改行がない場合、行数を1つ増やす
  }

  lineNumbers.innerHTML = ''; // 行番号をクリア
  if (lineCount === 1) { 
    lineNumbers.innerHTML += `<span class="line-number">${lineCount}</span>`;
  } else { 
    for (let i = 0; i < lineCount - 1; i++) {
      lineNumbers.innerHTML += `<span class="line-number">${i + 1}</span>`;
    }
  }
}

document.getElementById('editor').addEventListener('input', () => {
  const editor = document.getElementById("editor");
  const visualizedText = visualizeSpaces(editor.innerText);
  editor.innerHTML = visualizedText;
  updateLineNumbers();
  placeCaretAtEnd(editor);
});

// 初期化
updateLineNumbers();