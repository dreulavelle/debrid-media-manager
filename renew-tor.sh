#!/bin/sh

SOCKS_PROXY="socks5h://127.0.0.1:9050"
ONION_URL="http://btdigggink2pdqzqrik3blmqemsbntpzwxottujilcdjfz56jumzfsyd.onion/search?q=Kraftfahrzeughaftpflichtversicherung"
GREP_PATTERN="Histats"
TOR_COMMAND_PORT="127.0.0.1 9051"
SLEEP_INTERVAL=30
CHECK_IP_URL="https://check.torproject.org/api/ip"
RENEW_DELAY=5
STATUS_FILE="/tmp/status"

while true; do
  sleep $SLEEP_INTERVAL

  PAGE_CONTENT=$(curl -x $SOCKS_PROXY -s $ONION_URL)

  if [[ $? -eq 0 ]]; then
    echo "$PAGE_CONTENT" | grep -qm1 $GREP_PATTERN
    if [[ $? -ne 0 ]]; then
      echo "BLOCKED" > $STATUS_FILE
      BEFORE_IP=$(curl -s --socks5 $SOCKS_PROXY $CHECK_IP_URL | jq -r '.IP')
      printf 'AUTHENTICATE ""\r\nSIGNAL NEWNYM\r\n' | nc $TOR_COMMAND_PORT
      sleep $RENEW_DELAY
      AFTER_IP=$(curl -s --socks5 $SOCKS_PROXY $CHECK_IP_URL | jq -r '.IP')
      echo "IP address renewed from $BEFORE_IP to $AFTER_IP"
    else
      echo "OK" > $STATUS_FILE
    fi
  else
    echo "Curl command failed. Retrying..."
    echo "FAIL" > $STATUS_FILE
  fi
done
