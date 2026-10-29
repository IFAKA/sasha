import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {COLORS, MAIN_SHOP as SHOP} from '../constants';
import {T} from '../timeline';
import {Backdrop} from '../lib/Backdrop';
import {Camera, parallax} from '../lib/Camera';
import {Phone} from '../lib/Phone';
import {INSET, Lift, Screen} from '../lib/Screen';
import {Title} from '../lib/Title';
import {boxOf, themeOf, useManifest} from '../lib/captures';
import {HOME_SCROLL, useGeo} from '../lib/geo';
import {phonePose, camera} from '../choreo';
import {SNAP, SOFT, clamp01, lerp, ramp, spr, track} from '../lib/anim';
import {Check, CartBadge, Highlight, Tap} from '../lib/Ui';
import {useAbs} from '../lib/time';

export {HOME_SCROLL};
const SLIDE = {damping: 24, stiffness: 190, mass: 0.9};

/** Layer that slides in from the right over the previous one (like an app push). */
export const Layer: React.FC<{at: number; nextAt?: number; z: number; children: React.ReactNode}> = ({at, nextAt = 99999, z, children}) => {
  const f = useAbs();
  if (f < at - 1 || f > nextAt + 20) return null;
  const inP = clamp01(spr(f, at, SLIDE));
  const outP = clamp01(spr(f, nextAt, SLIDE));
  return (
    <div style={{position: 'absolute', inset: 0, zIndex: z, transform: `translateX(${(1 - inP) * 390 - outP * 110}px)`, boxShadow: inP < 1 ? '-20px 0 40px rgba(0,0,0,0.2)' : undefined}}>
      {children}
      {outP > 0 && <div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${0.25 * outP})`}} />}
    </div>
  );
};

/** The last frames before the whip-pan are motion blurred. */
export const Customer: React.FC = () => {
  const f = useAbs();
  return f >= T.whipOut - 6 ? (
    <CameraMotionBlur shutterAngle={240} samples={7}>
      <CustomerInner />
    </CameraMotionBlur>
  ) : (
    <CustomerInner />
  );
};

const CustomerInner: React.FC = () => {
  const f = useAbs();
  const m = useManifest();
  const t = themeOf(m, SHOP);
  const {geo, menuScroll: menuTarget, pickScroll, payScroll} = useGeo();
  const cam = camera(f, geo);

  // geometry from the real captures (or fallbacks)
  const card = boxOf(m, SHOP, 'catalog', 'productCard');
  const add = boxOf(m, SHOP, 'catalog', 'addButton');
  const cart = boxOf(m, SHOP, 'catalog', 'cartIcon');
  const stickyH = 117;
  const menuScroll = menuScrollAt(f, menuTarget);
  const cartC = {x: cart.x + cart.w - 6, y: cart.y + 8 + INSET};

  const branch = boxOf(m, SHOP, 'pickup', 'branchChip');
  const day = boxOf(m, SHOP, 'pickup', 'dayChip');
  const time = boxOf(m, SHOP, 'pickup', 'timeChip');
  const payBox = boxOf(m, SHOP, 'payment', 'payButton');
  const pickPay = boxOf(m, SHOP, 'pickup', 'payButton');

  const showLift = f >= T.cardLift && f < T.badge + 6;

  const holeOp = f < T.cardLift ? 0 : f < T.cardFly + 8 ? 1 : 1 - ramp(f, T.cardFly + 8, T.cardFly + 18);

  const checkOn = f >= T.paid;

  return (
    <AbsoluteFill>
      <Backdrop base={COLORS.cream} light={COLORS.warm} blob={t.accent} par={parallax(cam)} />
      <Camera cam={cam}>
        <Phone
          pose={phonePose(f)}
          sheen={ramp(f, 240, 480)}
          screen={
            <>
              <Layer at={0} nextAt={T.toMenu} z={1}>
                <Screen shop={SHOP} screen="home" scroll={HOME_SCROLL} />
              </Layer>
              <Layer at={T.toMenu} nextAt={T.toPickup} z={2}>
                <Screen shop={SHOP} screen="catalog" scroll={menuScroll} stickyH={stickyH} holes={[{box: card, opacity: holeOp, radius: 4}]} />
              </Layer>
              <Layer at={T.toPickup} nextAt={T.toPay} z={3}>
                <Screen shop={SHOP} screen="pickup" scroll={pickScroll}>
                  <Highlight f={f} at={T.tapBranch} box={branch} color={t.accent} />
                  <Highlight f={f} at={T.tapDay} box={day} color={t.accent} />
                  <Highlight f={f} at={T.tapTime} box={time} color={t.accent} />
                  <Highlight f={f} at={T.tapPickPay} box={pickPay} color={t.accent} radius={26} />
                </Screen>
              </Layer>
              <Layer at={T.toPay} nextAt={T.toConfirm} z={4}>
                <Screen shop={SHOP} screen="payment" scroll={payScroll}>
                  <Highlight f={f} at={T.tapPay} box={payBox} color={t.accent} radius={28} />
                </Screen>
                {checkOn && <div style={{position: 'absolute', inset: 0, background: `rgba(255,255,255,${0.7 * clamp01(spr(f, T.paid, SNAP))})`, backdropFilter: 'blur(6px)'}} />}
                <Check f={f} at={T.paid} color={t.accent} fadeAt={T.toConfirm + 2} />
              </Layer>
              <Layer at={T.toConfirm} z={5}>
                <Screen shop={SHOP} screen="confirmation" />
              </Layer>
            </>
          }
          overlay={
            <>
              {f >= T.toMenu && f < T.toPickup && showLift &&
                (f >= T.cardFly && f < T.badge ? (
                  <CameraMotionBlur shutterAngle={220} samples={6}>
                    <CardLift menuTarget={menuTarget} cartC={cartC} />
                  </CameraMotionBlur>
                ) : (
                  <CardLift menuTarget={menuTarget} cartC={cartC} />
                ))}
              {f >= T.toMenu && f < T.toPickup && (
                <>
                  <Tap f={f} at={T.tapCard} x={card.x + card.w / 2 + (add.x + add.w / 2 - card.x - card.w / 2) * 1.07} y={card.y - menuScroll + INSET +  card.h / 2 + (add.y + add.h / 2 - card.y - card.h / 2) * 1.07} />
                  <CartBadge f={f} at={T.badge} cx={cartC.x} cy={cartC.y} color={t.accent} />
                </>
              )}
              {f >= T.toPickup && f < T.toPay + 10 && (
                <>
                  <Tap f={f} at={T.tapBranch} x={branch.x + branch.w / 2} y={branch.y - pickScroll + INSET +  branch.h / 2} />
                  <Tap f={f} at={T.tapDay} x={day.x + day.w / 2} y={day.y - pickScroll + INSET +  day.h / 2} />
                  <Tap f={f} at={T.tapTime} x={time.x + time.w / 2} y={time.y - pickScroll + INSET +  time.h / 2} />
                  <Tap f={f} at={T.tapPickPay} x={pickPay.x + pickPay.w * 0.6} y={pickPay.y - pickScroll + INSET +  pickPay.h / 2} />
                </>
              )}
              {f >= T.toPay - 2 && f < T.toConfirm && <Tap f={f} at={T.tapPay} x={payBox.x + payBox.w / 2} y={payBox.y - payScroll + INSET +  payBox.h / 2} />}
            </>
          }
        />
      </Camera>
      <Title lines={['Tus clientes', '*eligen…*']} inAt={T.t3aIn} outAt={T.t3aOut} size={118} accent={t.accent} scrim={COLORS.cream} />
      <Title lines={['…reservan', '*día_y_hora…*']} inAt={T.t3bIn} outAt={T.t3bOut} size={118} accent={t.accent} scrim={COLORS.cream} />
      <Title lines={['…y pagan', '*online.*']} inAt={T.t3cIn} outAt={T.t3cOut} size={118} accent={t.accent} scrim={COLORS.cream} />
    </AbsoluteFill>
  );
};

const menuScrollAt = (f: number, target: number) =>
  track(f, [[0, 0], [T.toMenu + 6, target, {damping: 26, stiffness: 55, mass: 1.5}]], SOFT);

/** The product card pops out of the screen, then flies into the cart. Computes from its own frame so motion blur works. */
const CardLift: React.FC<{menuTarget: number; cartC: {x: number; y: number}}> = ({menuTarget, cartC}) => {
  const f = useAbs();
  const m = useManifest();
  const card = boxOf(m, SHOP, 'catalog', 'productCard');
  const scroll = menuScrollAt(f, menuTarget);
  const cardC = {x: card.x + card.w / 2, y: card.y - scroll + INSET + card.h / 2};
  const pop = spr(f, T.cardLift, {damping: 12, stiffness: 200, mass: 0.7});
  const u = clamp01(spr(f, T.cardFly, {damping: 24, stiffness: 70, mass: 1}));
  const hover = Math.sin((f - T.cardLift) / 5) * 2.5 * (1 - u);
  const arc = Math.sin(Math.PI * u);
  const press = f >= T.tapCard && f < T.tapCard + 10 ? 0.97 : 1;
  return (
    <Lift
      shop={SHOP}
      screen="catalog"
      element="productCard"
      scroll={scroll}
      lift={pop * (1 - u * 0.6)}
      scale={(1 + 0.07 * pop) * press * lerp(1, 0.1, Math.pow(u, 1.4))}
      dx={(cartC.x - cardC.x) * u - 30 * arc}
      dy={(cartC.y - cardC.y) * u + hover - 110 * arc}
      dz={50 * pop * (1 - u)}
      rotate={-6 * arc + 1.2 * pop * (1 - u)}
      opacity={u > 0.82 ? 1 - ramp(u, 0.82, 0.97) : 1}
      radius={20}
    />
  );
};
