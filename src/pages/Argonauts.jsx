import React, { useState, useEffect } from 'react';
import ArgonautsMachine from '@/components/argonauts/ArgonautsMachine';
import GameAssetLoader from '@/components/GameAssetLoader';
import { ARGONAUTS_ASSETS, GAME_BG } from '@/lib/gameAssets';
import { base44 } from '@/api/base44Client';
import GameDesktopPanel from '@/components/GameDesktopPanel';
import { startBgMusic, stopBgMusic } from '@/components/argonauts/argoBackgroundMusic';

export default function Argonauts() {
  const [authReady, setAuthReady] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);
  useEffect(() => { base44.auth.me().catch(() => {}).finally(() => setAuthReady(true)); }, []);
  useEffect(() => {
    if (authReady && assetsReady) startBgMusic();
    return () => stopBgMusic();
  }, [authReady, assetsReady]);
  if (!authReady || !assetsReady) {
    return (
      <GameAssetLoader
        title="ARGONAUTS"
        assets={ARGONAUTS_ASSETS}
        bgImage={GAME_BG.argonauts}
        onDone={() => setAssetsReady(true)}
      />
    );
  }
  return (
    <>
      <ArgonautsMachine />
      <GameDesktopPanel gameId="argonauts" title="Argonauts Rounds" />
    </>
  );
}