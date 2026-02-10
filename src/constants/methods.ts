export const ADD_FILE_METHOD = [
  {
    inputs: [
      {
        internalType: "string",
        name: "_appFileId",
        type: "string",
      },
      {
        internalType: "enum FileverseApp.FileType",
        name: "fileType",
        type: "uint8",
      },
      {
        internalType: "string",
        name: "_metadataIPFSHash",
        type: "string",
      },
      {
        internalType: "string",
        name: "_contentIPFSHash",
        type: "string",
      },
      {
        internalType: "string",
        name: "_gateIPFSHash",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "version",
        type: "uint256",
      },
    ],
    name: "addFile",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const EDIT_FILE_METHOD = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "fileId",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "_appFileId",
        type: "string",
      },
      {
        internalType: "string",
        name: "_metadataIPFSHash",
        type: "string",
      },
      {
        internalType: "string",
        name: "_contentIPFSHash",
        type: "string",
      },
      {
        internalType: "string",
        name: "_gateIPFSHash",
        type: "string",
      },
      {
        internalType: "enum FileverseApp.FileType",
        name: "fileType",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "version",
        type: "uint256",
      },
    ],
    name: "editFile",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;


export const DELETED_FILE_ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "fileId",
        type: "uint256",
      },
    ],
    name: "deleteFile",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;