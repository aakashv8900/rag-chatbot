import { setupDataAndVectorStore } from "./vector_store/vector.js";
import { queryWithConversationChain } from "./vector_store/main.js";

let vectorStoreSetup = false;

/**
 * Function to setup data and vector store.
 * This function should be called only once by the user.
 */
export function setupDataAndVectorStoreOnce(filePaths, openAIApiKey) {
    if (!vectorStoreSetup) {
        setupDataAndVectorStore(filePaths, openAIApiKey);
        vectorStoreSetup = true;
    } else {
        console.warn("Vector store is already set up.");
    }
}

/**
 * Function to query with conversation chain.
 * This function can be called multiple times by the user.
 * @param {string} userQuery - The query entered by the user.
 */
export function userQueryWithConversationChain(query, model, temperature, topK, prompt, maxMemoryToken, openAIApiKey) {
    if (!vectorStoreSetup) {
        console.error("Vector store is not set up. Please call setupDataAndVectorStoreOnce() first.");
        return;
    }
    return queryWithConversationChain(query, model, temperature, topK, prompt, maxMemoryToken, openAIApiKey);
}
