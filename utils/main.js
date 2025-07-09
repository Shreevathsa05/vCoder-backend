import ai from './ai.js';
import { functionDeclarations, handleToolCalls } from './tool.js';
import { FunctionCallingConfigMode, Type } from '@google/genai';

const systemInsPlanner = `
You are Avi, a structured AI planner. 
You are only frontend expert i.e html, css and js.
Who can develop any site using only these: html,css and js.

Work in phases: start ➝ plan ➝ action ➝ observe ➝ output.
- Only take **one step at a time**. Produce exactly one JSON object per response.
- Never call tools directly. Instead, output the required action in JSON schema.
- Think systematically and respond one step at a time.
`;

/**
 * Schema for Agent B (planner)
 */
export const agentResponseSchema = {
  type: Type.OBJECT,
  description: "Represents a single step in the AI agent's execution process.",
  properties: {
    step: {
      type: Type.STRING,
      enum: ["start", "plan", "action", "observe", "output"],
      description: "Phase of agent's execution"
    },
    content: {
      type: Type.STRING,
      description: "Step description, observation, or final output"
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
      required: []
    },
  },
  required: ["step", "content"]
};

export async function main(history) {
  const genAI = ai; // your imported Gemini client

  while (true) {
    // 👉 **Step 1: Agent B - Planner**
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
    console.log("Agent B:", stepJson);

    history.push({ role: "model", parts: [{ text: plannerResponse.text }] });

    // 👉 **Check step type**
    if (stepJson.step === "output") {
      console.log("✅ Final Output:", stepJson.content);
      break;
    }

    if (stepJson.step === "action") {
      // 👉 **Step 2: Agent A - Tool Executor**
      const toolCallPrompt = `Execute this action step:
      Function: ${stepJson.function}
      Input: ${JSON.stringify(stepJson.input)}`;

      const toolExecutorResponse = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: toolCallPrompt }] }],
        config: {
            systemInstruction:`
            You are only frontend expert i.e html, css and js.
            Who can develop any site using only these: html,css and js.
            
            🛠 **Available Tools:**

                1. **create_directory**
                   - **Description**: Creates a new directory in the system.
                   - **Parameters**:
                     - 'directory_name' (string): Name of the directory to create.

                2. **run_command**
                   - **Description**: Executes a shell command in the system and returns output or error.
                   - **Parameters**:
                     - 'command' (string): The shell command to execute.`,
          temperature: 0.1,
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.ANY,
            }
          },
          tools: [{ functionDeclarations }]
        }
      });

      const toolResult = toolExecutorResponse.candidates[0].content.parts[0];
      console.log("Agent A Tool Result:", toolResult);
      // 👉 Execute and await the tool call
      const executionResult = await handleToolCalls(toolResult.functionCall);

// 👉 Feed a proper observation back to the planner
      const observation = {
        step: "observe",
        // include both the original function call and its result
        content: JSON.stringify({
          functionCall: toolResult.functionCall,
          result: await executionResult
        })
      };

      history.push({
        role: "user",
        parts: [{ text: JSON.stringify(observation) }]
      });

    } else {
      continue;
    }

  }
}

// import ai from './ai.js';
// import { functionDeclarations, handleToolCalls } from './tool.js';
// // import { FunctionCallingConfigMode } from '@google/genai';
// import { Type } from '@google/genai';

// const systemIns = `


// You are Avi, an AI agent. 

// You work in phases: start ➝ plan ➝ action ➝ observe ➝ output.
// 🛑 **Rules:**
// - Work in distinct phases: start ➝ plan ➝ action ➝ observe ➝ output.
// - Only take **one step at a time**. **Produce exactly one JSON object per response.**
// - Always analyze the user's query carefully before acting.
// - Use available tools via their function calls when needed.
// - Wait for observation from tools before generating final outputs.
// - **Do not chain multiple steps in a single response.**

// 💡 **Phase descriptions:**
// - **start**: Acknowledge user query and prepare for planning.
// - **plan**: Think about step-by-step approach to fulfill the query.
// - **action**: Call a tool with the required input to perform the action.
// - **observe**: Note down the tool's output.
// - **output**: Provide the final answer to the user.

// 🛠 **Available Tools:**

// 1. **create_directory**
//    - **Description**: Creates a new directory in the system.
//    - **Parameters**:
//      - 'directory_name' (string): Name of the directory to create.

// 2. **run_command**
//    - **Description**: Executes a shell command in the system and returns output or error.
//    - **Parameters**:
//      - 'command' (string): The shell command to execute.

// - Always analyze the user's query carefully before acting.
// - Use available tools via their function calls when needed.
// - Wait for observation from tools before generating final outputs.


// 🧪 **Example Flow:**

// User: Create a directory called test_folder.

// {{"step": "start", "content": "User requested to create a directory named test_folder."}}
// {{"step": "plan", "content": "I will use create_directory to create test_folder."}}
// {{"step": "action", "function": "create_directory", "input": {"directory_name": "test_folder"}}}
// {{"step": "observe", "output": "✅ Directory 'test_folder' created."}}
// {{"step": "output", "content": "Directory 'test_folder' has been created successfully."}}


// Your outputs must follow this JSON structure:

// Output JSON Format:
//     {{
//         "step": "string",
//         "content": "string",
//         "function": "The name of function if the step is action",
//         "input": "The input parameter for the function",
//     }}

// Think systematically and respond one step at a time.

// `;

// export async function main(history) {
    
// //   while (true) {
//     try {
//         const response = await ai.models.generateContent({
//         model: "gemini-2.5-flash",
//         contents: history,
//         config: {
//             systemInstruction: systemIns,
//             temperature: 0.5,
//             toolConfig: {
//                     functionCallingConfig: {
//                         mode: "AUTO",
//                         // allowedFunctionNames: ['create_directory', 'run_command']
//                     }
//                 },
//             tools: [{ functionDeclarations }],
//         }
//     });

//     console.log(JSON.stringify(response));
//     const func = response.candidates[0].content.parts[0].functionCall;
//     await handleToolCalls(func);
//     } catch (error) {
//         console.log(error)
//     }
//     // }
// }

