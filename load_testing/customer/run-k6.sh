#!/usr/bin/env bash
set -e

# SpotQ Customer Load Testing Helper Script (macOS / Linux)
# Usage:
#   ./run-k6.sh
#   ./run-k6.sh -p load -t all
#   ./run-k6.sh -p smoke -t journey
#   ./run-k6.sh -p stress -t queue

PROFILE="smoke"
TYPE="all"
BASE_URL="http://host.docker.internal:10000"
EMAIL="customer@spotq.com"
PASSWORD="Customer@12345"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        -p|--profile) PROFILE="$2"; shift ;;
        -t|--type) TYPE="$2"; shift ;;
        -b|--base-url) BASE_URL="$2"; shift ;;
        -e|--email) EMAIL="$2"; shift ;;
        -P|--password) PASSWORD="$2"; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

echo "=========================================================="
echo " SpotQ Customer k6 Load Runner"
echo " Profile:  [$PROFILE]"
echo " Suite:    [$TYPE]"
echo " Base URL: [$BASE_URL]"
echo "=========================================================="

if command -v k6 &> /dev/null; then
    echo "[Mode] Running via local k6 CLI..."
    LOCAL_BASE_URL="${BASE_URL/host.docker.internal/localhost}"
    BASE_URL="$LOCAL_BASE_URL" \
    TEST_PROFILE="$PROFILE" \
    TEST_TYPE="$TYPE" \
    CUSTOMER_EMAIL="$EMAIL" \
    CUSTOMER_PASSWORD="$PASSWORD" \
    k6 run main.js
else
    echo "[Mode] Local k6 not found. Running inside Docker (grafana/k6)..."
    CURRENT_DIR="$(pwd)"
    docker run --rm -i \
        -v "${CURRENT_DIR}:/scripts" \
        -w /scripts \
        grafana/k6 run \
        -e BASE_URL="$BASE_URL" \
        -e TEST_PROFILE="$PROFILE" \
        -e TEST_TYPE="$TYPE" \
        -e CUSTOMER_EMAIL="$EMAIL" \
        -e CUSTOMER_PASSWORD="$PASSWORD" \
        main.js
fi

