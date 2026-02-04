import { EncodeDeployDataReturnType, Hex, toHex, } from 'viem';
import { Account, privateKeyToAccount } from 'viem/accounts';
import {
    getSmartAccountClient,
    getNonce,
    waitForUserOpReceipt,
    type TSmartAccountClient,
} from './pimlico-utils';

import { WaitForUserOperationReceiptReturnType } from 'viem/account-abstraction';

export interface IExecuteUserOperationRequest {
    contractAddress: Hex;
    data: EncodeDeployDataReturnType;
}



export class AgentClient {
    private smartAccountAgent: TSmartAccountClient | null = null;
    private readonly MAX_CALL_GAS_LIMIT = 500000;


    async initializeAgentClient(
        keyMaterial: Uint8Array,
        smartAccountAddress?: Hex
    ) {
        const agentAccount = privateKeyToAccount(toHex(keyMaterial));
        const smartAccountClient = await getSmartAccountClient(
            agentAccount,
            smartAccountAddress
        );
        this.smartAccountAgent = smartAccountClient;

    }

    getSmartAccountAgent(): TSmartAccountClient {
        if (!this.smartAccountAgent)
            throw new Error('Agent client not initialized');

        return this.smartAccountAgent;
    }

    getAgentAddress() {
        const smartAccountAgent = this.getSmartAccountAgent();
        return smartAccountAgent.account.address;
    }

    getAgentAccount() {
        const smartAccountAgent = this.getSmartAccountAgent();
        return smartAccountAgent.account;
    }

    destroyAgentClient() {
        this.smartAccountAgent = null;
    }

    async getCallData(
        request: IExecuteUserOperationRequest | IExecuteUserOperationRequest[]
    ) {
        const agentAccount = this.getAgentAccount();
        if (Array.isArray(request)) {
            if (request.length === 0 || request.length > 10)
                throw new Error('Request length must be between 1 and 10');

            const encodedCallData = request.map((req) => ({
                to: req.contractAddress,
                data: req.data,
                value: BigInt(0),
            }));

            return await agentAccount.encodeCalls(encodedCallData);
        }

        return await agentAccount.encodeCalls([
            {
                to: request.contractAddress,
                data: request.data,
                value: BigInt(0),
            },
        ]);
    }

    async sendUserOperation(
        request: IExecuteUserOperationRequest | IExecuteUserOperationRequest[],
        customGasLimit?: number
    ) {
        try {
            const smartAccountAgent = this.getSmartAccountAgent();

            const callData = await this.getCallData(request);

            return await smartAccountAgent.sendUserOperation({
                callData,
                callGasLimit: BigInt(customGasLimit || this.MAX_CALL_GAS_LIMIT),
                nonce: getNonce(),
            });
        } catch (error) {
            throw error;
        }
    }

    async executeUserOperationRequest(
        request: IExecuteUserOperationRequest | IExecuteUserOperationRequest[],
        timeout: number,
        customGasLimit?: number
    ) {
        const userOpHash = await this.sendUserOperation(request, customGasLimit);
        return await waitForUserOpReceipt(userOpHash, timeout);
    }


}


