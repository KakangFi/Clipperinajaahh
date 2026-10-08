# ClipForge

A futuristic browser-only video clipper for GitHub Pages.

## Fitur
- Upload video dari perangkat
- Tidak perlu backend/server untuk file video
- Pilih 15/30/45/60 detik
- Generate 1–30 clips
- Mode sebar sepanjang video / dari awal / acak
- Preview hasil
- Download satu per satu atau Download All
- FFmpeg WebAssembly untuk pemotongan lokal

## Deploy ke GitHub Pages
1. Buat repository baru di GitHub.
2. Upload `index.html`, `style.css`, dan `app.js`.
3. Buka Settings → Pages.
4. Pilih Deploy from a branch → `main` → `/root`.
5. Simpan dan buka URL GitHub Pages.

## Catatan
Versi ini belum melakukan semantic AI detection. "Auto" berarti titik clip dipilih otomatis berdasarkan durasi/mode. Untuk benar-benar mencari bagian paling menarik dari video (berdasarkan ucapan, scene, atau highlight), tambahkan tahap transkripsi/AI pada versi berikutnya.

Karena FFmpeg WebAssembly berjalan di browser, kemampuan video berjam-jam bergantung pada RAM/CPU perangkat dan browser. File sangat besar bisa membutuhkan waktu dan RAM tinggi.
