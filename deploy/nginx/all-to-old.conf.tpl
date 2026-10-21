# ย้อนกลับ: ส่งทุกอย่าง (รวมคิวและ socket.io) ไป web-aranhos-api ตัวเดิม (127.0.0.1:5505)
# วิธีใช้: คัดลอกไฟล์นี้เป็น default.conf แล้ว reload nginx (ดูคู่มือหัวข้อการย้อนกลับ)

map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

upstream aranhos_old { server 127.0.0.1:5505; }

server {
    listen 5504;

    client_max_body_size 100m;
    proxy_read_timeout 300s;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    location /socket.io/ {
        proxy_pass http://aranhos_old;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_buffering off;
        proxy_read_timeout 3600s;
    }

    location / {
        proxy_pass http://aranhos_old;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
    }
}
