#!/bin/sh
# One command rebuilds the SFX palette, palette.wav, the music bed and its stems (needs audio/.venv: numpy, scipy, soundfile).
D="$(cd "$(dirname "$0")" && pwd)"
if [ ! -x "$D/.venv/bin/python" ]; then python3 -m venv "$D/.venv" && "$D/.venv/bin/pip" -q install numpy scipy soundfile; fi
cd "$D" && ./.venv/bin/python build_sfx.py && ./.venv/bin/python build_music.py | tail -2
