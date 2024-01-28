import { arrayBufferToBase64 } from "./array-buffer-to-base64.js";

interface Props {
  url: string;
  useFetch?: boolean;
}

export async function LlavaImage({ url, useFetch = false }: Props) {
  if (!useFetch && !url.startsWith("http")) {
    const fs = await import("fs/promises");

    return await fs.readFile(url, { encoding: "base64" });
  } else {
    // @ts-ignore: todo fix later
    const response = await fetch(url);
    return arrayBufferToBase64(await response.arrayBuffer());
  }
}
