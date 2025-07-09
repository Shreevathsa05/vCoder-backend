# vcoder-cli

⚡ **vcoder-cli** is an AI-powered CLI tool to build websites directly into your desired folder with a simple command.

---

## 🚀 Features

- Build websites from natural language descriptions
- Generate clean HTML, CSS, JS files in your specified directory
- Uses Gemini AI for code generation
- Simple CLI usage via npx or global install

---

## 📦 Installation

### Using npx 
#### IMPORTANT  Do not skip
```
export API_KEY="YOUR_API_KEY"

```
- Get your first website built in seconds
```bash
npx vcoder-cli --folder ./ --description "Build a Stylish Todo App with array CRUD"

## OR

npx vcoder-cli --folder {folder_location} --description { Idea of a website }
```
- For using it globally around your directories
```bash
npm install -g vcoder-cli
```
```bash
vcoder-cli --folder ./ --description "Build a SaaS landing page"
```
| Option          | Description                        | Required |
| --------------- | ---------------------------------- | -------- |
| `--folder`      | Folder location to build website   | ✅ Yes    |
| `--description` | Description of website to generate | ✅ Yes    |


## 🔧 Development

Clone the repo:
```
git clone https://github.com/Shreevathsa05/vCoder-cli.git
cd vCoder-backend
```

## 🌐 Repository
```
https://github.com/Shreevathsa05/vCoder-cli.git
```


Made by Shreevathsa05

Contact- bhatshreevathsa17@gmail.com