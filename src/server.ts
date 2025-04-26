#!/usr/bin/env node
import { startServer } from "./mcp";
import { logger } from "./utils/logger";

startServer().catch((error) => {
  logger.error(`❌ Fatal Error: ${error}`);
  process.exit(1);
});
