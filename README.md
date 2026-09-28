# NEONFLIX — Public Video Backend

Backend sederhana untuk katalog video publik. Upload hanya bisa dilakukan memakai ADMIN_TOKEN.

## Jalankan lokal

```bash
npm install
ADMIN_TOKEN="ganti-token-ku" npm start
```

Buka `http://localhost:3000`.

## API

- `GET /api/videos` — katalog publik
- `POST /api/videos` — upload video (admin)
  - Header: `Authorization: Bearer TOKEN`
  - Form field: `video`
  - Opsional: `title`, `category`, `description`
- `DELETE /api/videos/:id` — hapus video (admin)
- `POST /api/videos/:id/view` — tambah view

## Penting untuk hosting publik

Folder `uploads/` dan `videos.json` harus memakai storage/disk yang persisten. Jangan mengandalkan filesystem ephemeral pada hosting serverless.

Gunakan hanya video yang kamu miliki atau punya hak untuk ditayangkan dan patuhi aturan hosting serta hukum yang berlaku.
