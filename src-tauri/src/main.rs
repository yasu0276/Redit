// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::fs;
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
    // ファイルのパスが存在するかチェックし、読み込む
    let path = PathBuf::from(path);
    if path.exists() {
        match fs::read_to_string(path) {
            Ok(content) => Ok(content),
            Err(err) => Err(format!("Failed to read file: {}", err)),
        }
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
