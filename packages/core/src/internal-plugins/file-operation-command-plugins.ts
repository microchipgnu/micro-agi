
import { BrowserFileOperations } from "../file-operations/browser";
import { NodeFileOperations } from "../file-operations/node";
import { FileOperations } from "../types/file-operations.types";
import type { CommandPlugin } from "./command-plugins";

let fileOperations: FileOperations;

if (typeof window !== "undefined") {
  // Browser environment
  fileOperations = new BrowserFileOperations();
} else {
  // Node.js environment
  const directoryPath = import.meta.dir;
  fileOperations = new NodeFileOperations(directoryPath);
}

const FileOperationCommandPlugins: CommandPlugin[] = [
  {
    command: "write_to_file",
    name: "Write to file",
    arguments: {
      file: "file",
      text: "text",
    },
    argumentsV2: {
      args: {
        file: { type: "string", description: "Name of the file to create" },
        text: { type: "string", description: "Content of the file" },
      },
      required: ["file", "text"],
    },
    execute: (args) => fileOperations.writeFile(args["file"], args["text"]),
  },
  {
    command: "read_file",
    name: "Read file",
    arguments: {
      file: "file",
    },
    argumentsV2: {
      args: {
        file: { type: "string", description: "Name of the file to read" },
      },
      required: ["file"],
    },
    execute: (args) => fileOperations.readFile(args["file"]),
  },
  {
    command: "append_to_file",
    name: "Append to file",
    arguments: {
      file: "file",
      text: "text",
    },
    argumentsV2: {
      args: {
        file: {
          type: "string",
          description: "Name of previously created file to append to",
        },
        text: { type: "string", description: "Content to append to file" },
      },
      required: ["file", "text"],
    },
    execute: (args) => fileOperations.appendToFile(args["file"], args["text"]),
  },
  {
    command: "delete_file",
    name: "Delete file",
    arguments: {
      file: "file",
    },
    argumentsV2: {
      args: {
        file: { type: "string", description: "Name of file to delete" },
      },
      required: ["file"],
    },
    execute: (args) => fileOperations.deleteFile(args["file"]),
  },
];

export default FileOperationCommandPlugins;
