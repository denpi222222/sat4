export const GUARD_CFG = {
  whitelistContracts: [
    // TODO: add your contract addresses here
  ] as `0x${string}`[],
  whitelistChainIds: [1, 11155111], // example: Ethereum mainnet + sepolia
  maxNativeValue: 10n ** 18n * 1000n, // 1000 ETH/APE/etc
};

export const ALLOWED_SIGN_DOMAINS = [
  'creziii.netlify.app',
  'localhost',
  '127.0.0.1'
];
