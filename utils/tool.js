// /utils/tool.js
import { execSync } from 'child_process';
import { Type } from '@google/genai';
import { mkdirSync, writeFileSync } from 'fs';

// ✅ Regex parser utility
function parseEchoCommand(command) {
  const match = command.match(/^echo\s+(['"`])([\s\S]*)\1\s*>\s*(.+)$/);
  if (!match) return null;

  let [, , rawContent, filePath] = match;

  // Convert literal \n to real newlines and unescape quotes
  rawContent = rawContent.replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\`/g, '`');

  return { content: rawContent, filePath };
}

export const functionDeclarations = [
  {
    name: "create_directory",
    description: "Creates a new directory",
    parameters: {
      type: Type.OBJECT,
      properties: {
        directory_name: { type: Type.STRING, description: "Directory name" }
      },
      required: ["directory_name"]
    }
  },
  {
    name: "run_command",
    description: "Executes a shell command and returns output or error",
    parameters: {
      type: Type.OBJECT,
      properties: {
        command: { type: Type.STRING, description: "Shell command" }
      },
      required: ["command"]
    }
  }
];

export async function handleToolCalls(func) {
  if (!func) {
    console.error("⚠️ No function call returned");
    return { success: false, error: "No function call returned" };
  }

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

  if (func.name === "run_command") {
    const { command } = func.args;

    // 📝 If it's an echo file write command
    const parsed = parseEchoCommand(command);
    if (parsed) {
      try {
        writeFileSync(parsed.filePath, parsed.content, 'utf8');
        console.log(`✅ Wrote file '${parsed.filePath}' with formatted content`);
        return { success: true, output: `File ${parsed.filePath} written` };
      } catch (error) {
        console.error(`❌ Error writing file ${parsed.filePath}: ${error.message}`);
        return { success: false, error: error.message };
      }
    }

    // 📝 Otherwise execute as normal shell command
    try {
      const output = execSync(command, { encoding: 'utf-8', shell: true });
      console.log(`✅ Command output:\n${output}`);
      return { success: true, output };
    } catch (error) {
      console.error(`❌ Error executing command: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  console.error(`⚠️ Unknown function ${func.name}`);
  return { success: false, error: `Unknown function ${func.name}` };
}
