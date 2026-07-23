import React from 'react';
import ArgonautsMachine from '@/components/argonauts/ArgonautsMachine';
import GameLoadingScreen from '@/components/GameLoadingScreen';
import { base44 } from '@/api/base44Client';
import { useState, useEffect } from 'react';

export default function Argonauts() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { base44.auth.me().catch(() => {}).finally(() => setLoading(false)); }, []);
  if (loading) return <GameLoadingScreen />;
  return <ArgonautsMachine />;
}