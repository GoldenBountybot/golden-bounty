import React from 'react';
import ArgonautsMachine from '@/components/argonauts/ArgonautsMachine';
import GameLoadingScreen from '@/components/GameLoadingScreen';
import { base44 } from '@/api/base44Client';
import { useState, useEffect } from 'react';

export default function Argonauts() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { base44.auth.me().catch(() => {}).finally(() => setLoading(false)); }, []);
  if (loading) return <GameLoadingScreen title="ARGONAUTS" bgImage="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/766629235_generated_image.png" />;
  return <ArgonautsMachine />;
}