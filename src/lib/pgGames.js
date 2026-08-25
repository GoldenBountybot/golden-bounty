// Official PG SOFT catalogue (pulled from PG's public game list).
// Rows are packed as "id~name~flags~image" to keep the file compact.
// flags: T = table game, C = cascading/cluster, P = classic pick, others = slots.
const U = 'https://www.pgsoft.com/uploads/Games/Images/';
const I = 'https://public.pg-demo.com/pages/static/image/en/Icon';

const ROWS = [
  "2152563~Touchdown Wins~C~U5011abb8-7644-46f8-b59c-d300e6959784.png",
  "2118946~Farmstead Fortune~~I/farmstead-fort/ICON-40c4f765.png",
  "2126622~Tornado Rampage~C~I/tornado-rampg/ICON-4b2ffffc.png",
  "2090174~Monkeys Wild Party~C~U56e75b51-7783-4e2d-a912-2747b3fa67ac.png",
  "2075272~Zombie Blasters~C~I/zombie-blaster/ICON-e0c8301b.png",
  "2040102~Super Wildrix~~I/super-wildrix/ICON-d2113bb8.png",
  "2081892~Mighty Mania~C~I/mighty-mania/ICON-976fae8d.png",
  "2058347~Reel Royale Showdown~C~U417a3bd7-e6b4-4a20-be7d-256d2dea772c.png",
  "2035783~Funky Fortunez~C~I/funky-fortunez/ICON-7da0b671.png",
  "2024510~Perfect Strike~C~Uf5885185-5889-40f3-bb67-ec7c929d5310.png",
  "1997301~Mayan Destiny~C~I/mayan-destiny/ICON-2e32f2f3.png",
  "1950910~Inferno Mayhem~C~I/inferno-mayhem/ICON-6682161f.png",
  "2100928~Fortune Horse~~I/fortune-horse/ICON-be28f928.png",
  "1981965~Forbidden Alchemy~~U61183803-799d-46dd-bd2f-ad694aa5124c.png",
  "1849515~Mythical Guardians~C~Ue0fdc8ad-7a14-421e-ae3d-4987b84823c3.png",
  "2009635~Poker Kingdom Win~C~I/poker-kingdom/ICON-07866812.png",
  "1940257~Alibaba's Cave of Fortune~~U6e6e5582-09ed-4a12-ac6b-44ede2e2c7ad.png",
  "2012025~Skylight Wonders~C~I/skylight-wonder/ICON-9dff6c0d.png",
  "1964781~Pharaoh Royals~~U1587bce7-23cd-4037-802d-5526d1f2cee4.png",
  "1929177~Kraken Gold Rush~C~Ude440243-d423-495a-affc-036b8a43c788.jpg",
  "1971587~Majestic Empire~C~U20e17a35-1334-4bd0-960a-bd6b8f060579.png",
  "1903012~Grimms' Bounty: Hansel & Gretel~C~U457d9f02-028d-4892-837b-515d210a8885.png",
  "1918451~Galaxy Miner~~U4f7c7fa9-145e-4640-b3fe-67e836462e61.png",
  "1897678~Dragon's Treasure Quest~C~U20e99ecd-a421-4252-b062-64d43fbfef9c.png",
  "1935269~Diner Frenzy Spins~~I/diner-frenzy/ICON-98dc1146.png",
  "1834850~Jack the Giant Hunter~C~U36c89f83-ac04-4882-b120-1cff4a01a14f.png",
  "1865521~Dead Man's Riches~~I/dead-man-riches/ICON-d1c7316f.png",
  "1881268~Knockout Riches~C~I/knockout-rich/ICON-e5fc63d1.png",
  "1827457~Doomsday Rampage~~I/doomsday-rampg/ICON-696c2c86.png",
  "1804577~Graffiti Rush~~I/graffiti-rush/ICON-56052db3.png",
  "1799745~Mr. Treasure's Fortune~C~I/mr-treas-fort/ICON-62b4d62a.png",
  "1879752~Fortune Snake~~I/fortune-snake/ICON-72a1706b.png",
  "1850016~Incan Wonders~~I/incan-wonders/ICON-a5f34cc0.png",
  "1702123~Geisha’s Revenge~C~I/geisha-revenge/ICON-28aeddda.png",
  "1666445~Chocolate Deluxe~C~I/choc-deluxe/ICON-5271e2f7.png",
  "1786529~Rio Fantasia~C~I/rio-fantasia/ICON-80aa884e.png",
  "1755623~Museum Wonders~C~I/museum-wonders/ICON-0a356a9f.png",
  "1815268~Oishi Delights~C~I/oishi-delights/ICON-cdc6b874.png",
  "1727711~Three Crazy Piggies~C~I/three-cz-pigs/ICON-c6c68b65.png",
  "1747549~Wings of Iguazu~~I/wings-iguazu/ICON-1915d926.png",
  "1760238~Yakuza Honor~C~I/yakuza-honor/ICON-22065ca5.png",
  "1648578~Shark Bounty~C~I/shark-bounty/ICON-71f45627.png",
  "1778752~Futebol Fever~~I/futebol-fever/ICON-60247804.png",
  "1738001~Chicky Run~~U45446946-1106-42bf-a514-ee5939784a68.png",
  "1635221~Zombie Outbreak~C~U188a0ea2-3d8e-4fd5-9306-6a75680285df.png",
  "1623475~Anubis Wrath~C~U65c195f6-a3d3-4523-9017-b754fa019d0e.png",
  "1717688~Mystic Potion~C~U45caaf2d-d977-4cb9-ba41-da5ed5b9ddd2.png",
  "1492288~Pinata Wins~C~I/pinata-wins/ICON-67465c1e.png",
  "1508783~Wild Ape #3258~C~U537cafee-4b42-48f2-83b6-3aa4a5278ad1.png",
  "1682240~Cash Mania~~I/cash-mania/ICON-fbc6adf6.png",
  "1671262~Gemstones Gold~C~Ucd358c25-7258-4929-baff-0e0c85b4b884.png",
  "1695365~Fortune Dragon~~U6db8b734-210d-4c7f-b427-0480a05a9e7d.png",
  "1451122~Dragon Hatch 2~C~Ud6db46aa-ed58-4289-ac03-8dad89d8ce9e.jpg",
  "1615454~Werewolf's Hunt~C~U2e54b0dc-718b-47f2-9895-24b3808ed73b.png",
  "1655268~Tsar Treasures~C~Uf25d28e9-592b-4ebb-893f-3d6f7752d375.png",
  "1580541~Mafia Mayhem~C~U99b8a358-9dcb-4ffe-b32f-750dee2da5df.png",
  "1555350~Forge of Wealth~C~U0a2b61bc-2199-4d4e-bc64-65bb562a7481.png",
  "1568554~Wild Heist Cashout~C~U3838195e-fd57-4044-bc05-875da9a160e1.png",
  "1529867~Ninja Raccoon Frenzy~C~Ub7c9b442-05cb-44e6-8899-89c2a74ba432.jpg",
  "1572362~Gladiator's Glory~C~Ueb322534-bfe4-42db-a1ac-8c7b16db1c80.png",
  "1594259~Safari Wilds~C~Uee6e5685-a253-4522-a178-17af607f1242.png",
  "1473388~Cruise Royale~C~I/cruise-royale/ICON-90b858aa.png",
  "1397455~Fruity Candy~C~Uc1bd5f08-4f2b-4be1-be13-073a4ceef7e2.jpg",
  "1601012~Lucky Clover Riches~C~U18ade33f-90e6-4394-b22b-9e89ecc70e71.png",
  "1513328~Super Golf Drive~C~Uac3c3dc1-cffe-4b05-81f1-d5b3233f9864.png",
  "1432733~Mystical Spirits~~U797a15fe-b4cd-4fd6-83f5-49d00c473b1a.png",
  "1448762~Songkran Splash~~I/songkran-spl/ICON-cc60821d.png",
  "1381200~Hawaiian Tiki~C~U9c26bfa7-d8b6-418f-85e5-092c6f24dd48.png",
  "1420892~Rave Party Fever~C~U3dd311e9-2b3d-41ca-a5c1-a31703ba0982.png",
  "1543462~Fortune Rabbit~~U942a8ad7-2501-41dd-9b03-d0cad60b9699.png",
  "1402846~Midas Fortune~C~U77b9a4c7-ca70-4aa0-898a-eb248ee158f1.png",
  "1372643~Diner Delights~C~U3dbea863-a99d-4dbb-b85f-dd19472c981e.png",
  "1368367~Alchemy Gold~C~U47d6ea60-2ee5-4a32-a50b-c80f04178d67.png",
  "1338274~Totem Wonders~~U624b2c4e-24c0-4597-a84a-8da5a8aaabbc.png",
  "1312883~Prosperity Fortune Tree~C~Ufe0deca8-9e51-43e2-8416-76c3843d6c84.png",
  "135~Wild Bounty Showdown~C~U47558386-711e-4a2f-95cc-953a29f5b0e6.png",
  "132~Wild Coaster~C~U6c619884-2a62-421e-95bf-a8fff8ebffb9.png",
  "128~Legend of Perseus~C~U54219b25-08da-4d1a-bb31-2158c920a38f.png",
  "127~Speed Winner~C~U25881516-d439-43ed-b6e3-eaf96f9074f7.png",
  "130~Lucky Piggy~C~Ucbc99249-8902-4c8d-9d52-16839d553a6f.png",
  "129~Win Win Fish Prawn Crab~C~Uf60111e4-7981-43c5-8154-2d866de25aa0.png",
  "124~Battleground Royale~C~U5e1ec796-e36a-4efc-934c-60b500bdcacc.png",
  "123~Rooster Rumble~C~U94e8b93e-2192-4a9c-a8e7-828e40832de3.png",
  "125~Butterfly Blossom~C~Ucc9e1cff-f7b7-4c42-885c-042909529531.png",
  "121~Destiny of Sun & Moon~C~U45b6cabc-48db-499f-be93-dd06e4b818fd.png",
  "122~Garuda Gems~C~U16ad88bc-6789-4bde-89e6-68aaedfaa83e.png",
  "126~Fortune Tiger~~Uc84dcb96-06bb-4377-a0a7-3b561fac92f8.png",
  "118~Mask Carnival~~U6142e08b-96d2-40af-b116-6352f5834292.png",
  "114~Emoji Riches~C~U679e269d-c9a2-4233-a03d-dd55856243c6.png",
  "107~Legendary Monkey King~C~U06f9ab7b-7b72-4676-a522-9997fc3215a1.png",
  "119~Spirited Wonders~C~U199235bb-b8a9-4a54-a63f-0c7120724841.png",
  "108~Buffalo Win~~U4fac121e-72ee-461d-aa43-7a1b1e656e64.png",
  "113~Raider Jane's Crypt of Fortune~~Uc72dace6-59d4-4475-ad42-2a15a353253e.png",
  "115~Supermarket Spree~CP~U3f60bdb8-a317-43cf-928f-02c69636f29b.png",
  "102~Mermaid Riches~CP~U52f68384-fc85-488d-a7e9-f1729dc63ca9.png",
  "105~Heist Stakes~C~Uec91051e-5415-4f31-8ab6-d63f55f7a7d4.png",
  "104~Wild Bandito~C~U2da32de9-7d53-4043-afa8-bb5dd4d9f25b.png",
  "100~Candy Superwin~C~Uf62541ae-087a-4b4d-886a-ac91ef761f82.jpg",
  "95~Majestic Treasures~C~Ub29bec46-4cf1-4eb1-9b77-98ad9813410d.png",
  "94~Bali Vacation~P~U8a6f54bc-5f8d-4d23-9737-53df9ee34cfc.png",
  "98~Fortune Ox~~Udad28553-b44b-41d9-9e8f-1188f7ffd995.png",
  "91~Guardians of Ice & Fire~~I/91/ICON-9fc8b377.png",
  "86~Galactic Gems~P~Ua6a0645e-2056-4bfe-9b13-4f26d9e56500.png",
  "97~Jack Frost's Winter~~U42db67b5-c702-4d29-8f31-3d14e221692e.png",
  "88~Jewels of Prosperity~~I/88/ICON-b203ed78.png",
  "84~Queen of Bounty~CP~U7c545509-fb5a-47a7-ae9f-9692a26cecf8.png",
  "90~Secrets of Cleopatra~~U854f925a-8c48-4bca-a3a2-7738dc6dc327.png",
  "58~Vampire's Charm~P~U1cf85ef6-78be-4aa3-ad73-218b20b7743d.png",
  "80~Circus Delight~P~U16f0d416-8567-4b67-96d5-2f554e93fc42.png",
  "85~Genie's 3 Wishes~P~U6e24d56a-60d9-49d9-bd58-199ac0a30e1c.png",
  "83~Wild Fireworks~CP~Uc76eb55f-9632-4bb7-a06a-92be48ef8e6f.png",
  "82~Phoenix Rises~P~U29012e2d-9e89-452b-b9cf-30f509b92a59.png",
  "74~Mahjong Ways 2~C~U68715ede-f53e-4f94-8efe-2cbf07e70cfd.png",
  "69~Bikini Paradise~~Udcec02ae-0290-443d-815b-91bc1aff7b34.png",
  "70~Candy Burst~C~Uee1539eb-4997-46cc-af17-72513b521187.png",
  "67~Shaolin Soccer~~Uccb499d7-fb1a-4c6b-967a-0ed35df440e3.png",
  "20~Reel Love~~U9950e02b-98a8-4c34-af2f-5bbe23f5034c.png",
  "68~Fortune Mouse~~Udcb0a0c8-86e4-4f81-a738-46fb29bf7c6a.png",
  "57~Dragon Hatch~C~Uc6c50759-1c6b-4ad9-8e2d-841343373672.png",
  "65~Mahjong Ways~C~Ucc01fe53-8f40-4299-9809-5a9e6f3ebb9a.png",
  "63~Dragon Tiger Luck~~Ude0f0574-0104-4277-aa4b-78ff297c3fd9.png",
  "64~Muay Thai Champion~~U3534dd16-575c-4696-88c5-fba6304c8cbe.png",
  "59~Ninja vs Samurai~~U129a76ff-cd17-41ff-8deb-8c3d391c2bf2.png",
  "61~Flirting Scholar~~U4afc4039-1e93-47fc-b7c6-93129a57f4a2.png",
  "60~Leprechaun Riches~C~Ueb4ef96e-c572-4605-af79-7363db79d1b7.png",
  "54~Captain’s Bounty~C~I/54/app_icon@3x-d966473e.png",
  "50~Journey To The Wealth~~I/50/app_icon@3x-76cde672.png",
  "53~The Great Icescape~~U28d18ca3-ede8-4ccf-a60a-5aeb99ed2f06.png",
  "48~Double Fortune~~I/48/app_icon@3x-b548efe5.png",
  "44~Emperor's Favour~~I/44/app_icon@3x-711bb137.png",
  "40~Jungle Delight~~I/40/app_icon@3x-52983134.png",
  "42~Ganesha Gold~~U358c5770-a0b2-4878-a40c-c653bd2bd080.png",
  "41~Symbols of Egypt~~U9bb285e8-c438-4672-8da0-4fa3e8294607.png",
  "39~Piggy Gold~~U20668a71-d8f1-442c-85bf-9e3961d5c1ae.png",
  "38~Gem Saviour Sword~~I/38/app_icon_en@3x-320fa62b.png",
  "31~Baccarat Deluxe~T~U31bdc924-27d3-4006-8381-37e87982375b.png",
  "37~Santa’s Gift Rush~~I/37/app_icon_en@3x-14137df7.png",
  "33~Hip Hop Panda~~U1316f098-9698-4300-93be-ec53d6780214.png",
  "36~Prosperity Lion~~I/36/app_icon@3x-4961bb52.png",
  "34~Legend of Hou Yi~~I/34/app_icon@3x-73d60a98.png",
  "35~Mr. Hallow-Jackpot!~~Ueed8d666-40e6-4582-9c5b-7995aab78d5a.png",
  "28~Hotpot~~I/28/app_icon_en@3x-d9638aca.png",
  "29~Dragon Legend~~Uf912c332-0ad4-438c-be7a-7e99a6fc9403.png",
  "18~Hood vs Wolf~~U6156447d-0627-413f-9ae9-7d2b2cd29f43.png",
  "2~Gem Saviour~C~I/2/app_icon@3x-d061fa39.png",
  "25~Plushie Frenzy~~I/25/app_icon@3x-4272aead.png",
  "7~Medusa~~I/7/app_icon@3x-2c7afa07.png",
  "24~Win Win Won~~U9c696452-4280-4bda-813b-3e2f1d479991.png",
  "6~Medusa II~~I/6/app_icon@3x-c872d998.png",
  "26~Tree Of Fortune~~I/26/app_icon@3x-ad5c8666.png",
  "3~Fortune Gods~~I/3/app_icon@3x-6bdc0362.png",
  "1~Honey Trap of Diao Chan~~I/1/app_icon@3x-1fd0f53f.png",
];

const expand = (img) => (img[0] === 'U' ? U + img.slice(1) : I + img.slice(1));

export const PG_CATEGORIES = ['All', 'New', 'Slots', 'Cascading', 'Classic', 'Table'];

// PG SOFT's most popular titles, most popular first. These are pulled to the
// top of the lobby; everything else keeps the catalogue order after them.
const POPULAR = [
  '65',      // Mahjong Ways
  '74',      // Mahjong Ways 2
  '135',     // Wild Bounty Showdown
  '126',     // Fortune Tiger
  '98',      // Fortune Ox
  '1543462', // Fortune Rabbit
  '68',      // Fortune Mouse
  '1695365', // Fortune Dragon
  '1879752', // Fortune Snake
  '57',      // Dragon Hatch
  '1451122', // Dragon Hatch 2
  '104',     // Wild Bandito
  '1312883', // Prosperity Fortune Tree
  '1529867', // Ninja Raccoon Frenzy
  '108',     // Buffalo Win
  '128',     // Legend of Perseus
  '130',     // Lucky Piggy
  '123',     // Rooster Rumble
  '122',     // Garuda Gems
  '102',     // Mermaid Riches
  '95',      // Majestic Treasures
  '94',      // Bali Vacation
  '42',      // Ganesha Gold
  '39',      // Piggy Gold
  '54',      // Captain's Bounty
  '60',      // Leprechaun Riches
  '1594259', // Safari Wilds
  '2100928', // Fortune Horse
  '132',     // Wild Coaster
  '127',     // Speed Winner
];
const popRank = (id) => {
  const i = POPULAR.indexOf(id);
  return i === -1 ? POPULAR.length : i;
};

export const PG_GAMES = ROWS.map((row, i) => {
  const [id, title, flags, img] = row.split('~');
  const cats = ['All'];
  if (i < 20) cats.push('New');
  if (flags.includes('T')) cats.push('Table');
  else cats.push('Slots');
  if (flags.includes('C')) cats.push('Cascading');
  if (flags.includes('P')) cats.push('Classic');
  return {
    id,
    title,
    desc: flags.includes('T') ? 'PG SOFT · Table' : 'PG SOFT · Slots',
    image: expand(img),
    cats,
    accent: 'from-violet-600 to-indigo-900',
    _order: i,
  };
}).sort((a, b) => popRank(a.id) - popRank(b.id) || a._order - b._order);