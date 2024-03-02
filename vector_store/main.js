import { readFileSync } from 'fs';
import { IndexFlatL2, float32 } from 'faiss';
import { ChatOpenAI } from "@langchain/openai";
import { ConversationSummaryBufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { OpenAIEmbeddings } from "@langchain/openai";
import {
    ChatPromptTemplate,
    MessagesPlaceholder,
} from "@langchain/core/prompts";
import path from "path"; // Import the path module

class Mail {
    constructor(page_content, metadata = {}) {
        this.page_content = page_content;
        this.metadata = metadata;
    }

    toDict() {
        return {
            page_content: this.page_content,
            metadata: this.metadata,
        };
    }
}

class VectorStore {
    constructor(jsonPath) {
        this.index = null;
        this.data = null;
        this.dimension = 0;
        this.loadData(jsonPath);
        this.createIndex();
    }

    loadData(jsonPath) {
        try {
            const resolvedPath = path.resolve(__dirname, jsonPath); // Resolve the JSON path
            this.data = JSON.parse(readFileSync(resolvedPath, 'utf8')); // Read the file using the resolved path
            this.dimension = this.data[0]['vector'].length;
        } catch (error) {
            console.error("Error loading vector data:", error);
            throw error;
        }
    }

    createIndex() {
        try {
            this.index = new IndexFlatL2(this.dimension);
            const vectors = this.data.map(item => item['vector']);
            this.index.add(float32(vectors.flat()));
        } catch (error) {
            console.error("Error creating index:", error);
            throw error;
        }
    }

    queryVectorStore(queryVector, k = 3) {
        try {
            queryVector = float32(queryVector.flat());
            const { distances, indices } = this.index.search(queryVector, k);
            console.log(distances, indices);
            return indices.flat().map(idx => new Mail(this.data[idx]['description'], this.data[idx]['metadata']));
        } catch (error) {
            console.error("Error querying vector store:", error);
            throw error;
        }
    }
}

const vectorStore = new VectorStore('./vector.json');

export async function queryWithConversationChain(query, model, temperature, topK, prompt, maxMemoryToken, openAIApiKey) {
    try {
        const llm = new ChatOpenAI({ temperature: temperature ? temperature : 0.7, model_name: model ? model : "gpt-4" });
        const embeddings = new OpenAIEmbeddings({ openAIApiKey: openAIApiKey });
        let userVector = embeddings.embedQuery(query);
        const expectedDimensions = vectorStore.dimension;
        if (userVector.length > expectedDimensions) {
            userVector = userVector.slice(0, expectedDimensions);
        } else if (userVector.length < expectedDimensions) {
            userVector = userVector.concat(Array(expectedDimensions - userVector.length).fill(0));
        }
        userVector = userVector.map(x => parseFloat(x));
        const search_data = [userVector];
        const docsAndScores = vectorStore.queryVectorStore(search_data, topK ? topK : 3);
        const mostRelevantDoc = docsAndScores.map(hit => hit.page_content);
        const serializedDicts = Array.from(new Set(docsAndScores.map(hit => JSON.stringify(hit.metadata))));
        const metadata = serializedDicts.map(d => JSON.parse(d));
        const context = mostRelevantDoc.join(" ");
        const chatPrompt = ChatPromptTemplate.fromMessages([
            [
                "system",
                `You are a customer support chatbot which represents an agent. Use your knowledge base to best respond to customer's queries. Based on our knowledge base, particularly focusing on relevant information we found: '${context}'.`,
            ],
            new MessagesPlaceholder("history"),
            ["human", "{input}"],
        ]);
        const memory = new ConversationSummaryBufferMemory({
            llm: llm,
            maxTokenLimit: maxMemoryToken ? maxMemoryToken : 10,
        });
        const conversation = new ConversationChain({ llm, verbose: true, memory: memory, prompt: prompt ? prompt : chatPrompt });
        const response = await conversation.call({
            input: query,
        });
        return [response['response'], metadata];
    } catch (error) {
        console.error("An error occurred during queryWithConversationChain:", error);
        throw error;
    }
}