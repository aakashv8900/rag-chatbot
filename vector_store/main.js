const fs = require('fs');
const { IndexFlatL2 } = require('faiss-node');
const path = require('path');

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
            this.data = JSON.parse(fs.readFileSync(resolvedPath, 'utf8')); // Read the file using the resolved path
            this.dimension = this.data[0]['vector'].length;
        } catch (error) {
            console.error("Error loading vector data:", error);
            throw error;
        }
    }

    createIndex() {
        try {
            this.index = new IndexFlatL2(this.dimension);
        const vectors = this.data.map(item => this.index.add(item.vector));
        } catch (error) {
            console.error("Error creating index:", error);
            throw error;
        }
    }

    queryVectorStore(queryVector, k = 3) {
        try {
            const { distances, labels } = this.index.search(queryVector, k);
            return labels.map(idx => new Mail(this.data[idx]['description'], this.data[idx]['filename']));
        } catch (error) {
            console.error("Error querying vector store:", error);
            throw error;
        }
    }
}

async function initializeVectorStore() {
    const vectorFilePath = path.join(__dirname, './vectors.json');
    try {
        await fs.promises.access(vectorFilePath); // Wait for the file access check
        const stats = await fs.promises.stat(vectorFilePath); // Wait for file stats retrieval
        if (stats.size > 0) {
            const vectorStore = new VectorStore(vectorFilePath);
            console.log("VectorStore initialized successfully.");
            return vectorStore;
        } else {
            console.error("Vector data file 'vectors.json' exists but is empty. Please check the file content.");
        }
    } catch (err) {
        console.error("Error accessing vector data file:", err);
        console.error("Vector data file 'vectors.json' does not exist. Please call setupDataAndVectorStoreOnce() first.");
    }
}


module.exports = { initializeVectorStore };