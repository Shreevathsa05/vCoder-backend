// /utils/main.js
import ai from './ai.js';
import { functionDeclarations, handleToolCalls } from './tool.js';
import { FunctionCallingConfigMode, Type } from '@google/genai';

// 📝 System instruction for Planner agent
const systemInsPlanner = `
You are Avi, a structured AI planner.
You are only a frontend expert (HTML, CSS, JS) who develops sites using only these.
Start by creating a folder named on the project.
Work in phases: start ➝ plan ➝ action ➝ observe ➝ output.
- Only take **one step at a time**. Produce exactly one JSON object per response.
- Never call tools directly. Instead, output the required action in JSON schema.
- Think systematically and respond one step at a time.
- If process has no content, retry it once before outputting failure.
The site created must be beautiful and colorful to attract the audience again and again.
`;

// Logging utility
function debugLog(...args) {
  if (process.env.DEBUG) console.log(...args);
}

// Agent response schema
export const agentResponseSchema = {
  type: Type.OBJECT,
  description: "Single step in the AI agent's execution process.",
  properties: {
    step: {
      type: Type.STRING,
      enum: ["start", "plan", "action", "code", "observe", "output"],
      description: "Phase of execution"
    },
    content: {
      type: Type.STRING,
      description: "Description, observation, or final output"
    },
    function: {
      type: Type.STRING,
      enum: ["create_directory", "run_command"],
      description: "Function to call if step is 'action'"
    },
    input: {
      type: Type.OBJECT,
      description: "Parameters for the function",
      properties: {
        directory_name: { type: Type.STRING },
        command: { type: Type.STRING },
      },
    },
  },
  required: ["step", "content"]
};

export async function main(history) {
  const genAI = ai; // imported Gemini client
  let iteration = 0;
  const MAX_ITERATIONS = 20;

  while (iteration < MAX_ITERATIONS) {
    iteration++;

    // Step 1: Planner
    const plannerResponse = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: history,
      config: {
        systemInstruction: systemInsPlanner,
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: agentResponseSchema
      }
    });

    const stepJson = JSON.parse(plannerResponse.text);
    debugLog("\n\n🗂️ Agent Planner:", stepJson);

    history.push({ role: "model", parts: [{ text: plannerResponse.text }] });

    // Exit if planner outputs final result
    if (stepJson.step === "output") {
      console.log("🎉 Final Output:", stepJson.content);
      break;
    }


    // 🔧 Execute action steps only
    if (stepJson.step === "action") {
      if (!stepJson.function || !stepJson.input) {
        console.error("❌ Invalid action step: Missing function or input");
        break;
      }

      const toolCallPrompt = `Execute this action step:
      Function: ${stepJson.function}
      Input: ${JSON.stringify(stepJson.input)}`;

      const toolExecutorResponse = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: toolCallPrompt }] }],
        config: {
          systemInstruction: `
            You are only a frontend expert (HTML, CSS, JS).
            Analyze the prompt and do accordingly.
            The site created must be beautiful and colorful to attract the audience again and again.

            🛠 **Available Tools:**
            1. create_directory - Creates a directory
            2. run_command - Executes a shell command
          `,
          temperature: 0.1,
          toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.ANY } },
          tools: [{ functionDeclarations }]
        }
      });

      const toolResult = toolExecutorResponse.candidates[0].content.parts[0];
      debugLog("\n\n🔧 Agent Tool:", toolResult);

      const executionResult = await handleToolCalls(toolResult.functionCall);

      // 📝 Feed observation back to planner
      const observation = {
        step: "observe",
        content: JSON.stringify({
          functionCall: toolResult.functionCall,
          result: executionResult
        })
      };

      history.push({ role: "user", parts: [{ text: JSON.stringify(observation) }] });
    }
  }

  if (iteration >= MAX_ITERATIONS) {
    console.error("⚠️ Planner exceeded max iterations. Exiting.");
  }
}
