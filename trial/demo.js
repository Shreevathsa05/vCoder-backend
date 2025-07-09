import dotenv from 'dotenv'
import { execSync } from 'child_process'
import { GoogleGenAI, FunctionCallingConfigMode, Type } from '@google/genai'

dotenv.config()

// Initialize GoogleGenAI with API key (no Vertex auth)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY })

// Define tools (function declarations)
const functionDeclarations = [
  {
    name: "create_directory",
    description: "Creates a new directory in the system",
    parameters: {
      type: Type.OBJECT,
      properties: {
        directory_name: {
          type: Type.STRING,
          description: "Name of the directory to create"
        }
      },
      required: ["directory_name"]
    }
  },
  {
    name: "run_command",
    description: "Executes a shell command in the system and returns the output or error",
    parameters: {
      type: Type.OBJECT,
      properties: {
        command: {
          type: Type.STRING,
          description: "The shell command to execute"
        }
      },
      required: ["command"]
    }
  }
]

// Handle tool calls automatically
async function handleToolCalls(func) {
  console.log("\n\nInside handle tools \n\n")
  if (!func) {
    console.log("⚠️ No function call returned.");
    return;
  }

  // Tool 1: create_directory
  if (func.name === "create_directory") {
    const { directory_name } = func.args;
    try {
      execSync(`mkdir ${directory_name}`);
      console.log(`✅ Directory '${directory_name}' created.`);
    } catch (error) {
      console.error(`❌ Error creating directory: ${error.message}`);
    }
  }

  // Tool 2: run_command
  else if (func.name === "run_command") {
    const { command } = func.args;
    try {
      const output = execSync(command, { encoding: 'utf-8' });
      console.log(`✅ Command output:\n${output}`);
    } catch (error) {
      console.error(`❌ Error executing command: ${error.message}`);
    }
  }
}


async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash", // or your available gemini-2.5-flash model
    contents: [
      { role: "user", parts: [{ text: "get info in utils/function.js " }] }
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
  })

  console.log(JSON.stringify( await response))
  const func =  await response.candidates[0].content.parts[0].functionCall
  await handleToolCalls(func);
}

await main()