const fs = require("fs");
const readline = require("readline");
const fetch = require("node-fetch");

const API_KEY = "";  // Set your API key here
const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MEMORY_FILE = "messages.txt";

let context = [];
let selectedModel = "llama3-8b-8192";
let personalityMode = "casual";

const models = [
  "llama3-8b-8192",
  "gpt-3.5-turbo",
  "gpt-4",
  "davinci-codex",
  "curie",
];

const personalityDescriptions = {
  casual:
    "You are friendly, relaxed, and informal. You speak in a casual tone.",
  formal:
    "You are polite, respectful, and formal. Your tone is professional and courteous.",
  humorous:
    "You are witty, funny, and always looking for a chance to make someone laugh.",
  empathetic:
    "You are compassionate and understanding, always ready to listen and provide emotional support.",
  philosophical:
    "You are deep, thoughtful, and reflective. You enjoy pondering the bigger questions of life.",
  playful:
    "You are lighthearted, mischievous, and full of energy. You enjoy making jokes and having fun.",
  flirtatious:
    "You are confident, charming, and know how to give a compliment. You make others feel special with a seductive and flirty tone.",
};

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
      console.error("Error saving conversation:", err);
    } else {
      console.log("You:");
    }
  });
}

async function getAIResponse(userInput) {
  try {
    const systemMessage =
      personalityDescriptions[personalityMode] ||
      personalityDescriptions["casual"];

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: systemMessage },
          ...context,
          { role: "user", content: userInput },
        ],
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

async function selectModelAndPersonality() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      "\nChoose an AI model:\n1. llama3-8b-8192\n2. gpt-3.5-turbo\n3. gpt-4\n4. davinci-codex\n5. curie\nEnter the number of your choice (1-5): ",
      (modelChoice) => {
        const modelIndex = parseInt(modelChoice) - 1;
        selectedModel = models[modelIndex] || models[0];

        rl.question(
          "\nChoose a personality:\n1. Casual\n2. Formal\n3. Humorous\n4. Empathetic\n5. Philosophical\n6. Playful\n7. Flirtatious\nEnter the number of your choice: ",
          (personalityChoice) => {
            switch (personalityChoice) {
              case "1":
                personalityMode = "casual";
                break;
              case "2":
                personalityMode = "formal";
                break;
              case "3":
                personalityMode = "humorous";
                break;
              case "4":
                personalityMode = "empathetic";
                break;
              case "5":
                personalityMode = "philosophical";
                break;
              case "6":
                personalityMode = "playful";
                break;
              case "7":
                personalityMode = "flirtatious";
                break;
              default:
                personalityMode = "casual";
            }
            console.log(
              `You selected model: ${selectedModel}, Personality: ${personalityMode}`
            );
            rl.close();
            resolve();
          }
        );
      }
    );
  });
}

async function main() {
  console.log("Welcome to your customizable AI chatbot!");

  await selectModelAndPersonality();

  console.log("Chatbot ready! Type 'exit' to quit.");

  loadHistory();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on("line", async (userInput) => {
    if (userInput.toLowerCase() === "exit") {
      console.log("\nGoodbye! 👋");
      rl.close();
      process.exit(0);
    }

    const response = await getAIResponse(userInput);
    console.log(`Luna: ${response}`);

    context.push({ role: "user", content: userInput });
    context.push({ role: "assistant", content: response });
    saveHistory(userInput, response);
  });
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
