// Central registry of image asset URLs per game.
// Each array lists every image the game needs on its initial screen so the
// preloader can fetch them all before the game UI is shown — no symbol or
// background pops in one-by-one after the player enters the game.
//
// URLs are collected from the engine/symbol/component files that define them,
// so adding a new asset to a game only requires adding its URL here too.

const CDN = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776';
const u = (id) => `${CDN}/${id}`;
const SND = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776';
const s = (id) => `${SND}/${id}`;

// ---- Shared assets (logo, plaque, loading screen) ----
const SHARED = [
  u('e0ebe2f88_InShot_20260722_150739877.jpg'), // Golden Bounty logo
  u('670fa1a3e_generated_image.png'),          // plaque bg (GameTitleBar)
];

// ---- Full-screen category/feature background per game (from the lobby cards) ----
export const GAME_BG = {
  wildBounty:  u('af2b94fcd_InShot_20260717_194156078.jpg'),
  superAce:    u('199c00bd0_generated_image.png'),
  crownCoins:  u('ef3b69c4c_generated_image.png'),
  gates:       u('2125c8cfd_generated_image.png'),
  bigBrown:    u('a6f715d21_generated_image.png'),
  argonauts:   u('766629235_generated_image.png'),
  rocketCrash: u('61f59a253_aviator-game-cover.png'),
  plinko:      u('22ada4a2e_generated_image.png'),
  mines:       u('446327a76_mines.jpg'),
  hiLo:        u('162440517_generated_image.png'),
  thimbles:    u('25ec953a6_generated_image.png'),
  freeSpin:    u('580f5a5e8_file_00000000f1f081fb9825395d20f29cb7.png'),
};

// ---- Wild Bounty (SlotGame) ----
export const WILD_BOUNTY_ASSETS = [
  ...SHARED,
  // background + frame
  u('25cab1181_file_00000000b50c8230a0ebee9ef44b2ebe.png'),
  u('c1acaec26_file_000000001de88211868a1e08115c5695.png'),
  u('a422458cf_file_000000001fe0823080289c04ab45bfdf.png'), // feature buy
  // top banner + plaque
  u('34377a521_file_00000000ce28820b9b425fc57f1c795e.png'),
  u('ded9f1015_file_00000000d1a0820eb551f775dc672260.png'),
  u('fd2e464cf_file_000000002a3c820b808b197402106ca0.png'),
  // symbols
  u('47b80dfa7_file_00000000ed3081fa8b2b38b3213ec99a.png'), // bandit
  u('1d7f9ad2f_file_00000000936c81fa8c6b61333fddd167.png'), // revolver
  u('d20ec7196_file_0000000029f08207838de49974589b4b.png'), // whiskey
  u('c71ef50cc_file_000000003d0c8211b8397d0e8ffb44b1.png'), // hat
  u('00ba69c97_file_0000000019208211ab3b4e56cdb92344.png'), // scatter
  u('c970620bf_file_0000000037f88207a4992e01551e3e21.png'), // wild
  u('0fd153331_file_0000000005e881faa113be069715c687.png'), // A
  u('82aafe905_file_000000003f80820786167aa236a07df2.png'), // K
  u('fea6fbacb_file_0000000071cc81faa25eed7055b02650.png'), // Q
  u('8257788f9_file_0000000090808211a1f59f4ce81dde17.png'), // J
  // decor frame + win light
  u('779f97a01_file_000000008b6081fab70937ee49f1af71.png'),
  u('bc304a051_file_0000000019b081faa7b2dd0cdc894459.png'),
  // spin button
  u('c6ef02281_file_00000000a90081fa8732fd40e55cc3ef.png'),
  u('12ac78246_file_00000000b0cc81faafcdac64067dd1a1.png'),
  // win banners
  u('bc8844e96_file_0000000057d881fbaa643e8f2dd979ce.png'), // super win
  u('abe2184b1_file_00000000233881faa2d49279db01c3b7.png'), // mega win
  u('ed1ba82bf_file_00000000de4c8230a7b6890bc5104bb2.png'), // feature buy confirm
  u('c59383f07_file_00000000f68481fab97bfcf72831e629.png'), // free spin start
  u('8252d57aa_generated_image.png'),                        // stat banner
  // sounds — downloaded during the loading screen so nothing streams in mid-game
  s('73abdca12_20260717094905.mp3'),
  s('42593c193_20260717094905_0_0.mp3'),
  s('3d0b01f51_20260717094905_2.mp3'),
  s('8260a4cd3_scater_0.mp3'),
  s('d0ba94ac5_spinbuttonclicksound.mp3'),
  s('08650935f_SpinSymbleMachSound_0.mp3'),
  s('d58be1dc8_Totalwinsound.mp3'),
  s('22fed69b4_backgroundsong.mp3'),
];

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

// ---- Gates of Olympus ----
export const GATES_ASSETS = [
  ...SHARED,
  u('1f0dcd8e1_file_00000000534882308373132046ad84c6.png'), // bg
  u('5a4c02bcc_file_000000003af0820bb4a62aa92952a91e.png'), // title banner
  u('84fd16eb6_file_00000000e474820ba9fd196f5f5c9f06.png'), // zeus figure
  u('0435e5ab7_file_0000000056708207b1ac35d409201618.png'), // free spin trigger
  u('d5525b830_file_00000000e7fc8211826f062956600ef9.png'), // free spins complete
  u('422880cd4_file_0000000057d881fbaa643e8f2dd979ce.png'), // super win
  u('b90df1f5b_file_00000000233881faa2d49279db01c3b7.png'), // mega win
  // symbols
  u('4948c7cf4_file_00000000e1408207955e20cec7981d33.png'), // zeus
  u('a4332bd7e_file_0000000095bc8207a1c24e7d2fa722cf.png'), // crown
  u('be9cc5ec1_file_000000000bd08207a5a1b4e77ea10f33.png'), // hourglass
  u('73a72a368_file_0000000013888230a3cd720eb1652b16.png'), // ring
  u('03fca0540_file_00000000fc488207a16c5e1464febce2.png'), // goblet
  u('b9b6c1bde_file_00000000004c8207b95b7bf99154cb6d.png'), // red
  u('a3a411a0b_file_0000000004448207843751971532abdf.png'), // blue
  u('d3a4e2228_file_000000009bc08207a95209fcf33e096b.png'), // green
  u('3829a472c_file_000000000e088230b3afc17f467dd494.png'), // yellow
  u('e121379a7_file_000000008b68820baaa63ab2e653d35f.png'), // scatter
  // multiplier symbols
  u('05d1b7bd2_file_00000000bf888230ad3b50315b7d1792.png'), // mult
  u('d7806105b_file_00000000c01481f886567f0ea4c79c5e.png'), // mult_blue
  u('1b3f46fa4_file_000000006288820bb1867ae53a90b18e.png'), // mult_pink
  u('744c32f73_file_000000009458820bb0170dc02a86f11c.png'), // mult_red
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
  'wild-bounty': WILD_BOUNTY_ASSETS,
  'fullhouse': SUPER_ACE_ASSETS,
  'crown-coins': CROWN_COINS_ASSETS,
  'gates-of-olympus': GATES_ASSETS,
  'big-brown': BIG_BROWN_ASSETS,
  'argonauts': ARGONAUTS_ASSETS,
  'rocket-crash': ROCKET_CRASH_ASSETS,
  'plinko': PLINKO_ASSETS,
  'mines': MINES_ASSETS,
  'hi-lo': HILO_ASSETS,
  'thimbles': THIMBLES_ASSETS,
  'free-spin': FREE_SPIN_ASSETS,
};