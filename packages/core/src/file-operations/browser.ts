/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import { FileOperations } from "../types/file-operations.types";

export class BrowserFileOperations implements FileOperations {
  // You can still have your private field to store the directory handle if needed
  private _directoryHandle: FileSystemDirectoryHandle | null = null;

  // The method to get the directory handle should be public to adhere to the interface
  public async getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
    if (!this._directoryHandle) {
      // Logic to get a directory handle, for example, by showing a directory picker
      this._directoryHandle = await window.showDirectoryPicker();
    }
    return this._directoryHandle;
  }

  async setDirectoryHandle(): Promise<any> {
    const directoryHandle = await window.showDirectoryPicker();
    this._directoryHandle = directoryHandle;
  }

  async readFile(fileName: string): Promise<string> {
    return "File read successfully";
  }

  async writeFile(fileName: string, text: string): Promise<string> {
    return "File written to successfully";
  }

  async appendToFile(fileName: string, text: string): Promise<string> {
    return "Text appended successfully";
  }

  async deleteFile(fileName: string): Promise<string> {
    return "File deleted successfully";
  }
}
