export const STATIC_CONFIG = {
    API_URL: 'https://sepolia-dsheet-storage-fc05499ecd15.herokuapp.com/',
    SERVER_DID: 'did:key:z6MkrrWQ11DoCzkLzoDuDnCszbwZZra3PmF62joDeMbpgCFD',
    NETWORK_NAME: 'sepolia',
    DEFAULT_PORT: '8001',
    DEFAULT_RPC_URL: 'https://rpc.sepolia.org',
    SERVICE_NAME: 'satellite',
    LOG_LEVEL: 'info',
} as const;

export const BASE_CONFIG = STATIC_CONFIG;