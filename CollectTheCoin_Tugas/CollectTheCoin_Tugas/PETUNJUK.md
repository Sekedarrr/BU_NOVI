# Collect The Coin — Tugas Materi 7 HTML5 Canvas

Proyek ini dibuat berdasarkan susunan proyek dan contoh kode pada PDF **HTML5 - Canvas**, bagian pembuatan game pada halaman 10–23. Program dikembangkan untuk memenuhi daftar tugas di halaman 25.

## Isi folder

- `index.html` — struktur halaman, Canvas, menu, kontrol smartphone, dan bagian biodata.
- `style.css` — tampilan GUI dan pengaturan responsif untuk layar komputer maupun smartphone.
- `script.js` — logika permainan, animasi, tabrakan, skor, nyawa, level, kontrol, dan suara.
- `assets/` — gambar SVG lokal untuk karakter pemain, koin, musuh, dan latar belakang.

## Cara menjalankan

1. Ekstrak ZIP ke sebuah folder, misalnya `CollectTheCoin_Tugas`.
2. Buka folder tersebut.
3. Klik dua kali `index.html` atau klik kanan lalu pilih **Open with** → browser (Chrome/Edge).
4. Tekan **MULAI GAME**.
5. Gerakkan pemain dengan tombol panah atau W/A/S/D. Pada smartphone gunakan tombol arah di bawah Canvas.

Tidak perlu menginstal XAMPP atau menjalankan server karena proyek ini menggunakan HTML, CSS, dan JavaScript sisi browser.

## WAJIB DISESUAIKAN SEBELUM DIKUMPULKAN

Buka `script.js`, lalu ubah data pada bagian berikut agar sesuai dengan biodata sendiri:

```js
const STUDENT_PROFILE = {
    name: "ISI NAMA LENGKAP",
    className: "ISI KELAS",
    number: "ISI NOMOR ABSEN",
    school: "ISI NAMA SEKOLAH"
};
```

## Penerapan tugas halaman 25

1. **Besarkan size player** — ukuran pemain sekarang 48 × 48 piksel (contoh pada PDF 30 × 30 piksel).
2. **Lebih banyak enemy secara acak** — permainan dimulai dengan beberapa musuh; musuh tambahan muncul dengan posisi, arah, dan kecepatan acak. Jumlah musuh meningkat sesuai level.
3. **Tambah jumlah koin untuk menang** — target kemenangan diubah menjadi 15 koin (150 poin), bukan 5 koin (50 poin) seperti contoh awal.
4. **Level sampai level 5** — level bertambah setiap memperoleh 3 koin dan dibatasi maksimum level 5.
5. **Biodata diri** — biodata ditampilkan di bawah game; isi data sendiri pada `STUDENT_PROFILE`.
6. **Video menang dan kalah** — rekam dua sesi terpisah: satu sesi sampai menang (15 koin), satu sesi sampai kalah (3 nyawa habis). Lihat petunjuk rekaman di bawah.
7. **Pengumpulan** — kirim ZIP proyek dan dua video rekaman melalui tautan yang dibagikan guru di grup kelas.

## Cara merekam video di Windows

- Jalankan game di Chrome atau Edge.
- Tekan `Win + G` untuk membuka Xbox Game Bar.
- Mulai rekaman dengan `Win + Alt + R`.
- Rekam satu video sampai layar **KAMU MENANG!** muncul.
- Ulangi game dan rekam video kedua sampai layar **GAME OVER** muncul.
- Tekan `Win + Alt + R` untuk menghentikan rekaman. Video biasanya tersimpan di `Videos\Captures`.

Catatan: video harus direkam langsung di komputer Anda saat memainkan game. File proyek ini tidak menyertakan video rekaman.
