// backend/controllers/widget.controller.js
import Groq from "groq-sdk";

export const handleBotQuery = async (req, res) => {
  try {
    // 1. Initialize Groq inside the function to avoid startup errors
    // Make sure GROQ_API_KEY is in your .env file
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // 2. Get the message from the frontend
    // Your ChatWidget.jsx sends: JSON.stringify({ message: messageText })
    const { message } = req.body;
    
    // Default fallback
    let botResponse = "I'm not sure about that. Please select one of the options below.";

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    // 3. AI Logic
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a helpful assistant for IVGJobs, a retired job portal. Your goal is to help retirees find jobs, navigate the site, and understand employer plans. Keep answers concise, professional, and friendly." 
        },
        { role: "user", content: message }
      ],
      model: "llama-3.3-70b-versatile",
    });

    botResponse = chatCompletion.choices[0]?.message?.content || botResponse;

    // 4. Return response
    // We use the key 'response' to match your previous controller structure
    res.status(200).json({ response: botResponse });

  } catch (error) {
    console.error("Widget Bot Error:", error);
    res.status(500).json({ error: "Service unavailable" });
  }
};