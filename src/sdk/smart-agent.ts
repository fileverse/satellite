import { Hex, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getSmartAccountClient, getNonce, waitForUserOpReceipt } from "./pimlico-utils";
import { AuthTokenProvider } from "./auth-token-provider";
import { STATIC_CONFIG } from "../cli/constants";
import { createSmartAccountClient } from "permissionless";
import type { IExecuteUserOperationRequest } from "../types";

export type { IExecuteUserOperationRequest };

export class AgentClient {
  private smartAccountAgent: ReturnType<typeof createSmartAccountClient> | null = null;
  private readonly MAX_CALL_GAS_LIMIT = 500000;
  private readonly authOptions: {
    namespace: string;
    segment: string;
    scheme: string;
  } = { namespace: "proxy", segment: "ACCESS", scheme: "pimlico" };

  constructor(private readonly authTokenProvider: AuthTokenProvider) {
    this.authTokenProvider = authTokenProvider;
  }

  async initializeAgentClient(keyMaterial: Uint8Array) {
    const agentAccount = privateKeyToAccount(toHex(keyMaterial));
    const authToken = await this.authTokenProvider.getAuthToken(STATIC_CONFIG.PROXY_SERVER_DID, this.authOptions);
    const smartAccountClient = await getSmartAccountClient(
      agentAccount,
      authToken,
      this.authTokenProvider.portalAddress,
    );
    this.smartAccountAgent = smartAccountClient;
  }

  getSmartAccountAgent() {
    if (!this.smartAccountAgent) throw new Error("Agent client not initialized");

    return this.smartAccountAgent;
  }

  getAgentAddress() {
    const smartAccountAgent = this.getSmartAccountAgent();
    if (!smartAccountAgent.account) throw new Error("Agent account not found");
    return smartAccountAgent.account.address;
  }

  getAgentAccount() {
    const smartAccountAgent = this.getSmartAccountAgent();
    if (!smartAccountAgent.account) throw new Error("Agent account not found");
    return smartAccountAgent.account;
  }

  destroyAgentClient() {
    this.smartAccountAgent = null;
  }

  async getCallData(request: IExecuteUserOperationRequest | IExecuteUserOperationRequest[]) {
    const agentAccount = this.getAgentAccount();
    if (Array.isArray(request)) {
      if (request.length === 0 || request.length > 10) throw new Error("Request length must be between 1 and 10");

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
    customGasLimit?: number,
  ) {
    const smartAccountAgent = this.getSmartAccountAgent();

    const callData = await this.getCallData(request);

    return await smartAccountAgent.sendUserOperation({
      callData,
      callGasLimit: BigInt(customGasLimit || this.MAX_CALL_GAS_LIMIT),
      nonce: getNonce(),
    });
  }

  async executeUserOperationRequest(
    request: IExecuteUserOperationRequest | IExecuteUserOperationRequest[],
    timeout: number,
    customGasLimit?: number,
  ) {
    const userOpHash = await this.sendUserOperation(request, customGasLimit);
    const { authToken, portalAddress, invokerAddress } = await this.getAuthParams();
    const receipt = await waitForUserOpReceipt(userOpHash, authToken, portalAddress, invokerAddress, timeout);
    if (!receipt.success) throw new Error(`Failed to execute user operation: ${receipt.reason}`);
    return receipt;
  }

  async getAuthParams(): Promise<{ authToken: string; portalAddress: Hex; invokerAddress: Hex }> {
    const authToken = await this.authTokenProvider.getAuthToken(STATIC_CONFIG.PROXY_SERVER_DID, this.authOptions);
    return {
      authToken,
      portalAddress: this.authTokenProvider.portalAddress,
      invokerAddress: this.getAgentAddress(),
    };
  }
}
