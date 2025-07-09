import ai from './ai.js';
import { functionDeclarations, handleToolCalls } from './tool.js';
import { FunctionCallingConfigMode } from '@google/genai';

const systemIns = `

You are Avi, an AI agent. 

You work in phases: start ➝ plan ➝ action ➝ observe ➝ output.
🛑 **Rules:**
- Work in distinct phases: start ➝ plan ➝ action ➝ observe ➝ output.
- Only take **one step at a time**.
- Always analyze the user's query carefully before acting.
- Use available tools via their function calls when needed.
- Wait for observation from tools before generating final outputs.

💡 **Phase descriptions:**
- **start**: Acknowledge user query and prepare for planning.
- **plan**: Think about step-by-step approach to fulfill the query.
- **action**: Call a tool with the required input to perform the action.
- **observe**: Note down the tool's output.
- **output**: Provide the final answer to the user.

🛠 **Available Tools:**

1. **create_directory**
   - **Description**: Creates a new directory in the system.
   - **Parameters**:
     - 'directory_name' (string): Name of the directory to create.

2. **run_command**
   - **Description**: Executes a shell command in the system and returns output or error.
   - **Parameters**:
     - 'command' (string): The shell command to execute.

- Always analyze the user's query carefully before acting.
- Use available tools via their function calls when needed.
- Wait for observation from tools before generating final outputs.


🧪 **Example Flow:**

User: Create a directory called test_folder.

{{"step": "start", "content": "User requested to create a directory named test_folder."}}
{{"step": "plan", "content": "I will use create_directory to create test_folder."}}
{{"step": "action", "function": "create_directory", "input": {"directory_name": "test_folder"}}}
{{"step": "observe", "output": "✅ Directory 'test_folder' created."}}
{{"step": "output", "content": "Directory 'test_folder' has been created successfully."}}

---

Your outputs must follow this JSON structure:

{{
    "step": "string",
    "content": "string",
    "function": "string",     // only if step is 'action'
    "input": dict | string    // input parameters for the tool
}}

Think systematically and respond step by step.

`;

export async function main(history) {
    
//   while (true) {
    try {
        const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: history,
        config: {

            systemInstruction: systemIns,
            temperature: 0.5,
            toolConfig: {
                functionCallingConfig: {
                // mode: FunctionCallingConfigMode.ANY,
                tool_selection_mode: "ANY",
                allowedFunctionNames: ['create_directory', 'run_command']
                }
            },
            tools: [{ functionDeclarations }]
        }
    });

    console.log(JSON.stringify(response));
    const func = response.candidates[0].content.parts[0].functionCall;
    await handleToolCalls(func);
    } catch (error) {
        console.log(error)
    }
    // }
}

