import { STATIC_CONFIG } from "../cli/constants";
import { getRuntimeConfig } from "../config";
import { gnosis, sepolia } from "./chains";

export const NETWORK_NAME = STATIC_CONFIG.NETWORK_NAME;
export const UPLOAD_SERVER_URL = STATIC_CONFIG.API_URL;

export const getRpcUrl = () => getRuntimeConfig().RPC_URL;
export const getPimlicoUrl = () => `${STATIC_CONFIG.PIMLICO_PROXY_URL}api/${NETWORK_NAME}/rpc`;

const CHAIN_MAP = {
  gnosis: gnosis,
  sepolia: sepolia,
} as const;

export const CHAIN = CHAIN_MAP[NETWORK_NAME as keyof typeof CHAIN_MAP];
export { DELETED_FILE_EVENT, EDITED_FILE_EVENT, ADDED_FILE_EVENT } from "./events";
export { DELETED_FILE_ABI, EDIT_FILE_METHOD, ADD_FILE_METHOD } from "./methods";



