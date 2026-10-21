# พอร์ต 5504 (URL เดิมที่ทุกเครื่องใช้) -> แยกเส้นทาง
#   endpoint คิว 14 ตัว + socket.io -> ระบบคิวใหม่ (127.0.0.1:5600)
#   ที่เหลือทั้งหมด (media display, limit-visit, follow48, claim ฯลฯ) -> web-aranhos-api ตัวเดิม (127.0.0.1:5505)
# วิธีใช้: คัดลอกไฟล์นี้เป็น default.conf แล้ว reload nginx (ดูคู่มือขั้นที่ 3)

map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

upstream queue_new   { server 127.0.0.1:5600; }
upstream aranhos_old { server 127.0.0.1:5505; }

server {
    listen 5504;

    # ระบบเดิมรับไฟล์ได้ถึง 100MB และบางรายงานใช้เวลานาน
    client_max_body_size 100m;
    proxy_read_timeout 300s;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    location ~ ^/api/v2/queues/(search-queue|my-queue|kskdepart|callname-by-depcode|next-queue|stay-queue|history-queue|call-name|pass-queue|login|call-queue|across-queue)(/|$) {
        proxy_pass http://queue_new;
    }

    location /socket.io/ {
        proxy_pass http://queue_new;
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
