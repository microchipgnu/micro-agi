import 'dotenv/config';
import { chatLoop } from "./utils/chat-loop";

chatLoop().catch(console.error);