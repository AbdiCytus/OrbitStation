# OrbStation: Project Adjustment Plan (27 Points)

This document contains the 4-phase roadmap for executing the 27 requested features and UI/UX improvements.

## 🚀 Tahap 1: UI Polish, Layout, & Responsivitas (Level: Mudah)
*Fokus pada merapikan tampilan, menyembunyikan elemen, penyesuaian CSS, dan notifikasi.*

1. **[Poin 2]** Hapus tombol close di sisi kanan modal Edit/Add Sector (Desktop).
2. **[Poin 8]** Sembunyikan teks "Added by" di sector biasa (hanya tampil di kolaborasi).
3. **[Poin 9]** Sembunyikan jumlah beacon per sector di halaman Public Profile.
4. **[Poin 13]** Sesuaikan ukuran (resize) popup transfer ownership & remove member di mobile.
5. **[Poin 15]** Sembunyikan menu Friend jika sedang berada di halaman Settings.
6. **[Poin 16]** Perkecil teks acak transisi di mobile dan tambah 5 kalimat teks acak baru.
7. **[Poin 23]** Rapikan halaman Not Found (404) agar responsive di mobile.
8. **[Poin 11 & 12]** Cegah modal detail tertutup otomatis saat melakukan "Pin", tambah toaster notifikasi saat di-pin/unpin, dan toaster batas maksimal 10 pin.

---

## 🛠️ Tahap 2: Animasi Dasar, UX Interaction, & Logika Ringan (Level: Menengah)
*Fokus pada gesture mobile, perbaikan state (lag/flicker), dan perubahan logika tombol.*

1. **[Poin 1]** Efek teks hologram absolute saat hover kartu beacon (Desktop).
2. **[Poin 3]** Ubah fungsional klik beacon (klik kartu langsung launch URL, tombol visit menjadi tombol detail).
3. **[Poin 4]** Gesture geser (swipe/grab) dari tepi kiri untuk membuka sidebar di mobile.
4. **[Poin 6]** Efek meredup pada tombol sidebar setelah dibiarkan beberapa saat (idle) di mobile.
5. **[Poin 5]** Atasi delay (terlambat muncul) pada data Owner di modal anggota.
6. **[Poin 7]** Perbaiki flickering/framedrop pada background halaman Public Profile di mobile.
7. **[Poin 10]** Perbarui batasan sistem agar mendukung pin hingga 10 beacon dan menampilkannya di Public Profile.
8. **[Poin 14]** Aksesibilitas Public Profile untuk tamu tanpa login & pembersihan navigasi "My Station".
9. **[Poin 20]** Tambahkan fungsi tombol reload khusus untuk data dalam Sector (tanpa memuat ulang halaman).

---

## ⚙️ Tahap 3: Modifikasi Database, Routing, & Transisi Berat (Level: Menengah-Sulit)
*Fokus pada pengaturan privasi, transisi halaman, dan perombakan halaman depan.*

1. **[Poin 17]** Bangun animasi transisi antar-sector kompleks (Navbar geser vertikal, sidebar menyamping, dan konten mengecil/membesar).
2. **[Poin 19]** Logika penghapusan seluruh riwayat chat ketika seorang teman dihapus (remove friend).
3. **[Poin 24]** Munculkan tombol "Tambah Teman" di Public Profile bagi pengunjung yang sudah login.
4. **[Poin 25]** Buat sistem Toggle privasi di Settings untuk mengatur visibilitas tombol "Tambah Teman".
5. **[Poin 22]** Fitur Toggle Static Background yang saling terhubung dengan sistem animasi utama.
6. **[Poin 21]** Redesain/improvisasi tampilan halaman Login dan Landing Page utama.

---

## 🪐 Tahap 4: Sistem Real-time, Analitik, & Efek Visual Skala Besar (Level: Sulit)
*Fokus pada fitur-fitur besar yang membutuhkan arsitektur tambahan.*

1. **[Poin 18]** Buat fitur Chat menjadi Real-time (pesan masuk otomatis tanpa perlu keluar/masuk ulang layar chat).
2. **[Poin 26]** Bangun halaman Dasbor Analitik dari nol (rekam jejak pengunjung, grafik, angka statistik kunjungan yang rapi).
3. **[Poin 27]** Rancang background Tata Surya/Kosmos animasi loop di Dasbor Analitik, dengan transisi perjalanan antar planet ketika berganti tab menu.
