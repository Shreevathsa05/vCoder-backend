import { execSync } from 'child_process';
import { Type } from '@google/genai';
import { mkdirSync, writeFileSync } from 'fs';


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
  console.log("\n\nInside handle tools\n\n");
  if (!func) {
    const msg = "No function call returned";
    console.log(`⚠️ ${msg}`);
    return { success: false, error: msg };
  }

  // 1) Directory creation
  if (func.name === "create_directory") {
    const { directory_name } = func.args;
    try {
      mkdirSync(directory_name, { recursive: true });
      console.log(`✅ Directory '${directory_name}' created.`);
      return { success: true, directory: directory_name };
    } catch (error) {
      console.error(`❌ Error creating directory: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // 2) File creation / arbitrary shell commands
  else if (func.name === "run_command") {
    const { command } = func.args;

    // If this is a “write HTML/CSS/JS to a file” command,
    // detect it and use fs.writeFileSync instead of echo+redirect:
    const writeMatch = command.match(/^echo\s+'([\s\S]*)'\s+>\s+(.+)$/);
    if (writeMatch) {
      const [, content, filePath] = writeMatch;
      try {
        writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Wrote file '${filePath}' via fs.writeFileSync`);
        return { success: true, output: `File ${filePath} written` };
      } catch (error) {
        console.error(`❌ Error writing file ${filePath}: ${error.message}`);
        return { success: false, error: error.message };
      }
    }

    // Otherwise fall back to real shell execution
    try {
      const output = execSync(command, { encoding: 'utf-8', shell: true });
      console.log(`✅ Command output:\n${output}`);
      return { success: true, output };
    } catch (error) {
      console.error(`❌ Error executing command: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  else {
    const msg = `Unknown function ${func.name}`;
    console.log(`⚠️ ${msg}`);
    return { success: false, error: msg };
  }
}

// export async function handleToolCalls(func) {
//   console.log("\n\nInside handle tools \n\n");
//   if (!func) {
//     console.log("⚠️ No function call returned.");
//     return;
//   }

//   if (func.name === "create_directory") {
//     const { directory_name } = func.args;
//     try {
//       execSync(`mkdir ${directory_name}`);
//       console.log(`✅ Directory '${directory_name}' created.`);
//     } catch (error) {
//       console.error(`❌ Error creating directory: ${error.message}`);
//     }
//   }

//   else if (func.name === "run_command") {
//     const { command } = func.args;
//     try {
//       const output = execSync(command, { encoding: 'utf-8' });
//       console.log(`✅ Command output:\n${output}`);
//     } catch (error) {
//       console.error(`❌ Error executing command: ${error.message}`);
//     }
//   }
// }
