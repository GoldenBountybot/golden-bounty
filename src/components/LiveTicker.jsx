import React, { useMemo } from 'react';
import { Volume2, Mail } from 'lucide-react';

// Live ticker shown below the home banners: a pill-shaped dark-teal marquee
// scrolling random deposit / withdraw / win messages right→left.
const NAMES = ['Alex', 'Brandon', 'Carlos', 'Diego', 'Emma', 'Fatima', 'Gabriel', 'Hassan', 'Ivan', 'Jamal', 'Kevin', 'Liam', 'Marco', 'Nadia', 'Omar', 'Pablo', 'Quinn', 'Ravi', 'Sofia', 'Tariq', 'Umair', 'Victor', 'Waleed', 'Xander', 'Yusuf', 'Zara'];
const GAMES = ['Wild Bounty', 'Gates of Olympus', 'Aviator', 'Plinko', 'Mines', 'Crown Coins', 'Big Brown', 'Argonauts', 'Super ACE'];

const rand = (min, max) => Math.random() * (max - min) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function depositAmount() {
  if (Math.random() < 0.18) return Math.round(rand(1200, 5000));
  return pick([5, 10, 20, 50, 100, 250, 1000]);
}
function withdrawAmount() {
  return pick([5, 10, 20, 50, 100, 250, 500, 1000]);
}
function winAmount() {
  if (Math.random() < 0.55) return rand(1, 120).toFixed(2);
  return Math.round(rand(50, 1500));
}

function buildFeed(n = 26) {
  const items = [];
  for (let i = 0; i < n; i++) {
    const name = pick(NAMES);
    const r = Math.random();
    if (r < 0.5) items.push({ icon: '↓', text: `${name} deposited $${depositAmount()}` });
    else if (r < 0.7) items.push({ icon: '↑', text: `${name} withdrew $${withdrawAmount()}` });
    else items.push({ icon: '★', text: `${name} won $${winAmount()} on ${pick(GAMES)}` });
  }
  return items;
}

export default function LiveTicker() {
  const feed = useMemo(() => buildFeed(26), []);
  const Row = ({ k }) => (
    <div className="flex items-center gap-6 px-6 shrink-0" key={k}>
      {feed.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5 whitespace-nowrap text-[12px] font-bold italic" style={{ color: '#d4a017', fontFamily: 'Georgia, serif' }}>
          <span style={{ color: '#5fb3a9' }}>{it.icon}</span>
          {it.text}
        </span>
      ))}
    </div>
  );
  return (
    <div className="max-w-6xl mx-auto px-4 mt-3">
      <div
        className="relative rounded-full overflow-hidden flex items-center"
        style={{ background: '#0e4a44', border: '1px solid rgba(95,179,169,0.45)', boxShadow: '0 3px 12px rgba(0,0,0,0.45)' }}
      >
        <span className="flex items-center justify-center w-9 h-9 shrink-0 ml-1 text-[#5fb3a9]">
          <Volume2 className="w-4 h-4" />
        </span>
        <div className="relative flex-1 overflow-hidden">
          <div className="flex w-max" style={{ animation: 'liveMarquee 40s linear infinite', willChange: 'transform' }}>
            <Row k="a" />
            <Row k="b" />
          </div>
        </div>
        <span className="flex items-center justify-center w-9 h-9 shrink-0 mr-1 text-[#d4a017]">
          <Mail className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
}