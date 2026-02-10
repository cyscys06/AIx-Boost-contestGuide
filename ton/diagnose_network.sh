#!/bin/bash

echo "=========================================="
echo "네트워크 접속 문제 진단 스크립트"
echo "=========================================="
echo ""

# === 1. 네트워크 인터페이스 확인 ===
echo "=== 1. 네트워크 인터페이스 ==="
ip addr show | grep -E "inet |inet6 " | grep -v "127.0.0.1"
echo ""

# === 2. 포트 80 리스닝 상태 (상세) ===
echo "=== 2. 포트 80 리스닝 상태 ==="
echo "ss 명령어 결과:"
sudo ss -tlnp | grep :80 || echo "포트 80 리스닝 안 됨"
echo ""
echo "netstat 명령어 결과 (있는 경우):"
sudo netstat -tlnp 2>/dev/null | grep :80 || echo "netstat 없음"
echo ""

# === 3. Nginx 프로세스 확인 ===
echo "=== 3. Nginx 프로세스 ==="
ps aux | grep nginx | grep -v grep || echo "Nginx 프로세스 없음"
echo ""

# === 4. Nginx 설정 확인 ===
echo "=== 4. 활성화된 Nginx 사이트 ==="
ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "sites-enabled 디렉토리 없음"
echo ""
echo "=== contest-guide 설정 (listen, server_name) ==="
if [ -f /etc/nginx/sites-available/contest-guide ]; then
    sudo grep -E "listen|server_name" /etc/nginx/sites-available/contest-guide | head -5
else
    echo "contest-guide 설정 파일 없음"
fi
echo ""

# === 5. IP 주소 확인 ===
echo "=== 5. 서버 IP 주소 ==="
PUBLIC_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || echo "확인 불가")
INTERNAL_IP=$(hostname -I | awk '{print $1}')
echo "공인 IP (외부에서 보이는 IP): $PUBLIC_IP"
echo "내부 IP (서버 내부 IP): $INTERNAL_IP"
echo ""

# === 6. 방화벽 상태 ===
echo "=== 6. 방화벽 상태 ==="
if command -v ufw &> /dev/null; then
    echo "UFW 상태:"
    sudo ufw status verbose | head -10
elif command -v firewall-cmd &> /dev/null; then
    echo "firewalld 상태:"
    sudo firewall-cmd --list-all 2>/dev/null | head -15
else
    echo "방화벽 명령어 없음 (iptables 직접 확인 필요)"
fi
echo ""

# === 7. 로컬에서 IP로 접속 테스트 ===
echo "=== 7. 로컬 접속 테스트 ==="
if [ -n "$INTERNAL_IP" ]; then
    echo "내부 IP로 테스트: http://$INTERNAL_IP"
    curl -I --max-time 5 http://$INTERNAL_IP 2>&1 | head -3
else
    echo "내부 IP 확인 불가"
fi
echo ""

# === 8. Nginx 에러 로그 확인 ===
echo "=== 8. 최근 Nginx 에러 로그 (마지막 5줄) ==="
if [ -f /var/log/nginx/error.log ]; then
    sudo tail -5 /var/log/nginx/error.log 2>/dev/null || echo "로그 읽기 권한 없음"
else
    echo "에러 로그 파일 없음"
fi
echo ""

# === 9. SELinux 상태 (CentOS/RHEL) ===
echo "=== 9. SELinux 상태 ==="
if command -v getenforce &> /dev/null; then
    echo "SELinux 모드: $(getenforce)"
    echo "HTTP 관련 SELinux 설정:"
    sudo getsebool -a 2>/dev/null | grep httpd | head -3 || echo "SELinux 설정 없음"
else
    echo "SELinux 없음"
fi
echo ""

# === 10. iptables 규칙 확인 ===
echo "=== 10. iptables 규칙 (포트 80 관련) ==="
if command -v iptables &> /dev/null; then
    sudo iptables -L -n -v 2>/dev/null | grep -E "80|ACCEPT|DROP|REJECT" | head -10 || echo "iptables 규칙 없음"
else
    echo "iptables 없음"
fi
echo ""

# === 11. Nginx 상태 확인 ===
echo "=== 11. Nginx 서비스 상태 ==="
sudo systemctl status nginx --no-pager | head -10
echo ""

# === 12. 네트워크 연결 테스트 ===
echo "=== 12. 외부에서 서버로의 연결 테스트 ==="
echo "다른 컴퓨터에서 다음 명령어로 테스트하세요:"
echo "  telnet $PUBLIC_IP 80"
echo "  또는"
echo "  curl -I http://$PUBLIC_IP"
echo ""

echo "=========================================="
echo "진단 완료"
echo "=========================================="
echo ""
echo "중요 체크리스트:"
echo "1. 포트 80이 0.0.0.0:80 또는 *:80에서 리스닝하는가? (127.0.0.1:80이면 문제)"
echo "2. 공인 IP가 실제 외부 IP인가? (192.168.x.x, 10.x.x.x는 내부 IP)"
echo "3. 방화벽에서 포트 80이 허용되어 있는가?"
echo "4. Nginx가 정상 실행 중인가?"
echo ""
