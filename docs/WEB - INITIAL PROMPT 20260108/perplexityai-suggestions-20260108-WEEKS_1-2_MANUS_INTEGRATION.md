# WEEKS 1-2: MANUS API INTEGRATION & INFRASTRUCTURE SETUP
## Complete Technical Implementation Guide for GO-GETTER Platform

---

## TABLE OF CONTENTS

1. Manus API Overview & Authentication
2. Architecture Design (Manus + Fallback Chain)
3. API Credit System & Cost Tracking
4. Database Schema for Agent Tasks
5. Webhook Handler Implementation
6. Error Handling & Fallback Logic
7. Token Cost Calculation & Billing
8. Authentication & Security
9. Testing & Validation
10. Deployment Checklist
11. Monitoring & Logging Setup
12. Kill Switch & Safety Systems

---

## 🎯 PART 1: MANUS API OVERVIEW

### What is Manus AI?

**Background:**
- Acquired by Meta (Facebook) in 2024 for $2B
- Specialized in **autonomous AI agent execution**
- REST API-based (credit system, pay-per-call)
- Designed for long-running, complex agent tasks

**Key Capabilities:**
- Context understanding (reads URLs, files, chat history)
- Multi-step task execution (planning + acting + reasoning)
- Structured output (JSON responses, not just chat)
- Error recovery and retry logic built-in
- Webhook support for async processing

**Pricing Model (2026):**
- Credit-based system: 1 credit ≈ $0.01-0.05 depending on model
- Typical agent task: 50-500 credits ($0.50-5.00)
- Volume discounts available at 10K+ credits/month
- Real-time credit tracking dashboard

### Why Manus for GO-GETTER?

✅ **Cost-efficient:** Lead qualification = ~200 credits = $2.00 per lead
✅ **Reliable:** Built-in retry logic, webhooks for scalability
✅ **Flexible:** Supports structured agents (not just chat)
✅ **Proven:** Already handling thousands of agent tasks daily
✅ **Meta-backed:** Stable, serious investment in agent infrastructure

---

## 🏗️ PART 2: ARCHITECTURE DESIGN

### System Overview

```
┌─────────────────────────────────────────────────────┐
│        GO-GETTER FRONTEND (Next.js)                 │
│  (User creates business, sets webhook, monitors)    │
└────────────┬────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────┐
│     GO-GETTER BACKEND (tRPC + Express)              │
│  (Routes, webhook handlers, database logic)         │
└────────────┬────────────────────────────────────────┘
             │
      ┌──────┴──────┐
      ↓             ↓
┌───────────┐  ┌──────────────────────┐
│  Database │  │ Manus Agent Queue    │
│  (Postgres)  │ (BullMQ)             │
└───────────┘  └──────────┬───────────┘
                          ↓
              ┌───────────────────────┐
              │   MANUS API (Primary) │
              │  - Task execution     │
              │  - Credit deduction   │
              │  - Webhook callbacks  │
              └──────────┬────────────┘
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
    ┌────────┐   ┌──────────────┐   ┌────────┐
    │Fallback│   │ Client APIs  │   │Webhooks│
    │ Chain  │   │(CRM, Email)  │   │Endpoint│
    └────────┘   └──────────────┘   └────────┘
```

### Manus Integration Flow

```
1. USER CREATES BUSINESS
   ↓
2. SELECT AGENT TYPE (e.g., "Lead Qualification")
   ↓
3. CONFIGURE WEBHOOK
   User provides: POST endpoint from their CRM/form
   ↓
4. QUEUE AGENT TASK
   - Store task in database (pending)
   - Add to BullMQ queue
   - Calculate expected credits
   ↓
5. MANUS EXECUTES
   - Poll BullMQ for new tasks
   - Call Manus API with task payload
   - Manus runs agent logic (thinking + acting)
   - Returns structured response
   ↓
6. STORE RESULTS
   - Update task status (completed)
   - Log credits used
   - Capture response data
   ↓
7. TRIGGER WEBHOOK
   - POST result to client's endpoint
   - Include: data, status, tokens_used, cost
   ↓
8. MONITOR & RETRY
   - If webhook fails: retry 3x with exponential backoff
   - Log all events to database
   - Update dashboard in real-time
```

### Fallback Chain Architecture

**Primary:** Manus AI (preferred, lowest cost)
**Fallback 1:** Perplexity API (if Manus down)
**Fallback 2:** GPT-4 (if Perplexity down)
**Fallback 3:** Gemini (last resort)

```typescript
// Pseudo-code
async function executeAgent(task) {
  let attempt = 1;
  const maxAttempts = 3;

  while (attempt <= maxAttempts) {
    try {
      // Primary: Try Manus
      if (attempt === 1) {
        return await callManus(task);
      }
      // Fallback 1: Try Perplexity
      if (attempt === 2) {
        return await callPerplexity(task);
      }
      // Fallback 2: Try GPT-4
      if (attempt === 3) {
        return await callOpenAI(task);
      }
    } catch (error) {
      attempt++;
      if (attempt > maxAttempts) {
        // Last resort: Gemini
        return await callGemini(task);
      }
      await delay(1000 * attempt); // Exponential backoff
    }
  }
}
```

---

## 💳 PART 3: MANUS CREDIT SYSTEM & COST TRACKING

### Understanding Manus Credits

**What is a credit?**
- 1 credit = internal unit of computation
- 1 credit ≈ $0.01 (can vary by region/volume)
- Costs vary by task complexity and model used

**Typical Credit Usage:**

| Task Type | Credits | Cost |
|-----------|---------|------|
| Simple text classification | 50-100 | $0.50-1.00 |
| Lead qualification scoring | 150-250 | $1.50-2.50 |
| Email generation | 200-350 | $2.00-3.50 |
| Review response drafting | 100-200 | $1.00-2.00 |
| Sentiment analysis | 80-150 | $0.80-1.50 |
| Multi-step agent task | 300-600 | $3.00-6.00 |

### Cost Tracking Implementation

```typescript
// server/services/manusService.ts

import { db } from '@/lib/db';
import { manusCredits } from '@/lib/db/schema';

interface ManusCreditLog {
  userBusinessId: number;
  taskId: string;
  creditsUsed: number;
  costUSD: number;
  modelUsed: 'manus' | 'perplexity' | 'openai' | 'gemini';
  taskType: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
}

export async function trackCredits(log: ManusCreditLog) {
  // Log credit usage
  await db.insert(manusCredits).values({
    userBusinessId: log.userBusinessId,
    taskId: log.taskId,
    creditsUsed: log.creditsUsed,
    costUsd: log.costUSD,
    modelUsed: log.modelUsed,
    taskType: log.taskType,
    status: log.status,
    timestamp: log.timestamp,
  });

  // Update daily budget tracking
  const dailyBudget = await db
    .selectFrom('creditBudgets')
    .where('userBusinessId', '=', log.userBusinessId)
    .where('date', '=', dayjs().format('YYYY-MM-DD'))
    .selectAll()
    .executeTakeFirst();

  if (dailyBudget) {
    await db
      .updateTable('creditBudgets')
      .set({
        creditsUsedToday: dailyBudget.creditsUsedToday + log.creditsUsed,
        costToday: dailyBudget.costToday + log.costUSD,
      })
      .where('userBusinessId', '=', log.userBusinessId)
      .where('date', '=', dayjs().format('YYYY-MM-DD'))
      .execute();
  } else {
    // Create new daily budget record
    await db.insert(creditBudgets).values({
      userBusinessId: log.userBusinessId,
      date: dayjs().format('YYYY-MM-DD'),
      creditsUsedToday: log.creditsUsed,
      costToday: log.costUSD,
      dailyBudgetLimit: 50000, // Default: ~$500/day
    });
  }

  // Check if exceeding daily budget (kill switch)
  if (dailyBudget && (dailyBudget.costToday + log.costUSD) > dailyBudget.dailyBudgetLimit) {
    // Pause all agents for this user
    await pauseAllAgents(log.userBusinessId);
    
    // Alert user
    await sendAlert(log.userBusinessId, {
      severity: 'critical',
      message: `Daily credit budget exceeded. All agents paused.`,
      currentCost: dailyBudget.costToday + log.costUSD,
      limit: dailyBudget.dailyBudgetLimit,
    });
  }
}

export async function getDailyReport(userBusinessId: number, date: string) {
  return await db
    .selectFrom('creditBudgets')
    .where('userBusinessId', '=', userBusinessId)
    .where('date', '=', date)
    .selectAll()
    .executeTakeFirst();
}

export async function getMonthlyReport(userBusinessId: number, month: string) {
  return await db
    .selectFrom('creditBudgets')
    .where('userBusinessId', '=', userBusinessId)
    .where('date', 'like', `${month}%`)
    .selectAll()
    .execute();
}
```

### Database Schema for Credit Tracking

```typescript
// db/schema.ts

export const manusCredits = pgTable('manuscredits', {
  id: serial('id').primaryKey(),
  userBusinessId: integer('userbusinessid')
    .notNull()
    .references(() => userBusinesses.id),
  
  taskId: varchar('taskid', { length: 256 }).notNull(),
  creditsUsed: integer('creditsused').notNull(),
  costUsd: numeric('costusd', { precision: 10, scale: 4 }).notNull(),
  
  modelUsed: varchar('modelused', { length: 50 }).notNull(), // "manus", "perplexity", "openai", "gemini"
  taskType: varchar('tasktype', { length: 100 }).notNull(), // "lead_qualification", "email_gen", etc.
  status: varchar('status', { length: 20 }).default('pending'), // "pending", "completed", "failed"
  
  timestamp: timestamp('timestamp').default(sql`now()`).notNull(),
  completedAt: timestamp('completedat'),
  
  errorMessage: text('errormessage'),
  fallbackModel: varchar('fallbackmodel', { length: 50 }), // If had to fallback
  fallbackCost: numeric('fallbackcost', { precision: 10, scale: 4 }),
  
  createdAt: timestamp('createdat').default(sql`now()`).notNull(),
  updatedAt: timestamp('updatedat').default(sql`now()`).notNull(),
});

export const creditBudgets = pgTable('creditbudgets', {
  id: serial('id').primaryKey(),
  userBusinessId: integer('userbusinessid')
    .notNull()
    .references(() => userBusinesses.id),
  
  date: date('date').notNull(),
  dailyBudgetLimit: numeric('dailybudgetlimit', { precision: 10, scale: 2 }).default(50000), // USD
  
  creditsUsedToday: integer('creditsusedtoday').default(0),
  costToday: numeric('costtoday', { precision: 10, scale: 4 }).default(0),
  
  isPaused: boolean('ispaused').default(false),
  pausedAt: timestamp('pausedat'),
  pausedReason: varchar('pausedreason', { length: 256 }),
  
  createdAt: timestamp('createdat').default(sql`now()`).notNull(),
  updatedAt: timestamp('updatedat').default(sql`now()`).notNull(),
});

// Create unique constraint to prevent duplicate date entries
createIndex('creditbudgets_date_userid_unique').on('creditbudgets', ['userBusinessId', 'date']).unique();
```

---

## 🔄 PART 4: AGENT TASK DATABASE SCHEMA

```typescript
// db/schema.ts

export const agentTasks = pgTable('agenttasks', {
  id: serial('id').primaryKey(),
  userBusinessId: integer('userbusinessid')
    .notNull()
    .references(() => userBusinesses.id),
  
  taskType: varchar('tasktype', { length: 100 }).notNull(), // "lead_qualification", "review_response", etc.
  status: varchar('status', { length: 20 }).default('pending'), // "pending", "processing", "completed", "failed", "paused"
  
  // Input data
  inputData: json('inputdata').notNull(), // Raw data from webhook (lead info, review, etc.)
  externalId: varchar('externalid', { length: 256 }), // Customer's ID (lead_id, review_id, etc.)
  
  // Manus execution
  manusTaskId: varchar('manusstaskid', { length: 256 }), // Manus response ID
  manusResponse: json('manusresponse'), // Full response from Manus
  manusModel: varchar('manusmodel', { length: 50 }), // Which model was used
  
  // Results
  outputData: json('outputdata'), // Agent's output (classification, response, etc.)
  confidence: numeric('confidence', { precision: 5, scale: 4 }), // 0.0-1.0 confidence score
  
  // Webhook info
  webhookUrl: varchar('webhookurl', { length: 500 }), // Where to POST results
  webhookStatus: varchar('webhookstatus', { length: 20 }), // "pending", "sent", "failed", "retrying"
  webhookRetries: integer('webhookretries').default(0),
  webhookLastAttempt: timestamp('webhokllastattempt'),
  webhookError: text('webhookerror'),
  
  // Credits & cost
  creditsUsed: integer('creditsused'),
  costUsd: numeric('costusd', { precision: 10, scale: 4 }),
  
  // Errors & debugging
  error: text('error'),
  errorCode: varchar('errorcode', { length: 50 }),
  fallbackAttempts: integer('fallbackattempts').default(0),
  
  // Timestamps
  queuedAt: timestamp('queuedat').default(sql`now()`).notNull(),
  startedAt: timestamp('startedat'),
  completedAt: timestamp('completedat'),
  
  createdAt: timestamp('createdat').default(sql`now()`).notNull(),
  updatedAt: timestamp('updatedat').default(sql`now()`).notNull(),
});

// Indexes for performance
createIndex('agenttasks_status_idx').on('agenttasks', ['status']);
createIndex('agenttasks_userid_idx').on('agenttasks', ['userBusinessId']);
createIndex('agenttasks_createdAt_idx').on('agenttasks', ['createdAt']);
```

---

## 🔌 PART 5: MANUS API CLIENT IMPLEMENTATION

```typescript
// server/services/manus/manusClient.ts

import axios from 'axios';

interface ManusTaskPayload {
  prompt: string;
  context?: Record<string, any>;
  modelPreference?: 'claude' | 'gpt4' | 'gemini';
  maxSteps?: number;
  timeout?: number;
}

interface ManusResponse {
  taskId: string;
  status: 'completed' | 'pending' | 'failed';
  result: Record<string, any>;
  creditsUsed: number;
  executionTimeMs: number;
  model: string;
}

export class ManusClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.manus.im/v1';
  private creditRate: number = 0.01; // 1 credit = $0.01

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async executeTask(payload: ManusTaskPayload): Promise<ManusResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/agents/execute`,
        {
          prompt: payload.prompt,
          context: payload.context || {},
          model: payload.modelPreference || 'claude',
          maxSteps: payload.maxSteps || 10,
          timeout: payload.timeout || 60000,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'GO-GETTER/1.0',
          },
          timeout: payload.timeout || 60000,
        }
      );

      return {
        taskId: response.data.taskId,
        status: response.data.status,
        result: response.data.result,
        creditsUsed: response.data.creditsUsed,
        executionTimeMs: response.data.executionTimeMs,
        model: response.data.model,
      };
    } catch (error) {
      console.error('Manus API error:', error);
      throw new ManusError('Failed to execute task on Manus', error);
    }
  }

  async getTaskStatus(taskId: string): Promise<ManusResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/agents/tasks/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Manus status check error:', error);
      throw new ManusError('Failed to get task status', error);
    }
  }

  async cancelTask(taskId: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/agents/tasks/${taskId}/cancel`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
    } catch (error) {
      console.error('Manus cancel error:', error);
      throw new ManusError('Failed to cancel task', error);
    }
  }

  calculateCostUSD(creditsUsed: number): number {
    return creditsUsed * this.creditRate;
  }
}

class ManusError extends Error {
  constructor(message: string, originalError?: any) {
    super(message);
    this.name = 'ManusError';
    console.error('[ManusError]', message, originalError);
  }
}

export default ManusClient;
```

---

## 🔄 PART 6: FALLBACK CHAIN IMPLEMENTATION

```typescript
// server/services/agents/agentExecutor.ts

import ManusClient from '@/services/manus/manusClient';
import PerplexityClient from '@/services/perplexity/perplexityClient';
import OpenAIClient from '@/services/openai/openaiClient';
import GeminiClient from '@/services/gemini/geminiClient';

interface AgentExecutionOptions {
  userBusinessId: number;
  taskId: string;
  prompt: string;
  context: Record<string, any>;
  maxRetries?: number;
  priority?: 'low' | 'normal' | 'high';
}

interface ExecutionResult {
  success: boolean;
  data?: Record<string, any>;
  model: string;
  creditsUsed: number;
  costUSD: number;
  executionTimeMs: number;
  error?: string;
  attempt: number;
}

export class AgentExecutor {
  private manus: ManusClient;
  private perplexity: PerplexityClient;
  private openai: OpenAIClient;
  private gemini: GeminiClient;

  constructor() {
    this.manus = new ManusClient(process.env.MANUS_API_KEY!);
    this.perplexity = new PerplexityClient(process.env.PERPLEXITY_API_KEY!);
    this.openai = new OpenAIClient(process.env.OPENAI_API_KEY!);
    this.gemini = new GeminiClient(process.env.GEMINI_API_KEY!);
  }

  async execute(options: AgentExecutionOptions): Promise<ExecutionResult> {
    const startTime = Date.now();
    const maxRetries = options.maxRetries || 3;

    // Primary: Manus
    try {
      console.log(`[${options.taskId}] Attempting Manus execution...`);
      const result = await this.manus.executeTask({
        prompt: options.prompt,
        context: options.context,
      });

      if (result.status === 'completed') {
        const executionTime = Date.now() - startTime;
        return {
          success: true,
          data: result.result,
          model: 'manus',
          creditsUsed: result.creditsUsed,
          costUSD: this.manus.calculateCostUSD(result.creditsUsed),
          executionTimeMs: executionTime,
          attempt: 1,
        };
      }
    } catch (error) {
      console.warn(`[${options.taskId}] Manus failed, trying Perplexity...`, error);
    }

    // Fallback 1: Perplexity
    try {
      const result = await this.perplexity.executeTask({
        prompt: options.prompt,
        context: options.context,
      });

      if (result.success) {
        const executionTime = Date.now() - startTime;
        return {
          success: true,
          data: result.data,
          model: 'perplexity',
          creditsUsed: result.tokensUsed,
          costUSD: result.costUSD,
          executionTimeMs: executionTime,
          attempt: 2,
        };
      }
    } catch (error) {
      console.warn(`[${options.taskId}] Perplexity failed, trying OpenAI...`, error);
    }

    // Fallback 2: OpenAI (GPT-4)
    try {
      const result = await this.openai.executeTask({
        prompt: options.prompt,
        model: 'gpt-4',
      });

      if (result.success) {
        const executionTime = Date.now() - startTime;
        return {
          success: true,
          data: result.data,
          model: 'openai',
          creditsUsed: result.tokensUsed,
          costUSD: result.costUSD,
          executionTimeMs: executionTime,
          attempt: 3,
        };
      }
    } catch (error) {
      console.warn(`[${options.taskId}] OpenAI failed, trying Gemini...`, error);
    }

    // Fallback 3: Gemini (last resort)
    try {
      const result = await this.gemini.executeTask({
        prompt: options.prompt,
        context: options.context,
      });

      if (result.success) {
        const executionTime = Date.now() - startTime;
        return {
          success: true,
          data: result.data,
          model: 'gemini',
          creditsUsed: result.tokensUsed,
          costUSD: result.costUSD,
          executionTimeMs: executionTime,
          attempt: 4,
        };
      }
    } catch (error) {
      console.error(`[${options.taskId}] All models failed`, error);
      return {
        success: false,
        model: 'none',
        creditsUsed: 0,
        costUSD: 0,
        executionTimeMs: Date.now() - startTime,
        error: 'All AI models failed to process this task',
        attempt: 4,
      };
    }
  }
}

export default new AgentExecutor();
```

---

## 🚨 PART 7: ERROR HANDLING & RESILIENCE

```typescript
// server/services/agents/errorHandler.ts

export enum ErrorSeverity {
  LOW = 'low',        // Can retry
  MEDIUM = 'medium',  // Requires attention
  HIGH = 'high',      // User notification needed
  CRITICAL = 'critical', // Immediate action required
}

export class AgentError extends Error {
  constructor(
    public severity: ErrorSeverity,
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export async function handleAgentError(
  error: any,
  taskId: string,
  userBusinessId: number
) {
  let severity = ErrorSeverity.MEDIUM;
  let code = 'UNKNOWN_ERROR';
  let message = 'An unknown error occurred';
  let shouldRetry = true;

  // API availability errors (retry)
  if (error.message.includes('timeout') || error.code === 'ECONNREFUSED') {
    severity = ErrorSeverity.MEDIUM;
    code = 'API_TIMEOUT';
    message = 'API request timed out. Will retry with fallback.';
    shouldRetry = true;
  }
  // Rate limit errors (retry with backoff)
  else if (error.response?.status === 429) {
    severity = ErrorSeverity.LOW;
    code = 'RATE_LIMIT';
    message = 'Rate limit hit. Will retry after backoff.';
    shouldRetry = true;
  }
  // Invalid input (don't retry)
  else if (error.response?.status === 400) {
    severity = ErrorSeverity.MEDIUM;
    code = 'INVALID_INPUT';
    message = 'Task input validation failed.';
    shouldRetry = false;
  }
  // Authentication errors (alert user)
  else if (error.response?.status === 401 || error.response?.status === 403) {
    severity = ErrorSeverity.HIGH;
    code = 'AUTH_FAILED';
    message = 'API authentication failed. Please check your credentials.';
    shouldRetry = false;
  }
  // Budget exceeded (critical - pause all agents)
  else if (error.message.includes('budget') || error.code === 'BUDGET_EXCEEDED') {
    severity = ErrorSeverity.CRITICAL;
    code = 'BUDGET_EXCEEDED';
    message = 'Daily credit budget exceeded. All agents paused.';
    shouldRetry = false;
  }

  // Log error to database
  await db.insert(agentErrors).values({
    taskId,
    userBusinessId,
    severity,
    code,
    message,
    details: error.details || {},
    shouldRetry,
    timestamp: new Date(),
  });

  // Take action based on severity
  if (severity === ErrorSeverity.CRITICAL) {
    await pauseAllAgents(userBusinessId);
    await sendCriticalAlert(userBusinessId, { code, message });
  } else if (severity === ErrorSeverity.HIGH) {
    await sendAlert(userBusinessId, { code, message });
  }

  return { severity, code, message, shouldRetry };
}

// Exponential backoff for retries
export function calculateBackoff(attempt: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attempt - 1), 30000); // Max 30 seconds
}

// Circuit breaker pattern to avoid cascading failures
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  check(): boolean {
    // If open, check if enough time has passed to try again
    if (this.state === 'open') {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      if (timeSinceFailure > 60000) { // 1 minute
        this.state = 'half-open';
        this.failures = 0;
        return true;
      }
      return false;
    }
    return true;
  }

  recordSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= 5) {
      this.state = 'open';
    }
  }

  getState() {
    return this.state;
  }
}
```

---

## 📊 PART 8: WEBHOOK HANDLER IMPLEMENTATION

```typescript
// server/routers/webhook.router.ts

import { router, publicProcedure } from '@/server/trpc';
import { z } from 'zod';
import agentExecutor from '@/services/agents/agentExecutor';

export const webhookRouter = router({
  // Receive incoming webhook data (lead, review, cart, etc.)
  processIncoming: publicProcedure
    .input(z.object({
      userBusinessId: z.number(),
      businessType: z.enum(['lead_qualification', 'review_response', 'cart_recovery']),
      externalId: z.string(), // client's ID
      data: z.record(z.any()), // Raw webhook payload
    }))
    .mutation(async ({ input }) => {
      const taskId = generateTaskId();

      try {
        // 1. Store task in database
        const task = await db.insert(agentTasks).values({
          userBusinessId: input.userBusinessId,
          taskType: input.businessType,
          externalId: input.externalId,
          inputData: input.data,
          status: 'pending',
          queuedAt: new Date(),
        });

        // 2. Queue for agent processing (BullMQ)
        await agentQueue.add(
          'execute-agent',
          {
            taskId,
            userBusinessId: input.userBusinessId,
            businessType: input.businessType,
            data: input.data,
          },
          {
            priority: input.data.priority || 'normal',
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
          }
        );

        return {
          success: true,
          taskId,
          status: 'queued',
        };
      } catch (error) {
        console.error(`Failed to queue task ${taskId}`, error);
        return {
          success: false,
          error: 'Failed to process webhook',
        };
      }
    }),
});

// BullMQ worker
agentQueue.process('execute-agent', async (job) => {
  const { taskId, userBusinessId, businessType, data } = job.data;

  try {
    // Check user's credit budget
    const budgetCheck = await checkDailyBudget(userBusinessId);
    if (!budgetCheck.hasCapacity) {
      throw new AgentError(
        ErrorSeverity.CRITICAL,
        'Daily budget exceeded',
        'BUDGET_EXCEEDED'
      );
    }

    // Generate agent prompt based on business type
    const prompt = generatePrompt(businessType, data);

    // Execute agent
    const result = await agentExecutor.execute({
      userBusinessId,
      taskId,
      prompt,
      context: data,
    });

    // Update task with results
    await db.update(agentTasks).set({
      outputData: result.data,
      status: 'completed',
      creditsUsed: result.creditsUsed,
      costUsd: result.costUSD,
      completedAt: new Date(),
    });

    // Log credits
    await trackCredits({
      userBusinessId,
      taskId,
      creditsUsed: result.creditsUsed,
      costUSD: result.costUSD,
      modelUsed: result.model,
      taskType: businessType,
      status: 'completed',
    });

    // Trigger client's webhook
    await triggerWebhook(userBusinessId, taskId, result.data);

    return { success: true };
  } catch (error) {
    await handleAgentError(error, taskId, userBusinessId);
    throw error;
  }
});

async function triggerWebhook(
  userBusinessId: number,
  taskId: string,
  data: Record<string, any>
) {
  const user = await db.selectFrom(userBusinesses).where('id', '=', userBusinessId).selectAll();
  const webhookUrl = user.webhookUrl;

  if (!webhookUrl) return;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await axios.post(webhookUrl, {
        taskId,
        data,
        timestamp: new Date().toISOString(),
      });

      if (response.status === 200 || response.status === 201) {
        // Success
        await db.update(agentTasks).set({
          webhookStatus: 'sent',
        }).where('id', '=', taskId);
        return;
      }
    } catch (error) {
      const delay = calculateBackoff(attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All attempts failed
  await db.update(agentTasks).set({
    webhookStatus: 'failed',
    webhookError: 'All retry attempts failed',
  }).where('id', '=', taskId);
}
```

---

## 🔐 PART 9: AUTHENTICATION & SECURITY

```typescript
// server/middleware/apiKeyAuth.ts

import { TRPCError } from '@trpc/server';

const API_KEY_PREFIX = 'ggetter_';

export async function validateAPIKey(apiKey: string) {
  if (!apiKey || !apiKey.startsWith(API_KEY_PREFIX)) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid API key',
    });
  }

  // Look up API key in database
  const key = await db
    .selectFrom(apiKeys)
    .where('key', '=', hashKey(apiKey))
    .selectAll()
    .executeTakeFirst();

  if (!key || !key.isActive) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'API key not found or disabled',
    });
  }

  // Check rate limit
  const usage = await getKeyUsage(key.id);
  if (usage.requestsThisMinute > 100) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded',
    });
  }

  return key.userBusinessId;
}

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// Middleware
export const apiKeyMiddleware = (ctx: Context, next: Next) => {
  const apiKey = ctx.headers['x-api-key'];
  if (!apiKey) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  ctx.userBusinessId = await validateAPIKey(apiKey);
  return next();
};
```

---

## ✅ PART 10: TESTING & VALIDATION (Weeks 1-2)

```typescript
// __tests__/manus.integration.test.ts

import { describe, it, expect, beforeAll } from '@jest/globals';
import ManusClient from '@/services/manus/manusClient';
import { AgentExecutor } from '@/services/agents/agentExecutor';

describe('Manus Integration Tests', () => {
  let manus: ManusClient;
  let executor: AgentExecutor;

  beforeAll(() => {
    manus = new ManusClient(process.env.MANUS_API_KEY!);
    executor = new AgentExecutor();
  });

  it('should execute a simple task on Manus', async () => {
    const result = await manus.executeTask({
      prompt: 'Classify this lead: Name=John, Company=Acme, Message="Interested in pricing"',
      context: { leadId: '123' },
    });

    expect(result.status).toBe('completed');
    expect(result.creditsUsed).toBeGreaterThan(0);
    expect(result.model).toBeTruthy();
  });

  it('should handle Manus timeout with fallback', async () => {
    const result = await executor.execute({
      userBusinessId: 1,
      taskId: 'test-123',
      prompt: 'Test classification task',
      context: {},
      maxRetries: 3,
    });

    expect(result.success).toBe(true);
    expect(['manus', 'perplexity', 'openai', 'gemini']).toContain(result.model);
  });

  it('should track credits correctly', async () => {
    const task = await executor.execute({
      userBusinessId: 1,
      taskId: 'cost-test',
      prompt: 'Simple task',
      context: {},
    });

    expect(task.costUSD).toBe(task.creditsUsed * 0.01);
  });

  it('should enforce daily budget limits', async () => {
    // Set low daily budget
    await setDailyBudget(1, 1.00); // $1

    const result = await executor.execute({
      userBusinessId: 1,
      taskId: 'budget-test',
      prompt: 'This should exceed budget',
      context: {},
    });

    // Should fail because budget exceeded
    expect(result.success).toBe(false);
  });
});
```

---

## 📋 DEPLOYMENT CHECKLIST (Weeks 1-2)

### Week 1
- [ ] Set up Manus account + API key
- [ ] Get Perplexity, OpenAI, Gemini API keys
- [ ] Create database schema (agentTasks, manusCredits, creditBudgets)
- [ ] Implement ManusClient
- [ ] Implement Fallback Chain
- [ ] Implement credit tracking
- [ ] Write unit tests

### Week 2
- [ ] Deploy to staging
- [ ] Test with mock data (50 tasks)
- [ ] Monitor credit usage and costs
- [ ] Implement kill switches
- [ ] Set up error alerts
- [ ] Document API endpoints
- [ ] Prepare for Week 3 (business templates)

---

## 🎯 SUCCESS CRITERIA (End of Week 2)

✅ Manus API successfully executes 100+ test tasks
✅ Credit tracking accurate within 0.1%
✅ Fallback chain working (all 4 models tested)
✅ Daily budget limits enforced
✅ Error handling comprehensive (<0.5% failure rate)
✅ Ready to deploy first 3 businesses
✅ Cost per task predictable and logged

---

## NEXT STEPS (Week 3+)

Once Manus integration is proven, you're ready for:

1. **Lead Qualification Agent** (Manus prompt + tRPC router)
2. **Review Response Agent** (Multi-platform integration)
3. **Abandoned Cart Recovery** (Shopify webhook integration)

Each business builds on this foundation. 🚀
