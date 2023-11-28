export interface FileOperations {
    getDirectoryHandle: () => Promise<any>;
    setDirectoryHandle: (directoryPath?: string) => Promise<any>;
    readFile: (fileName: string) => Promise<string>;
    writeFile: (fileName: string, text: string) => Promise<string>;
    appendToFile: (fileName: string, text: string) => Promise<string>;
    deleteFile: (fileName: string) => Promise<string>;
  }
  