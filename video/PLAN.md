# Product ad: the shop template, for café and bakery owners

## Brief
- **Audience:** owners of cafés and bakeries in Argentina (Rosario, Funes, Roldán). They take orders by WhatsApp today.
- **One message:** "Tu propia tienda online: tus clientes piden y pagan solos, vos solo horneás."
- **Format:** 1080×1920 (9:16), 30 fps, 30 s (900 frames). A 15 s cut later. Spanish (Argentina, "vos").
- **Tone:** warm, premium, calm confidence (Apple / Stripe product film), not loud.

## Grid (everything lands on it)
- Music at **120 BPM** → 1 beat = 0.5 s = **15 frames**; 1 bar = 4 beats = **60 frames**.
- Cuts, title entrances and big hits happen on beats. Small UI moves on half-beats (7–8 f).

## Script
| # | Frames | Bars | Picture | Title (on screen) | Sound |
|---|---|---|---|---|---|
| 1 Hook | 0–105 | 1–2 | Dark-ish warm scene. An owner's phone fills with WhatsApp bubbles ("¿Tenés torta para el sábado?", "¿A qué hora paso?", "¿Aceptan transferencia?", "¿Me pasás precios?"...), faster and faster, overlapping, phone shakes slightly. | "¿Todavía tomás pedidos por WhatsApp?" | Pings pile up and speed up; riser under them |
| 2 Turn | 105–120 | end of bar 2 | All bubbles get pulled into one point at screen centre (scale down + blur), flash to cream. | — | Reverse whoosh into silence (1 beat) |
| 3 Reveal | 120–240 | 3–4 | The music drops. A clean phone with the SENS home page rises into frame in 3D, settles. | "Tu tienda online." then "Con tu marca." | Drop: impact + music starts |
| 4 Customer | 240–480 | 5–8 | Camera pushes into the phone. Menu scrolls; a cake card lifts off the screen (layer), finger tap, card flies into cart, badge bounces to 1. Next: pickup branch + day + time chips get chosen. Next: Mercado Pago pay button pressed, check mark. | "Tus clientes eligen…" → "…reservan día y hora…" → "…y pagan online." | Tap, pop, whoosh, ding on beats |
| 5 Owner | 480–660 | 9–11 | Phone turns; we are on the owner side (`/admin`). A new order card slides in at the top (notification). Then the sales dashboard: bars grow, revenue counts up. | "Vos solo horneás." | Order chime; rising tones for bars |
| 6 Many shops | 660–780 | 12–13 | Same phone, its screen swaps skin on every beat: SENS → Mais → Delfis → Cardamomo → Delulu (real shops). Background colour follows each shop's theme. | "Cada tienda, su propia cara." | One hit per swap |
| 7 CTA | 780–900 | 14–15 | Phone drifts back, title and contact settle; logo lockup. | "Tu tienda online en 1 día." + contact line | Final impact, music rings out |

## Look
- Warm cream background (#F6F0E6-ish) with soft radial light, subtle film grain, soft long shadows.
  Scene 1 is darker and cooler (problem); from scene 3 on it is warm (solution).
- Phone: an iPhone-style frame drawn in CSS (rounded body, thin bezel, dynamic island), 3D via CSS perspective.
- Type: one strong sans for titles (big, tight tracking, 2–4 words per line) + one serif italic for accent words.
- Motion: springs, never linear. Anticipation and overshoot on taps. Stagger 2–3 f. Motion blur on fast moves.

## Criteria for done (and the check)
1. 900 frames, 1080×1920, 30 fps, H.264 MP4 with AAC stereo → `ffprobe` shows it.
2. Every title readable and inside the Instagram safe zone (top 250 px and bottom 400 px kept clear of text) → contact sheet, looked at.
3. Every screen shown is the real app (captured), sharp at 1080 wide (captured at 3× pixel density) → zoomed still frame, looked at.
4. Every cut / hit / title entrance lands on a 15-frame beat → cue sheet check script: all cue frames % 15 in {0, 7, 8}.
5. Audio: loudness −14 LUFS integrated (±1), true peak ≤ −1 dBTP → `ffmpeg -af ebur128` output.
6. Sounds land on their cue frame (±1 f) → cue sheet drives the mix, not hand placement.

## Open items (need the owner)
- Product name / logo for the end card (placeholder for now) and the contact line (WhatsApp or site).

## Progress
- [ ] Captures (Playwright, phone size, 3×, demo data, element boxes)
- [ ] Music bed (120 BPM, 30 s, built from Stickz loops)
- [ ] Remotion project + scenes, styleframes reviewed
- [ ] Animatic with temp audio
- [ ] Sound design from cue sheet + mix
- [ ] Final render + checks
