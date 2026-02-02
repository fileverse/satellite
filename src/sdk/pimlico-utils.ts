import {
    createPublicClient,
    http,
    hexToBigInt,
    toHex,
    toBytes,
    PrivateKeyAccount,
    Hex,
    Transport,
    Chain,
    RpcSchema,
    Client,
} from 'viem';

import { createPimlicoClient } from 'permissionless/clients/pimlico';
import { createSmartAccountClient, type SmartAccountClient } from 'permissionless';
import { toSafeSmartAccount } from 'permissionless/accounts';
import { entryPoint07Address, type SmartAccount } from 'viem/account-abstraction';
import { CHAIN, PIMLICO_URL, RPC_URL } from '../constants';
import { generatePrivateKey } from "viem/accounts"

export type TSmartAccountClient = SmartAccountClient<
    Transport,
    Chain,
    SmartAccount,
    Client,
    RpcSchema
>;

export const publicClient = createPublicClient({
    transport: http(RPC_URL),
    chain: CHAIN
})

export const pimlicoClient = createPimlicoClient({
    transport: http(PIMLICO_URL),
    entryPoint: {
        address: entryPoint07Address,
        version: "0.7"
    }
})

export const signerToSmartAccount = async (
    signer: PrivateKeyAccount,
    smartAccountAddress?: Hex
) =>
    await toSafeSmartAccount({
        client: publicClient,
        owners: [signer],
        address: smartAccountAddress,
        entryPoint: {
            address: entryPoint07Address,
            version: '0.7',
        },
        version: '1.4.1',
    });

export const getSmartAccountClient = async (
    signer: PrivateKeyAccount,
    smartAccountAddress?: Hex
): Promise<TSmartAccountClient> => {
    const smartAccount = await signerToSmartAccount(signer, smartAccountAddress);

    return createSmartAccountClient({
        account: smartAccount,
        chain: CHAIN,
        paymaster: pimlicoClient,
        bundlerTransport: http(PIMLICO_URL),
        userOperation: {
            estimateFeesPerGas: async () =>
                (await pimlicoClient.getUserOperationGasPrice()).fast,
        },
    });
};

export const getNonce = () =>
    hexToBigInt(
        toHex(toBytes(generatePrivateKey()).slice(0, 24), {
            size: 32,
        })
    );

export const waitForUserOpReceipt = async (
    hash: Hex,
    timeout = 120000
) => {
    const receipt = await pimlicoClient.waitForUserOperationReceipt({
        hash,
        timeout,
    });

    if (!receipt.success)
        throw new Error(`Failed to execute user operation: ${receipt.reason}`);
    return receipt;
};