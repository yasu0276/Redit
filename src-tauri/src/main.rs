// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::fs;
use memmap2::Mmap;
use std::fs::File;
use std::path::PathBuf;

// コマンドとして呼び出せる関数を定義
#[tauri::command]
fn line_count(content: String) -> usize {
    let mut line_count = content.lines().count();

    /* 未入力時は 1 行目を表示するため特殊処理する */
    if line_count == 0 {
        line_count += 1;
    }

    return line_count;
}

// コマンドとして呼び出せる関数を定義
#[tauri::command]
fn open_file(path: String) -> Result<String, String> {
    let path = PathBuf::from(path);
    if path.exists() {
        // ファイルを開く
        let file = File::open(&path).map_err(|err| format!("Failed to open file: {}", err))?;

        // メモリマップを作成
        let mmap = unsafe { Mmap::map(&file) }.map_err(|err| format!("Failed to map file: {}", err))?;

        // マップされた内容を文字列に変換
        let content = String::from_utf8_lossy(&mmap);

        Ok(content.to_string())
    } else {
        Err("File does not exist.".to_string())
    }
}

#[tauri::command]
fn save_file(path: String, content: String) -> Result<(), String> {
    // 指定されたパスにファイルを保存する
    match fs::write(path, content) {
        Ok(_) => Ok(()),
        Err(err) => Err(format!("Failed to save file: {}", err)),
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_file, save_file, line_count])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
