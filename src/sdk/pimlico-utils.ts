import {
  createPublicClient,
  http,
  hexToBigInt,
  toHex,
  toBytes,
  type PrivateKeyAccount,
  type Hex,
  type Transport,
  type Chain,
  type RpcSchema,
  type Client,
} from "viem";

import { createPimlicoClient } from "permissionless/clients/pimlico";
import { createSmartAccountClient, type SmartAccountClient } from "permissionless";
import { toSafeSmartAccount } from "permissionless/accounts";
import { entryPoint07Address, type SmartAccount } from "viem/account-abstraction";
import { CHAIN, getRpcUrl, getPimlicoUrl } from "../constants";
import { generatePrivateKey } from "viem/accounts";
import { getRuntimeConfig } from "../config";

export type TSmartAccountClient = SmartAccountClient<Transport, Chain, SmartAccount, Client, RpcSchema>;

export const getPublicClient = () =>
  createPublicClient({
    transport: http(getRpcUrl()),
    chain: CHAIN,
  });

export const getPimlicoClient = (authToken: string) =>
  createPimlicoClient({
    transport: http(getPimlicoUrl(), {
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    }),
    entryPoint: {
      address: entryPoint07Address,
      version: "0.7",
    },
  });

export const signerToSmartAccount = async (signer: PrivateKeyAccount, smartAccountAddress?: Hex) =>
  await toSafeSmartAccount({
    client: getPublicClient(),
    owners: [signer],
    address: smartAccountAddress,
    entryPoint: {
      address: entryPoint07Address,
      version: "0.7",
    },
    version: "1.4.1",
  });

export const getSmartAccountClient = async (
  signer: PrivateKeyAccount,
  authToken: string,
  smartAccountAddress?: Hex,
): Promise<TSmartAccountClient> => {
  const smartAccount = await signerToSmartAccount(signer, smartAccountAddress);
  const pimlicoClient = getPimlicoClient(authToken);

  return createSmartAccountClient({
    account: smartAccount,
    chain: CHAIN,
    paymaster: pimlicoClient,
    bundlerTransport: http(getPimlicoUrl(), {
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    }),
    userOperation: {
      estimateFeesPerGas: async () => (await pimlicoClient.getUserOperationGasPrice()).fast,
    },
  });
};

export const getNonce = () =>
  hexToBigInt(
    toHex(toBytes(generatePrivateKey()).slice(0, 24), {
      size: 32,
    }),
  );

export const waitForUserOpReceipt = async (hash: Hex, authToken: string, timeout = 120000) => {
  const pimlicoClient = getPimlicoClient(authToken);
  const receipt = await pimlicoClient.waitForUserOperationReceipt({
    hash,
    timeout,
  });

  if (!receipt.success) throw new Error(`Failed to execute user operation: ${receipt.reason}`);
  return receipt;
};
