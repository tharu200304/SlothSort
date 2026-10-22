#!/usr/bin/env python3
"""
SlothSort Web Server (Enhanced)
FastAPI backend powering the SlothSort AI web interface.
Features folder switching, rich AI reasoning tags, pre-scan predictions, and full reversibility.
"""

import os
import sys
import json
import shutil
import io
import zipfile
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import core SlothSort functions
from slothsort import (
    DEFAULT_INBOX_DIR,
    DEFAULT_SORTED_DIR,
    DEFAULT_MODEL,
    OLLAMA_HOST,
    MANIFEST_FILE,
    extract_file_snippet,
    query_local_model,
    organize_file,
    undo_slothsort,
    seed_sample_inbox,
    is_ollama_online,
    _fallback_rule_inference,
    format_portable_path
)

app = FastAPI(title="SlothSort AI Interface", description="Web UI for SlothSort Autonomous Local File Tidier")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)

# Active configuration state - portable across any machine
CONFIG = {
    "current_preset": "demo",
    "inbox_path": BASE_DIR / "messy_inbox",
    "vault_path": BASE_DIR / "organized_vault",
    "custom_inbox": None,
    "custom_vault": None,
    "model": DEFAULT_MODEL,
    "available_models": ["llama3.2:3b", "qwen2.5:3b", "phi3:mini", "mistral:7b"]
}

CONFIG["inbox_path"].mkdir(parents=True, exist_ok=True)
CONFIG["vault_path"].mkdir(parents=True, exist_ok=True)

ALL_CATEGORIES = [
    "Invoices & Receipts",
    "Banking & Taxes",
    "Spreadsheets & Data",
    "Legal & Contracts",
    "Research & Academic",
    "Code & Development",
    "Notes & Ideas",
    "Personal & Health",
    "Media & Images",
    "Presentations & Slides",
    "E-Books & Manuals",
    "Travel & Bookings",
    "Resumes & Credentials",
    "Configs & System Logs",
    "Archives & Installers",
    "Audio & Podcasts",
    "Work & Documents",
    "Miscellaneous"
]


@app.get("/api/state")
def get_system_state():
    """Returns the comprehensive state: AI status, folders, rich file cards, and manifest history."""
    ollama_online = is_ollama_online(OLLAMA_HOST)
    inbox = Path(CONFIG["inbox_path"])
    vault = Path(CONFIG["vault_path"])

    # Read manifest index to associate metadata with sorted files
    manifest_map: Dict[str, Dict[str, Any]] = {}
    manifest_entries = []
    manifest_path = vault / MANIFEST_FILE
    if manifest_path.exists():
        try:
            with open(manifest_path, "r", encoding="utf-8") as mf:
                for line in mf:
                    line = line.strip()
                    if line:
                        entry = json.loads(line)
                        manifest_entries.append(entry)
                        # Map by sorted file name
                        s_name = entry.get("sorted_name") or Path(entry.get("sorted_path", "")).name
                        manifest_map[s_name] = entry
        except Exception:
            pass

    # Read inbox files with heuristic pre-scan insights
    inbox_files = []
    if inbox.exists():
        for f in sorted(inbox.iterdir()):
            if f.is_file() and f.name != MANIFEST_FILE:
                stat = f.stat()
                snippet = extract_file_snippet(f)
                # Quick local pre-scan for understandability
                pre_scan = _fallback_rule_inference(f, snippet)
                inbox_files.append({
                    "name": f.name,
                    "extension": f.suffix,
                    "size_bytes": stat.st_size,
                    "modified": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M"),
                    "snippet": snippet[:400],
                    "predicted_category": pre_scan.get("category", "General"),
                    "predicted_name": pre_scan.get("suggested_filename", f.name),
                    "reasoning": pre_scan.get("reasoning", "Awaiting local neural inference"),
                    "tags": pre_scan.get("tags", []),
                    "confidence": pre_scan.get("confidence", "Medium")
                })

    # Read vault files grouped by category with rich metadata
    vault_categories: Dict[str, List[Dict[str, Any]]] = {}
    total_sorted_count = 0
    if vault.exists():
        for item in sorted(vault.iterdir()):
            if item.is_dir():
                files = []
                for f in sorted(item.iterdir()):
                    if f.is_file():
                        stat = f.stat()
                        meta = manifest_map.get(f.name, {})
                        rel_path = str(f.relative_to(BASE_DIR)) if str(f).startswith(str(BASE_DIR)) else str(f)
                        files.append({
                            "name": f.name,
                            "original_name": meta.get("original_name", "Unknown original"),
                            "category": item.name,
                            "path": rel_path,
                            "size_bytes": stat.st_size,
                            "modified": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M"),
                            "summary": meta.get("summary", "Organized by SlothSort"),
                            "reasoning": meta.get("reasoning", "Categorized based on document content patterns"),
                            "tags": meta.get("tags", [item.name.lower()]),
                            "confidence": meta.get("confidence", "95%")
                        })
                        total_sorted_count += 1
                vault_categories[item.name] = files

    user_downloads = Path.home() / "Downloads"

    return {
        "ollama_online": ollama_online,
        "ollama_host": OLLAMA_HOST,
        "active_model": CONFIG["model"],
        "available_models": CONFIG["available_models"],
        "current_preset": CONFIG["current_preset"],
        "inbox_path": str(inbox),
        "vault_path": str(vault),
        "inbox_path_display": format_portable_path(inbox),
        "vault_path_display": format_portable_path(vault),
        "user_downloads_path": str(user_downloads),
        "custom_inbox": CONFIG.get("custom_inbox"),
        "custom_vault": CONFIG.get("custom_vault"),
        "desktop_path": str(Path.home() / "Desktop"),
        "documents_path": str(Path.home() / "Documents"),
        "all_categories": ALL_CATEGORIES,
        "inbox_files": inbox_files,
        "inbox_count": len(inbox_files),
        "vault_categories": vault_categories,
        "sorted_count": total_sorted_count,
        "can_undo": len(manifest_entries) > 0,
        "manifest_history": manifest_entries[-10:]
    }


@app.post("/api/settings/preset")
def switch_preset(preset: str = Query(...)):
    """Switches the active folder preset (demo vs downloads vs custom)."""
    if preset == "demo":
        CONFIG["current_preset"] = "demo"
        CONFIG["inbox_path"] = BASE_DIR / "messy_inbox"
        CONFIG["vault_path"] = BASE_DIR / "organized_vault"
    elif preset == "downloads":
        dl = Path.home() / "Downloads"
        CONFIG["current_preset"] = "downloads"
        CONFIG["inbox_path"] = dl
        CONFIG["vault_path"] = dl / "SlothVault"
    elif preset == "custom" and CONFIG.get("custom_inbox"):
        CONFIG["current_preset"] = "custom"
        CONFIG["inbox_path"] = Path(CONFIG["custom_inbox"])
        CONFIG["vault_path"] = Path(CONFIG["custom_vault"]) if CONFIG.get("custom_vault") else Path(CONFIG["custom_inbox"]) / "SlothVault"
    else:
        raise HTTPException(status_code=400, detail="Invalid preset")

    CONFIG["inbox_path"].mkdir(parents=True, exist_ok=True)
    CONFIG["vault_path"].mkdir(parents=True, exist_ok=True)

    return {
        "status": "success",
        "preset": CONFIG["current_preset"],
        "inbox_path": str(CONFIG["inbox_path"]),
        "vault_path": str(CONFIG["vault_path"]),
        "inbox_path_display": format_portable_path(CONFIG["inbox_path"]),
        "vault_path_display": format_portable_path(CONFIG["vault_path"])
    }


@app.post("/api/settings/custom-folder")
def set_custom_folder(inbox_path: str = Form(...), vault_path: Optional[str] = Form(None)):
    """Sets any folder on the computer as the active inbox target."""
    raw_inbox = inbox_path.strip().strip('"').strip("'")
    if not raw_inbox:
        raise HTTPException(status_code=400, detail="Folder path cannot be empty")

    inbox_p = Path(raw_inbox).expanduser()
    if not inbox_p.is_absolute():
        inbox_p = (BASE_DIR / inbox_p).resolve()
    else:
        inbox_p = inbox_p.resolve()

    try:
        inbox_p.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot access or create folder: {e}")

    if vault_path and vault_path.strip():
        raw_vault = vault_path.strip().strip('"').strip("'")
        vault_p = Path(raw_vault).expanduser()
        if not vault_p.is_absolute():
            vault_p = (BASE_DIR / vault_p).resolve()
        else:
            vault_p = vault_p.resolve()
    else:
        vault_p = inbox_p / "SlothVault"

    vault_p.mkdir(parents=True, exist_ok=True)

    CONFIG["current_preset"] = "custom"
    CONFIG["inbox_path"] = inbox_p
    CONFIG["vault_path"] = vault_p
    CONFIG["custom_inbox"] = str(inbox_p)
    CONFIG["custom_vault"] = str(vault_p)

    return {
        "status": "success",
        "preset": "custom",
        "inbox_path": str(inbox_p),
        "vault_path": str(vault_p),
        "inbox_path_display": format_portable_path(inbox_p),
        "vault_path_display": format_portable_path(vault_p)
    }


@app.post("/api/settings/model")
def switch_model(model: str = Query(...)):
    """Updates the active open-weight model."""
    CONFIG["model"] = model
    return {"status": "success", "model": model}


@app.post("/api/seed")
def seed_demo_files():
    """Populates the active inbox with realistic messy clutter files."""
    inbox = Path(CONFIG["inbox_path"])
    seed_sample_inbox(inbox)
    return {"status": "success", "message": f"Seeded sample clutter files into {inbox.name}"}


@app.post("/api/sort")
def execute_sort(dry_run: bool = False, model: Optional[str] = None):
    """Executes sorting (dry-run or real move) and returns structured results."""
    inbox = Path(CONFIG["inbox_path"])
    vault = Path(CONFIG["vault_path"])

    if not inbox.exists():
        raise HTTPException(status_code=400, detail=f"Inbox folder '{inbox}' does not exist")

    files = [f for f in inbox.iterdir() if f.is_file() and f.name != MANIFEST_FILE]
    if not files:
        return {"status": "empty", "message": "Inbox is clean! Nothing to sort.", "results": []}

    target_model = model or CONFIG["model"]
    ollama_ready = is_ollama_online(OLLAMA_HOST)
    use_mock = not ollama_ready

    results = []
    for file_path in files:
        snippet = extract_file_snippet(file_path)
        analysis = query_local_model(
            file_path=file_path,
            snippet=snippet,
            model_name=target_model,
            use_mock=use_mock
        )

        category = analysis.get("category", "Miscellaneous")
        new_name = analysis.get("suggested_filename", file_path.name)
        summary = analysis.get("summary", "")
        reasoning = analysis.get("reasoning", "Pattern-matched semantic content")
        tags = analysis.get("tags", [])
        confidence = analysis.get("confidence", "High")

        dest_path = organize_file(
            file_path=file_path,
            output_vault=vault,
            analysis=analysis,
            dry_run=dry_run
        )

        rel_dest = str(dest_path.relative_to(BASE_DIR)) if str(dest_path).startswith(str(BASE_DIR)) else str(dest_path)

        results.append({
            "original_name": file_path.name,
            "category": category,
            "suggested_filename": new_name,
            "summary": summary,
            "reasoning": reasoning,
            "tags": tags,
            "confidence": confidence,
            "destination": rel_dest if not dry_run else f"{vault.name}/{category}/{new_name}",
            "dry_run": dry_run
        })

    return {
        "status": "success",
        "dry_run": dry_run,
        "engine_used": f"Ollama ({target_model})" if ollama_ready else "Local Heuristic Engine",
        "processed_count": len(results),
        "results": results
    }


@app.post("/api/undo")
def execute_undo():
    """Reverts all files from organized_vault back to the inbox."""
    vault = Path(CONFIG["vault_path"])
    manifest_path = vault / MANIFEST_FILE
    if not manifest_path.exists():
        return {"status": "error", "message": "No manifest file found to undo"}

    undo_slothsort(vault_path=str(vault))
    return {"status": "success", "message": "All sorted files restored to their original locations"}


@app.post("/api/upload")
async def upload_file_to_inbox(files: List[UploadFile] = File(...)):
    """Accepts user file uploads into the active inbox folder."""
    inbox = Path(CONFIG["inbox_path"])
    saved_files = []
    for uploaded in files:
        safe_filename = Path(uploaded.filename).name
        target_path = inbox / safe_filename
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(uploaded.file, buffer)
        saved_files.append(safe_filename)

    return {"status": "success", "uploaded": saved_files, "count": len(saved_files)}


@app.get("/api/file-content")
def get_file_content(path: str = Query(...)):
    """Safely retrieves a preview of a file's content or media metadata."""
    p = Path(path)
    target = p if p.is_absolute() else (BASE_DIR / path).resolve()

    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    ext = target.suffix.lower()
    is_img = ext in [".png", ".jpg", ".jpeg", ".svg", ".gif", ".webp", ".ico"]
    snippet = extract_file_snippet(target)
    return {
        "name": target.name,
        "path": str(target),
        "extension": ext,
        "is_image": is_img,
        "raw_url": f"/api/file-raw?path={path}",
        "size_bytes": target.stat().st_size,
        "content": snippet
    }


@app.get("/api/file-raw")
def get_file_raw(path: str = Query(...)):
    """Serves raw media files for in-browser rendering."""
    p = Path(path)
    target = p if p.is_absolute() else (BASE_DIR / path).resolve()
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(str(target))


@app.get("/api/file-download")
def download_file(path: str = Query(...)):
    """Serves file directly for browser download."""
    p = Path(path)
    target = p if p.is_absolute() else (BASE_DIR / path).resolve()
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(
        path=str(target),
        filename=target.name,
        media_type="application/octet-stream"
    )


@app.post("/api/vault/rename")
def rename_vault_file(path: str = Form(...), new_name: str = Form(...)):
    """Renames a file in the vault, updating disk and manifest."""
    clean_name = new_name.strip().replace("/", "-").replace("\\", "-")
    p = Path(path)
    file_p = p if p.is_absolute() else (BASE_DIR / path).resolve()
    if not file_p.exists() or not file_p.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    dest_file = file_p.parent / clean_name
    if dest_file.exists() and dest_file != file_p:
        raise HTTPException(status_code=400, detail="A file with that name already exists in this folder")

    shutil.move(str(file_p), str(dest_file))

    # Update manifest if present
    vault = Path(CONFIG["vault_path"])
    manifest_p = vault / MANIFEST_FILE
    if manifest_p.exists():
        try:
            lines = []
            with open(manifest_p, "r", encoding="utf-8") as mf:
                for line in mf:
                    if line.strip():
                        entry = json.loads(line)
                        if entry.get("sorted_name") == file_p.name:
                            entry["sorted_name"] = dest_file.name
                            entry["sorted_path"] = str(dest_file.relative_to(BASE_DIR)) if str(dest_file).startswith(str(BASE_DIR)) else str(dest_file)
                        lines.append(json.dumps(entry))
            with open(manifest_p, "w", encoding="utf-8") as mf:
                mf.write("\n".join(lines) + "\n")
        except Exception:
            pass

    return {
        "status": "success",
        "old_name": file_p.name,
        "new_name": dest_file.name,
        "new_path": str(dest_file.relative_to(BASE_DIR)) if str(dest_file).startswith(str(BASE_DIR)) else str(dest_file)
    }


@app.post("/api/vault/delete")
def delete_vault_file(path: str = Form(...)):
    """Deletes a file from the vault and cleans empty folders."""
    p = Path(path)
    file_p = p if p.is_absolute() else (BASE_DIR / path).resolve()
    if not file_p.exists() or not file_p.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    parent_dir = file_p.parent
    file_p.unlink()

    vault = Path(CONFIG["vault_path"])
    if parent_dir != vault and parent_dir.is_dir() and not any(parent_dir.iterdir()):
        try:
            parent_dir.rmdir()
        except Exception:
            pass

    return {"status": "success", "message": f"Deleted {file_p.name}"}


@app.post("/api/vault/create-category")
def create_category(category_name: str = Form(...)):
    """Creates a new category folder in the organized vault."""
    clean_cat = category_name.strip().replace("/", "-").replace("\\", "-")
    if not clean_cat:
        raise HTTPException(status_code=400, detail="Invalid category name")
    vault = Path(CONFIG["vault_path"])
    cat_dir = vault / clean_cat
    cat_dir.mkdir(parents=True, exist_ok=True)
    if clean_cat not in ALL_CATEGORIES:
        ALL_CATEGORIES.append(clean_cat)
    return {"status": "success", "category": clean_cat, "all_categories": ALL_CATEGORIES}


@app.post("/api/vault/move")
def move_vault_file(path: str = Form(...), new_category: str = Form(...)):
    """Allows moving a file to a different category in the vault."""
    target_cat = new_category.strip().replace("/", "-")
    p = Path(path)
    file_p = p if p.is_absolute() else (BASE_DIR / path).resolve()
    if not file_p.exists() or not file_p.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    vault = Path(CONFIG["vault_path"])
    dest_dir = vault / target_cat
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_file = dest_dir / file_p.name

    counter = 1
    stem = dest_file.stem
    while dest_file.exists() and dest_file != file_p:
        dest_file = dest_dir / f"{stem}_{counter}{dest_file.suffix}"
        counter += 1

    shutil.move(str(file_p), str(dest_file))

    # Clean old folder if empty
    old_dir = file_p.parent
    if old_dir != vault and old_dir.is_dir() and not any(old_dir.iterdir()):
        try:
            old_dir.rmdir()
        except Exception:
            pass

    return {
        "status": "success",
        "old_path": str(file_p),
        "new_path": str(dest_file),
        "new_category": target_cat
    }


@app.post("/api/vault/batch-move")
def batch_move_vault_files(paths: List[str] = Form(...), new_category: str = Form(...)):
    """Batch moves multiple files in the vault to a new category."""
    target_cat = new_category.strip().replace("/", "-")
    vault = Path(CONFIG["vault_path"])
    dest_dir = vault / target_cat
    dest_dir.mkdir(parents=True, exist_ok=True)

    moved = []
    for path_str in paths:
        p = Path(path_str)
        file_p = p if p.is_absolute() else (BASE_DIR / path_str).resolve()
        if file_p.exists() and file_p.is_file():
            dest_file = dest_dir / file_p.name
            counter = 1
            stem = dest_file.stem
            while dest_file.exists() and dest_file != file_p:
                dest_file = dest_dir / f"{stem}_{counter}{dest_file.suffix}"
                counter += 1
            old_parent = file_p.parent
            shutil.move(str(file_p), str(dest_file))
            moved.append(dest_file.name)
            if old_parent != vault and old_parent.is_dir() and not any(old_parent.iterdir()):
                try:
                    old_parent.rmdir()
                except Exception:
                    pass
    return {"status": "success", "moved_count": len(moved), "new_category": target_cat}


@app.post("/api/vault/batch-delete")
def batch_delete_vault_files(paths: List[str] = Form(...)):
    """Batch deletes multiple files in the vault."""
    vault = Path(CONFIG["vault_path"])
    deleted = []
    parents_to_check = set()
    for path_str in paths:
        p = Path(path_str)
        file_p = p if p.is_absolute() else (BASE_DIR / path_str).resolve()
        if file_p.exists() and file_p.is_file():
            parents_to_check.add(file_p.parent)
            file_p.unlink()
            deleted.append(file_p.name)
    for parent_dir in parents_to_check:
        if parent_dir != vault and parent_dir.is_dir() and not any(parent_dir.iterdir()):
            try:
                parent_dir.rmdir()
            except Exception:
                pass
    return {"status": "success", "deleted_count": len(deleted)}


@app.post("/api/vault/batch-zip")
def batch_zip_vault_files(paths: List[str] = Form(...)):
    """Compresses selected files into a zip archive and returns it as a download."""
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for path_str in paths:
            p = Path(path_str)
            file_p = p if p.is_absolute() else (BASE_DIR / path_str).resolve()
            if file_p.exists() and file_p.is_file():
                arc_name = f"{file_p.parent.name}/{file_p.name}"
                zip_file.write(file_p, arcname=arc_name)
    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="slothsort_selected_files.zip"'}
    )


@app.get("/api/vault/export")
def export_manifest():
    """Exports the audit manifest log as downloadable JSONL."""
    vault = Path(CONFIG["vault_path"])
    manifest_file = vault / MANIFEST_FILE
    if not manifest_file.exists():
        raise HTTPException(status_code=404, detail="No manifest available to export")
    return FileResponse(
        path=str(manifest_file),
        filename="slothsort_manifest_export.jsonl",
        media_type="application/x-ndjson"
    )


# Mount static assets
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/", response_class=HTMLResponse)
def serve_index():
    """Serves the main single-page UI."""
    index_file = STATIC_DIR / "index.html"
    if not index_file.exists():
        return HTMLResponse("<h1>Static index.html not found</h1>", status_code=500)
    with open(index_file, "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())


if __name__ == "__main__":
    print("[*] Starting Enhanced SlothSort Web Interface on http://localhost:8000 ...")
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=False)
