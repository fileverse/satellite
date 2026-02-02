import { config } from "../config";
import { gnosis, sepolia } from 'viem/chains';

export const RPC_URL = config.RPC_URL as string;
export const NETWORK_NAME = config.NETWORK_NAME as string;
export const UPLOAD_SERVER_URL = config.UPLOAD_SERVER_URL as string;
const PIMLICO_API_KEY = config.PIMLICO_API_KEY as string;

const CHAIN_MAP = {
    gnosis: gnosis,
    sepolia: sepolia,
} as const;

export const CHAIN = CHAIN_MAP[NETWORK_NAME as keyof typeof CHAIN_MAP];

export const PIMLICO_URL = `https://api.pimlico.io/v2/${NETWORK_NAME}/rpc?apikey=${PIMLICO_API_KEY}` as const;


export const ADD_FILE_ABI = [{
    inputs: [
        {
            internalType: 'string',
            name: '_appFileId',
            type: 'string',
        },
        {
            internalType: 'enum FileverseApp.FileType',
            name: 'fileType',
            type: 'uint8',
        },
        {
            internalType: 'string',
            name: '_metadataIPFSHash',
            type: 'string',
        },
        {
            internalType: 'string',
            name: '_contentIPFSHash',
            type: 'string',
        },
        {
            internalType: 'string',
            name: '_gateIPFSHash',
            type: 'string',
        },
        {
            internalType: 'uint256',
            name: 'version',
            type: 'uint256',
        },
    ],
    name: 'addFile',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
}] as const;

export const EDIT_FILE_ABI = [{
    inputs: [
        {
            internalType: 'uint256',
            name: 'fileId',
            type: 'uint256',
        },
        {
            internalType: 'string',
            name: '_appFileId',
            type: 'string',
        },
        {
            internalType: 'string',
            name: '_metadataIPFSHash',
            type: 'string',
        },
        {
            internalType: 'string',
            name: '_contentIPFSHash',
            type: 'string',
        },
        {
            internalType: 'string',
            name: '_gateIPFSHash',
            type: 'string',
        },
        {
            internalType: 'enum FileverseApp.FileType',
            name: 'fileType',
            type: 'uint8',
        },
        {
            internalType: 'uint256',
            name: 'version',
            type: 'uint256',
        },
    ],
    name: 'editFile',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
}] as const;