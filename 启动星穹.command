#!/bin/zsh
cd "${0:A:h}" || exit 1
if ! command -v npm >/dev/null 2>&1; then
  if [[ -f "$HOME/.nvm/nvm.sh" ]]; then
    source "$HOME/.nvm/nvm.sh"
    nvm use --silent 22
  fi
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "请先安装 Node.js 22 或更新版本：https://nodejs.org/"
  read "?按回车关闭"
  exit 1
fi
if curl -fsS http://127.0.0.1:5181/ 2>/dev/null | /usr/bin/grep -q 'ASTRA'; then
  open http://127.0.0.1:5181/
  exit 0
fi
if [[ ! -d node_modules ]]; then
  npm install --no-audit --no-fund || exit 1
fi
if [[ ! -f public/mediapipe/hand_landmarker.task ]]; then
  npm run prepare:assets || exit 1
fi
echo "ASTRA 星穹正在启动：http://127.0.0.1:5181/"
echo "关闭这个终端窗口即可停止。"
npm run dev &
ASTRA_SERVER_PID=$!
trap 'kill "$ASTRA_SERVER_PID" 2>/dev/null' EXIT INT TERM
for ASTRA_ATTEMPT in {1..30}; do
  if curl -fsS http://127.0.0.1:5181/ >/dev/null 2>&1; then
    open http://127.0.0.1:5181/
    break
  fi
  sleep 1
done
wait "$ASTRA_SERVER_PID"
