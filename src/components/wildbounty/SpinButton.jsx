import React, { useEffect, useRef, useState } from 'react';

// Faithful replica of the reference spin button: a wooden medallion with two
// gold chasing arrows. Rotation is driven by requestAnimationFrame so the
// transition from fast spin to a slow-motion coast is perfectly smooth (no
// angle snapping) and the deceleration eases out naturally.
const SPIN_IMG =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/25136629b_file_00000000277882069551e3444a9535e9.png';

export default function SpinButton({ spinning, onClick, disabled }) {
  const imgRef = useRef(null);
  const angleRef = useRef(0);   // current rotation (deg)
  const velRef = useRef(0);     // current angular velocity (deg/sec)
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const spinningRef = useRef(spinning);
  const [glowing, setGlowing] = useState(false);

  useEffect(() => { spinningRef.current = spinning; }, [spinning]);

  useEffect(() => {
    const SPIN_SPEED = 660;   // deg/sec while spinning
    const RAMP = 4.5;         // how quickly we accelerate toward spin speed
    const COAST_TAU = 0.42;   // coast deceleration time constant (sec)
    let active = true;

    const step = (ts) => {
      if (!active) return;
      if (!lastRef.current) lastRef.current = ts;
      const dt = Math.min((ts - lastRef.current) / 1000, 0.05);
      lastRef.current = ts;

      if (spinningRef.current) {
        // smoothly ramp up to the spin speed
        velRef.current += (SPIN_SPEED - velRef.current) * Math.min(1, dt * RAMP);
      } else {
        // exponential deceleration → smooth coast to a stop, no snap
        velRef.current *= Math.exp(-dt / COAST_TAU);
        if (velRef.current < 0.5) velRef.current = 0;
      }
      angleRef.current = (angleRef.current + velRef.current * dt) % 360;
      if (imgRef.current) imgRef.current.style.transform = `rotate(${angleRef.current}deg)`;
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { active = false; cancelAnimationFrame(rafRef.current); lastRef.current = 0; };
  }, []);

  // Keep the golden glow while spinning and for a moment after, while coasting.
  useEffect(() => {
    if (spinning) {
      if (velRef.current < 60) velRef.current = 160; // kick-start so it doesn't lag
      setGlowing(true);
      return;
    }
    setGlowing(true);
    const t = setTimeout(() => setGlowing(false), 2100);
    return () => clearTimeout(t);
  }, [spinning]);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative flex items-center justify-center disabled:opacity-90"
    >
      <span
        className="relative w-[5.5rem] h-[5.5rem] rounded-full flex items-center justify-center overflow-hidden transition-transform active:scale-95"
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.7)' }}
      >
        <img
          ref={imgRef}
          src={SPIN_IMG}
          alt="Spin"
          draggable={false}
          className="block w-full h-full object-cover select-none"
          style={{
            transform: 'rotate(0deg)',
            filter: glowing
              ? 'brightness(1.25) saturate(1.4) blur(0.4px) drop-shadow(0 0 18px rgba(255,220,120,0.55)) drop-shadow(0 0 40px rgba(255,200,70,0.45)) drop-shadow(0 0 70px rgba(255,190,60,0.3))'
              : 'brightness(1.08) drop-shadow(0 0 10px rgba(255,190,80,0.35))',
            transition: 'filter 0.3s ease',
          }}
        />
      </span>
    </button>
  );
}