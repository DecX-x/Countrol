// src/agent.ts
import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage, HumanMessage, AIMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { config } from "dotenv";
import {
  createTransactionTool,
  readTransactionsTool,
  updateTransactionTool,
  deleteTransactionTool,
} from "./tools/financeTools"; // Pastikan path benar
import { MemorySaver } from "@langchain/langgraph";

config(); // Memuat variabel lingkungan dari file .env
const apikey = process.env.API_KEY;

// 0. Inisialisasi LLM (Ganti dengan model dan API key Anda)
const llm = new ChatOpenAI({
  model: "qwen-turbo",
  apiKey: apikey,
  temperature: 0.7,
  configuration: {
    baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
  }
});

// Multimodal LLM untuk pemrosesan gambar
const multimodalLLM = new ChatOpenAI({
  model: "qwen-vl-plus-latest",
  apiKey: apikey,
  temperature: 0.7,
  configuration: {
    baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
  }
});

// Add conversation memory
const memory = new MemorySaver();

// 1. Fungsi untuk memanggil LLM (Agent Node)
// Fungsi ini akan memutuskan apakah akan memanggil tool atau merespons pengguna
async function callModel(state: typeof StateAnnotation.State): Promise<Partial<typeof StateAnnotation.State>> {
  const { messages, userId, hasImage, imageData } = state;
  if (!userId) {
    // Ini seharusnya tidak terjadi jika state diinisialisasi dengan benar
    return { messages: [new AIMessage("Error: User ID is not set in the agent state.")] };
  }
  
  // Check if we've been stuck in a loop - if last few messages are AI with tools and tool responses
  const lastFewMessages = messages.slice(-6); // Look at last 6 messages
  const aiToolCallCount = lastFewMessages.filter(m => 
    m instanceof AIMessage && m.tool_calls && m.tool_calls.length > 0
  ).length;
  
  if (aiToolCallCount >= 3) {
    console.log("WARNING: Detected potential infinite loop, providing final response");
    return { 
      messages: [new AIMessage("Maaf, terjadi masalah teknis saat memproses permintaan Anda. Silakan coba lagi dengan perintah yang lebih spesifik.")] 
    };
  }
  // Cek apakah ini adalah proses multimodal (ada gambar)
  const isMultimodalProcess = hasImage && imageData;
    // Cek apakah ada analisis gambar sebelumnya yang belum dieksekusi
  const hasImageAnalysis = messages.some(m => 
    m instanceof AIMessage && 
    m.content && 
    typeof m.content === 'string' && 
    (m.content.includes('Tanggal Transaksi:') || 
     m.content.includes('Jumlah:') || 
     m.content.includes('Kategori:') ||
     m.content.includes('detail transaksi') ||
     m.content.includes('struk') ||
     (m.content.includes('Rp.') && (m.content.includes('Tambah') || m.content.includes('ketik'))))
  );
  
  // Cek apakah user mengetik "Tambah" setelah analisis gambar
  const lastUserMessage = messages[messages.length - 1];
  const userInput = lastUserMessage instanceof HumanMessage && typeof lastUserMessage.content === 'string' 
    ? lastUserMessage.content.toLowerCase().trim() 
    : '';
  
  const isAddCommand = (userInput === 'tambah' || userInput === 'add' || userInput === 'create') && hasImageAnalysis;

  console.log("=== COMMAND DETECTION DEBUG ===");
  console.log("Last user message:", lastUserMessage?.content);
  console.log("Is add command:", isAddCommand);
  console.log("Has image analysis:", hasImageAnalysis);
  console.log("=== END DEBUG ===");

  // System prompt untuk qwen-vl (analisis gambar saja)
  const visionSystemPrompt = `You are a financial document analyzer. Analyze the image and extract transaction details.

EXTRACTION RULES:
- Extract: date, amount, merchant/description, category
- For old dates (different year), note that today is ${new Date().toISOString().split('T')[0]}
- Categorize as: Food & Beverage, Transportation, General, etc.
- Provide details in Indonesian format

OUTPUT FORMAT:
Berikut adalah detail transaksi yang telah diambil dari struk:

Tanggal Transaksi: [extracted date]
Jumlah: Rp. [amount in IDR format]
Kategori: [category]
Deskripsi: [merchant/item description]

[Additional context about date if needed]

Ketik "Tambah" untuk menambahkan transaksi ini ke database Anda.`;  // System prompt untuk qwen-turbo (tool execution)
  const toolSystemPrompt = `You are a helpful AI financial assistant.
You can help users CRUD (Create, Read, Update, Delete) their financial transactions.
All operations will be performed for the user with ID: ${userId}.

IMPORTANT TOOL USAGE INSTRUCTIONS:
- When using tools, provide arguments as a JSON object, NOT as a string
- For create_financial_transaction, always include: type, category, amount, date
- For read_financial_transactions, you can provide filters or leave empty for all transactions
- For update_financial_transaction, provide: transactionId and updates object
- For delete_financial_transaction, provide: transactionId

EXAMPLES:
- To create: {"type": "expense", "category": "Food & Beverage", "amount": 50000, "date": "2025-05-24", "description": "Lunch"}
- To read all: {} or leave empty
- To read filtered: {"category": "Food & Beverage", "limit": 10}
- To update: {"transactionId": "uuid-here", "updates": {"amount": 75000}}
- To delete: {"transactionId": "uuid-here"}

MANDATORY TOOL USAGE:
- ALWAYS use tools first before responding to ANY financial query
- NEVER provide error messages without trying tools first
- For any request about transactions, budgets, expenses, or financial data: USE TOOLS IMMEDIATELY
- Do NOT assume what data exists - always check with tools first

TOOL RESULT INTERPRETATION - CRITICAL RULES:
- If tool returns "Found X transactions:" followed by JSON data, this is ALWAYS SUCCESS
- Process the transaction data and present it in a user-friendly format
- NEVER say "terjadi kesalahan" or "error" if you receive transaction data
- If tool returns "No transactions found", this is normal - just inform user no transactions exist
- Only treat responses that explicitly start with "Error:" as actual errors
- Success indicators: "Found", transaction data, JSON arrays, numbers, dates
- Error indicators: "Error:", "Failed", "Cannot", "Missing"

RESPONSE RULES:
- When you get transaction data, immediately format and present it nicely
- Do not mention any technical issues or errors when data is successfully retrieved
- Focus on presenting the financial information clearly and helpfully
- NEVER give error responses without first attempting to use appropriate tools

AUTO-EXECUTION RULES:
- When user says "Tambah" after image analysis, automatically create the transaction
- Extract details from previous AI analysis and execute create_financial_transaction
- Use today's date: ${new Date().toISOString().split('T')[0]} if original date is old

SUCCESSFUL DATA PROCESSING:
- When you receive transaction data from tools (even if prefixed with "Found X transactions:"), immediately format it nicely
- Never mention errors, problems, or issues when transaction data is successfully retrieved
- Transform JSON data into user-friendly Indonesian format with proper currency formatting
- Present data clearly with dates, categories, amounts, and descriptions

When creating transactions, if the user doesn't specify a category, use these defaults:
- For food/eating: "Food & Beverage" 
- For transport: "Transportation"
- For salary/income: "Salary"
- For general expenses: "General"

Today's date is ${new Date().toISOString().split('T')[0]}. Use this as default date if user says "today" or doesn't specify.

Always respond in Indonesian (Bahasa Indonesia) when appropriate.

CRITICAL: When processing tool results containing transaction data:
1. If you see "Found X transactions:" followed by JSON data - this means SUCCESS
2. Immediately parse and format the data for the user 
3. Do NOT say there was an error or problem
4. Present the financial data clearly and professionally
5. Only report errors if the tool response explicitly starts with "Error:"

FIRST-TIME INTERACTION RULES:
- For ANY financial query (expenses, income, transactions, budget), ALWAYS call read_financial_transactions first
- Do NOT provide assumptions or error messages without checking tools first
- Even if you think there might be no data, still call the tool to verify
- Let the tool result determine your response, not assumptions

FORMATTING GUIDELINES FOR TRANSACTION DATA:
- Convert amounts to Rupiah format (Rp X.XXX,-)
- Format dates to Indonesian format (DD Month YYYY)
- Categorize transactions clearly
- Show totals and summaries when appropriate`;

  // Membuat instance tools DENGAN userId yang sudah ada di state
  const toolsForThisUser = [
    createTransactionTool(userId),
    readTransactionsTool(userId),
    updateTransactionTool(userId),
    deleteTransactionTool(userId),
  ];
  // Tentukan LLM dan system prompt berdasarkan konteks
  let selectedLLM;
  let systemPromptContent;
  let modelWithTools;
  if (isMultimodalProcess) {
    // Gunakan qwen-vl untuk analisis gambar (tanpa tools)
    selectedLLM = multimodalLLM;
    systemPromptContent = visionSystemPrompt;
    modelWithTools = selectedLLM; // Tidak bind tools untuk analisis gambar
  } else if (isAddCommand) {
    // Jika user mengetik "Tambah", gunakan qwen-turbo dengan tools dan auto-extract data
    selectedLLM = llm;
    systemPromptContent = toolSystemPrompt + `\n\nSPECIAL INSTRUCTION: User has typed "Tambah" after image analysis. You MUST:
1. Extract transaction details from the previous AI message that contains image analysis
2. Automatically execute create_financial_transaction tool with extracted data
3. Use today's date (${new Date().toISOString().split('T')[0]}) as the transaction date
4. DO NOT ask for confirmation - execute immediately`;
    modelWithTools = selectedLLM.bindTools(toolsForThisUser);
  } else {
    // Gunakan qwen-turbo untuk tool execution normal
    selectedLLM = llm;
    systemPromptContent = toolSystemPrompt;
    modelWithTools = selectedLLM.bindTools(toolsForThisUser);
  }

  // Menambahkan system prompt jika belum ada atau berbeda
  let effectiveMessages = messages;
  if (messages.length === 0 || !(messages[0] instanceof SystemMessage) || messages[0].content !== systemPromptContent) {
    const nonSystemMessages = messages.filter(m => !(m instanceof SystemMessage));
    effectiveMessages = [new SystemMessage(systemPromptContent), ...nonSystemMessages];
  }
  // Jika ada gambar, modifikasi pesan terakhir untuk menyertakan konten visual
  if (isMultimodalProcess) {
    const lastMessage = effectiveMessages[effectiveMessages.length - 1];
    if (lastMessage instanceof HumanMessage) {
      // Membuat pesan multimodal dengan format yang benar untuk qwen-vl-plus-latest
      const multimodalMessage = new HumanMessage({
        content: [
          {
            type: "text",
            text: lastMessage.content as string
          },
          {
            type: "image_url",
            image_url: {
              url: imageData
            }
          }
        ]
      });
      
      // Ganti pesan terakhir dengan versi multimodal
      effectiveMessages = [...effectiveMessages.slice(0, -1), multimodalMessage];
    }
  }
  // Jika user mengetik "Tambah", extract data dari analisis sebelumnya dan buat pesan yang memicu tool call
  if (isAddCommand) {
    console.log("=== TAMBAH COMMAND DETECTED ===");
    const transactionData = extractTransactionFromAnalysis(messages);
    console.log("Transaction data extracted:", transactionData);
    
    if (transactionData) {
      // Buat pesan yang eksplisit untuk memicu tool call
      const instructionMessage = new HumanMessage(
        `Execute create_financial_transaction tool immediately with these exact parameters: ${JSON.stringify(transactionData)}. Do not ask for confirmation.`
      );
      effectiveMessages = [...effectiveMessages.slice(0, -1), instructionMessage];
      console.log("Created instruction message for tool execution");
    } else {
      // Jika tidak bisa extract data, minta user untuk mengupload ulang
      const errorMessage = new HumanMessage(
        "Tidak dapat menemukan detail transaksi dari analisis sebelumnya. Silakan upload gambar struk terlebih dahulu."
      );
      effectiveMessages = [...effectiveMessages.slice(0, -1), errorMessage];
      console.log("No transaction data found, requesting re-upload");
    }
    console.log("=== END TAMBAH COMMAND ===");
  }
  try {
    console.log("=== CALLMODEL DEBUG ===");
    console.log("Invoking model with", effectiveMessages.length, "messages");
    console.log("Last message type:", effectiveMessages[effectiveMessages.length - 1].constructor.name);
    
    const aiResponse = await modelWithTools.invoke(effectiveMessages);
    
    console.log("=== AI RESPONSE DEBUG ===");
    console.log("Response type:", aiResponse.constructor.name);
    console.log("Has tool_calls:", !!(aiResponse.tool_calls && aiResponse.tool_calls.length > 0));
    console.log("Tool calls count:", aiResponse.tool_calls?.length || 0);
    console.log("Content length:", typeof aiResponse.content === 'string' ? aiResponse.content.length : 0);
    console.log("Content preview:", typeof aiResponse.content === 'string' ? aiResponse.content.substring(0, 150) + '...' : aiResponse.content);
    console.log("=== END AI RESPONSE DEBUG ===");
    
    return { messages: [aiResponse] }; // Return only the new AI response, the reducer will handle concatenation
  } catch (error: any) {
    console.error("Error in callModel:", error);
    return { messages: [new AIMessage(`Error: ${error.message}`)] };
  }
}

// Create StateAnnotation for the workflow
const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  userId: Annotation<string | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  hasImage: Annotation<boolean>({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),
  imageData: Annotation<string | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  })
});

// Route function to determine next step
function routeMessage(state: typeof StateAnnotation.State) {
  const lastMessage = state.messages[state.messages.length - 1];
  const messageCount = state.messages.length;
  
  console.log("=== ROUTING DEBUG ===");
  console.log("Total messages in state:", messageCount);
  console.log("Last message type:", lastMessage.constructor.name);
  console.log("Last message content:", typeof lastMessage.content === 'string' ? lastMessage.content.substring(0, 100) + '...' : lastMessage.content);
  
  // Check if it's an AI message with tool calls
  if (lastMessage instanceof AIMessage && lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    console.log("Routing: AI message with tool calls -> going to tools");
    console.log("Tool calls:", lastMessage.tool_calls.map(tc => tc.name));
    return "tools";
  }
  
  // Check if it's a tool message
  if (lastMessage instanceof ToolMessage) {
    console.log("Routing: Tool message -> going back to agent");
    console.log("Tool name:", lastMessage.name);
    return "agent";
  }
  
  // Check if it's an AI message without tool calls (final response)
  if (lastMessage instanceof AIMessage) {
    console.log("Routing: AI message without tool calls -> ENDING conversation");
    console.log("Final response content length:", typeof lastMessage.content === 'string' ? lastMessage.content.length : 0);
    return END;
  }
  
  // Check if it's a human message (shouldn't happen in routing, but let's be safe)
  if (lastMessage instanceof HumanMessage) {
    console.log("Routing: Human message -> going to agent");
    return "agent";
  }
  
  console.log("Routing: Unknown message type -> ending");
  console.log("=== END ROUTING DEBUG ===");
  return END;
}

// Global tools instance - we'll create one per user session
const userToolsCache = new Map<string, any[]>();

// Function to clear cache for a user (useful for testing)
export function clearUserCache(userId: string) {
  console.log(`Clearing cache for user: ${userId}`);
  userToolsCache.delete(userId);
}

function getToolsForUser(userId: string) {
  if (!userToolsCache.has(userId)) {
    const tools = [
      createTransactionTool(userId),
      readTransactionsTool(userId),
      updateTransactionTool(userId),
      deleteTransactionTool(userId),
    ];
    userToolsCache.set(userId, tools);
  }
  return userToolsCache.get(userId)!;
}

// 2. Fungsi untuk mengeksekusi Tool (Action Node)
// ToolNode akan menangani pemanggilan tool yang benar berdasarkan output LLM
async function callTool(state: typeof StateAnnotation.State): Promise<Partial<typeof StateAnnotation.State>> {
  const { messages, userId } = state;
  
  if (!userId) {
    console.error("ERROR: User ID is not set for tool execution");
    return { 
      messages: [new ToolMessage("Error: User ID is not set for tool execution", "error")]
    };
  }

  console.log("CallTool: Starting tool execution for user:", userId);
  
  const lastMessage = messages[messages.length - 1];
  if (!(lastMessage instanceof AIMessage) || !lastMessage.tool_calls || lastMessage.tool_calls.length === 0) {
    console.error("ERROR: No tool calls found in last AI message");
    return { 
      messages: [new ToolMessage("Error: No tool calls found", "error")]
    };
  }

  console.log("CallTool: Found tool calls:", lastMessage.tool_calls.length);

  // Clear cache jika ada operasi write (create/update/delete)
  const writeOperations = ['create_financial_transaction', 'update_financial_transaction', 'delete_financial_transaction'];
  const hasWriteOperation = lastMessage.tool_calls.some(call => 
    writeOperations.includes(call.name)
  );
  
  if (hasWriteOperation) {
    console.log("CallTool: Clearing tools cache due to write operation");
    userToolsCache.delete(userId);
  }

  const toolsForThisUser = getToolsForUser(userId);
  const toolNode = new ToolNode(toolsForThisUser);
  
  try {
    console.log("CallTool: Invoking toolNode...");
    const result = await toolNode.invoke(state);
    console.log("CallTool: ToolNode result:", result);
    
    // Clear cache lagi setelah operasi write berhasil
    if (hasWriteOperation) {
      console.log("CallTool: Clearing tools cache after successful write operation");
      userToolsCache.delete(userId);
    }
    
    return result;
  } catch (error: any) {
    console.error(`ERROR in callTool:`, error);
    return { 
      messages: [new ToolMessage(`Error executing tools: ${error.message}`, "error")]
    };
  }
}

// Helper function untuk mengekstrak detail transaksi dari analisis gambar sebelumnya
function extractTransactionFromAnalysis(messages: BaseMessage[]): any {
  console.log("=== EXTRACT TRANSACTION DEBUG ===");
  console.log("Total messages:", messages.length);
  
  // Cari pesan AI yang berisi analisis gambar
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    console.log(`Message ${i}:`, message.constructor.name, typeof message.content);
    
    if (message instanceof AIMessage && message.content && typeof message.content === 'string') {
      const content = message.content;
      console.log("Checking content:", content.substring(0, 200) + "...");
      
      // Cek apakah ini adalah analisis gambar dengan berbagai pattern
      const hasTransactionAnalysis = content.includes('Tanggal Transaksi:') || 
                                   content.includes('Jumlah:') || 
                                   content.includes('detail transaksi') ||
                                   content.includes('Rp.') ||
                                   content.includes('struk');
      
      if (hasTransactionAnalysis) {
        console.log("Found transaction analysis in message:", content);
        
        // Extract details menggunakan regex yang lebih fleksibel
        const amountMatch = content.match(/(?:Jumlah|Total|Amount):\s*Rp\.?\s*([\d.,]+)/i) ||
                           content.match(/Rp\.?\s*([\d.,]+)/i);
        
        const dateMatch = content.match(/(?:Tanggal|Date)(?:\s+Transaksi)?:\s*([^\n]+)/i);
        const categoryMatch = content.match(/(?:Kategori|Category):\s*([^\n]+)/i);
        const descriptionMatch = content.match(/(?:Deskripsi|Description|Merchant):\s*([^\n]+)/i) ||
                               content.match(/(?:di|at|from)\s+([^\n,]+)/i);
        
        console.log("Matches found:");
        console.log("- Amount:", amountMatch?.[1]);
        console.log("- Date:", dateMatch?.[1]);
        console.log("- Category:", categoryMatch?.[1]);
        console.log("- Description:", descriptionMatch?.[1]);
        
        if (amountMatch) {
          // Clean amount: remove dots and commas, parse as integer
          const cleanAmount = amountMatch[1].replace(/[.,]/g, '');
          const amount = parseInt(cleanAmount);
          
          const category = categoryMatch ? categoryMatch[1].trim() : 'General';
          const description = descriptionMatch ? descriptionMatch[1].trim() : 'Transaction from receipt';
          
          const transactionData = {
            type: "expense",
            category: category,
            amount: amount,
            date: new Date().toISOString().split('T')[0], // Use today's date
            description: description
          };
          
          console.log("Extracted transaction data:", transactionData);
          console.log("=== END EXTRACT DEBUG ===");
          return transactionData;
        } else {
          console.log("No amount found in analysis");
        }
      }
    }
  }
  
  console.log("No transaction analysis found");
  console.log("=== END EXTRACT DEBUG ===");
  return null;
}

// 3. Create the workflow using the correct pattern
const workflow = new StateGraph(StateAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", callTool)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", routeMessage)
  .addEdge("tools", "agent");

// Compile the graph WITH memory checkpointer untuk menjaga thread/conversation context
export const app = workflow.compile({
  checkpointer: memory,
});

// --- Streaming Conversational Agent ---
export async function runAgentStream(userInput: string, currentUserId: string, threadId: string = "default", imageData?: string) {
  if (!currentUserId) {
    console.error("User ID tidak diberikan untuk menjalankan agent.");
    return;
  }

  // Clear cache to ensure fresh data for each conversation
  clearUserCache(currentUserId);
  console.log(`🔄 Cleared cache for user: ${currentUserId}`);

  const initialState: typeof StateAnnotation.State = {
    messages: [new HumanMessage(userInput)],
    userId: currentUserId,
    hasImage: !!imageData,
    imageData: imageData || null,
  };

  const config = {
    configurable: { thread_id: threadId },
    recursionLimit: 15,
  };

  console.log(`\n🤖 AI Assistant: `);
  if (imageData) {
    console.log("📷 Processing image with multimodal capabilities...");
  }
  
  let finalResponse = "";
  let isStreamingContent = false;
  
  try {
    const stream = await app.stream(initialState, config);
    
    for await (const chunk of stream) {
      // Handle agent node outputs
      if (chunk.agent && chunk.agent.messages) {
        const lastMessage = chunk.agent.messages[chunk.agent.messages.length - 1];
        
        if (lastMessage instanceof AIMessage) {
          // If it has tool calls, show a processing message
          if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
            if (!isStreamingContent) {
              process.stdout.write("🔧 Memproses data keuangan...");
              isStreamingContent = true;
            }
          }
          // If it has content and no tool calls, stream it
          else if (lastMessage.content && typeof lastMessage.content === 'string') {
            if (isStreamingContent) {
              process.stdout.write("\n");
              isStreamingContent = false;
            }
            
            // Stream the response word by word for better real-time effect
            const words = lastMessage.content.split(' ');
            for (let i = 0; i < words.length; i++) {
              process.stdout.write(words[i]);
              if (i < words.length - 1) process.stdout.write(' ');
              finalResponse += words[i] + (i < words.length - 1 ? ' ' : '');
              
              // Add delay between words for streaming effect
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
        }
      }
      
      // Handle tool execution
      if (chunk.tools && chunk.tools.messages) {
        const toolMessages = chunk.tools.messages;
        for (const toolMsg of toolMessages) {
          if (toolMsg instanceof ToolMessage) {
            // Show processing dots during tool execution
            if (!isStreamingContent) {
              process.stdout.write(".");
            }
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }
    }
    
    if (isStreamingContent) {
      process.stdout.write(" ✅");
    }
    
    console.log("\n");
    return finalResponse;
  } catch (error: any) {
    console.error("\n❌ Error in streaming agent:", error);
    return null;
  }
}

// --- Contoh Penggunaan Agent ---
export async function runAgent(userInput: string, currentUserId: string, imageData?: string) {
  if (!currentUserId) {
    console.error("User ID tidak diberikan untuk menjalankan agent.");
    return;
  }

  const initialState: typeof StateAnnotation.State = {
    messages: [new HumanMessage(userInput)],
    userId: currentUserId, // Inisialisasi userId di sini
    hasImage: !!imageData,
    imageData: imageData || null,
  };

  console.log(`--- Running Agent for userId: ${currentUserId} ---`);
  console.log(`Input: ${userInput}`);
  if (imageData) {
    console.log("📷 Image data provided for multimodal processing");
  }

  const result = await app.invoke(initialState, { recursionLimit: 15 }); // Increase recursion limit

  console.log("\n--- Agent Result ---");
  // Pesan terakhir biasanya adalah respons dari AI setelah semua langkah
  const finalMessage = result.messages[result.messages.length - 1];
  if (finalMessage instanceof AIMessage) {
    if (finalMessage.content) {
        console.log("AI:", finalMessage.content);
    }
    if (finalMessage.tool_calls && finalMessage.tool_calls.length > 0) {
        console.log("AI wants to call tools:", finalMessage.tool_calls);
    }
  } else {
    console.log("Final state:", result.messages);
  }
  console.log("---------------------\n");
  return result;
}