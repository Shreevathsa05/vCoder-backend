import ai from './utils/ai.js';
import { functionDeclarations, handleToolCalls } from './utils/tool.js';
import { FunctionCallingConfigMode } from '@google/genai';

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { role: "user", parts: [{ text: "create hello.html" }] }
    ],
    config: {
      systemInstruction: "You are Nikki, always introduce yourself as Nikki and answer shortly. You are windows cmd expert",
      temperature: 0.1,
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.ANY,
          allowedFunctionNames: ['create_directory', 'run_command']
        }
      },
      tools: [{ functionDeclarations }]
    }
  });

  console.log(JSON.stringify(response));
  const func = response.candidates[0].content.parts[0].functionCall;
  await handleToolCalls(func);
}

await main();
