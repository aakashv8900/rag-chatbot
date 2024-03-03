const { setupDataAndVectorStore } = require('./vector_store/vector.js');
const { initializeVectorStore } = require('./vector_store/main.js'); // Import VectorStore class
const { ChatOpenAI } = require('@langchain/openai');
const { ConversationSummaryBufferMemory } = require('langchain/memory');
const { ConversationChain } = require('langchain/chains');
const { OpenAIEmbeddings } = require('@langchain/openai');
const {
    ChatPromptTemplate,
} = require('@langchain/core/prompts');
const path = require('path');
const fs = require('fs');

/**
 * Function to setup data and vector store.
 * This function should be called only once by the user.
 */
function setupDataAndVectorStoreOnce(filePaths, openAIApiKey) {
    setupDataAndVectorStore(filePaths, openAIApiKey);
}

/**
 * Function to query with conversation chain.
 * This function can be called multiple times by the user.
 * @param {string} userQuery - The query entered by the user.
 */
async function userQueryWithConversationChain(query, openAIApiKey, model, temperature, topK, prompt, maxMemoryToken) {
    try {
        let vectorStore = await initializeVectorStore()
        const llm = new ChatOpenAI({ temperature: temperature ? temperature : 0.7, model_name: model ? model : "gpt-4", openAIApiKey: openAIApiKey });
        const embeddings = new OpenAIEmbeddings({ openAIApiKey: openAIApiKey });
        let userVector = await embeddings.embedQuery(query);
        const expectedDimensions = vectorStore.dimension;
        if (userVector.length > expectedDimensions) {
            userVector = userVector.slice(0, expectedDimensions);
        } else if (userVector.length < expectedDimensions) {
            userVector = userVector.concat(Array(expectedDimensions - userVector.length).fill(0));
        }
        userVector = userVector.map(x => parseFloat(x));
        const docsAndScores = await vectorStore.queryVectorStore(userVector, topK ? topK : 3);
        const mostRelevantDoc = docsAndScores.map(hit => hit.page_content);
        const serializedDicts = Array.from(new Set(docsAndScores.map(hit => JSON.stringify(hit.metadata))));
        const metadata = serializedDicts.map(d => JSON.parse(d));
        const context = mostRelevantDoc.join(" ");
        const chatPrompt = ChatPromptTemplate.fromMessages([
            [
                "system",
                `You are a customer support chatbot which represents an agent. Use your knowledge base to best respond to customer's queries. Based on our knowledge base, particularly focusing on relevant information we found: '${context}'.`,
            ],
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
        return response['response'], metadata;
    } catch (error) {
        console.error("An error occurred during userQueryWithConversationChain:", error);
        throw error;
    }
}

module.exports = { userQueryWithConversationChain, setupDataAndVectorStoreOnce };