import 'dotenv/config';
import { chatLoop } from "./src/chat/chat-loop";

chatLoop().catch(console.error);
