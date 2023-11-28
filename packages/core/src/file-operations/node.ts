import * as fs from "fs/promises";
import * as path from "path";
import { FileOperations } from "../types/file-operations.types";

export class NodeFileOperations implements FileOperations {
  private directoryPath: string;

  constructor(directoryPath: string) {
    this.directoryPath = directoryPath;
  }

  async getDirectoryHandle(): Promise<any> {
    // In Node.js, this could simply return the directory path or similar
    return this.directoryPath;
  }

  async setDirectoryHandle(directoryPath?: string): Promise<any> {
    this.directoryPath = directoryPath || import.meta.dir;
    return this.directoryPath;
  }
  async readFile(fileName: string): Promise<string> {
    const filePath = path.join(this.directoryPath, fileName);
    return fs.readFile(filePath, { encoding: "utf-8" });
  }

  async writeFile(fileName: string, text: string): Promise<string> {
    const filePath = path.join(this.directoryPath, fileName);
    await fs.writeFile(filePath, text);
    return "File written to successfully";
  }

  async appendToFile(fileName: string, text: string): Promise<string> {
    const filePath = path.join(this.directoryPath, fileName);
    await fs.appendFile(filePath, text);
    return "Text appended successfully";
  }

  async deleteFile(fileName: string): Promise<string> {
    const filePath = path.join(this.directoryPath, fileName);
    await fs.unlink(filePath);
    return "File deleted successfully";
  }
}
