#!/bin/sh
# One command rebuilds the music bed (needs audio/.venv with numpy, scipy, soundfile).
D="$(cd "$(dirname "$0")" && pwd)"
if [ ! -x "$D/.venv/bin/python" ]; then python3 -m venv "$D/.venv" && "$D/.venv/bin/pip" -q install numpy scipy soundfile; fi
exec "$D/.venv/bin/python" "$D/build_music.py"
