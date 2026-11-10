# Co-op Setup Guide

## ปัญหา: เกม Deploy บน Vercel แต่ต้องการ Signaling Server

Vercel เป็น static hosting ไม่รองรับ WebSocket  
คุณต้องรัน **signaling server** บนเครื่องของคุณเอง

---

## วิธีที่ 1 — เล่น LAN (เครื่องในบ้านเดียวกัน) ✅ ง่ายที่สุด

### รัน server:
```bash
cd anime-extra-random-defense-3d
node server.js 8765
```

### ทุกคนเปิด:
```
http://[IP เครื่องคุณ]:8765
```
ดู IP ด้วย `ipconfig` → หา IPv4 เช่น `192.168.1.100`

---

## วิธีที่ 2 — เล่นข้าม internet ด้วย ngrok ✅ แนะนำ

### 1. ติดตั้ง ngrok
ดาวน์โหลดที่ https://ngrok.com/download

### 2. รัน server + ngrok:
```bash
# Terminal 1
node server.js 8765

# Terminal 2
ngrok http 8765
```

### 3. ngrok จะให้ URL แบบ:
```
https://abc123.ngrok-free.app
```

### 4. ผู้เล่นเปิดหน้าเกม (Vercel URL หรือ ngrok URL)
ใส่ server address ในช่อง **Server address**:
```
wss://abc123.ngrok-free.app
```
> ใช้ `wss://` ไม่ใช่ `https://` เพราะเป็น WebSocket

---

## วิธีที่ 3 — เล่นบนเครื่องเดียวกัน (2 หน้าต่าง)

```bash
node server.js 8765
```
เปิด `http://localhost:8765` สองหน้าต่าง — ไม่ต้องใส่ server address

---

## หมายเหตุเรื่อง HTTP vs HTTPS

| หน้าเกมเปิดจาก | ต้องใช้ |
|---|---|
| `http://localhost:8765` | `ws://...` |
| `https://vercel.app` | `wss://...` (ต้องผ่าน ngrok/tunnel) |

เบราว์เซอร์บล็อก `ws://` (ไม่ encrypted) เมื่อหน้าเป็น `https://`
