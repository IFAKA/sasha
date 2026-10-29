import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {COLORS, MAIN_SHOP as SHOP} from '../constants';
import {T} from '../timeline';
import {Backdrop} from '../lib/Backdrop';
import {Camera} from '../lib/Camera';
import {Phone} from '../lib/Phone';
import {INSET, Lift, Screen} from '../lib/Screen';
import {Title} from '../lib/Title';
import {boxOf, unionBox, themeOf, useManifest} from '../lib/captures';
import {phonePose, camera} from '../choreo';
import {BOUNCY, SNAP, SOFT, clamp01, lerp, mix, ramp, spr, track} from '../lib/anim';
import {SANS} from '../lib/fonts';
import {useAbs} from '../lib/time';
import {Layer} from './Customer';

const money = (n: number) => '$ ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const REVENUE = 6762000;

const Banner: React.FC<{f: number; color: string}> = ({f, color}) => {
  const inP = spr(f, T.notif, {damping: 14, stiffness: 160, mass: 0.8});
  const outP = spr(f, T.notif + 32, SNAP);
  if (f < T.notif || outP > 0.98) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 14,
        top: 54,
        width: 362,
        height: 76,
        borderRadius: 24,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(14px)',
        boxShadow: '0 14px 34px rgba(0,0,0,0.28)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 14px',
        fontFamily: SANS,
        transform: `translateY(${(1 - inP) * -150 - outP * 150}px) scale(${lerp(0.92, 1, inP)})`,
      }}
    >
      <div style={{width: 46, height: 46, borderRadius: 12, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 7h13l-1.5 8H8z" />
          <path d="M6 7L5 4H3" />
          <circle cx="9" cy="19" r="1.2" />
          <circle cx="16" cy="19" r="1.2" />
        </svg>
      </div>
      <div style={{flex: 1}}>
        <div style={{fontWeight: 700, fontSize: 16, color: '#1b1b1b'}}>Nuevo pedido</div>
        <div style={{fontWeight: 500, fontSize: 14, color: '#555'}}>Retira hoy a las 17:30 · Pagado</div>
      </div>
      <div style={{fontSize: 12, color: '#888', fontWeight: 500}}>ahora</div>
    </div>
  );
};

export const Owner: React.FC = () => {
  const f = useAbs();
  const m = useManifest();
  const t = themeOf(m, SHOP);
  const cam = camera(f);
  const newest = unionBox(boxOf(m, SHOP, 'adminOrders', 'freshBadge'), boxOf(m, SHOP, 'adminOrders', 'newOrderCard'));
  const chart = boxOf(m, SHOP, 'adminSales', 'chartArea');
  const revCard = boxOf(m, SHOP, 'adminSales', 'revenueCard');
  const revNum = boxOf(m, SHOP, 'adminSales', 'revenueNumber');
  const salesScroll = track(f, [[0, 387], [T.revenueDone, 700, {damping: 22, stiffness: 90, mass: 1}]], SOFT);

  const slideIn = spr(f, T.notif + 1, {damping: 15, stiffness: 150, mass: 0.8});
  const orderLand = spr(f, T.orderLands, BOUNCY);
  const spinning = f >= T.spin && f < T.spin + 36;

  // bars: each vertical strip is wiped upward from the baseline, with a small stagger (the white hole hides the real bars until then)
  const bars = {x: chart.x + 30, y: chart.y + chart.h * 0.2, w: chart.w - 38, h: chart.h * 0.58};
  const N = 15;
  const strips = Array.from({length: N}).map((_, i) => {
    const g = clamp01(spr(f, T.bars + i * 1.5, {damping: 18, stiffness: 90, mass: 0.8}));
    const sw = bars.w / N;
    return (
      <Lift
        key={i}
        shop={SHOP}
        screen="adminSales"
        element="chartArea"
        box={{x: bars.x + i * sw, y: bars.y, w: sw + 0.6, h: bars.h}}
        radius={0}
        extraStyle={{clipPath: `inset(${(1 - g) * 100}% 0 0 0)`, background: '#fff'}}
      />
    );
  });
  const countP = clamp01(ramp(f, T.revenueUp, T.revenueDone));
  const count = REVENUE * (1 - Math.pow(1 - countP, 3));
  const done = spr(f, T.revenueDone, BOUNCY);
  const counting = f < T.revenueDone;

  const phone = (
    <Phone
      pose={phonePose(f)}
      sheen={ramp(f, 480, 660)}
      screen={
        <>
          <Layer at={0} nextAt={T.toAdmin} z={1}>
            <Screen shop={SHOP} screen="confirmation" />
          </Layer>
          <div style={{position: 'absolute', inset: 0, zIndex: 2, display: f >= T.toAdmin ? 'block' : 'none'}}>
            <Layer at={0} nextAt={T.toSales} z={1}>
              <Screen shop={SHOP} screen="adminOrders" holes={[{box: newest, opacity: 1}]} />
            </Layer>
            <Layer at={T.toSales} z={2}>
              <Screen
                shop={SHOP}
                screen="adminSales"
                scroll={salesScroll}
                holes={[
                  {box: bars, opacity: f >= T.bars + 40 ? 0 : 1, color: '#fff', radius: 0},
                  {box: revNum, opacity: counting ? 1 : 0, color: '#fff', radius: 0},
                ]}
              >
                {counting && f >= T.toSales + 4 && (
                  <div style={{position: 'absolute', left: revNum.x, top: revNum.y, width: revNum.w, height: revNum.h, fontFamily: SANS, fontWeight: 500, fontSize: 46, lineHeight: `${revNum.h}px`, letterSpacing: '-0.03em', color: '#2b1d14', fontVariantNumeric: 'tabular-nums'}}>{money(count)}</div>
                )}
                {f >= T.revenueDone && f < T.revenueDone + 22 && (
                  <div style={{position: 'absolute', left: revCard.x - 3, top: revCard.y - 3, width: revCard.w + 6, height: revCard.h + 6, borderRadius: 27, border: `3px solid ${t.accent}`, opacity: 1 - ramp(f, T.revenueDone, T.revenueDone + 22), transform: `scale(${1 + 0.05 * ramp(f, T.revenueDone, T.revenueDone + 22)})`}} />
                )}
                {strips}
              </Screen>
            </Layer>
          </div>
        </>
      }
      clipOverlay={
        f >= T.toAdmin && f < T.toSales + 6 ? (
          <>
            {f >= T.notif && (
              <div style={{position: 'absolute', inset: 0}}>
                <Lift
                  shop={SHOP}
                  screen="adminOrders"
                  element="newOrderCard"
                  box={newest}
                  dy={(1 - slideIn) * -(newest.y + newest.h + 40)}
                  scale={1 + 0.04 * (1 - clamp01(orderLand)) + 0.02 * Math.sin(orderLand * 3)}
                  lift={0.5 * (1 - clamp01(ramp(f, T.orderLands + 6, T.orderLands + 24)))}
                  opacity={clamp01(slideIn * 3)}
                  radius={24}
                />
                {f >= T.orderLands && (
                  <div style={{position: 'absolute', left: newest.x - 3, top: newest.y - 3 + INSET, width: newest.w + 6, height: newest.h + 6, borderRadius: 27, border: `3px solid ${t.accent}`, opacity: 1 - ramp(f, T.orderLands, T.orderLands + 22), transform: `scale(${1 + 0.06 * ramp(f, T.orderLands, T.orderLands + 22)})`}} />
                )}
              </div>
            )}
            <Banner f={f} color={t.accent} />
          </>
        ) : null
      }
    />
  );

  return (
    <AbsoluteFill>
      <Backdrop base={mix(COLORS.cream, COLORS.creamDeep, 0.5)} light={COLORS.warm} blob={t.accent} />
      <Camera zoom={cam.zoom} rot={cam.rot} tx={cam.tx} ty={cam.ty} oy={cam.oy}>
        {spinning ? (
          <CameraMotionBlur shutterAngle={200} samples={6}>
            <PhoneAgain />
          </CameraMotionBlur>
        ) : (
          phone
        )}
      </Camera>
      <Title lines={['Vos solo', '*horneás.*']} inAt={T.t4In} outAt={T.t4Out} size={124} accent={t.accent} />
    </AbsoluteFill>
  );
};

// Used only for the 36 spin frames; re-renders itself from its own (sub-)frame for motion blur.
const PhoneAgain: React.FC = () => {
  const f = useAbs();
  const m = useManifest();
  const newest = unionBox(boxOf(m, SHOP, 'adminOrders', 'freshBadge'), boxOf(m, SHOP, 'adminOrders', 'newOrderCard'));
  return (
    <Phone
      pose={phonePose(f)}
      screen={
        <>
          <Layer at={0} nextAt={T.toAdmin} z={1}>
            <Screen shop={SHOP} screen="confirmation" />
          </Layer>
          {f >= T.toAdmin && <Screen shop={SHOP} screen="adminOrders" holes={[{box: newest, opacity: 1}]} />}
        </>
      }
    />
  );
};
