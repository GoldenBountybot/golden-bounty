// AAA Premium Casino UI Kit
// Theme: Royal Black, Dark Mahogany Wood, Matte Black Metal, Brushed Gold, Soft Amber Glow
// All assets are transparent PNGs with no text/icons/logos — overlay content in code.

const BASE = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776';

export const casinoUi = {
  headerBanner:   `${BASE}/3f255e48d_generated_image.png`,
  backButton:     `${BASE}/8285b045c_generated_image.png`,
  walletPanel:    `${BASE}/dcb94ac3f_generated_image.png`,
  betPanel:       `${BASE}/0813b5f72_generated_image.png`,
  plusButton:     `${BASE}/458d4cebd_generated_image.png`,
  minusButton:    `${BASE}/fb37a9eaa_generated_image.png`,
  arrowButton:    `${BASE}/ea47c05e1_generated_image.png`,
  multiplierPanel:`${BASE}/acc0a92ba_generated_image.png`,
  gameBoardFrame:`${BASE}/aaa1eb2b0_generated_image.png`,
  spinButton:     `${BASE}/b29d43674_generated_image.png`,
  historyButton:  `${BASE}/be13b303a_generated_image.png`,
  menuButton:     `${BASE}/27e08fc77_generated_image.png`,
  bottomNav:      `${BASE}/dcc356b23_generated_image.png`,
  infoPanel:      `${BASE}/56c1c7610_generated_image.png`,
  goldFrame:      `${BASE}/1e60acd55_generated_image.png`,
  divider:        `${BASE}/b47152f08_generated_image.png`,
};

// Shared style helpers for consistent premium framing across games.
// `frame` = url string from casinoUi
export const frameStyle = (frame, opts = {}) => ({
  backgroundImage: `url('${frame}')`,
  backgroundSize: '100% 100%',
  backgroundRepeat: 'no-repeat',
  boxShadow: opts.glow
    ? '0 0 18px rgba(212,175,55,0.35), 0 6px 18px rgba(0,0,0,0.55)'
    : '0 4px 14px rgba(0,0,0,0.5)',
});

export default casinoUi;