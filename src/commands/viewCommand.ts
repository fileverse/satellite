import { Command } from "commander";
import { getFile } from "../domain/file";
import { getRuntimeConfig } from "../config";
import { ApiKeysModel } from "../infra/database/models";

export const viewCommand = new Command()
  .name("view")
  .description("View content preview of a ddoc")
  .argument("<ddocId>", "The ddoc ID to view")
  .option("-n, --lines <number>", "Number of lines to preview (default: 10)", "10")
  .action(async (ddocId: string, options: { lines?: string }) => {
    try {
      const runtimeConfig = getRuntimeConfig();
      const apiKey = runtimeConfig.API_KEY;
      if (!apiKey) throw new Error("API key is required");
      const portalAddress = ApiKeysModel.findByApiKey(apiKey)?.portalAddress as string;
      if (!portalAddress) throw new Error("Portal address is required");

      const file = getFile(ddocId, portalAddress);
      if (!file) {
        console.error(`Ddoc with ID "${ddocId}" not found.`);
        return;
      }

      const content = file.content || "";
      const contentLines = content.split("\n");
      const totalLines = contentLines.length;
      const previewLines = Math.max(1, parseInt(options.lines || "10", 10));
      const linesToShow = Math.min(previewLines, totalLines);

      if (content.trim().length === 0) {
        console.log("\nContent preview:\n");
        console.log("=".repeat(80));
        console.log("(empty)");
        console.log("=".repeat(80));
      } else {
        const preview = contentLines.slice(0, linesToShow).join("\n");

        console.log("\nContent preview:\n");
        console.log("=".repeat(80));
        console.log(preview);
        if (totalLines > linesToShow) {
          console.log(`\n... (${totalLines - linesToShow} more line${totalLines - linesToShow === 1 ? "" : "s"})`);
        }
        console.log("=".repeat(80));
        console.log(`\nShowing ${linesToShow} of ${totalLines} line${totalLines === 1 ? "" : "s"}\n`);
      }
    } catch (error: any) {
      console.error("Error viewing ddoc:", error.message);
      throw error;
    }
  });
