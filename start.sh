#!/usr/bin/env bash
#

# 1) Optional: set up a Python venv and install dependencies
# python -m venv venv
# source venv/bin/activate
pip install -r requirements.txt

# 2) Start Python app in the background
echo "Starting Python app in background..."
nohup python app.py &

# 3) (Optionally) build or install Node dependencies
npm install
npm run build

# 4) Start Node in the foreground
echo "Starting Node app in foreground..."
npm start
