import { STATIC_CONFIG } from '../cli/constants';
import { getRuntimeConfig } from '../config';
import { gnosis, sepolia } from 'viem/chains';

export const NETWORK_NAME = STATIC_CONFIG.NETWORK_NAME;
export const UPLOAD_SERVER_URL = STATIC_CONFIG.API_URL;

export const getRpcUrl = () => getRuntimeConfig().RPC_URL;
export const getPimlicoApiKey = () => getRuntimeConfig().PIMLICO_API_KEY;
export const getPimlicoUrl = () =>
    `https://api.pimlico.io/v2/${NETWORK_NAME}/rpc?apikey=${getPimlicoApiKey()}`;

const CHAIN_MAP = {
    gnosis: gnosis,
    sepolia: sepolia,
} as const;

export const CHAIN = CHAIN_MAP[NETWORK_NAME as keyof typeof CHAIN_MAP];


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


export const ADDED_FILE_EVENT_ABI = [{
    anonymous: false,
    inputs: [
        {
            indexed: true,
            internalType: 'uint256',
            name: 'fileId',
            type: 'uint256',
        },
        {
            indexed: false,
            internalType: 'string',
            name: 'appFileId',
            type: 'string',
        },
        {
            indexed: false,
            internalType: 'enum FileverseApp.FileType',
            name: 'fileType',
            type: 'uint8',
        },
        {
            indexed: false,
            internalType: 'string',
            name: 'metadataIPFSHash',
            type: 'string',
        },
        {
            indexed: false,
            internalType: 'string',
            name: 'contentIPFSHash',
            type: 'string',
        },
        {
            indexed: false,
            internalType: 'string',
            name: 'gateIPFSHash',
            type: 'string',
        },
        {
            indexed: false,
            internalType: 'uint256',
            name: 'version',
            type: 'uint256',
        },
        {
            indexed: true,
            internalType: 'address',
            name: 'by',
            type: 'address',
        },
    ],
    name: 'AddedFile',
    type: 'event',
}] as const;

export const EDITED_FILE_EVENT_ABI = [{
    anonymous: false,
    inputs: [
        {
            indexed: true,
            internalType: 'uint256',
            name: 'fileId',
            type: 'uint256',
        },
        {
            indexed: false,
            internalType: 'string',
            name: 'appFileId',
            type: 'string',
        },
        {
            indexed: false,
            internalType: 'enum FileverseApp.FileType',
            name: 'fileType',
            type: 'uint8',
        },
        {
            indexed: false,
            internalType: 'string',
            name: 'metadataIPFSHash',
            type: 'string',
        },
        {
            indexed: false,
            internalType: 'string',
            name: 'contentIPFSHash',
            type: 'string',
        },
        {
            indexed: false,
            internalType: 'string',
            name: 'gateIPFSHash',
            type: 'string',
        },
        {
            indexed: false,
            internalType: 'uint256',
            name: 'version',
            type: 'uint256',
        },
        {
            indexed: true,
            internalType: 'address',
            name: 'by',
            type: 'address',
        },
    ],
    name: 'EditedFile',
    type: 'event',
}] as const;


export const DELETED_FILE_ABI = [{
    inputs: [
        {
            internalType: 'uint256',
            name: 'fileId',
            type: 'uint256',
        },
    ],
    name: 'deleteFile',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
}] as const;

export const DELETED_FILE_EVENT_ABI = [{
    anonymous: false,
    inputs: [
        {
            indexed: true,
            internalType: 'uint256',
            name: 'fileId',
            type: 'uint256',
        },
        {
            indexed: false,
            internalType: 'string',
            name: 'appFileId',
            type: 'string',
        },
        {
            indexed: true,
            internalType: 'address',
            name: 'by',
            type: 'address',
        },
    ],
    name: 'DeletedFile',
    type: 'event',
}] as const;