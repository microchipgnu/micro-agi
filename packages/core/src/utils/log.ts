export const log = (
  message: string,
  level: "info" | "warn" | "error" = "info"
): void => {
  switch (level) {
    case "info":
      console.info(message);
      break;
    case "warn":
      console.warn(message);
      break;
    case "error":
      console.error(message);
      break;
  }
};
