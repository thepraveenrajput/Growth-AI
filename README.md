# RazorGrowth AI — Agentic Merchant Growth Copilot

> **Disclaimer**: Independent student project built for the Razorpay AI Builder Internship 2026 challenge. Uses synthetic payment data and does not represent an official Razorpay product.

RazorGrowth AI is an AI-powered merchant decision-support copilot designed to analyze payment transaction feeds, algorithmically isolate revenue leaks, run diagnostics using payment analysis tools, and deliver explainable, actionable recommendations to increase successful payment volumes.

---

## 1. The Business Problem

For online merchants, a payment dashboard is not enough. Seeing that a payment success rate has dropped from 94% to 88% tells a merchant *that* something is wrong, but it does not tell them *why* it is wrong, *which* customer segments are affected, *what* financial impact it has, or *how* to fix it.

RazorGrowth AI bridges this gap. It answers:
1. What is causing payment failures on my platform?
2. Which opportunity represents the highest revenue leak?
3. What concrete action should I take right now?
4. What would the estimated revenue recovery be if I resolve this?

---

## 2. Why Agentic AI?

Traditional analytical platforms show static graphs. General chatbots generate generic answers based on static prompts.

**RazorGrowth AI** uses **Agentic AI**:
- The AI does not guess statistics. It uses defined **Local Analytical Tools** (`get_payment_method_metrics`, `get_hourly_performance`, etc.) to run queries over the actual database.
- It reasons iteratively: checking global success rates, comparing methods, examining failure reasons, and pulling contextual articles from an internal **RAG Knowledge Base**.
- It prevents hallucination: if the dataset does not contain sufficient data, it is constrained to report *"Insufficient evidence to determine the cause."*

---

## 3. Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (v4)
- **Database**: PostgreSQL (Docker-based)
- **ORM**: Prisma Client
- **AI Engine**: Google Gemini API (`gemini-1.5-flash`) via the `@google/generative-ai` SDK
- **Testing**: Node.js Native Test Runner with `tsx` execution

---

## 4. Database Schema

The database model is configured via Prisma:
- `Merchant`: The profile of the merchant using the copilot.
- `Customer`: Customer profiles categorized by segments (`SMB`, `Mid-Market`, `Enterprise`).
- `Transaction`: Transaction records containing amount, status (`SUCCESS`, `FAILED`), paymentMethod (`UPI`, `CARD`, `NETBANKING`, `WALLET`), and failure reasons (`BANK_DEGRADED`, `INSUFFICIENT_FUNDS`, etc.).
- `Opportunity`: Rule-based identified inefficiencies (e.g. UPI evening degradation).
- `Recommendation`: AI-generated playbooks linked to opportunities.
- `AgentRun` & `AgentToolCall`: Observability logging of the AI agent's tool calls and execution trace.
- `KnowledgeDocument`: Dynamic payment guides searched via keyword-matching RAG.
- `MerchantAction`: Audit logs recording merchant approvals and rejections.

---

## 5. Opportunity Detection Rules

Before the AI agent intervenes, a rule-based engine runs over the database to detect:
1. **UPI Evening Peak Failure**: Triggers when UPI success rates drop by > 5% between 7 PM and 10 PM daily.
2. **Method Underperformance**: Triggers if any payment method performs > 8% below the merchant baseline (e.g. Netbanking).
3. **High-Value Customer Failures**: Identifies failed transactions from Enterprise customers with historical spend > ₹25,000 in the last 72 hours.
4. **Customer Drop-Off**: Triggers if a customer segment experiences a > 15% drop-off in transaction volume week-over-week.

---

## 6. Setup & Execution

### Prerequisites
- Node.js (v20+)
- Docker Desktop (Running)

### 1. Database Initialization
Spin up the PostgreSQL Docker container (port 5432):
```bash
docker run --name razorgrowth-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```

### 2. Configure Environment Variables
Create a `.env` file in the root folder:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"
GEMINI_API_KEY="YOUR_GOOGLE_AI_STUDIO_API_KEY"
```
*Note: If the `GEMINI_API_KEY` is omitted, the copilot runs in **Local Diagnostic Mode (Offline)** using deterministic metrics and fallback reasoning.*

### 3. Install Dependencies
```bash
npm install
```

### 4. Apply Database Migrations & Seed
Apply database structures and generate the synthetic dataset (~48,000 transactions containing seasonal failures, underperforming methods, and knowledge guides):
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. Run Automated Tests
Execute the unit and integration tests verifying analytics calculations, detector logic, and AI safety:
```bash
npm test
```
*(Or manually: `npx tsx --test src/__tests__/analytics.test.ts src/__tests__/detector.test.ts src/__tests__/agent.test.ts`)*

### 6. Run the Local Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Interactive Demo Workflow

To verify the core product values, follow this 5-step flow in the dashboard:
1. **Dashboard**: Observe the overall success rate is 91.8%.
2. **Opportunities**: Notice that a **UPI Evening Success Rate Spike** has been detected as high priority.
3. **AI Growth Agent**: Ask *"Why did my UPI success rate drop?"*. Watch the agent execute `get_payment_method_metrics` and `get_hourly_performance` tools in real-time, compile metrics showing a drop to 84% between 7 PM - 10 PM, cite HDFC/SBI bank failures, and return a recommendation.
4. **Approve Action**: Click **Approve** on the recommendation. Inspect the **Activity Log** to verify the action is saved in the audit log.
5. **Simulator**: Adjust the target success rate slider to 95% and see the deterministic revenue opportunity dynamically calculate.
