<h1>RAG Chatbot</h1>

<p>
  <img src="https://img.shields.io/npm/v/rag-chatbot.svg" alt="Version">
  <img src="https://img.shields.io/npm/l/rag-chatbot.svg" alt="License">
</p>

<p>RAG Chatbot is a customizable chatbot package powered by OpenAI's Langchain vector embeddings. It enables developers to easily integrate a sophisticated conversational AI Assistant in the backend into their applications.</p>

<h2>Features</h2>

<ul>
  <li><strong>Customizable:</strong> Tailor the chatbot's responses and behaviour to suit your application's needs by providing it with your knowledge base in Docx or Txt format.</li>
  <li><strong>Powered by Langchain Vector Embeddings:</strong> Benefit from state-of-the-art language understanding and generation capabilities.</li>
  <li><strong>Easy Integration:</strong> Simple npm installation and usage.</li>
  <li><strong>Scalable:</strong> Designed to handle varying levels of user interactions efficiently.</li>
</ul>

<h2>Installation</h2>

<p>You can install RAG Chatbot via npm:</p>

<pre><code>npm install rag-chatbot
</code></pre>

<h2>Usage</h2>

<p>To use RAG Chatbot in your project, follow these steps:</p>

<ol>
  <li><strong>Import the module setupDataAndVectorStoreOnce for creating a vector store (Do this whenever your knowledge base is modified):</strong></li>
  <pre><code>
    const setupDataAndVectorStoreOnce = require('rag-chatbot');
    const filePaths = ['./demo.txt','./demo.docx'];
    setupDataAndVectorStoreOnce(filePaths,openAiKey);
  </code></pre>
  
  <li><strong>Once you create your vector store, initialize the module userQueryWithConversationChain and integrate it in your chatbot and pass the user's query and openaikey for it to answer user's query from it's knowledge base automatically.</strong></li>
  <pre><code>
    const userQueryWithConversationChain = require('rag-chatbot');
    const result = userQueryWithConversationChain(query, openAIApiKey);
    console.log(result.response, result.metadata);
  </code></pre>
  
  <li><strong>You can customize the userQueryWithConversationChain module for more accuracy according to your vector store and use case.</strong></li>
  <pre><code>
    const userQueryWithConversationChain = require('rag-chatbot');
    const result = userQueryWithConversationChain(query, openAIApiKey, model, temperature, topK, prompt, maxMemoryToken);
    console.log(result.response, result.metadata);
  </code></pre>
</ol>

<h2>Configuration Options</h2>

<p>Here are the available configuration options:</p>

<ul>
  <li><strong>apiKey:</strong> Your OpenAI API key (required).</li>
  <li><strong>model:</strong> The model to use for generating responses (default: "gpt-4").</li>
  <li><strong>temperature:</strong> Sampling temperature for response generation (default: 0.7).</li>
  <li><strong>topK:</strong> Maximum number of tokens to generate for each response (default: 3).</li>
  <li><strong>prompt:</strong> The prompt to provide a customize prompt to llm.</li>
  <li><strong>maxMemroyToken:</strong> Maximum number of tokens to keep the contextual memory of the llm (default: 10).</li>
</ul>

<h2>License</h2>

<p>This project is licensed under the MIT License - see the <a href="LICENSE">LICENSE</a> file for details.</p>
