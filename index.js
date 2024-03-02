const { setupDataAndVectorStore } = require('./vector_store/vector.js');
const { VectorStore } = require('./vector_store/main.js'); // Import VectorStore class
const { ChatOpenAI } = require('@langchain/openai');
const { ConversationSummaryBufferMemory } = require('langchain/memory');
const { ConversationChain } = require('langchain/chains');
const { OpenAIEmbeddings } = require('@langchain/openai');
const {
    ChatPromptTemplate,
    MessagesPlaceholder,
} = require('@langchain/core/prompts');
const path = require('path');

let vectorStoreSetup = false;

/**
 * Function to setup data and vector store.
 * This function should be called only once by the user.
 */
function setupDataAndVectorStoreOnce(filePaths, openAIApiKey) {
    setupDataAndVectorStore(filePaths, openAIApiKey);
    vectorStoreSetup = true;
}

/**
 * Function to query with conversation chain.
 * This function can be called multiple times by the user.
 * @param {string} userQuery - The query entered by the user.
 */
async function userQueryWithConversationChain(query, model, temperature, topK, prompt, maxMemoryToken, openAIApiKey) {
    console.log("here")
    if (!vectorStoreSetup) {
        console.error("Vector store is not set up. Please call setupDataAndVectorStoreOnce() first.");
        return;
    }
    try {
        let vectorStore;
        if (fs.existsSync(path.join(__dirname, './vector_store/vector.json'))) {
            vectorStore = new VectorStore(path.join(__dirname, './vector_store/vector.json')); // Initialize VectorStore
        } else {
            console.error("Vector data file 'vector.json' does not exist. Please call setupDataAndVectorStoreOnce() first.");
            return;
        }
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
        console.error("An error occurred during userQueryWithConversationChain:", error);
        throw error;
    }
}

module.exports = { userQueryWithConversationChain, setupDataAndVectorStoreOnce };