# Panduan pengelolaan repo (untuk AI)

> ⚠ **ATURAN NO. 1 — INI FORK, BUKAN REPO UPSTREAM.**
> Repo ini adalah fork milik owner: `tasirin1/mindcraft`, branch aktif
> **`develop`** (bukan `main`/`master`). Upstream-nya
> `mindcraft-bots/mindcraft` (branch `develop`). Push HANYA ke fork
> (`origin` = `tasirin1/mindcraft`); JANGAN push ke upstream, JANGAN
> force-push, dan JANGAN menyinkronkan upstream tanpa perintah owner —
> fork ini sudah divergen (punya rangkaian commit sendiri sejak
> 2025-12-22/24) sehingga sinkronisasi butuh penggabungan hati-hati,
> bukan rebase/reset.
>
> ⚠ **ATURAN NO. 2 — API KEY TIDAK PERNAH MASUK GIT.**
> Kode membaca **`keys.json`** (jamak) lewat `src/utils/keys.js`, dengan
> fallback environment variable. File `key.json` (tunggal) di repo ini
> TIDAK dibaca kode sama sekali. Riwayat fork pernah memuat API key
> Gemini & OpenRouter terisi (commit 2025-12-22/23, sudah dikosongkan di
> HEAD `c718e6d`) — git tidak pernah lupa: key yang pernah ter-commit
> di repo PUBLIK wajib dianggap bocor dan dicabut/diganti di provider.
> Jangan pernah commit `keys.json`/`key.json` yang terisi; pakai env
> variable di mesin/hosting.

Baca file ini SEBELUM mengubah, memperbaiki, atau mengelola repository ini.
Panduan pemakaian umum (instalasi, profil, tugas) ada di `README.md` dan
`minecollab.md`.

**Memori terpusat:** repo ini terhubung ke repo memori pusat `tasirin1/memori-agents-ai` (privat — https://github.com/tasirin1/memori-agents-ai), sumber kebenaran antar-sesi semua repo Tasirin. Awal sesi: `git pull --ff-only` di clone lokal repo memori (path menyesuaikan mesin; di mesin Muse: `~/workspace/memori-agents-ai`), lalu baca `SOUL.md` + `mindcraft.md` di sana, plus `git status --short` + `git log --oneline -5` di repo ini. Akhir sesi: update `mindcraft.md`, jalankan `python3 scripts/check_memory.py` di repo memori, lalu commit + push (`memory: mindcraft - <ringkasan>`). `AGENTS.md` ini mengatur pekerjaan di repo ini; aturan lintas repo versi kanoniknya di `SOUL.md` repo memori.

## Identitas repo

- **Apa**: Mindcraft — bot Minecraft **Java Edition** yang otaknya LLM
  (LLM + Mineflayer). Bot bisa ngobrol, jalan, menambang, crafting,
  membangun, dan bekerja sama dengan bot lain secara otonom.
- **Bahasa/runtime**: JavaScript (ESM, `"type": "module"`), Node.js.
  Upstream menyarankan **Node v18/v20 LTS**; Node v24+ bermasalah di
  modul native `gl`/`canvas` (lihat `FAQ.md`).
- **Lisensi**: MIT (upstream). Paper: arXiv:2504.17950 (MineCollab).
- **Clone kerja di mesin Muse**: `~/workspace/mindcraft-fork` (fork).
  Clone bersih upstream untuk pembanding: `~/workspace/mindcraft`.
- **Tidak ada CI**: repo ini (dan upstream) TIDAK punya GitHub Actions.
  Verifikasi = lokal (sintaks + ESLint + uji jalan), bukan CI — jangan
  mengklaim "CI hijau" untuk repo ini.

## Struktur repository

```
.
├── main.js                  # Pintu masuk: parse argumen + env override → Mindcraft.init → createAgent per profil
├── settings.js              # Pengaturan global (host/port/auth/profil/mode aman) + override SETTINGS_JSON
├── andy.json                # Profil aktif fork: nama "Mish_AI", model "" (diisi env BOT_MODEL)
├── ai.json                  # Profil cadangan fork (nama Mish_AI; BELUM aktif — barisnya dikomentari di settings.js)
├── key.json                 # Template kunci KOSONG (tunggal — TIDAK dibaca kode; yang dibaca keys.json)
├── keys.example.json        # (di upstream) contoh keys.json — di fork digantikan key.json
├── profiles/                # Profil siap pakai per provider + defaults/ (survival/assistant/creative/god_mode) + tasks/
├── bots/                    # Template kode aksi (execTemplate.js, lintTemplate.js) + folder action-code per bot (runtime)
├── patches/                 # patch-package untuk mineflayer/minecraft-data (diterapkan saat postinstall)
├── tasks/                   # Definisi tugas MineCollab (basic, crafting, cooking, construction) + skrip evaluasi Python
├── minecollab.md            # Panduan benchmark MineCollab
├── Dockerfile / docker-compose.yml / Tasks.Dockerfile
├── services/viaproxy/       # ViaProxy untuk versi Minecraft yang tidak didukung langsung
└── src/
    ├── mindcraft/           # mindcraft.js (init/createAgent), mindserver.js (server pengelola + UI :8080), mcserver.js
    ├── process/             # agent_process.js (tiap bot = proses sendiri), init_agent.js (initBot Mineflayer)
    ├── agent/               # Otak bot — lihat "Arsitektur ringkas"
    │   ├── agent.js         # Kelas Agent: spawn, dengar chat, handleMessage, rute antar-bot
    │   ├── commands/        # actions.js (±40 aksi !perintah) + queries.js (±14 tanya) + index.js (parser/validasi)
    │   ├── library/         # skills.js (tangan, ±37 fungsi), world.js (mata), skill_library.js, lockdown.js (sandbox SES)
    │   ├── modes.js         # 10 mode refleks otomatis (tanpa LLM)
    │   ├── coder.js         # LLM menulis JS bebas → lint ESLint → jalan di Compartment SES (maks 5 percobaan)
    │   ├── self_prompter.js # Loop otonom untuk !goal (berhenti sesudah 3x tanpa perintah)
    │   ├── conversation.js  # Percakapan antar-bot (jawab sekarang vs abaikan dulu)
    │   ├── history.js       # Riwayat konteks (maks settings.max_messages)
    │   ├── memory_bank.js   # Tempat tersimpan (rememberHere) + ingatan
    │   ├── npc/             # Pengendali tujuan NPC (item_goal, build_goal, controller)
    │   ├── tasks/           # Validator tugas (tasks.js, cooking_tasks.js, construction_tasks.js)
    │   └── vision/          # Screenshot pandangan bot → vision model (bawaan mati)
    ├── models/              # 1 berkas per provider LLM (gpt, gemini, claude, ollama, openrouter, …) + prompter.js + _model_map.js
    └── utils/               # keys.js (keys.json/env), mcdata.js, text.js, math.js, translator.js, examples.js
```

## Arsitektur ringkas

- **Alur utama**: `main.js` → `Mindserver` (port 8080, UI web) → tiap
  profil = satu `Agent` di proses terpisah → bot Mineflayer nyambung ke
  server Minecraft (tujuan diisi env `MINECRAFT_HOST`/`MINECRAFT_PORT`;
  bawaan lokal 127.0.0.1:55916 — lihat kustomisasi fork).
- **Jawab chat**: pesan masuk → `Agent.handleMessage()` → LLM membalas
  teks + boleh menyisipkan `!perintah(arg)` → `ActionManager`
  menjalankannya → hasil kembali ke LLM sebagai pesan sistem.
- **Dua jalur aksi**: (1) perintah siap pakai `!collectBlocks`,
  `!craftRecipe`, `!goToPlayer`, dll; (2) `!newAction` — LLM menulis
  kode JS bebas yang dijalankan `Coder` dalam sandbox SES. Jalur 2
  hanya ada bila `allow_insecure_coding: true`.
- **Refleks tanpa LLM** (`modes.js`, jalan berkala di `Agent.update`):
  `self_preservation`, `unstuck`, `cowardice`, `self_defense`,
  `hunting`, `item_collecting`, `torch_placing`, `elbow_room`,
  `idle_staring`, `cheat`. Darurat ditangani kode biasa — cepat dan
  hemat token; LLM hanya untuk keputusan.
- **Otonomi**: `!goal("...")` menyalakan `SelfPrompter` — agen
  menyuruh dirinya sendiri terus sampai tujuan selesai.
- **Ingatan**: konteks dibatasi `max_messages`; ingatan jangka panjang
  diringkas LLM (prompt `saving_memory`, ≤500 karakter di profil
  bawaan) + `MemoryBank` untuk tempat yang diingat.
- **Model per tugas**: profil bisa membedakan `model` (ngobrol),
  `code_model` (nulis kode), `vision_model` (mata), `embedding`
  (pilih contoh relevan), `speak_model` (TTS).

## Kustomisasi fork (JANGAN dihapus/dianggap bug tanpa cek bagian ini)

Fork ini BUKAN upstream polos. Perubahan owner (commit 2025-12-22/24,
kebanyakan lewat editor web GitHub) yang sengaja dipertahankan:

| Bagian | Isi kustomisasi | Catatan |
|---|---|---|
| `settings.js` | `minecraft_version`/`host`/`port` dari env (`MINECRAFT_VERSION`/`MINECRAFT_HOST`/`MINECRAFT_PORT`); bawaan `127.0.0.1` port `55916`, `auth: "offline"` | Config server lama (Aternos `mishcreative.aternos.me:58495`) DIHAPUS owner 2026-11-17 — server tujuan sekarang diisi lewat env, jangan hardcode alamat server di kode |
| `settings.js` | `language: "id"`, `init_message: "Aku udah spawn"`, `max_messages: 10`, `num_examples: 1`, `max_commands: 3` | Bawaan upstream: en / 15 / 2 / -1. Batas diperketat demi hemat biaya |
| `settings.js` | Blok `SETTINGS_JSON` dipindah ke dalam `settings.js` (di upstream ada di `main.js`) | Jangan diduplikasi di dua tempat |
| `src/mindcraft/mindserver.js` + `src/mindcraft/public/index.html` | Panel web punya form **API Key AI** (pilih Gemini/OpenRouter, input password, tombol "Pasang Key & Restart Bot") → handler socket `set-api-key` menaruh key di `process.env` proses mindserver (HANYA memori, tidak ditulis ke berkas/git) lalu UI memicu `start-agent` (force-restart proses agen) agar key aktif | Perintah owner 2026-11-17: API key diisi lewat web control, bukan env/berkas — JANGAN ganti jadi penyimpanan berkas; whitelist nama key hanya `GEMINI_API_KEY`/`OPENROUTER_API_KEY` |
| `main.js` | `Mindcraft.init(true, ...)` (upstream `false`), override model via env `BOT_MODEL`, env `PORT` menjadi port Mindserver UI (supaya panel web + chat ke server terbuka di alamat publik hosting), server Express health-check (`GET /health`, `GET /` → "Mish_AI is alive!") di port `HEALTH_PORT` (bawaan `8081`, JANGAN 8080 — tabrakan dengan mindserver) | Pola hosting Koyeb/Render: satu port publik = UI Mindserver; health-check cukup di port internal terpisah (diatur owner 2026-11-17) |
| `andy.json` | `name: "Mish_AI"`, `model: ""` | Model KOSONG disengaja: diisi `BOT_MODEL` saat jalan. Tanpa env itu bot tidak punya otak |
| `ai.json` | Profil `Mish_AI` + `spawn_timeout: 60` | Bidang server lama (`init_commands: ["/joinq survival1"]`, `auto_login`, `password`) DIHAPUS owner 2026-11-17 — bidang itu juga tidak dirujuk `src/` mana pun. Profil ini belum aktif di `settings.js` |
| `package.json` | `pg` ditambahkan; `eslint`, `@eslint/js`, `eslint-plugin-no-floating-promise`, `globals`, `minecraft-assets` dihapus dari dependensi | Akibat: lint lokal dari `coder.js` bisa gagal modul hilang — kembalikan dependensi lint bila menyentuh jalur `!newAction` |
| `key.json` | Template semua kunci KOSONG, nama tunggal | Yang dibaca kode = `keys.json` (jamak) atau env. Lihat Aturan No. 2 |

## Keputusan & larangan historis

- **Branch `develop`** — bawaan upstream dan fork; jangan membuat
  branch `main` atau memindahkan bawaan tanpa perintah owner.
- **`allow_insecure_coding` tetap `false`** di server publik/online.
  Bila hidup, LLM (dan suntikan chat pemain lain) bisa menulis +
  menjalankan JS di mesin yang menjalankan bot; sandbox SES bukan
  jaminan. Saran upstream: bila terpaksa hidup, jalankan dalam Docker.
- **Minecraft JAVA saja** (≤1.21.11, disarankan 1.21.6) — bukan
  Bedrock/HP Android. Bot tidak bisa jalan dari Galaxy A05/STB;
  butuh mesin Node (PC/laptop/VPS/hosting) + dunia/server Java.
- **Nama profil = nama akun Minecraft** untuk server online
  ber-`auth: "microsoft"`; bila beda, bot mengobrol dengan dirinya
  sendiri tanpa henti.
- **Jangan commit secret**: `keys.json`, token, password akun/server.
  `.gitignore` sudah menutup `keys.json` — `key.json` TIDAK tertutup
  `.gitignore`, jadi hati-hati ekstra di file itu.
- **Jangan mengedit `patches/` sembarangan** — patch mineflayer/
  minecraft-data diterapkan ulang oleh `patch-package` tiap
  `npm install`; perubahan modul di `node_modules` tanpa patch baru
  akan hilang.
- **Jangan menaikkan batas hemat fork** (`max_messages`,
  `num_examples`, `max_commands`) tanpa perintah owner — itu
  keputusan biaya.
- **Bahasa**: `AGENTS.md` + memori + penjelasan ke owner = Bahasa
  Indonesia. Kode dan teks dalam game mengikuti upstream (Inggris),
  kecuali kustomisasi fork yang memang Indonesia (`language: "id"`).
  Commit: `type: deskripsi` (lihat aturan pengembangan).

## Pola bug yang pernah/berpotensi terjadi & guard-nya

| Pola | Penyebab | Guard |
|---|---|---|
| "My brain disconnected" / key tidak ditemukan | File bernama `key.json` (tunggal) padahal kode membaca `keys.json`; atau env belum disetel | Cek `src/utils/keys.js`: sumber key = `keys.json` ATAU env var bernama sama persis |
| Bot tidak punya model | `andy.json` `model: ""` dan env `BOT_MODEL` kosong | Setel `BOT_MODEL` (mis. lewat env hosting) atau isi model di profil aktif |
| `ECONNREFUSED` saat nyambung | Dunia LAN belum dibuka / port beda / env server belum disetel | Samakan `host`/`port` di `settings.js`/env dengan server tujuan; bawaan LAN 55916 |
| `npm install` gagal (Python/C++/`gl`) | Node v24+ atau perkakas build hilang | Pakai Node 20 LTS (nvm); bila vision tidak dipakai: `npm install --no-optional` (lihat `FAQ.md`) |
| Bot nyangkut berulang | Pathfinder Mineflayer tidak sempurna; patch tidak terpasang | Hapus `node_modules`, `npm install` ulang agar `patches/` terpasang; mode `unstuck` wajib aktif |
| Bot spam ngobrol sendiri | Nama profil ≠ nama akun Minecraft (server microsoft-auth) | Samakan persis nama profil dengan akun bot |
| Kode `!newAction` ditolak terus | Dependensi ESLint dibuang dari fork (lihat kustomisasi) atau kode tanpa `await` | Kode wajib ≥1 `await`, tanpa `setTimeout`/`setInterval`, hanya `skills`/`world`/`Vec3`/`bot` |
| API key bocor lewat riwayat git | Key pernah ter-commit walau sesudahnya dikosongkan | Aturan No. 2: anggap bocor, cabut di provider; menghapus file TIDAK membersihkan riwayat |
| Perubahan hilang sesudah `npm install` | Edit langsung di `node_modules` | Ubah lewat `patches/` (`npx patch-package <paket>`) |

## Aturan pengembangan

1. **Verifikasi lokal saja, tanpa CI** — repo ini tidak punya workflow
   GitHub Actions. Sebelum commit: `git diff --check` bersih +
   `node --check <file.js>` untuk tiap file JS yang diubah + parse
   JSON untuk profil/settings (`node -e "JSON.parse(...)"` tidak
   berlaku untuk `settings.js` — file itu modul JS, cek dengan
   `node --check settings.js`). Uji jalan penuh (`npm install` +
   `node main.js` + bot masuk dunia) hanya di mesin yang memang
   disiapkan untuk itu (Node 20 LTS); jangan menginstal JDK/server
   Minecraft berat di mesin kerja Muse tanpa perintah owner.
2. **Node v20 LTS** untuk semua pekerjaan jalan/lint. Node v24 hanya
   boleh untuk baca/grep/`node --check`.
3. **Gaya commit**: `type: deskripsi` — tipe: `feat`, `fix`,
   `refactor`, `docs`, `chore`, `perf`. Satu commit satu tujuan.
   Deskripsi singkat; bahasa mengikuti konteks perubahan (kode
   upstream = Inggris, kustomisasi fork = Indonesia boleh).
4. **Patch minimal, ikut gaya sekitar** — fork ini harus tetap mudah
   digabung dengan upstream; jangan refactor besar, jangan ganti nama
   fungsi/berkas upstream tanpa alasan kuat.
5. **Jangan tambah dependensi** tanpa perintah owner — dependensi
   native (`canvas`, `gl`) adalah sumber gagal install terbesar.
6. **Perubahan `settings.js`/`main.js` wajib cek env override** —
   banyak nilai bisa ditimpa env (`SETTINGS_JSON`, `BOT_MODEL`,
   `MINECRAFT_*`, `PROFILES`, …); perilaku di hosting bisa beda dari
   isi file.
7. **Profil baru** = berkas JSON baru di root/`profiles/`, daftarkan
   di `settings.js` `profiles`, pastikan `name` + `model` terisi
   (atau `BOT_MODEL` disetel).
8. **Mode perbaiki = maraton**: perintah "perbaiki/fix/lanjutkan"
   atas temuan audit dikerjakan sampai habis — satu temuan satu
   perbaikan akar masalah, tiap perbaikan selesai langsung commit +
   push ke fork, tidak berhenti di tengah, tidak menumpuk perubahan
   di working tree. Tidak ada CI, jadi "build gagal" di repo ini =
   gagal `node --check`/lint/uji jalan yang dilaporkan owner —
   perbaiki itu dulu sebelum lanjut ke temuan berikutnya.
9. **Audit menyeluruh = sub-agen paralel + verifikasi mandiri**:
   pecah jadi 2–5 sub-agen per area (mis. agent/commands, library,
   models, mindserver/process), lalu verifikasi sendiri tiap klaim
   berat langsung ke kode (`rg`/`sed`) sebelum masuk laporan atau
   patch — klaim sub-agen bukan fakta sampai terbukti. Temuan wajib
   memuat `file:baris` + kenapa berbahaya + skenario pemicu + level
   bahaya (Kritikal/Tinggi/Sedang/Rendah).
10. **Setiap temuan audit dicatat sebagai issue dulu**: hasil audit
    (mode baca-saja) tidak langsung diperbaiki — tiap temuan yang
    lolos verifikasi dibuatkan satu issue GitHub di **fork**
    `tasirin1/mindcraft` (`gh issue create`, satu issue = satu
    temuan) berisi `file:baris`, kenapa berbahaya, skenario pemicu,
    level, dan ronde audit. Perintah "perbaiki/lanjut" mengambil
    antrean dari issue terbuka (level terberat dulu, lalu nomor
    tertua); commit menyebut `Closes #N` dan issue ditutup setelah
    perbaikan di-push (temuan yang digugurkan ditutup dengan alasan).
    Bila Issues dimatikan/`gh` tak ada, catat daftar bernomor di
    `mindcraft.md` repo memori. Versi kanonik: `SOUL.md` memori agen.
11. **Sinkron upstream = keputusan owner** — fork divergen dua arah;
    jangan `merge`/`rebase` dari `mindcraft-bots/mindcraft` tanpa
    perintah eksplisit. Bila diperintah: fetch upstream, laporkan
    jumlah commit tertinggal/duluan dulu, gabung di branch uji, cek
    konflik di file kustomisasi fork (`settings.js`, `main.js`,
    `andy.json`, `ai.json`, `package.json`) satu per satu.
12. **Cek program lokal dulu, manfaatkan semaksimal mungkin** — di
    awal tiap pekerjaan, cek program lokal yang terinstal
    (`command -v` + `--version`; mis. `rg`, `fd`, `jq`, `git`,
    `node`, `python3`, `gh`) lalu pakai yang paling tepat: `rg` untuk
    cari teks, `fd` untuk cari berkas, `jq` untuk JSON.

## Menambah/mengubah fitur — file mana yang disentuh

- **Perintah aksi baru** → `src/agent/commands/actions.js` (definisi +
  implementasi memanggil `library/skills.js` bila perlu).
- **Perintah tanya baru** → `src/agent/commands/queries.js`.
- **Kemampuan fisik baru bot** → fungsi baru di
  `src/agent/library/skills.js` (+ fungsi baca dunia di `world.js`
  bila perlu persepsi baru) + daftarkan dokumentasinya agar terpilih
  sebagai contoh kode.
- **Mode refleks baru** → `src/agent/modes.js` + kunci mode di profil
  `profiles/defaults/*.json`.
- **Provider/model LLM baru** → berkas baru di `src/models/` +
  daftarkan di `src/models/_model_map.js` + baris di tabel README.
- **Perilaku ngobrol/prompt** → profil (`andy.json`, `ai.json`,
  `profiles/*.json`, `profiles/defaults/_default.json` untuk prompt
  bawaan `conversing`/`coding`/`saving_memory`).
- **Tujuan otonom/self-prompt** → `src/agent/self_prompter.js` +
  aksi `!goal` di `commands/actions.js`.
- **Tugas MineCollab baru** → JSON di `tasks/` + validator di
  `src/agent/tasks/` bila jenis tugas baru.
- **Pengaturan global** → `settings.js` (+ spesifikasi UI di
  `src/mindcraft/public/settings_spec.json` bila perlu tampil di UI).
- **UI mindserver** → `src/mindcraft/mindserver.js` +
  `src/mindcraft/public/index.html`.
- **Health-check hosting** → blok Express di akhir `main.js` (fork).

## Cara menjalankan & verifikasi

```bash
# Prasyarat: Node 20 LTS, Minecraft Java ≤1.21.11 (saran 1.21.6)
npm install                      # postinstall menerapkan patches/
# Kunci: buat keys.json (JANGAN commit) ATAU setel env, mis. GEMINI_API_KEY
node main.js                     # mindserver UI di http://localhost:8080
# Dunia sendiri: buka world → Open to LAN port 55916 (samakan settings)
# Tugas contoh:
node main.js --task_path tasks/basic/single_agent.json --task_id gather_oak_logs
# Docker (wajib bila allow_insecure_coding dihidupkan):
docker-compose up --build
```

Verifikasi sesudah perubahan kode:

```bash
git diff --check
node --check <file-yang-diubah>.js
# + uji jalan singkat bila mesinnya siap: bot spawn, balas init_message,
#   dan jalankan 1 perintah (!inventory) tanpa error di log.
```

Pastikan: bot masuk dunia, tidak spam diri sendiri, mode refleks
aktif, dan (bila di hosting) `GET /health` membalas `OK`.

## Keputusan historis (dokumen hidup)

| Keputusan | Alasan |
|---|---|
| Fork dikelola Alive sejak 2026-11-17 atas perintah owner "kelola repository mirip repository lainnya, tambahkan AGENTS.md" | Sebelumnya fork hanya diedit manual lewat web (2025-12-22/24) tanpa panduan agen dan tanpa file memori proyek |
| Bot fork bernama `Mish_AI`, server tujuan Aternos `mishcreative.aternos.me` | Kustomisasi owner 2025-12-23/24 (dari isi `settings.js`/`ai.json` fork) — **config servernya DICABUT 2026-11-17 atas perintah owner ("hapus config untuk server lama"); nama bot tetap** |
| Fork disinkronkan dari upstream 2026-11-17 (merge `c11ea53`: 72 commit upstream masuk, 0 tertinggal) | Perintah owner; konflik `andy.json`/`package.json`/`main.js` diselesaikan dengan mempertahankan kustomisasi fork; dependensi ESLint upstream diterima kembali |
| **Panel ramah HP + API Key & Model pindah ke modal ⚙ Agent Settings** | Perintah owner 2026-11-17: admin web harus enak di layar HP dan rapi. `.controls-row` jadi flex-wrap (dulu grid kaku, tombol kepotong di HP), media query ≤700px (kartu 1 kolom, modal 94vw, tombol sentuh 38px, font input 16px). Blok API Key + Model AI PINDAH dari badan halaman ke modal setelan agen; `set-model` kini per-agen (`{agentName, model}`) dan restart hanya agen itu. JANGAN kembalikan blok global di badan halaman |
| **Halaman chat khusus gaya ChatGPT** | Perintah owner 2026-11-17. Tombol `💬 Chat` di kartu agen membuka overlay sepenuh layar: gelembung user (kanan) / bot (kiri), catatan sistem (baris `⚙…`/`*… used !…`) tampil kecil di tengah. Sumbernya aliran `bot-output` yang sama + `sendMessage` panel; riwayat di memori browser (maks 200/agen), hilang saat panel ditutup — JANGAN klaim tersimpan permanen |
| **Ganti nama bot dari panel web** | Perintah owner 2026-11-17. Blok "Nama Bot" di modal ⚙ (satu panel dengan API Key + Model): handler `rename-agent` memvalidasi aturan username Minecraft (`^[A-Za-z0-9_]{3,16}$`), lalu `destroyAgent` nama lama + `createAgent` dengan setelan sama persis berganti `profile.name` (auto-start). Nama berlaku selama server jalan; permanen = ubah `name` di `profiles/andy.json` repo |
| **Status key & model di kartu agen** | Perintah owner 2026-11-17 (pilihan dari daftar saran Alive). Endpoint `GET /ai-status`: status key TANPA nilai (`asli`/`penampung`/`kosong` per provider, dari env mindserver) + model per agen. Kartu agen punya sel `ai-<nama>` diperbarui `refreshAiStatus()` (sesudah render, sesudah pasang key, lalu tiap 15 dtk); tanpa key asli sel berwarna kuning peringatan. JANGAN pernah kirim nilai key ke panel |
| **Meta viewport WAJIB ada di panel** | Halaman panel awalnya TANPA `<meta name="viewport">` → browser HP merender selebar ±980px lalu mengecilkan, semua tulisan mungil dan media query ≤700px tak pernah aktif (laporan owner "masih perlu zoom" + screenshot 2026-11-17 15:53 WIB, padahal tombol sudah tidak kepotong). Sudah dipasang `width=device-width, initial-scale=1`; JANGAN sampai hilang saat mengedit `<head>` |
| **Mode jembatan kesadaran** | Perintah owner 2026-11-17 ("pake kamu dengan mode kesadaran aku" → jembatan + mode kesadaran). Env `MINDCRAFT_BRIDGE_URL` di proses agen mengarahkan model chat ke repo `tasirin1/mindcraft-bridge` (penyedia `lmstudio`, model `kesadaran`, url dari env) — `agent.js` sebelum `new Prompter`. Temuan kabel: `selectAPI` hanya membaca nama model sehingga `url` profil HILANG; `prompter.js` kini meneruskan `url`/`params` profil ke profil model (chat/code/vision). Tanpa env, perilaku bot persis seperti sebelumnya |
| **Pemilihan model AI di panel web** (dropdown + isian bebas → socket `set-model` → profil agen di memori mindserver + env `BOT_MODEL`, endpoint `GET /current-model`) | Perintah owner 2026-11-17: ganti model tanpa sentuh env/berkas. Daftar bawaan = model gratis (Gemini Flash/Lite, OpenRouter free, Llama :free, Groq). Berlaku sesudah restart agen (UI yang me-restart) |
| **Login otomatis server offline** (env `BOT_LOGIN_PASSWORD`/`BOT_AUTO_REGISTER` PRIORITAS, cadangan kolom `login_password`/`auto_register` di setelan/⚙; dijalankan saat spawn di `agent.js`) | Perintah owner 2026-11-17: kolom user/password buat server AuthMe — username = nama bot, bot kirim `/register` (bila dicentang) lalu `/login` sendiri sesudah spawn. Password TIDAK ditulis ke log; JANGAN commit password asli ke git. Pilihan owner 2026-11-17: password diisi lewat ENV (notebook/hosting), bukan berkas setelan |
| **Gerbang sebutan @namabot** di chat publik (`agent.js` handler `chat`) + POV bawaan MATI lagi (`render_bot_view: false`) | Keputusan owner 2026-11-17: panel fokus ke riwayat chat + status (POV berat dirender di HP); pemain lain menyapa bot lewat sebutan namanya (mis. `@Mish_AI ikut aku`), obrolan tanpa sebutan diabaikan sebelum ke AI (obat boros token). Whisper + panel web TIDAK ikut digerbang. JANGAN kembalikan tangkap-semua-chat |
| Kontrol **Perintah Server** di panel web (kotak `commandInput` per agen → socket `send-server-command` → agen `bot.chat()` mentah) | Perintah owner 2026-11-17: pindah dunia di server berlobi lewat chat web control (mis. `/joinq survival1`). Jalur ini SENGAJA tidak lewat AI/`handleMessage` (nol token, langsung dieksekusi bot); JANGAN alihkan ke LLM |
| Tampilan POV bot MENYALA (`render_bot_view: true`) + nempel di panel dari jarak jauh | Perintah owner 2026-11-17: POV harus ada di web control. Iframe panel bawaan menunjuk `localhost:3000` (tak terjangkau dari HP), jadi mindserver punya endpoint `GET /viewer-url` (env `VIEWER_PUBLIC_URL` atau berkas `viewer_url.txt` di akar repo) dan panel mengganti src iframe POV ke alamat itu; notebook Colab menulis alamat tunnel viewer (port 3000) ke berkas itu |
| Mindserver `server.listen(port)` TANPA host (dual-stack) | Uji Colab 2026-11-17: listen di `'localhost'` terikat ::1 saja sedangkan agen menyambung 127.0.0.1 → `xhr poll error`, agen mati saat start; JANGAN kembalikan host `'localhost'` |
| API key dipasang lewat panel web (form di Mindserver, hidup di memori proses) | Perintah owner 2026-11-17 "mending masukin api nya di web control aja" — notebook Colab memakai key penampung `ISI-LEWAT-PANEL-WEB` agar bot tidak crash saat start tanpa key |
| Port publik hosting = Mindserver UI, health-check pindah ke 8081 | Perintah owner 2026-11-17 "usahakan agar bisa chat di server lewat Web" — sebelumnya port publik hanya melayani halaman health-check sehingga panel chat tidak terjangkau, dan bawaan 8080 health-check bertabrakan dengan mindserver |
| Model diisi lewat env `BOT_MODEL`, bukan di profil | `andy.json` model kosong disengaja pada kustomisasi fork; memudahkan ganti model di hosting tanpa commit |
| Batas konteks diperketat (10 pesan, 1 contoh, maks 3 perintah) | Hemat biaya API — keputusan kustomisasi fork 2025-12-24 |
| Health-check Express di `main.js` | Hosting pola Koyeb/Render menuntut port HTTP terbuka agar layanan dianggap hidup |
