import React, { useState, useEffect } from 'react';
import { Volume2, Mail } from 'lucide-react';

// Live ticker shown below the home banners: a black pill-shaped marquee with
// golden text scrolling right→left. The feed regenerates every few seconds
// with fresh unique names + new deposit / withdraw / win amounts so the same
// message never repeats.
const NAMES = ['Alex', 'Brandon', 'Carlos', 'Diego', 'Emma', 'Fatima', 'Gabriel', 'Hassan', 'Ivan', 'Jamal', 'Kevin', 'Liam', 'Marco', 'Nadia', 'Omar', 'Pablo', 'Quinn', 'Ravi', 'Sofia', 'Tariq', 'Umair', 'Victor', 'Waleed', 'Xander', 'Yusuf', 'Zara', 'Aria', 'Bilal', 'Chen', 'Dario', 'Esra', 'Farhan', 'Gina', 'Hiro', 'Ines', 'Jana', 'Kofi', 'Lena', 'Mona', 'Niko'];

const GAMES = ['Wild Bounty', 'Gates of Olympus', 'Aviator', 'Plinko', 'Mines', 'Crown Coins', 'Big Brown', 'Argonauts', 'Super ACE'];

const GOLD = '#d4a017';
const rand = (min, max) => Math.random() * (max - min) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Deposit / withdraw: whole-number amounts (e.g. 25, 105, 220, 540, 860, 1000).
function depositAmount() {
  if (Math.random() < 0.18) return Math.round(rand(1100, 2500));
  return Math.round(rand(25, 1000));
}
function withdrawAmount() {
  return Math.round(rand(25, 1000));
}
// Game wins: one-decimal floats (e.g. 56.5, 68.6, 80.4, 408.8).
function winAmount() {
  return rand(10, 500).toFixed(1);
}

// Build a feed with unique names (shuffled) so the same user/message never
// repeats within a batch.
function buildFeed(n = 26) {
  const names = [...NAMES].sort(() => Math.random() - 0.5);
  const items = [];
  for (let i = 0; i < n; i++) {
    const name = names[i % names.length];
    const r = Math.random();
    if (r < 0.5) items.push({ icon: '↓', text: `${name} deposited $${depositAmount()}` });
    else if (r < 0.7) items.push({ icon: '↑', text: `${name} withdrew $${withdrawAmount()}` });
    else items.push({ icon: '★', text: `${name} won $${winAmount()} on ${pick(GAMES)}` });
  }
  return items;
}

export default function LiveTicker() {
  const [feed, setFeed] = useState(() => buildFeed(26));
  useEffect(() => {
    const id = setInterval(() => setFeed(buildFeed(26)), 7000);
    return () => clearInterval(id);
  }, []);

  const Row = ({ k }) => (
    <div className="flex items-center gap-6 px-6 shrink-0" key={k}>
      {feed.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5 whitespace-nowrap text-[12px] font-bold italic" style={{ color: GOLD, fontFamily: 'Georgia, serif' }}>
          <span style={{ color: GOLD, opacity: 0.85 }}>{it.icon}</span>
          {it.text}
        </span>
      ))}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 mt-3">
      <div
        className="relative rounded-full overflow-hidden flex items-center"
        style={{ background: '#0a0a0c', border: `1px solid rgba(245,210,120,0.45)`, boxShadow: '0 3px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(245,210,120,0.12)' }}
      >
        <span className="flex items-center justify-center w-9 h-9 shrink-0 ml-1" style={{ color: GOLD }}>
          <Volume2 className="w-4 h-4" />
        </span>
        <div className="relative flex-1 overflow-hidden">
          <div className="flex w-max" style={{ animation: 'liveMarquee 40s linear infinite', willChange: 'transform' }}>
            <Row k="a" />
            <Row k="b" />
          </div>
        </div>
        <span className="flex items-center justify-center w-9 h-9 shrink-0 mr-1" style={{ color: GOLD }}>
          <Mail className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
}