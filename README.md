# AhliHisap

Pendamping **pengurangan** vape & rokok — bukan berhenti paksa. Reduction-first,
Indonesia-native, dan menunjukkan uang yang kembali ke kantong. Tanpa menghakimi.

## Prinsip

- **Reduction-first.** Mode default `reduce`. Tidak ada quit date yang dipaksakan;
  mode `quit` bisa dinyalakan kapan saja.
- **Momentum, bukan rupiah, jadi pahlawan.** Win condition = berada di bawah
  baseline. Uang adalah kartu sekunder.
- **Non-judgmental.** Di atas baseline bukan "gagal", cuma "besok lagi".
- **Dua jalur data.** `session_log` (1-tap, fuzzy, untuk momentum harian) +
  `bottle_event` (jarang, kalibrator akurasi → koreksi baseline otomatis).

## Stack (Tahap 0: local-first, tanpa backend)

- Vite + React + TypeScript, PWA (installable, offline)
- IndexedDB via Dexie — semua data di perangkat, tanpa login/biaya
- Motion untuk transisi, Phosphor untuk ikon
- Skema dirancang agar migrasi ke Supabase nanti = menambah layer sync, bukan rewrite

## Desain

Petrol gelap dengan dua aksen bermakna: **amber = uang**, **aqua = liquid/health**.
Signature: *liquid level yang bergerak* mengikuti keadaan (di onboarding merespons
baseline; di dashboard membaca momentum hari ini). Hanken Grotesk (display) · Inter
(body) · JetBrains Mono (angka/data).

## Jalankan

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # produksi + service worker PWA
npm test           # unit test formula
```

## Struktur

```
src/
  db/         types, Dexie schema, repo (writes), stats (pure aggregation)
  lib/        formula (+ test), format, coach, presets, badges
  hooks/      useData — live queries (dexie-react-hooks)
  components/ LiquidLevel (signature), ui kit
  features/   onboarding · dashboard · whatif
```

## Status v1

Masuk: onboarding 5-langkah, logging sesi 1-tap, bottle_event, dashboard
momentum-first, Money Saved kumulatif, trend 7-hari, coach template, What If lite,
badge sederhana, koreksi baseline 7-hari, empty state hari pertama.

Ditunda (v2+): health timeline, laporan bulanan, smart pattern insight, AI coach
(LLM), mode rokok penuh — semuanya butuh data historis menumpuk dulu.
