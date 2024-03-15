import { config } from "dotenv";
config();

import { OpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import express from 'express';
import cors from 'cors';
import path from 'path'; // Agregado para manejar las rutas de archivos
import fs from 'fs'; // Agregado para leer archivos
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 3000;

const parser = StructuredOutputParser.fromNamesAndDescriptions({
  answer: "answer to the user's question",
});
const formatInstructions = parser.getFormatInstructions();

const prompt = new PromptTemplate({
  template:
    "Behave as a storyteller, every question you receive must be turned into a magical tale\n{format_instructions}\n Question: {question}",
  inputVariables: ["question"],
  partialVariables: { format_instructions: formatInstructions },
});

const model = new OpenAI({ temperature: 0.8 });

// Ruta GET para servir el archivo HTML
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'index.html'); // Reemplaza 'index.html' con el nombre de tu archivo HTML
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(data);
  });
});

app.post('/ask', async (req, res) => {
  try {
    const question = req.body.question;
    if (!question) {
      return res.status(400).json({ error: 'Se requiere una pregunta en el cuerpo de la solicitud' });
    }

    const input = await prompt.format({ question });
    const response = await model.invoke(input);
    const parsedResponse = await parser.parse(response);

    res.json({ answer: parsedResponse.answer });
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor en ejecución en http://localhost:${PORT}`);
});
