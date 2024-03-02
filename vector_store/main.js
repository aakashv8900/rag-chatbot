const { readFileSync } = require('fs');
const { IndexFlatL2, float32 } = require('faiss-node');
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

module.exports = { VectorStore };