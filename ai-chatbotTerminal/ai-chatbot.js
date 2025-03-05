const fs = require("fs");
const readline = require("readline");
const fetch = require("node-fetch");

// Replace with your actual API key
const API_KEY = "API key";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MEMORY_FILE = "messages.txt";

let context = [];

function loadHistory() {
  if (fs.existsSync(MEMORY_FILE)) {
    const data = fs.readFileSync(MEMORY_FILE, "utf-8");
    const lines = data.split("\n");

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("user: ")) {
        const userMessage = lines[i].substring(6);
        const aiMessage = lines[i + 1] ? lines[i + 1].substring(4) : "";
        context.push({ role: "user", content: userMessage });
        context.push({ role: "assistant", content: aiMessage });
      }
    }
  }
}

function saveHistory(userInput, aiResponse) {
  const history = `user: ${userInput}\nAI: ${aiResponse}\n`;
  fs.appendFile(MEMORY_FILE, history, (err) => {
    if (err) {
      console.error("Error saving conversation history:", err);
    } else {
      console.log("Message saved to file!");
    }
  });
}

async function getAIResponse(userInput) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [...context, { role: "user", content: userInput }],
      }),
    });

    const data = await response.json();
    if (data && data.choices && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      throw new Error("Unexpected API response format");
    }
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

(async function main() {
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("Welcome to your AI chatbot! Type 'exit' to quit.");
  loadHistory();
  console.log("Loaded previous history:", context);

  while (true) {
    await new Promise((resolve) => {
      readline.question("\nYou: ", async (userInput) => {
        if (userInput.toLowerCase() === "exit") {
          console.log("\nGoodbye! 👋");
          readline.close();
          process.exit(0);
        }

        const response = await getAIResponse(userInput);
        console.log("AI:", response);
        context.push({ role: "user", content: userInput });
        context.push({ role: "assistant", content: response });

        saveHistory(userInput, response);

        resolve();
      });
    });
  }
})();
