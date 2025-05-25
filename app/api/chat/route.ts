import { NextRequest, NextResponse } from "next/server";
import { app } from '@/lib/agent';
import { HumanMessage, AIMessage, ToolMessage } from '@langchain/core/messages';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`=== API CHAT REQUEST [${requestId}] ===`);
  
  try {
    const body = await request.json();
    const { message, image, threadId = 'default' } = body;
    
    console.log(`[${requestId}] Message:`, message);
    console.log(`[${requestId}] ThreadId:`, threadId);
    console.log(`[${requestId}] Has image:`, !!image);
    
    if (!message || typeof message !== 'string') {
      console.log(`[${requestId}] Invalid message format`);
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Use the test user ID as specified in the conversation
    const userId = 'user_6831885af26f9a4e3ab53166';

    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        // Send data in SSE format
        const sendData = (type: string, content: string) => {
          const data = JSON.stringify({ type, content });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };

        try {
          // Initial state for the agent
          const initialState = {
            messages: [new HumanMessage(message)],
            userId: userId,
            hasImage: !!image,
            imageData: image || null,
          };

          const config = {
            configurable: { thread_id: threadId },
            recursionLimit: 15,
          };

          // Send initial processing status
          if (image) {
            sendData('status', '📷 Processing image with multimodal AI...');
          } else {
            sendData('status', '🔧 Processing financial data...');
          }

          let finalResponse = '';
          let isProcessingTools = false;
          let contentBuffer = '';

          try {
            // Stream the agent execution
            const agentStream = await app.stream(initialState, config);
            
            for await (const chunk of agentStream) {
              // Handle agent node outputs (AI responses)
              if (chunk.agent && chunk.agent.messages) {
                const lastMessage = chunk.agent.messages[chunk.agent.messages.length - 1];
                
                if (lastMessage instanceof AIMessage) {
                  // If it has tool calls, show processing message
                  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
                    if (!isProcessingTools) {
                      sendData('status', '🔧 Processing financial data...');
                      isProcessingTools = true;
                    }
                  }
                  // If it has content and no tool calls, stream the response
                  else if (lastMessage.content && typeof lastMessage.content === 'string') {
                    if (isProcessingTools) {
                      sendData('status', '✅ Data processed');
                      isProcessingTools = false;
                    }
                    
                    // Stream the content progressively
                    const newContent = lastMessage.content;
                    if (newContent !== contentBuffer) {
                      contentBuffer = newContent;
                      finalResponse = newContent;
                      sendData('content', finalResponse);
                      
                      // Add a small delay for better streaming effect
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
                    // Show progress during tool execution
                    sendData('status', '📊 Updating financial records...');
                    await new Promise(resolve => setTimeout(resolve, 100));
                  }
                }
              }
            }
            
            // Ensure we have a final response
            if (!finalResponse) {
              finalResponse = 'Task completed successfully.';
            }
            
            // Send completion
            sendData('done', finalResponse);
            
          } catch (agentError) {
            console.error('Agent execution error:', agentError);
            sendData('error', agentError instanceof Error ? agentError.message : 'Failed to process your request');
          }

        } catch (error) {
          console.error('Error in chat stream:', error);
          sendData('error', error instanceof Error ? error.message : 'An error occurred while processing your request');
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}