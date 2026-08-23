import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to generate a random number within normal distribution
function randomNormal(mean: number, stdDev: number, min: number = 0): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  num = num * stdDev + mean;
  return Math.max(min, Math.round(num));
}

// Random pick from array
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean Database
  console.log('🧹 Cleaning existing database records...');
  await prisma.merchantAction.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.agentToolCall.deleteMany();
  await prisma.agentRun.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.merchant.deleteMany();
  await prisma.knowledgeDocument.deleteMany();

  // 2. Create Demo Merchant
  console.log('🏢 Creating demo merchant...');
  const merchant = await prisma.merchant.create({
    data: {
      id: 'demo-merchant',
      name: 'RazorGrowth Demo Merchant',
      email: 'merchant@razorgrowth.ai',
    },
  });

  // 3. Create Customers (1,000 customers with specific segments)
  console.log('👥 Generating 1,000 synthetic customers...');
  const customerSegments = ['SMB', 'Mid-Market', 'Enterprise'];
  const segmentWeights = [0.70, 0.25, 0.05]; // 70% SMB, 25% Mid-Market, 5% Enterprise

  const customersData = Array.from({ length: 1000 }).map((_, index) => {
    // Determine segment based on weight
    const r = Math.random();
    let segment = 'SMB';
    if (r < segmentWeights[2]) {
      segment = 'Enterprise';
    } else if (r < segmentWeights[2] + segmentWeights[1]) {
      segment = 'Mid-Market';
    }

    return {
      id: `cust-${index + 1}`,
      name: `Customer ${index + 1}`,
      email: `customer${index + 1}@example.com`,
      segment: segment,
    };
  });

  await prisma.customer.createMany({
    data: customersData,
  });

  // Fetch the created customers
  const customers = await prisma.customer.findMany();
  const vipCustomers = customers.filter(c => c.segment === 'Enterprise').slice(0, 10);
  const vipCustomerIds = vipCustomers.map(c => c.id);

  // 4. Generate ~50,000 Transactions over 30 days
  console.log('💸 Generating ~50,000 transactions over 30 days...');
  const transactions = [];
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const paymentMethods = ['UPI', 'CARD', 'NETBANKING', 'WALLET'];
  // Method weights: UPI (50%), CARD (30%), NETBANKING (15%), WALLET (5%)
  const methodPickList = [
    ...Array(50).fill('UPI'),
    ...Array(30).fill('CARD'),
    ...Array(15).fill('NETBANKING'),
    ...Array(5).fill('WALLET'),
  ];

  // Device types
  const devices = ['MOBILE', 'DESKTOP', 'TABLET'];
  const devicePickList = [
    ...Array(70).fill('MOBILE'),
    ...Array(25).fill('DESKTOP'),
    ...Array(5).fill('TABLET'),
  ];

  // Generate day-by-day to create trends
  for (let d = 0; d < 30; d++) {
    const currentDayDate = new Date(thirtyDaysAgo);
    currentDayDate.setDate(thirtyDaysAgo.getDate() + d);

    // Number of transactions per day: average ~1650, standard dev ~150
    // Simulating slightly lower volume on weekends
    const isWeekend = currentDayDate.getDay() === 0 || currentDayDate.getDay() === 6;
    const baseDailyVolume = isWeekend ? 1300 : 1750;
    const dailyCount = randomNormal(baseDailyVolume, 100, 1000);

    for (let t = 0; t < dailyCount; t++) {
      // Pick random customer
      const customer = pickRandom(customers);
      
      // Determine timestamp within the day with a realistic hourly distribution
      // Peaks around lunch (12-14) and evening (19-22)
      let hour = 0;
      const hourRandom = Math.random();
      if (hourRandom < 0.15) {
        hour = Math.floor(Math.random() * 6); // Midnight to 6 AM (low)
      } else if (hourRandom < 0.40) {
        hour = 6 + Math.floor(Math.random() * 6); // 6 AM to 12 PM (moderate)
      } else if (hourRandom < 0.65) {
        hour = 12 + Math.floor(Math.random() * 6); // 12 PM to 6 PM (lunch peak/afternoon)
      } else {
        hour = 18 + Math.floor(Math.random() * 6); // 6 PM to midnight (evening peak)
      }

      const minutes = Math.floor(Math.random() * 60);
      const seconds = Math.floor(Math.random() * 60);
      const transactionTime = new Date(currentDayDate);
      transactionTime.setHours(hour, minutes, seconds);

      // Amount based on customer segment
      let amount = 0;
      if (customer.segment === 'Enterprise') {
        amount = randomNormal(18000, 6000, 5000);
      } else if (customer.segment === 'Mid-Market') {
        amount = randomNormal(3200, 800, 1000);
      } else {
        amount = randomNormal(380, 150, 15);
      }

      // Select payment method
      const paymentMethod = pickRandom(methodPickList);

      // Select device
      const deviceType = pickRandom(devicePickList);

      // Determine Transaction Status and Failure Reasons
      let status = 'SUCCESS';
      let failureReason = null;

      const randomValue = Math.random() * 100;

      // SCENARIO 1: UPI Evening degradation (7 PM - 10 PM, hours 19, 20, 21) in the last 14 days
      const isUpiEveningDegradation = 
        paymentMethod === 'UPI' && 
        (hour === 19 || hour === 20 || hour === 21) && 
        d >= 16; // Last 14 days of our 30-day period

      // SCENARIO 2: High-value customer failure in the last 3 days
      const isHighValueCustomerFailure = 
        vipCustomerIds.includes(customer.id) && 
        d >= 27 && // Last 3 days
        Math.random() < 0.60; // 60% failure rate for VIP customers in last 3 days

      if (isHighValueCustomerFailure) {
        status = 'FAILED';
        // Give reasons that indicate high-value failures
        failureReason = pickRandom(['INSUFFICIENT_FUNDS', 'BANK_DEGRADED']);
      } else if (isUpiEveningDegradation) {
        // Drop UPI success rate to 84% during evening peak hours
        if (randomValue > 84.0) {
          status = 'FAILED';
          // Heavy focus on BANK_DEGRADED to simulate UPI bank downtime
          failureReason = Math.random() < 0.80 ? 'BANK_DEGRADED' : 'NETWORK_TIMEOUT';
        }
      } else {
        // Standard Baseline Success Rates
        let successThreshold = 91.8; // default
        if (paymentMethod === 'CARD') {
          successThreshold = 93.5;
        } else if (paymentMethod === 'NETBANKING') {
          successThreshold = 74.5; // Netbanking underperformance
        } else if (paymentMethod === 'WALLET') {
          successThreshold = 96.0;
        } else if (paymentMethod === 'UPI') {
          successThreshold = 91.8;
        }

        if (randomValue > successThreshold) {
          status = 'FAILED';
          // Standard failure reason distribution
          if (paymentMethod === 'NETBANKING') {
            failureReason = pickRandom(['BANK_DEGRADED', 'NETWORK_TIMEOUT', 'USER_ABORTED']);
          } else if (paymentMethod === 'CARD') {
            failureReason = pickRandom(['INSUFFICIENT_FUNDS', 'USER_ABORTED', 'NETWORK_TIMEOUT']);
          } else {
            failureReason = pickRandom(['USER_ABORTED', 'INSUFFICIENT_FUNDS', 'BANK_DEGRADED']);
          }
        }
      }

      transactions.push({
        merchantId: merchant.id,
        customerId: customer.id,
        amount: Math.round(amount * 100) / 100, // round to 2 decimals
        currency: 'INR',
        paymentMethod: paymentMethod,
        status: status,
        failureReason: failureReason,
        deviceType: deviceType,
        customerSegment: customer.segment,
        timestamp: transactionTime,
      });
    }
  }

  // Bulk Insert Transactions in chunks of 5000 to keep memory low and database happy
  console.log(`⚡ Inserting ${transactions.length} transactions into PostgreSQL...`);
  const chunkSize = 5000;
  for (let i = 0; i < transactions.length; i += chunkSize) {
    const chunk = transactions.slice(i, i + chunkSize);
    await prisma.transaction.createMany({
      data: chunk,
    });
    console.log(`   └─ Inserted chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(transactions.length / chunkSize)}`);
  }

  // 5. Seed Knowledge Base Articles
  console.log('📚 Seeding payment optimization articles...');
  const articles = [
    {
      title: 'UPI Success Rate Optimization and Fallback Routing',
      category: 'UPI',
      content: `### UPI Success Rate Optimization

Unified Payments Interface (UPI) is the primary payment mechanism in India, accounting for over 70% of digital retail transactions. However, UPI success rates are subject to bank node degradation and PSP (Payment Service Provider) server issues.

#### Key Optimization Strategies:
1. **Dynamic Bank Downtime Detection**: Maintain a rolling window of UPI failure reasons. If failures with reason \`BANK_DEGRADED\` spike above 15% for a specific issuing bank, temporarily route transactions to an alternative PSP bank or prompt the user to switch UPI apps (e.g., from PhonePe to Google Pay).
2. **Intent Flow vs. Collect Flow**: In mobile applications, prefer UPI Intent flow. UPI Intent opens the UPI app directly on the phone, eliminating collect-request timeouts and manual address typos, lifting success rates by 8-12%.
3. **Smart Retries**: For non-user errors (like network timeout), implement an auto-retry backoff. If the bank times out, retry through an alternate aggregator endpoint within 2-3 seconds.
4. **App Fallbacks**: Guide customers to switch to Card or Netbanking if their default UPI PSP bank is undergoing active degradation.`,
    },
    {
      title: 'Handling Bank Degraded States in Real-Time Payments',
      category: 'RETRY_STRATEGY',
      content: `### Managing Bank Degraded States

When a bank gateway goes down, transaction success rates plummet, causing customer frustration and cart abandonment. Managing this programmatically protects merchant GMV.

#### Diagnosis of Gateways:
- **BANK_DEGRADED**: Returned when the issuing or acquiring bank gateway is unresponsive or rejects transactions explicitly due to internal bank server failure.
- **NETWORK_TIMEOUT**: Typically happens during transaction validation or OTP submission where the connection is dropped.

#### Recommended Action Plan:
- **Real-Time Downtime Alerts**: Detect when 5 consecutive transactions for a payment method fail due to \`BANK_DEGRADED\`.
- **Reroute Aquiring Gateways**: If you are multi-homed (using multiple payment gateways/aggregators), dynamically direct traffic away from the degraded bank gateway to the secondary gateway.
- **Frontend Notification**: Notify merchants or show an inline warning to users: *"UPI payments via HDFC Bank are currently slow. We recommend paying via Card or another UPI handle."*
- **Auto-Retry Session Preservation**: Retain checkout state so customers don't have to re-enter their details if a network error occurs.`,
    },
    {
      title: 'Card Retry Strategies for Mid-Market & Enterprise Merchants',
      category: 'CARD',
      content: `### Optimizing Card Transaction Success

Card payments (Credit and Debit) remain the backbone of high-value transactions. Cart success rates are primarily impacted by cardholder authentication (3D Secure / OTP timeouts) and insufficient funds.

#### Strategies to Drive Card Success:
1. **OTP Assist / Auto-Read**: In mobile apps, use SMS auto-read libraries to pre-populate OTP boxes. This reduces user drop-off during the 3DS verification page, which accounts for 40% of card failures.
2. **Dynamic Route Optimizer**: Automatically detect card networks (Visa, Mastercard, RuPay) and route transactions to the gateway with the highest performance for that specific network.
3. **Card Tokenization (CoFT)**: Enable Card-on-File Tokenization. Tokenized cards require only the CVV and OTP to complete a transaction, bypassing card number input. This increases repeat customer success rates by up to 5%.
4. **Auto-Retry on Soft Declines**: If a transaction fails with a retryable code (like gateway timeout), perform an automatic background retry using an alternative gateway session before informing the merchant/user of the failure.`,
    },
    {
      title: 'Rerouting Netbanking Failures Dynamically',
      category: 'NETBANKING',
      content: `### Overcoming Netbanking Performance Issues

Netbanking is highly reliable in terms of payment finality but suffers from poor success rates due to outdated bank portals, complex authorization flows, and user drop-off on legacy screens.

#### Remediation and Optimization:
1. **Fallback to UPI**: Since Netbanking links directly to bank accounts, promote UPI as the primary payment method. Provide a one-click transition: *"UPI is faster and has a 20% higher success rate than Netbanking. Would you like to use UPI instead?"*
2. **Direct Integrations**: For high-volume banks (SBI, HDFC, ICICI, Axis), ensure direct API integrations rather than routing through third-party intermediaries to reduce network hops.
3. **Intelligent Routing**: Route Netbanking transactions through an aggregator with a direct host-to-host channel with the chosen bank.
4. **Failure Analysis**: Monitor for \`USER_ABORTED\` versus \`BANK_DEGRADED\` in Netbanking. A high \`USER_ABORTED\` rate suggests the user got stuck on the bank's portal or OTP page, which warrants a payment method alternative prompt.`,
    },
    {
      title: 'Identifying Customer Drop-off & Enhancing Success Rates',
      category: 'GROWTH',
      content: `### Preventing Customer Drop-Off and Retention Loss

Customer drop-off happens when users stop making purchases, or experience repeated payment failures and leave the merchant's platform.

#### Actionable Frameworks:
1. **Identify At-Risk Segments**: Segment customers by transaction frequency (Recency, Frequency, Monetary value). If the repeat purchase interval of a segment increases by 25%, trigger a drop-off warning.
2. **Post-Failure Engagement**: If a customer experiences a payment failure, immediately offer a recovery link via email/SMS. This links back to the active shopping cart with the payment method pre-configured to a high-success alternative.
3. **Targeted Checkout Promotions**: Highlight payment methods with the highest success rates for each customer. For example, if a customer's primary UPI app is experiencing high failure rates, prioritize cards or another digital wallet in their UI.
4. **Success Incentives**: Offer small incentives (e.g., free shipping, cashbacks) when customers tokenise their cards or verify their UPI handles, as tokenized methods have a 6% higher completion rate.`,
    }
  ];

  await prisma.knowledgeDocument.createMany({
    data: articles,
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
