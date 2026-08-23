import { GoogleGenerativeAI } from '@google/generative-ai';
import db from '../db';
import { tools, toolDeclarations, ToolName } from './tools';

// Interface for structured output
export interface AgentResponse {
  finding: string;
  evidence: string[];
  likelyCause: string;
  recommendedAction: string;
  estimatedOpportunity: number;
  confidence: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  toolCallsExecuted: { toolName: string; inputParams: any; outputResult: any }[];
  isFallback: boolean;
}

// Fallback logic for Local Diagnostic Mode (when GEMINI_API_KEY is not set)
async function executeLocalDiagnostics(prompt: string): Promise<AgentResponse> {
  console.log('🤖 Running in Local Diagnostic Mode (Offline)...');
  const lowerPrompt = prompt.toLowerCase();
  const toolCallsExecuted: any[] = [];

  let finding = '';
  let evidence: string[] = [];
  let likelyCause = '';
  let recommendedAction = '';
  let estimatedOpportunity = 0;
  let confidence = 0;
  let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';

  if (lowerPrompt.includes('upi') || lowerPrompt.includes('evening') || lowerPrompt.includes('7 pm') || lowerPrompt.includes('success rate') || lowerPrompt.includes('drop')) {
    // UPI Evening failure diagnostic
    const upiHourlyResult = await tools.get_hourly_performance({ paymentMethod: 'UPI' });
    const upiOverallResult = await tools.get_payment_method_metrics({});
    
    toolCallsExecuted.push({
      toolName: 'get_payment_method_metrics',
      inputParams: {},
      outputResult: upiOverallResult
    });
    
    toolCallsExecuted.push({
      toolName: 'get_hourly_performance',
      inputParams: { paymentMethod: 'UPI' },
      outputResult: upiHourlyResult
    });

    const upiOverall = upiOverallResult.find(m => m.method === 'UPI');
    const eveningHours = [19, 20, 21];
    const eveningTotal = upiHourlyResult.filter(h => eveningHours.includes(h.hour)).reduce((sum, h) => sum + h.totalCount, 0);
    const eveningSuccess = upiHourlyResult.filter(h => eveningHours.includes(h.hour)).reduce((sum, h) => sum + h.successfulCount, 0);
    const eveningSuccessRate = eveningTotal > 0 ? (eveningSuccess / eveningTotal) * 100 : 0;
    
    finding = 'UPI payment success rate dropped significantly during high-volume evening hours (7 PM - 10 PM).';
    evidence = [
      `UPI Baseline Success Rate: ${upiOverall ? upiOverall.successRate : '91.8'}%`,
      `UPI Evening Success Rate (7 PM - 10 PM): ${Math.round(eveningSuccessRate * 10) / 10}%`,
      `UPI success drop margin: -${Math.round(((upiOverall?.successRate ?? 91.8) - eveningSuccessRate) * 10) / 10} percentage points`,
      `Affected UPI transactions volume: ${eveningTotal} transactions in peak hours`
    ];
    likelyCause = 'Server degradation on bank API nodes and customer-side authentication timeouts during heavy regional traffic.';
    recommendedAction = 'Implement a dynamic multi-acquiring gateway router to route UPI transactions via alternative PSP nodes when primary gateways experience high failure rates.';
    estimatedOpportunity = 145000;
    confidence = 88;
    priority = 'HIGH';
  } else if (lowerPrompt.includes('netbanking') || lowerPrompt.includes('method') || lowerPrompt.includes('underperform')) {
    // Netbanking underperformance diagnostic
    const methodResult = await tools.get_payment_method_metrics({});
    toolCallsExecuted.push({
      toolName: 'get_payment_method_metrics',
      inputParams: {},
      outputResult: methodResult
    });

    const nb = methodResult.find(m => m.method === 'NETBANKING');
    
    finding = 'Netbanking success rate underperforms compared to other digital payment methods.';
    evidence = [
      `Netbanking Success Rate: ${nb ? nb.successRate : '74.5'}%`,
      `Merchant Baseline Success Rate: 91.8%`,
      `Total Netbanking transactions: ${nb ? nb.totalCount : '0'}`
    ];
    likelyCause = 'Legacy netbanking portals requiring multiple page redirections and manual login credentials leading to high user abort rates.';
    recommendedAction = 'Prioritize UPI on checkout layout and prompt Netbanking users to switch to UPI for a faster, higher-success experience.';
    estimatedOpportunity = 92000;
    confidence = 82;
    priority = 'MEDIUM';
  } else if (lowerPrompt.includes('vip') || lowerPrompt.includes('high value') || lowerPrompt.includes('enterprise') || lowerPrompt.includes('customer')) {
    // VIP failures diagnostic
    const segmentResult = await tools.get_customer_segment_analysis({});
    const sampleTxs = await tools.get_transaction_examples({ status: 'FAILED', limit: 5 });
    
    toolCallsExecuted.push({
      toolName: 'get_customer_segment_analysis',
      inputParams: {},
      outputResult: segmentResult
    });
    toolCallsExecuted.push({
      toolName: 'get_transaction_examples',
      inputParams: { status: 'FAILED', limit: 5 },
      outputResult: sampleTxs
    });

    const ent = segmentResult.find(s => s.segment === 'Enterprise');

    finding = 'High-value customer checkout failures detected on high-ticket transactions.';
    evidence = [
      `Enterprise Segment Success Rate: ${ent ? ent.successRate : '89.5'}%`,
      `Enterprise Total Volume: ₹${ent ? ent.volume.toLocaleString('en-IN') : '0'}`,
      `Failed transaction samples show repetitive USER_ABORTED and BANK_DEGRADED failure states on high amounts.`
    ];
    likelyCause = 'Insufficient credit/debit balances and authentication failures during high-ticket verification processes.';
    recommendedAction = 'Configure automated payment recovery campaigns to email/WhatsApp a payment retry link with pre-filled billing details to enterprise users immediately upon transaction failure.';
    estimatedOpportunity = 230000;
    confidence = 80;
    priority = 'HIGH';
  } else {
    // General diagnostic
    const summary = await tools.get_merchant_summary({});
    toolCallsExecuted.push({
      toolName: 'get_merchant_summary',
      inputParams: {},
      outputResult: summary
    });

    finding = 'Overall transaction metrics are stable, but revenue leaks exist in Netbanking and evening UPI transactions.';
    evidence = [
      `Overall Success Rate: ${summary.successRate}%`,
      `Attempted volume (GMV): ₹${summary.totalVolume.toLocaleString('en-IN')}`,
      `Lost payment volume (Revenue leak): ₹${summary.failedVolume.toLocaleString('en-IN')}`
    ];
    likelyCause = 'Unresolved bank gateway timeouts and lack of fallback checkout paths for customer transactions.';
    recommendedAction = 'Run a full Opportunity Scan in the Opportunities tab and review the recommended gateway fallback actions.';
    estimatedOpportunity = summary.potentialRevenueOpportunity;
    confidence = 75;
    priority = 'MEDIUM';
  }

  // Save the run and tool calls to DB for audit trail
  const agentRun = await db.agentRun.create({
    data: {
      prompt,
      response: JSON.stringify({ finding, evidence, likelyCause, recommendedAction, estimatedOpportunity, confidence, priority }),
    }
  });

  for (const tc of toolCallsExecuted) {
    await db.agentToolCall.create({
      data: {
        agentRunId: agentRun.id,
        toolName: tc.toolName,
        inputParams: tc.inputParams,
        outputResult: tc.outputResult
      }
    });
  }

  return {
    finding,
    evidence,
    likelyCause,
    recommendedAction,
    estimatedOpportunity,
    confidence,
    priority,
    toolCallsExecuted,
    isFallback: true
  };
}

// Live execution utilizing Gemini API with function calling
export async function executeAgent(prompt: string): Promise<AgentResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return await executeLocalDiagnostics(prompt);
  }

  try {
    console.log('🤖 Initializing Google Gemini API Client...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Using gemini-1.5-flash for tool-calling speed and efficiency
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: `You are RazorGrowth AI, a senior merchant growth copilot. 
      Your task is to analyze payment transaction metrics using the tools provided to answer the merchant's question.
      
      You must follow these rules strictly:
      1. Never make up or invent statistics. Use ONLY data returned by the tools.
      2. If you do not have enough data to determine a cause, output "Insufficient evidence to determine the cause."
      3. You must execute one or more tools in a loop to collect evidence before formulating your recommendation.
      4. You must return your final answer strictly in JSON format matching this schema:
      {
        "finding": "Short summary of the core issue discovered",
        "evidence": ["Bullet point 1 detailing specific numbers/rates", "Bullet point 2..."],
        "likelyCause": "Analysis of the technical/operational reason for the failures",
        "recommendedAction": "Concrete, actionable step the merchant should take",
        "estimatedOpportunity": number representing estimated INR revenue recovery,
        "confidence": number representing confidence percentage between 0 and 100,
        "priority": "HIGH" | "MEDIUM" | "LOW"
      }
      Do not wrap the JSON in markdown code blocks like \`\`\`json. Output raw JSON only.`
    });

    const chat = model.startChat({
      tools: [{
        functionDeclarations: toolDeclarations as any
      }]
    });

    console.log(`🤖 Sending prompt to Gemini: "${prompt}"`);
    let result = await chat.sendMessage(prompt);
    let functionCalls = result.response.functionCalls ? result.response.functionCalls() : undefined;

    const toolCallsExecuted: any[] = [];
    const maxIterations = 5;
    let iterations = 0;

    // Handle tool calling loop
    while (functionCalls && functionCalls.length > 0 && iterations < maxIterations) {
      iterations++;
      console.log(`🤖 Gemini requested function execution (${functionCalls.length} calls):`, JSON.stringify(functionCalls));

      const responses = [];

      for (const call of functionCalls) {
        const { name, args } = call;
        const toolName = name as ToolName;
        
        if (tools[toolName]) {
          console.log(`⚙️ Executing local tool: ${toolName} with args:`, args);
          const toolResult = await (tools[toolName] as any)(args);
          
          toolCallsExecuted.push({
            toolName,
            inputParams: args,
            outputResult: toolResult
          });

          responses.push({
            functionResponse: {
              name,
              response: { result: toolResult }
            }
          });
        } else {
          console.warn(`⚠️ Tool ${toolName} requested by model is not implemented.`);
          responses.push({
            functionResponse: {
              name,
              response: { error: 'Tool not implemented' }
            }
          });
        }
      }

      // Send the tool outputs back to Gemini to continue reasoning
      result = await chat.sendMessage(responses);
      functionCalls = result.response.functionCalls ? result.response.functionCalls() : undefined;
    }

    const responseText = result.response.text();
    console.log('🤖 Final Gemini Raw Output:', responseText);

    // Parse the JSON output from the model
    let parsed: any;
    try {
      // Clean up markdown wrapping if the model ignored system instructions
      let cleanText = responseText.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.substring(7, cleanText.length - 3).trim();
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.substring(3, cleanText.length - 3).trim();
      }
      parsed = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response as JSON. Raw text:', responseText);
      // Fallback parser: extract elements using regex or return offline fallback
      return await executeLocalDiagnostics(prompt);
    }

    // Save run to DB for audit trail
    const agentRun = await db.agentRun.create({
      data: {
        prompt,
        response: JSON.stringify(parsed),
      }
    });

    // Save individual tool calls
    for (const tc of toolCallsExecuted) {
      await db.agentToolCall.create({
        data: {
          agentRunId: agentRun.id,
          toolName: tc.toolName,
          inputParams: tc.inputParams,
          outputResult: tc.outputResult
        }
      });
    }

    return {
      finding: parsed.finding || 'Diagnostic evaluation completed.',
      evidence: parsed.evidence || [],
      likelyCause: parsed.likelyCause || 'Insufficient evidence.',
      recommendedAction: parsed.recommendedAction || 'No action needed.',
      estimatedOpportunity: Number(parsed.estimatedOpportunity) || 0,
      confidence: Number(parsed.confidence) || 0,
      priority: parsed.priority || 'MEDIUM',
      toolCallsExecuted,
      isFallback: false
    };

  } catch (error: any) {
    console.error('❌ Error executing live Gemini agent:', error);
    // Fall back gracefully to local diagnostic engine
    return await executeLocalDiagnostics(prompt);
  }
}
