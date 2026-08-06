// Central registry of ALL image assets used across the app's non-game pages
// (Home, Dashboard, Pay, Withdraw, Profile, Airdrop, Referrals, Swap, etc.).
//
// These are preloaded during the app splash screen so that every page's
// images, banners, and icons are already in the browser cache the moment
// the user navigates — nothing pops in or downloads visibly after entry.
//
// Game-specific assets live in gameAssets.js and are preloaded by each
// game's own loading screen (GameAssetLoader).

const CDN = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776';
const u = (id) => `${CDN}/${id}`;

// ---- Splash + shared backgrounds ----
const SPLASH = [
  u('b1a2d7d3e_file_000000009ef4820baac5161c2e45158b.png'), // splash image
  u('42da6c35a_file_00000000a918820b81da42fc2ddfcfda.png'), // app background
  u('c39869f00_file_000000003b6c821193c37e7c968d77f2.png'), // Golden Bounty logo
  u('89345e410_file_00000000f5f88207ba2a1422c54f7ec0.png'), // Bounty Bot support logo
  u('e0ebe2f88_InShot_20260722_150739877.jpg'),             // GB logo (shared)
  u('670fa1a3e_generated_image.png'),                      // plaque bg (GameTitleBar)
  u('11d70dbce_file_000000007ca8820782fc88a9cf61d873.png'), // BOUNTY token logo
];

// ---- Home page banners ----
const HOME = [
  u('fac3dbda4_file_000000008654821185c00f28c290ba18.png'), // hero banner
  u('954aff594_file_00000000d7b081fab9598b09e1590c28.png'), // airdrop banner
];

// ---- WesternGameBanners carousel ----
const BANNERS = [
  u('400f63f31_generated_image.png'), // Wild Bounty
  u('e8873dacc_generated_image.png'), // Crown Coins
  u('704331505_generated_image.png'), // Aviator
  u('c6e6b2403_generated_image.png'), // Golden Stack Vault
  u('e448825ee_generated_image.png'), // Plinko Drop
];

// ---- Bottom navigation tiles ----
const BOTTOM_NAV = [
  u('0bf2d07ee_file_000000009cf082119790d647b9b4d6d2.png'), // Dashboard
  u('5ee916b61_file_0000000084f082119192d2d5866b87d5.png'), // Stack
  u('a37f15d57_file_00000000710c8207a086cbd3402c46e3.png'), // 777 Play
  u('e130df042_file_00000000003c81fab9a795d126ebcf40.png'), // VIP
  u('991ab5d3e_file_00000000a2b081fa9b55e7aca49962fc.png'), // Profile
];

// ---- Dashboard / Stack ----
const DASHBOARD = [
  u('e4a14a054_file_0000000014cc821197a44e24a1a46272.png'), // stack banner default
];

// ---- PromoWelcome ----
const PROMO = [
  u('f23530b9f_file_00000000588c81f7b3cdd650f71b7b28.png'), // promo banner
];

// ---- Airdrop page ----
const AIRDROP = [
  u('6b0feb46f_file_00000000a2c082079005efbe99d662d8.png'), // airdrop hero
];

// ---- Game card cover images (Home lobby grid) ----
const GAME_CARDS = [
  u('580f5a5e8_file_00000000f1f081fb9825395d20f29cb7.png'), // free-spin
  u('af2b94fcd_InShot_20260717_194156078.jpg'),              // wild-bounty
  u('162440517_generated_image.png'),                        // hi-lo
  u('22ada4a2e_generated_image.png'),                        // plinko
  u('199c00bd0_generated_image.png'),                        // super ace
  u('446327a76_mines.jpg'),                                  // mines
  u('61f59a253_aviator-game-cover.png'),                     // rocket-crash
  u('ef3b69c4c_generated_image.png'),                         // crown-coins
  u('a6f715d21_generated_image.png'),                         // big-brown
  u('766629235_generated_image.png'),                         // argonauts
  u('2125c8cfd_generated_image.png'),                         // gates
  u('25ec953a6_generated_image.png'),                         // thimbles
];

// ---- External coin logos (PayMethod) ----
const COIN_LOGOS = [
  'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400',
  'https://coin-images.coingecko.com/coins/images/279/large/ethereum.png?1696501628',
  'https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661',
  'https://coin-images.coingecko.com/coins/images/825/large/bnb-icon2_2x.png?1696501970',
  'https://coin-images.coingecko.com/coins/images/4128/large/solana.png?1718769756',
  'https://coin-images.coingecko.com/coins/images/1094/large/photo_2026-04-13_09-59-16.png?1776048311',
  'https://coin-images.coingecko.com/coins/images/5/large/dogecoin.png?1696501409',
  'https://coin-images.coingecko.com/coins/images/2/large/litecoin.png?1696501400',
  'https://coin-images.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png?1696512369',
  'https://coin-images.coingecko.com/coins/images/12171/large/polkadot.jpg?1766533446',
  'https://coin-images.coingecko.com/coins/images/26455/large/Aptos-Network-Symbol-Black-RGB-1x.png?1761789140',
  'https://coin-images.coingecko.com/coins/images/4713/large/polygon.png?1698233745',
  'https://coin-images.coingecko.com/coins/images/17980/large/Gram_Circular_Badge.png?1781524778',
  'https://cdn.simpleicons.org/binance/F0B90B',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Trust_Wallet_logo_%282026%29.png/330px-Trust_Wallet_logo_%282026%29.png',
];

// ---- Support panel brand icons ----
const SUPPORT = [
  'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg',
  'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg',
  'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg',
];

// The complete list of app-wide images to preload during the splash screen.
export const APP_ASSETS = [
  ...SPLASH,
  ...HOME,
  ...BANNERS,
  ...BOTTOM_NAV,
  ...DASHBOARD,
  ...PROMO,
  ...AIRDROP,
  ...GAME_CARDS,
  ...COIN_LOGOS,
  ...SUPPORT,
];