const fs = require('fs');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { writeFile } = require('fs').promises;
const path = require('path');
const mammoth = require("mammoth");

async function loadFilesFromText(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const formattedText = fileContent.replace(/(\r\n|\n|\r)/gm, " ");
        return formattedText;
    } catch (error) {
        console.error("Error reading the text file:", error);
        throw error;
    }
}

async function loadFilesFromDocx(filePath) {
    try {
        const fileContent = await fs.promises.readFile(filePath);
        const result = await mammoth.extractRawText({ buffer: fileContent });
        return result.value.trim();
    } catch (error) {
        console.error("Error reading or parsing the .docx file:", error);
        throw error;
    }
}

class Mail {
    constructor(pageContent, metadata = {}) {
        this.pageContent = pageContent;
        this.metadata = metadata;
    }
}

class CharacterTextSplitter {
    constructor(chunkSize, chunkOverlap) {
        this.chunkSize = chunkSize;
        this.chunkOverlap = chunkOverlap;
    }

    splitDocuments(documents) {
        let splitTexts = [];
        for (let doc of documents) {
            let text = doc.pageContent;
            for (let i = 0; i < text.length; i += this.chunkSize - this.chunkOverlap) {
                let chunk = text.substring(i, i + this.chunkSize);
                splitTexts.push(new Mail(chunk, { filename: doc.metadata.filename }));
            }
        }
        return splitTexts;
    }
}

function getFilename(filePath) {
    return path.basename(filePath); // Use path.basename() to get the filename
}

async function setupDataAndVectorStore(filePaths, openAIApiKey) {
    try {
        const texts = [];
        await Promise.all(filePaths.map(async filePath => {
            const extension = path.extname(filePath); // Use path.extname() to get the file extension
            if (extension === '.docx') { // Compare with '.docx' instead of 'docx'
                const text = await loadFilesFromDocx(filePath);
                texts.push(new Mail(text, { filename: getFilename(filePath) }));
            } else if (extension === '.txt') { // Compare with '.txt' instead of 'txt'
                const text = await loadFilesFromText(filePath);
                texts.push(new Mail(text, { filename: getFilename(filePath) }));
            } else {
                console.log(filePath + ' has an unsupported extension.');
            }
        }));
        const textSplitter = new CharacterTextSplitter(1000, 200);
        const splitTexts = textSplitter.splitDocuments(texts);
        const embeddingsModel = new OpenAIEmbeddings({ openAIApiKey: openAIApiKey });
        const embeddings = await embeddingsModel.embedDocuments(splitTexts.map(item => item.pageContent));
        const embeddingsWithFilenames = embeddings.map((embedding, index) => ({
            vector: embedding,
            description: splitTexts[index].pageContent,
            filename: splitTexts[index].metadata
        }));
        await writeFile(path.join(__dirname, 'vectors.json'), JSON.stringify(embeddingsWithFilenames, null, 2));
        console.log(`Embeddings saved to vector.json`);
    } catch (error) {
        console.error("An error occurred during setupDataAndVectorStore:", error);
        throw error;
    }
}

module.exports = { setupDataAndVectorStore };