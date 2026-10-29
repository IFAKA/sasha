#!/bin/sh
# Render one still per scene at its key moment: out/stills/NN-name.png (ids/frames in src/Root.tsx).
# Usage: scripts/stills.sh [name ...]   (no args = all)
cd "$(dirname "$0")/.." || exit 1
mkdir -p out/stills
i=0
for n in hook0 hook turn reveal medium card pickup pay confirm whip owner revenue sales skinbase skinteal skinplum skinnavy cta; do
  i=$((i+1))
  if [ $# -gt 0 ] && ! echo " $* " | grep -q " $n "; then continue; fi
  nice -n 15 npx remotion still src/index.ts "still-$n" "out/stills/$(printf %02d $i)-$n.png" --log=error 2>&1 | grep -v "manifest.json" 
done
