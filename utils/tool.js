import { execSync } from 'child_process';
import { Type } from '@google/genai';

export const functionDeclarations = [
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
];

export async function handleToolCalls(func) {
  console.log("\n\nInside handle tools \n\n");
  if (!func) {
    console.log("⚠️ No function call returned.");
    return;
  }

  if (func.name === "create_directory") {
    const { directory_name } = func.args;
    try {
      execSync(`mkdir ${directory_name}`);
      console.log(`✅ Directory '${directory_name}' created.`);
    } catch (error) {
      console.error(`❌ Error creating directory: ${error.message}`);
    }
  }

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
