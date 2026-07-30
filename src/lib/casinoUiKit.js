// Royal Premium Casino Game UI Kit
// Consistent theme: dark mahogany wood, rich walnut texture, polished gold
// frame, embossed gold carving, soft warm golden glow, elegant vintage casino.
// All assets are transparent PNGs with empty centers (no text/numbers/icons)
// so app overlays content on top.

const BASE = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776';

export const CASINO_UI = {
  topBanner:        `${BASE}/7f74289ba_generated_image.png`,
  titleBanner:      `${BASE}/69fc9b34e_generated_image.png`,
  betPanel:         `${BASE}/ea250fd74_generated_image.png`,
  amountDisplay:    `${BASE}/ada9d9270_generated_image.png`,
  multiplierPanel:  `${BASE}/da982e50a_generated_image.png`,
  spinButton:       `${BASE}/5a9b143be_generated_image.png`,
  historyButton:    `${BASE}/2fe97288f_generated_image.png`,
  backButton:       `${BASE}/2eaf1a47c_generated_image.png`,
  menuButton:       `${BASE}/1b171e963_generated_image.png`,
  plusButton:       `${BASE}/239a51edc_generated_image.png`,
  minusButton:      `${BASE}/f57f54e83_generated_image.png`,
  arrowButton:      `${BASE}/087c633d6_generated_image.png`,
  smallSquare:      `${BASE}/4a544af24_generated_image.png`,
  infoPanel:        `${BASE}/50125cdcb_generated_image.png`,
  bottomNav:        `${BASE}/fef367ed9_generated_image.png`,
  decorativeFrame:  `${BASE}/030fd148d_generated_image.png`,
  emptyPanel:       `${BASE}/e403139e4_generated_image.png`,
  woodenDivider:    `${BASE}/6dbbfc788_generated_image.png`,
  statusBar:        `${BASE}/75e3de1ec_generated_image.png`,
};

// Helper: inline style object for using a kit frame as a background that
// stretches exactly to the element size.
export const frameBg = (url) => ({
  backgroundImage: `url('${url}')`,
  backgroundSize: '100% 100%',
  backgroundRepeat: 'no-repeat',
});