export const success = (text) => ({
    content: [
      {
        type: "text",
        text,
      },
    ],
  });
  
  export const error = (message) => ({
    content: [
      {
        type: "text",
        text: `Error: ${message}`,
      },
    ],
  });