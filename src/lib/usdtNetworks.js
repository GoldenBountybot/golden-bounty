// EVM networks supporting USDT via WalletConnect (eth_sendTransaction).
// Non-EVM chains (Tron/Solana/TON/Aptos) can't use this auto-pay flow.
// `decimals` matters: BSC USDT = 18, ETH/Polygon USDT = 6.
export const USDT_NETWORKS = [
  {
    key: 'bsc',
    label: 'BNB Smart Chain (BEP20)',
    short: 'BSC · USDT',
    chainId: 56,
    chainIdHex: '0x38',
    rpc: 'https://bsc-dataseed.binance.org',
    explorer: 'https://bscscan.com',
    usdt: '0x55d398326f99059fF775485246999027B3197955',
    decimals: 18,
    admin: '0xbe44b1608cd0a7e7f18166d18ad2c21a61bd6570',
    nativeName: 'BNB',
    nativeSymbol: 'BNB',
    color: '#f0b90b',
  },
  {
    key: 'eth',
    label: 'Ethereum (ERC20)',
    short: 'ETH · USDT',
    chainId: 1,
    chainIdHex: '0x1',
    rpc: 'https://eth.llamarpc.com',
    explorer: 'https://etherscan.io',
    usdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6,
    admin: '0xbe44b1608cd0a7e7f18166d18ad2c21a61bd6570',
    nativeName: 'Ether',
    nativeSymbol: 'ETH',
    color: '#627eea',
  },
  {
    key: 'polygon',
    label: 'Polygon (POS)',
    short: 'POL · USDT',
    chainId: 137,
    chainIdHex: '0x89',
    rpc: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
    usdt: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    decimals: 6,
    admin: '0xbe44b1608cd0a7e7f18166d18ad2c21a61bd6570',
    nativeName: 'POL',
    nativeSymbol: 'POL',
    color: '#8247e5',
  },
];

export const DEFAULT_USDT_NETWORK = USDT_NETWORKS[0];