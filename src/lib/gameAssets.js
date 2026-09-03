// Central registry of image asset URLs per game.
// Each array lists every image the game needs on its initial screen so the
// preloader can fetch them all before the game UI is shown — no symbol or
// background pops in one-by-one after the player enters the game.
//
// URLs are collected from the engine/symbol/component files that define them,
// so adding a new asset to a game only requires adding its URL here too.

const CDN = 'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44';
const u = (id) => `${CDN}/${id}`;
const SND = 'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44';
const s = (id) => `${SND}/${id}`;

// ---- Shared assets (logo, plaque, loading screen) ----
const SHARED = [
  u('e0ebe2f88_InShot_20260722_150739877.jpg'), // Golden Bounty logo
  u('670fa1a3e_generated_image.png'),          // plaque bg (GameTitleBar)
];

// ---- Full-screen category/feature background per game (from the lobby cards) ----
export const GAME_BG = {
  superAce:    u('199c00bd0_generated_image.png'),
  crownCoins:  u('ef3b69c4c_generated_image.png'),
  bigBrown:    u('a6f715d21_generated_image.png'),
  argonauts:   u('766629235_generated_image.png'),
  rocketCrash: u('61f59a253_aviator-game-cover.png'),
  plinko:      u('22ada4a2e_generated_image.png'),
  mines:       u('446327a76_mines.jpg'),
  hiLo:        u('162440517_generated_image.png'),
  thimbles:    u('25ec953a6_generated_image.png'),
  freeSpin:    u('580f5a5e8_file_00000000f1f081fb9825395d20f29cb7.png'),
};

// ---- Super Ace / Full House ----
export const SUPER_ACE_ASSETS = [
  ...SHARED,
  // background
  u('753cb0ea7_file_00000000788881fa92ac18ec92116526.png'),
  // card back + golden wild
  u('fcd98f4f5_InShot_20260718_152559101.jpg'),
  u('6060a2364_wild-ace-01.png'),
  // court card faces
  u('e40b4b48f_generated_image.png'), // K
  u('21f5a1dbb_generated_image.png'), // Q
  u('a23681e83_generated_image.png'), // J
  u('4e53e6ae2_generated_image.png'), // A
  // machine frame + badges + banners
  u('4c5d3e4ce_file_00000000541c8211a6dd57b4e4dcf69f.png'), // machine bg
  u('93a12d6af_wild.png'),                                   // wild badge
  u('c725b5a50_wild-ace-02.png'),                            // golden wild badge
  u('eb8a29b62_file_00000000cf3081f895784c4d5383afd4.png'), // free spin start
  u('4241239e5_file_0000000057d881fbaa643e8f2dd979ce.png'), // super win
  u('e3c7dc482_file_00000000233881faa2d49279db01c3b7.png'), // mega win
];

// ---- Crown Coins ----
export const CROWN_COINS_ASSETS = [
  ...SHARED,
  u('f28be6c98_.jpg'), // money bg / plank bg
  u('9e18b75a6_file_00000000700081fab7c3b36c02964e06.png'), // crown coins banner
  // symbols
  u('e193ac3ef_generated_image.png'), // cherry
  u('9190b625b_generated_image.png'), // seven
  u('7e3526539_generated_image.png'), // lemon
  u('b17d8bc3d_generated_image.png'), // plum
  u('478f58171_generated_image.png'), // watermelon
  u('d06a66723_generated_image.png'), // orange
  u('32ed52293_generated_image.png'), // bell
  u('3a13fd6fd_generated_image.png'), // bar
  u('fdc47a05f_generated_image.png'), // grape
  u('7b32fae4a_generated_image.png'), // coin
  // value coin + jackpots
  u('09f3a23e1_generated_image.png'),
  u('f672115c5_generated_image.png'), // MIN
  u('462282802_generated_image.png'), // MID
  u('d95929e49_generated_image.png'), // MAX
  u('681750740_generated_image.png'), // ULTRA
];

// ---- Big Brown ----
export const BIG_BROWN_ASSETS = [
  ...SHARED,
  u('9a6ce937b_generated_image.png'), // bg
  u('42a9ab939_generated_image.png'), // wild expand
  u('f423d208b_generated_image.png'), // title banner
  u('86dd448f2_file_00000000c7fc81fa80de66b90930e468.png'), // spin button
  u('4b986ee28_file_0000000057d881fbaa643e8f2dd979ce.png'), // super win banner
  u('670fa1a3e_generated_image.png'), // bonus / free-spin banner
  // symbols
  u('98a234d10_generated_image.png'), // scatter
  u('31ddcdcb0_generated_image.png'), // brown/spirit
  u('d5e8a8396_generated_image.png'), // buffalo
  u('049e21afd_file_00000000263c820eb39538b113dcdcdc.png'), // eagle
  u('678cbc6de_generated_image.png'), // cougar
  u('d03f81032_generated_image.png'), // wolf
  u('75af4c854_generated_image.png'), // deer
  u('b7e1c393e_generated_image.png'), // A
  u('0563064f0_generated_image.png'), // K
  u('11e4aee1c_generated_image.png'), // Q
  u('aa1e47a19_generated_image.png'), // J
  u('9765e60dc_generated_image.png'), // 10
  u('e5f443649_generated_image.png'), // 9
  // sounds
  s('8c2379326_spinbuttonx.mp3'),
  s('f73b711cd_bgbn_0.mp3'),
  s('b0087b27a_BigBrown.mp3'),
];

// ---- Argonauts ----
export const ARGONAUTS_ASSETS = [
  ...SHARED,
  u('766629235_generated_image.png'), // bg
  u('2a63f4def_generated_image.png'), // coin free-spin palace backdrop
  u('5e1ba97ff_file_000000008624820bb05d279226f89912.png'), // value coin
  u('f8ed43464_generated_image.png'), // title banner
  u('71f946c63_file_00000000e5d881fab7f33117c10362eb.png'), // spin button
  u('2921f28f1_generated_image.png'), // golden fleece banner bg
  u('4ba013c10_file_00000000142481fabe264564bd974c86.png'), // free games banner
  u('6abe5be40_file_0000000057d881fbaa643e8f2dd979ce.png'), // super win banner
  u('cf4003fa2_file_00000000233881faa2d49279db01c3b7.png'), // mega win banner
  u('b4e358bc4_generated_image.png'), // overlays (free-spin transition bg)
  // symbols
  u('aa8365d9b_file_000000003078820b89250f27c56de62e.png'), // wild
  u('58d0858d9_file_000000008fa0820bb5da9eef0fb09545.png'), // scatter
  u('1c288effb_file_00000000b92c820ba7b84e338f31f43a.png'), // bonus
  u('87ea31954_file_000000001b80820b8d6d3c9e756709e7.png'), // jason
  u('5e79860d9_file_000000004900820b9b740d0a7100cb38.png'), // atlanta
  u('ad27ed152_file_00000000e8cc820b9c45251d35e5fbfb.png'), // lizard
  u('8281d4090_file_00000000d4b0820baceab77e6055cfc7.png'), // dove
  u('46043deed_file_00000000d370820bb6e81b120d4d648b.png'), // harp
  u('a7c4a453e_file_00000000330c820bb7083c0ecb826172.png'), // cup
  u('f3c47cc81_file_0000000019e481f8a4cdf17759a2b277.png'), // potion
  u('c3399d723_file_000000006180820b9453462a52494a1b.png'), // bow
  // sounds — loaded up-front too, so nothing streams in mid-game
  s('8c2379326_spinbuttonx.mp3'),
  s('b5a389fb5_valuecn.mp3'),
  s('2c0205154_mixkobutor.mp3'),
  s('f95aef0f5_AmphoraSymbol.mp3'),
  s('a42c40c82_GoldenLyre.mp3'),
  s('e3ff9a2c4_CrossedSwords.mp3'),
  s('865659119_GreenDragon.mp3'),
  s('478cbdd23_SpartanWarrior.mp3'),
];

// ---- Rocket Crash (Aviator) ----
export const ROCKET_CRASH_ASSETS = [
  ...SHARED,
  u('15e34753b_generated_image.png'), // bomber
];

// ---- Plinko ----
export const PLINKO_ASSETS = [
  ...SHARED,
  u('41d1489a2_file_000000005b9881faa2d49d948685f05d.png'), // board
  u('a402172b3_file_000000002200820baadd0a1f2df2f8ce.png'), // drop btn
  u('0dfe151f2_file_0000000012f4820b97f8bd8f450c0d36.png'), // stat banner
  u('08830b540_file_00000000e134820babf1565cf66cbd5b.png'), // message banner
  u('50a48430e_file_000000002fc08211917ff24d7e23cfbc.png'), // history btn
  u('9908875c4_file_00000000fcd081fa8582ee43f34c550f.png'), // bg overlay
];

// ---- Mines ----
export const MINES_ASSETS = [
  ...SHARED,
  u('7ad5415af_.jpg'), // bg
  u('00dc49c08_generated_image.png'), // balance icon bg
  u('67ff4e03b_generated_image.png'), // bet button bg
  u('47e470df6_file_000000002200820baadd0a1f2df2f8ce.png'), // bet button
];

// ---- HiLo ----
export const HILO_ASSETS = [
  ...SHARED,
];

// ---- Thimbles ----
export const THIMBLES_ASSETS = [
  ...SHARED,
  u('47b6716b5_file_000000001a38820bbc8591d3888ea292.png'), // saloon bg
  u('156d0d0e6_file_00000000647481fab85bdbbf2ac788cc.png'), // table bg
  u('2c9406808_file_000000003fc481fab86dd38fbe7b4787.png'), // bet banner
  u('06b6ee99c_file_000000003c488211a7ea3420ca9b6b25.png'), // spin
  u('f1d422732_file_000000002c8c81f789fe32b56de1dcdf.png'), // barrel
  u('4fcee62b8_file_000000001a688230909747b265fab779.png'), // history
  u('6b98787a0_file_00000000eee082308b42773bcc9edee4.png'), // win banner
  u('8a7398106_file_00000000fdcc81fa9090dcaff6ecfea6.png'), // ball
  u('1fd7f6441_file_0000000066e081f7a29c25fb6bde36e0.png'), // 1 ball
  u('de25c864e_file_00000000c2f081f79b316882b62f9e13.png'), // 2 balls
];

// ---- Free Spin ----
export const FREE_SPIN_ASSETS = [
  ...SHARED,
  u('bd52e9c49_file_00000000a50c8207b70a5b0acc15d3dc.png'), // bg
  u('6f64aed99_file_00000000c4c881fa936f6d4b80af30a1.png'), // frame
  u('580f5a5e8_file_00000000f1f081fb9825395d20f29cb7.png'), // wheel
  u('664f53d7d_file_00000000bc488207a04754014a812972.png'), // pointer
  u('58482abdf_file_0000000099f08207bd615be46766e77b.png'), // win banner
  u('2856c6533_file_00000000a3c8820ba092dc2cb1951125.png'), // spin button
];

// Map game card IDs to their full asset list, so the lobby can start
// preloading a game's assets the moment the player hovers its card —
// long before they click through to the loading screen.
export const GAME_ASSET_MAP = {
  'fullhouse': SUPER_ACE_ASSETS,
  'crown-coins': CROWN_COINS_ASSETS,
  'big-brown': BIG_BROWN_ASSETS,
  'argonauts': ARGONAUTS_ASSETS,
  'rocket-crash': ROCKET_CRASH_ASSETS,
  'plinko': PLINKO_ASSETS,
  'mines': MINES_ASSETS,
  'hi-lo': HILO_ASSETS,
  'thimbles': THIMBLES_ASSETS,
  'free-spin': FREE_SPIN_ASSETS,
};