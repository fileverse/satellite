import { Command } from "commander";
import Table from "cli-table3";
import { EventsModel } from "../infra/database/models";
import { formatDate } from "./utils/util";

const MAX_ERROR_LEN = 60;

export const eventsCommand = new Command().name("events").description("Worker event operations (list failed, retry)");

eventsCommand
  .command("list-failed")
  .description("List all failed events")
  .action(async () => {
    try {
      const events = EventsModel.listFailed();
      if (events.length === 0) {
        console.log("No failed events.");
        return;
      }
      const table = new Table({
        head: ["ID", "File ID", "Portal", "Type", "Timestamp", "Last Error"],
        colWidths: [28, 12, 14, 10, 12, MAX_ERROR_LEN],
        style: { head: [] },
      });
      events.forEach((e) => {
        const err = e.lastError ?? "";
        table.push([
          e._id,
          e.fileId,
          e.portalAddress || "—",
          e.type,
          formatDate(new Date(e.timestamp)),
          err.length > MAX_ERROR_LEN ? err.slice(0, MAX_ERROR_LEN - 3) + "..." : err,
        ]);
      });
      console.log(`\nFailed events (${events.length}):\n`);
      console.log(table.toString());
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("Error listing failed events:", msg);
      throw error;
    }
  });

eventsCommand
  .command("retry <eventId>")
  .description("Retry a single failed event by ID")
  .action(async (eventId: string) => {
    try {
      const updated = EventsModel.resetFailedToPending(eventId);
      if (updated) {
        console.log(`Event ${eventId} reset to pending. Worker will pick it up.`);
      } else {
        console.error(`Event not found or not in failed state: ${eventId}`);
        process.exitCode = 1;
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("Error retrying event:", msg);
      throw error;
    }
  });

eventsCommand
  .command("retry-all")
  .description("Retry all failed events")
  .action(async () => {
    try {
      const count = EventsModel.resetAllFailedToPending();
      console.log(`Reset ${count} failed event(s) to pending. Worker will pick them up.`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("Error retrying failed events:", msg);
      throw error;
    }
  });
