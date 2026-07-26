// Ornate gold frame applied as a CSS border-image around the reel board.
// border-image slices the symmetric square frame into corners / edges / center.
// The center is NOT drawn (no `fill`), so the reel area shows through
// transparently while the polished gold border + gems surround the board.
const FRAME_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/330e20997_generated_image.png';

export const gatesFrameStyle = {
  borderStyle: 'solid',
  borderWidth: 36,
  borderImageSource: `url(${FRAME_URL})`,
  borderImageSlice: '18%',
  borderImageWidth: 36,
  borderImageOutset: 0,
  borderImageRepeat: 'round',
  background: 'transparent',
};