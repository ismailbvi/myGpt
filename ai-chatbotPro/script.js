const API_KEY = ""; // Replace with your actual API key
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

document.getElementById("send-btn").addEventListener("click", sendMessage);
document
  .getElementById("user-input")
  .addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      sendMessage();
    }
  });

async function sendMessage() {
  const userInput = document.getElementById("user-input").value;
  if (!userInput.trim()) return;

  // Display user message
  appendMessage("You", userInput);
  document.getElementById("user-input").value = "";

  // Fetch AI response
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: userInput }],
      }),
    });

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error(data.error?.message || "Unexpected API response");
    }

    // Display AI response
    appendMessage("AI", data.choices[0].message.content);
  } catch (error) {
    appendMessage("AI", `Error: ${error.message}`);
  }
}

function appendMessage(sender, text) {
  const chatBox = document.getElementById("chat-box");
  const messageDiv = document.createElement("div");
  messageDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
  messageDiv.style.padding = "5px";
  chatBox.appendChild(messageDiv);

  // Auto-scroll to the latest message
  chatBox.scrollTop = chatBox.scrollHeight;
}
