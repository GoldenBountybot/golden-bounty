import React, { useState, useEffect } from 'react';
import ArgonautsMachine from '@/components/argonauts/ArgonautsMachine';
import GameAssetLoader from '@/components/GameAssetLoader';
import { ARGONAUTS_ASSETS } from '@/lib/gameAssets';
import { base44 } from '@/api/base44Client';

export default function Argonauts() {
  const [authReady, setAuthReady] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);
  useEffect(() => { base44.auth.me().catch(() => {}).finally(() => setAuthReady(true)); }, []);
  if (!authReady || !assetsReady) {
    return (
      <GameAssetLoader
        title="ARGONAUTS"
        assets={ARGONAUTS_ASSETS}
        bgImage="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/766629235_generated_image.png"
        onDone={() => setAssetsReady(true)}
      />
    );
  }
  return <ArgonautsMachine />;
}