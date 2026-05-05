import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import cors from "cors";
import path from "path";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.post("/api/generate", async (req, res) => {
    try {
      const { idea, duration, platform } = req.body;
      
      const promptText = `Write a ${duration} UGC (User Generated Content) video script for an AI avatar video for ${platform} based on this idea: "${idea}". 
If I provided images of a product or its sale page, act as an expert product researcher. Extract its features, potential use cases, target audience, and (if visible) price or selling points. Seamlessly weave these details into a compelling UGC script.

CRITICAL REQUIREMENT: The VERY LAST sentence of the full script and the final scene MUST end with exactly this text: "For more AI info and tips, and don't forget to subscribe and follow my channel."`;

      // We handle images in a real app, but for simplicity in this transition
      // we'll accept just the text in this route, unless we also parse the base64 images
      // sent from the frontend. We will accept parts array if provided.
      const contents = req.body.contents || [promptText];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          systemInstruction: 'You are an expert script writer and UGC video producer for social media AI avatars (like those generated in HeyGen). The user will provide an idea, specific platform guidelines, duration, and potentially images. You must generate 1) A full read-out-loud script. 2) A scene-by-scene breakdown splitting the script into segments. \nFor each scene in the breakdown, provide the spoken text AND specify ONLY the physical body movements, facial expressions, and gestures the avatar should make (e.g. "point forward", "nod head", "hands open", "smile"). Do NOT describe camera angles or B-roll for the avatar gestures.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: "object",
            properties: {
              title: { type: "string" },
              fullScript: { type: "string", description: "The complete script text to be pasted into the avatar text-to-speech engine." },
              scenes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    spokenText: { type: "string", description: "The segment of the script spoken in this scene." },
                    gesture: { type: "string", description: "Specific body movements, facial expressions, and gestures for the avatar." }
                  },
                  required: ["spokenText", "gesture"]
                }
              }
            },
            required: ["title", "fullScript", "scenes"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        return res.status(500).json({ error: "No response generated." });
      }

      res.status(200).json(JSON.parse(text));
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || "Something went wrong" });
    }
  });

  app.post("/api/generatePrompts", async (req, res) => {
    try {
      const { category } = req.body;
      
      const promptText = `Generate 10 highly detailed photography and videography prompts for the category "${category}". 
They should be similar in style to these examples:
- "Cinematic widescreen crop, teal and orange grade, Red lingerie set on black silk sheets, lying on stomach, chin on hands, playful expression, string lights bokeh background"
- "Magazine-quality, retouched skin, commercial lighting, Runway-inspired look, floor length satin gown in emerald, dramatic train, marble staircase, old money aesthetic"
- "Film photography aesthetic, visible grain, Corporate headshot, navy blazer, white background, approachable smile, professional hair and makeup, studio softbox, Sigma 35mm f/1.4 Art, wide open bokeh, dappled light through leaves"

Make sure to include details such as lighting, camera model, lens, aesthetic, mood, and color grading. Output strictly as a JSON array of 10 strings.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: "array",
            items: {
              type: "string"
            }
          }
        }
      });

      const text = response.text;
      if (!text) {
        return res.status(500).json({ error: "No response generated." });
      }

      res.status(200).json({ prompts: JSON.parse(text) });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || "Something went wrong" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
