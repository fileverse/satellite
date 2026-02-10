export const ADDED_FILE_EVENT = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "fileId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "appFileId",
        type: "string",
      },
      {
        indexed: false,
        internalType: "enum FileverseApp.FileType",
        name: "fileType",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "string",
        name: "metadataIPFSHash",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "contentIPFSHash",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "gateIPFSHash",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "version",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "by",
        type: "address",
      },
    ],
    name: "AddedFile",
    type: "event",
  },
] as const;

export const EDITED_FILE_EVENT = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "fileId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "appFileId",
        type: "string",
      },
      {
        indexed: false,
        internalType: "enum FileverseApp.FileType",
        name: "fileType",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "string",
        name: "metadataIPFSHash",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "contentIPFSHash",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "gateIPFSHash",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "version",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "by",
        type: "address",
      },
    ],
    name: "EditedFile",
    type: "event",
  },
] as const;

export const DELETED_FILE_EVENT = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "fileId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "appFileId",
        type: "string",
      },
      {
        indexed: true,
        internalType: "address",
        name: "by",
        type: "address",
      },
    ],
    name: "DeletedFile",
    type: "event",
  },
] as const;