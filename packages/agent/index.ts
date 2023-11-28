import "dotenv/config";
import { chatLoop } from "@micro-agi/core";

chatLoop().catch(console.error);
