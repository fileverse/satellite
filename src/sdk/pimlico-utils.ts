import { createPublicClient, http, hexToBigInt, toHex, toBytes, type PrivateKeyAccount, type Hex } from "viem";

import { createPimlicoClient } from "permissionless/clients/pimlico";
import { createSmartAccountClient } from "permissionless";
import { toSafeSmartAccount } from "permissionless/accounts";
import { entryPoint07Address } from "viem/account-abstraction";
import { CHAIN, getRpcUrl, getPimlicoUrl } from "../constants";
import { generatePrivateKey } from "viem/accounts";

export const getPublicClient = () =>
  createPublicClient({
    transport: http(getRpcUrl(), {
      retryCount: 0,
    }),
    chain: CHAIN,
  });

export const getPimlicoClient = (authToken: string, portalAddress: Hex, invokerAddress: Hex) =>
  createPimlicoClient({
    transport: http(getPimlicoUrl(), {
      retryCount: 0,
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${authToken}`,
          contract: portalAddress,
          invoker: invokerAddress,
        },
      },
    }),
    entryPoint: {
      address: entryPoint07Address,
      version: "0.7",
    },
  });

export const signerToSmartAccount = async (signer: PrivateKeyAccount) =>
  await toSafeSmartAccount({
    client: getPublicClient(),
    owners: [signer],
    entryPoint: {
      address: entryPoint07Address,
      version: "0.7",
    },
    version: "1.4.1",
  });

export const getSmartAccountClient = async (signer: PrivateKeyAccount, authToken: string, portalAddress: Hex) => {
  const smartAccount = await signerToSmartAccount(signer);
  const pimlicoClient = getPimlicoClient(authToken, portalAddress, smartAccount.address);

  return createSmartAccountClient({
    account: smartAccount,
    chain: CHAIN,
    paymaster: pimlicoClient,
    bundlerTransport: http(getPimlicoUrl(), {
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${authToken}`,
          contract: portalAddress,
          invoker: smartAccount.address,
        },
      },
      retryCount: 0,
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

export const waitForUserOpReceipt = async (
  hash: Hex,
  authToken: string,
  portalAddress: Hex,
  invokerAddress: Hex,
  timeout = 120000,
) => {
  const pimlicoClient = getPimlicoClient(authToken, portalAddress, invokerAddress);
  return pimlicoClient.waitForUserOperationReceipt({
    hash,
    timeout,
  });
};
