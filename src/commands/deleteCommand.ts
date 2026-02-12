import { Command } from "commander";
import { deleteFile } from "../domain/file";
import { getRuntimeConfig } from "../config";
import { ApiKeysModel } from "../infra/database/models";
import { validateApiKey } from "./utils/util";

export const deleteCommand = new Command()
  .name("delete")
  .description("Delete one or more ddocs by their IDs")
  .argument("<ddocIds...>", "One or more ddoc IDs to delete (space-separated)")
  .action(async (ddocIds: string[]) => {
    try {
      const runtimeConfig = getRuntimeConfig();

      const apiKey = runtimeConfig.API_KEY;

      validateApiKey(apiKey);

      const apiKeyInfo = await ApiKeysModel.findByApiKey(apiKey);
      const portalAddress = apiKeyInfo?.portalAddress as string;

      if (!portalAddress) throw new Error("Portal address is required");

      for (const ddocId of ddocIds) {
        try {
          await deleteFile(ddocId, portalAddress);
          console.log(`ddoc ${ddocId} deleted successfully`);
        } catch (error: any) {
          console.error(`Error deleting ddoc ${ddocId}:`, error.message);
          // Continue with next ddoc instead of stopping
        }
      }
    } catch (error: any) {
      console.error("Error:", error.message);
      throw error;
    }
  });
