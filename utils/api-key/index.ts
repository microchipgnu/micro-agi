const OPENAI_LS_KEY = "OPENAI_API_KEY";
const NODE_STORAGE_DIR = "./scratch";

import {
  LocalStorage,
  type LocalStorage as LocalStorageType,
} from "node-localstorage";
import { constants } from "../constants";

const canUseDOMLocalStorage =
  typeof window !== "undefined" && window.localStorage;

let nodeLocalStorage: LocalStorageType;
if (!canUseDOMLocalStorage) {
  nodeLocalStorage = new LocalStorage(NODE_STORAGE_DIR);
}

export function getAPIKey(): string | null {
  if (canUseDOMLocalStorage) {
    return window.localStorage.getItem(OPENAI_LS_KEY);
  } else {
    return nodeLocalStorage.getItem(OPENAI_LS_KEY);
  }
}

export function setAPIKey(apiKey: string): void {
  if (canUseDOMLocalStorage) {
    window.localStorage.setItem(OPENAI_LS_KEY, apiKey);
  } else {
    nodeLocalStorage.setItem(OPENAI_LS_KEY, apiKey);
  }
}

setAPIKey(constants.openaiKey || "");
