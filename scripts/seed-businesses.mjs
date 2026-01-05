import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const businesses = [
  // CONTENT & MEDIA - High Score (Prime/Stable)
  {
    name: "AI Content Syndication Network",
    description: "Automated content aggregation and redistribution across multiple platforms. AI agents curate trending content, rewrite for different audiences, and distribute to niche blogs and social media accounts. Revenue from affiliate links and sponsored placements.",
    vertical: "content_media",
    guaranteed_demand: 85,
    automation_level: 95,
    token_efficiency: 80,
    profit_margin: 75,
    maintenance_cost: 20,
    legal_risk: 25,
    competition_saturation: 40,
    estimated_revenue_per_hour: "2.50",
    estimated_token_cost_per_hour: "0.15",
    estimated_infra_cost_per_day: "3.00",
    setup_cost: "50.00",
    setup_time_hours: 8,
    min_agents_required: 3,
    recommended_models: JSON.stringify(["gpt-4o-mini", "claude-3-haiku", "gemini-flash"]),
    required_apis: JSON.stringify(["OpenAI", "Social Media APIs", "RSS Feeds"]),
    infra_requirements: JSON.stringify(["Cloud hosting", "Database", "CDN"]),
    implementation_guide: "1. Set up content aggregation pipelines from RSS feeds and social APIs\\n2. Configure AI agents for content curation and rewriting\\n3. Deploy distribution bots to target platforms\\n4. Implement affiliate link injection\\n5. Set up analytics and revenue tracking\\n6. Configure auto-scaling based on engagement metrics"
  },
  {
    name: "Automated Newsletter Empire",
    description: "AI-powered newsletter generation targeting micro-niches. Agents research topics, write engaging content, manage subscriber lists, and optimize for open rates. Monetized through sponsorships and premium tiers.",
    vertical: "content_media",
    guaranteed_demand: 90,
    automation_level: 90,
    token_efficiency: 85,
    profit_margin: 80,
    maintenance_cost: 15,
    legal_risk: 15,
    competition_saturation: 35,
    estimated_revenue_per_hour: "3.00",
    estimated_token_cost_per_hour: "0.12",
    estimated_infra_cost_per_day: "2.00",
    setup_cost: "30.00",
    setup_time_hours: 6,
    min_agents_required: 2,
    recommended_models: JSON.stringify(["gpt-4o", "claude-3-sonnet"]),
    required_apis: JSON.stringify(["OpenAI", "Mailchimp/ConvertKit", "News APIs"]),
    infra_requirements: JSON.stringify(["Email service", "Landing pages", "Analytics"]),
    implementation_guide: "1. Identify 5-10 profitable micro-niches with low competition\\n2. Set up newsletter platforms (Substack, Beehiiv, or self-hosted)\\n3. Configure AI content generation pipelines\\n4. Implement subscriber growth automation\\n5. Set up sponsorship marketplace integration\\n6. Deploy engagement optimization agents"
  },
  {
    name: "Stock Photo Licensing Bot",
    description: "AI generates unique stock photos and illustrations, uploads to multiple marketplaces, and manages licensing. Passive income from downloads with minimal ongoing work.",
    vertical: "content_media",
    guaranteed_demand: 75,
    automation_level: 92,
    token_efficiency: 70,
    profit_margin: 85,
    maintenance_cost: 10,
    legal_risk: 20,
    competition_saturation: 50,
    estimated_revenue_per_hour: "1.50",
    estimated_token_cost_per_hour: "0.25",
    estimated_infra_cost_per_day: "1.50",
    setup_cost: "100.00",
    setup_time_hours: 12,
    min_agents_required: 2,
    recommended_models: JSON.stringify(["DALL-E 3", "Midjourney", "Stable Diffusion"]),
    required_apis: JSON.stringify(["Image Generation APIs", "Stock Platform APIs"]),
    infra_requirements: JSON.stringify(["Image storage", "Metadata management", "Multi-platform upload"]),
    implementation_guide: "1. Research trending stock photo categories and keywords\\n2. Set up image generation pipeline with style consistency\\n3. Implement metadata and tagging automation\\n4. Configure multi-platform upload (Shutterstock, Adobe Stock, etc.)\\n5. Deploy pricing optimization agent\\n6. Set up revenue tracking and analytics"
  },

  // DIGITAL SERVICES - High Score
  {
    name: "AI Customer Support Reseller",
    description: "White-label AI customer support service for small businesses. Agents handle inquiries, process returns, and escalate complex issues. Subscription-based pricing with per-interaction fees.",
    vertical: "digital_services",
    guaranteed_demand: 95,
    automation_level: 88,
    token_efficiency: 75,
    profit_margin: 70,
    maintenance_cost: 25,
    legal_risk: 20,
    competition_saturation: 30,
    estimated_revenue_per_hour: "5.00",
    estimated_token_cost_per_hour: "0.30",
    estimated_infra_cost_per_day: "5.00",
    setup_cost: "200.00",
    setup_time_hours: 24,
    min_agents_required: 5,
    recommended_models: JSON.stringify(["gpt-4o", "claude-3-sonnet", "gemini-pro"]),
    required_apis: JSON.stringify(["OpenAI", "Anthropic", "CRM APIs", "Helpdesk APIs"]),
    infra_requirements: JSON.stringify(["Multi-tenant platform", "Chat widgets", "Knowledge base", "Analytics"]),
    implementation_guide: "1. Build white-label customer support platform\\n2. Implement multi-tenant architecture\\n3. Create customizable AI agent templates\\n4. Set up integration with popular helpdesk tools\\n5. Deploy escalation and human handoff system\\n6. Implement usage-based billing"
  },
  {
    name: "Automated Code Review Service",
    description: "AI-powered code review and security scanning service. Agents analyze pull requests, identify bugs, suggest improvements, and check for vulnerabilities. Per-repository subscription model.",
    vertical: "digital_services",
    guaranteed_demand: 80,
    automation_level: 95,
    token_efficiency: 65,
    profit_margin: 75,
    maintenance_cost: 20,
    legal_risk: 15,
    competition_saturation: 25,
    estimated_revenue_per_hour: "4.00",
    estimated_token_cost_per_hour: "0.40",
    estimated_infra_cost_per_day: "4.00",
    setup_cost: "150.00",
    setup_time_hours: 20,
    min_agents_required: 3,
    recommended_models: JSON.stringify(["gpt-4o", "claude-3-opus", "codellama"]),
    required_apis: JSON.stringify(["GitHub API", "GitLab API", "OpenAI", "Anthropic"]),
    infra_requirements: JSON.stringify(["Git integration", "CI/CD hooks", "Dashboard", "Notification system"]),
    implementation_guide: "1. Build GitHub/GitLab app for repository access\\n2. Implement code analysis pipeline\\n3. Create security vulnerability scanner\\n4. Set up automated PR commenting\\n5. Deploy dashboard for insights\\n6. Implement subscription management"
  },
  {
    name: "AI Resume Optimization SaaS",
    description: "Automated resume analysis and optimization service. AI agents parse resumes, match against job descriptions, suggest improvements, and generate ATS-friendly versions. Freemium model with premium features.",
    vertical: "digital_services",
    guaranteed_demand: 88,
    automation_level: 92,
    token_efficiency: 80,
    profit_margin: 82,
    maintenance_cost: 15,
    legal_risk: 10,
    competition_saturation: 45,
    estimated_revenue_per_hour: "2.00",
    estimated_token_cost_per_hour: "0.08",
    estimated_infra_cost_per_day: "2.00",
    setup_cost: "75.00",
    setup_time_hours: 16,
    min_agents_required: 2,
    recommended_models: JSON.stringify(["gpt-4o-mini", "claude-3-haiku"]),
    required_apis: JSON.stringify(["OpenAI", "PDF parsing", "Job board APIs"]),
    infra_requirements: JSON.stringify(["Web app", "Document processing", "User accounts"]),
    implementation_guide: "1. Build resume upload and parsing system\\n2. Implement job description matching algorithm\\n3. Create AI optimization suggestions engine\\n4. Set up ATS-friendly export formats\\n5. Deploy freemium subscription system\\n6. Implement A/B testing for conversion optimization"
  },

  // E-COMMERCE AUTOMATION - High Score
  {
    name: "Dropshipping Product Research Bot",
    description: "AI agents continuously scan marketplaces for trending products, analyze profit margins, and identify dropshipping opportunities. Provides curated product lists with supplier contacts and pricing analysis.",
    vertical: "ecommerce",
    guaranteed_demand: 85,
    automation_level: 90,
    token_efficiency: 85,
    profit_margin: 70,
    maintenance_cost: 20,
    legal_risk: 15,
    competition_saturation: 40,
    estimated_revenue_per_hour: "2.00",
    estimated_token_cost_per_hour: "0.10",
    estimated_infra_cost_per_day: "2.50",
    setup_cost: "80.00",
    setup_time_hours: 10,
    min_agents_required: 3,
    recommended_models: JSON.stringify(["gpt-4o-mini", "gemini-flash"]),
    required_apis: JSON.stringify(["Amazon API", "AliExpress API", "eBay API", "Google Trends"]),
    infra_requirements: JSON.stringify(["Data scraping", "Database", "Dashboard", "Alerts"]),
    implementation_guide: "1. Set up marketplace data collection pipelines\\n2. Implement trend analysis algorithms\\n3. Create profit margin calculator\\n4. Build supplier database with ratings\\n5. Deploy alert system for hot products\\n6. Set up subscription tiers with different access levels"
  },
  {
    name: "AI Price Optimization Engine",
    description: "Dynamic pricing service for e-commerce stores. AI monitors competitor prices, demand patterns, and inventory levels to automatically adjust prices for maximum profit. Per-SKU pricing model.",
    vertical: "ecommerce",
    guaranteed_demand: 82,
    automation_level: 95,
    token_efficiency: 90,
    profit_margin: 75,
    maintenance_cost: 15,
    legal_risk: 10,
    competition_saturation: 30,
    estimated_revenue_per_hour: "3.50",
    estimated_token_cost_per_hour: "0.05",
    estimated_infra_cost_per_day: "3.00",
    setup_cost: "120.00",
    setup_time_hours: 18,
    min_agents_required: 2,
    recommended_models: JSON.stringify(["gpt-4o-mini", "custom ML models"]),
    required_apis: JSON.stringify(["Shopify API", "WooCommerce API", "Competitor scraping"]),
    infra_requirements: JSON.stringify(["Real-time data processing", "ML pipeline", "Dashboard"]),
    implementation_guide: "1. Build e-commerce platform integrations\\n2. Implement competitor price monitoring\\n3. Create demand forecasting models\\n4. Deploy dynamic pricing algorithms\\n5. Set up A/B testing for price strategies\\n6. Implement ROI tracking dashboard"
  },
  {
    name: "Automated Review Response Manager",
    description: "AI agents monitor and respond to product reviews across marketplaces. Handles positive reviews with thank-yous, addresses negative feedback professionally, and escalates issues requiring human attention.",
    vertical: "ecommerce",
    guaranteed_demand: 78,
    automation_level: 88,
    token_efficiency: 85,
    profit_margin: 80,
    maintenance_cost: 12,
    legal_risk: 15,
    competition_saturation: 35,
    estimated_revenue_per_hour: "1.80",
    estimated_token_cost_per_hour: "0.08",
    estimated_infra_cost_per_day: "1.50",
    setup_cost: "60.00",
    setup_time_hours: 8,
    min_agents_required: 2,
    recommended_models: JSON.stringify(["gpt-4o-mini", "claude-3-haiku"]),
    required_apis: JSON.stringify(["Amazon Seller API", "Google Business API", "Yelp API"]),
    infra_requirements: JSON.stringify(["Review aggregation", "Response templates", "Escalation queue"]),
    implementation_guide: "1. Set up review monitoring across platforms\\n2. Implement sentiment analysis pipeline\\n3. Create response template library\\n4. Deploy automated response system\\n5. Build escalation workflow for complex issues\\n6. Set up analytics and reporting"
  },

  // DATA & INSIGHTS - High Score
  {
    name: "AI Market Research Reports",
    description: "Automated generation of market research reports for niche industries. AI agents gather data, analyze trends, and produce professional reports sold on-demand or via subscription.",
    vertical: "data_insights",
    guaranteed_demand: 80,
    automation_level: 85,
    token_efficiency: 70,
    profit_margin: 85,
    maintenance_cost: 20,
    legal_risk: 15,
    competition_saturation: 25,
    estimated_revenue_per_hour: "4.00",
    estimated_token_cost_per_hour: "0.35",
    estimated_infra_cost_per_day: "3.00",
    setup_cost: "100.00",
    setup_time_hours: 20,
    min_agents_required: 4,
    recommended_models: JSON.stringify(["gpt-4o", "claude-3-sonnet", "perplexity"]),
    required_apis: JSON.stringify(["Perplexity", "News APIs", "Financial data APIs", "Social listening"]),
    infra_requirements: JSON.stringify(["Report generation", "PDF export", "Payment processing"]),
    implementation_guide: "1. Identify high-value niche markets with limited research\\n2. Build data collection and aggregation pipelines\\n3. Implement AI analysis and insight generation\\n4. Create professional report templates\\n5. Set up e-commerce for report sales\\n6. Deploy subscription model for recurring revenue"
  },
  {
    name: "Competitive Intelligence Bot",
    description: "AI-powered competitor monitoring service. Tracks competitor pricing, product launches, marketing campaigns, and news mentions. Delivers daily/weekly intelligence briefings to subscribers.",
    vertical: "data_insights",
    guaranteed_demand: 85,
    automation_level: 92,
    token_efficiency: 80,
    profit_margin: 78,
    maintenance_cost: 18,
    legal_risk: 20,
    competition_saturation: 30,
    estimated_revenue_per_hour: "3.00",
    estimated_token_cost_per_hour: "0.15",
    estimated_infra_cost_per_day: "2.50",
    setup_cost: "90.00",
    setup_time_hours: 14,
    min_agents_required: 3,
    recommended_models: JSON.stringify(["gpt-4o-mini", "perplexity", "gemini-flash"]),
    required_apis: JSON.stringify(["Web scraping", "News APIs", "Social APIs", "SEO tools"]),
    infra_requirements: JSON.stringify(["Data collection", "Analysis pipeline", "Alert system", "Dashboard"]),
    implementation_guide: "1. Build competitor tracking infrastructure\\n2. Implement multi-source data collection\\n3. Create analysis and summarization pipeline\\n4. Deploy automated briefing generation\\n5. Set up customizable alert thresholds\\n6. Implement tiered subscription pricing"
  },
  {
    name: "Social Sentiment Analyzer",
    description: "Real-time social media sentiment analysis for brands and topics. AI monitors mentions, analyzes sentiment trends, and provides actionable insights. API and dashboard access for clients.",
    vertical: "data_insights",
    guaranteed_demand: 75,
    automation_level: 95,
    token_efficiency: 85,
    profit_margin: 72,
    maintenance_cost: 15,
    legal_risk: 10,
    competition_saturation: 40,
    estimated_revenue_per_hour: "2.50",
    estimated_token_cost_per_hour: "0.12",
    estimated_infra_cost_per_day: "3.00",
    setup_cost: "80.00",
    setup_time_hours: 12,
    min_agents_required: 2,
    recommended_models: JSON.stringify(["gpt-4o-mini", "custom sentiment models"]),
    required_apis: JSON.stringify(["Twitter API", "Reddit API", "News APIs", "OpenAI"]),
    infra_requirements: JSON.stringify(["Stream processing", "Time-series DB", "Real-time dashboard"]),
    implementation_guide: "1. Set up social media data streams\\n2. Implement sentiment analysis models\\n3. Build real-time processing pipeline\\n4. Create visualization dashboard\\n5. Deploy API for programmatic access\\n6. Set up usage-based pricing"
  },

  // MEDIUM SCORE (Stable/Experimental)
  {
    name: "AI Podcast Production Service",
    description: "Automated podcast creation from text content. AI converts articles, reports, or scripts into natural-sounding podcast episodes with multiple voices and sound effects.",
    vertical: "content_media",
    guaranteed_demand: 65,
    automation_level: 80,
    token_efficiency: 60,
    profit_margin: 70,
    maintenance_cost: 25,
    legal_risk: 20,
    competition_saturation: 35,
    estimated_revenue_per_hour: "1.50",
    estimated_token_cost_per_hour: "0.20",
    estimated_infra_cost_per_day: "2.00",
    setup_cost: "80.00",
    setup_time_hours: 15,
    min_agents_required: 2,
    recommended_models: JSON.stringify(["ElevenLabs", "gpt-4o", "Whisper"]),
    required_apis: JSON.stringify(["Text-to-speech APIs", "Audio processing", "Podcast hosting"]),
    infra_requirements: JSON.stringify(["Audio processing", "Storage", "Distribution"]),
    implementation_guide: "1. Set up text-to-speech pipeline with multiple voices\\n2. Implement script optimization for audio\\n3. Create audio post-processing workflow\\n4. Build podcast RSS feed generation\\n5. Deploy to major podcast platforms\\n6. Set up per-episode or subscription pricing"
  },
  {
    name: "Automated Legal Document Generator",
    description: "AI-powered generation of standard legal documents (NDAs, contracts, terms of service). Customizable templates with jurisdiction-specific compliance. Per-document or subscription pricing.",
    vertical: "digital_services",
    guaranteed_demand: 70,
    automation_level: 85,
    token_efficiency: 75,
    profit_margin: 80,
    maintenance_cost: 20,
    legal_risk: 40,
    competition_saturation: 45,
    estimated_revenue_per_hour: "2.00",
    estimated_token_cost_per_hour: "0.10",
    estimated_infra_cost_per_day: "1.50",
    setup_cost: "150.00",
    setup_time_hours: 25,
    min_agents_required: 2,
    recommended_models: JSON.stringify(["gpt-4o", "claude-3-opus"]),
    required_apis: JSON.stringify(["OpenAI", "Document generation", "E-signature"]),
    infra_requirements: JSON.stringify(["Template engine", "PDF generation", "User accounts"]),
    implementation_guide: "1. Research and create legal document templates\\n2. Implement customization engine\\n3. Add jurisdiction-specific variations\\n4. Build document generation pipeline\\n5. Integrate e-signature capability\\n6. Set up compliance disclaimers and pricing"
  },
  {
    name: "Inventory Forecasting Service",
    description: "AI predicts inventory needs based on historical sales, seasonality, and market trends. Helps e-commerce businesses optimize stock levels and reduce carrying costs.",
    vertical: "ecommerce",
    guaranteed_demand: 72,
    automation_level: 88,
    token_efficiency: 85,
    profit_margin: 70,
    maintenance_cost: 20,
    legal_risk: 10,
    competition_saturation: 35,
    estimated_revenue_per_hour: "2.20",
    estimated_token_cost_per_hour: "0.08",
    estimated_infra_cost_per_day: "2.00",
    setup_cost: "100.00",
    setup_time_hours: 18,
    min_agents_required: 2,
    recommended_models: JSON.stringify(["Custom ML", "gpt-4o-mini"]),
    required_apis: JSON.stringify(["E-commerce APIs", "Weather APIs", "Economic indicators"]),
    infra_requirements: JSON.stringify(["ML pipeline", "Data warehouse", "Dashboard"]),
    implementation_guide: "1. Build data ingestion from e-commerce platforms\\n2. Implement forecasting ML models\\n3. Create recommendation engine\\n4. Deploy real-time dashboard\\n5. Set up alert system for reorder points\\n6. Implement ROI tracking"
  },
  {
    name: "Patent Analysis Service",
    description: "AI analyzes patent databases to identify trends, potential infringements, and white space opportunities. Valuable for R&D teams and IP lawyers.",
    vertical: "data_insights",
    guaranteed_demand: 60,
    automation_level: 80,
    token_efficiency: 60,
    profit_margin: 85,
    maintenance_cost: 25,
    legal_risk: 15,
    competition_saturation: 20,
    estimated_revenue_per_hour: "5.00",
    estimated_token_cost_per_hour: "0.50",
    estimated_infra_cost_per_day: "4.00",
    setup_cost: "200.00",
    setup_time_hours: 30,
    min_agents_required: 3,
    recommended_models: JSON.stringify(["gpt-4o", "claude-3-opus"]),
    required_apis: JSON.stringify(["USPTO API", "EPO API", "Google Patents"]),
    infra_requirements: JSON.stringify(["Patent database", "Analysis pipeline", "Visualization"]),
    implementation_guide: "1. Set up patent data ingestion pipelines\\n2. Implement patent parsing and classification\\n3. Build similarity and infringement detection\\n4. Create trend analysis dashboard\\n5. Deploy white space identification\\n6. Set up enterprise pricing model"
  },

  // LOWER SCORE (Experimental) - Higher Risk/Lower Automation
  {
    name: "AI Influencer Management",
    description: "Automated management of virtual AI influencers on social media. Creates content, engages with followers, and manages brand partnerships. High potential but requires significant oversight.",
    vertical: "content_media",
    guaranteed_demand: 55,
    automation_level: 70,
    token_efficiency: 55,
    profit_margin: 65,
    maintenance_cost: 40,
    legal_risk: 45,
    competition_saturation: 30,
    estimated_revenue_per_hour: "3.00",
    estimated_token_cost_per_hour: "0.40",
    estimated_infra_cost_per_day: "5.00",
    setup_cost: "300.00",
    setup_time_hours: 40,
    min_agents_required: 5,
    recommended_models: JSON.stringify(["gpt-4o", "DALL-E 3", "Midjourney"]),
    required_apis: JSON.stringify(["Social APIs", "Image generation", "Video generation"]),
    infra_requirements: JSON.stringify(["Content pipeline", "Scheduling", "Analytics", "Brand safety"]),
    implementation_guide: "1. Design AI influencer persona and visual identity\\n2. Set up content generation pipeline\\n3. Implement engagement automation\\n4. Build brand partnership management\\n5. Deploy content moderation and safety\\n6. Create monetization tracking"
  },
  {
    name: "Crypto Arbitrage Scanner",
    description: "AI monitors cryptocurrency exchanges for arbitrage opportunities. Identifies price discrepancies and calculates potential profits after fees. High risk but potentially high reward.",
    vertical: "data_insights",
    guaranteed_demand: 50,
    automation_level: 95,
    token_efficiency: 90,
    profit_margin: 60,
    maintenance_cost: 30,
    legal_risk: 55,
    competition_saturation: 60,
    estimated_revenue_per_hour: "2.00",
    estimated_token_cost_per_hour: "0.05",
    estimated_infra_cost_per_day: "5.00",
    setup_cost: "250.00",
    setup_time_hours: 35,
    min_agents_required: 2,
    recommended_models: JSON.stringify(["Custom algorithms", "gpt-4o-mini"]),
    required_apis: JSON.stringify(["Exchange APIs", "Price feeds", "Blockchain APIs"]),
    infra_requirements: JSON.stringify(["Low-latency infrastructure", "Multi-exchange connections", "Risk management"]),
    implementation_guide: "1. Set up connections to major exchanges\\n2. Implement real-time price monitoring\\n3. Build arbitrage opportunity detection\\n4. Create profit/risk calculator\\n5. Deploy alert system\\n6. Implement paper trading for validation"
  },
  {
    name: "AI Translation Agency",
    description: "Automated translation service with human-quality output. AI handles translation, localization, and cultural adaptation. Per-word or subscription pricing for businesses.",
    vertical: "digital_services",
    guaranteed_demand: 70,
    automation_level: 75,
    token_efficiency: 70,
    profit_margin: 65,
    maintenance_cost: 30,
    legal_risk: 20,
    competition_saturation: 55,
    estimated_revenue_per_hour: "2.50",
    estimated_token_cost_per_hour: "0.25",
    estimated_infra_cost_per_day: "2.00",
    setup_cost: "100.00",
    setup_time_hours: 20,
    min_agents_required: 3,
    recommended_models: JSON.stringify(["gpt-4o", "DeepL", "Google Translate"]),
    required_apis: JSON.stringify(["Translation APIs", "Document processing"]),
    infra_requirements: JSON.stringify(["Multi-format support", "Quality assurance", "Client portal"]),
    implementation_guide: "1. Set up multi-language translation pipeline\\n2. Implement quality scoring system\\n3. Build document format handling\\n4. Create client portal for orders\\n5. Deploy review and revision workflow\\n6. Set up competitive pricing tiers"
  },
  {
    name: "Automated Bookkeeping Service",
    description: "AI-powered bookkeeping for small businesses. Categorizes transactions, reconciles accounts, and generates financial reports. Requires some human oversight for complex cases.",
    vertical: "digital_services",
    guaranteed_demand: 75,
    automation_level: 70,
    token_efficiency: 80,
    profit_margin: 70,
    maintenance_cost: 35,
    legal_risk: 35,
    competition_saturation: 40,
    estimated_revenue_per_hour: "3.00",
    estimated_token_cost_per_hour: "0.15",
    estimated_infra_cost_per_day: "2.50",
    setup_cost: "150.00",
    setup_time_hours: 25,
    min_agents_required: 3,
    recommended_models: JSON.stringify(["gpt-4o", "custom ML"]),
    required_apis: JSON.stringify(["Banking APIs", "QuickBooks", "Xero"]),
    infra_requirements: JSON.stringify(["Secure data handling", "Accounting engine", "Reporting"]),
    implementation_guide: "1. Build secure bank connection infrastructure\\n2. Implement transaction categorization ML\\n3. Create reconciliation automation\\n4. Deploy financial report generation\\n5. Set up human review workflow\\n6. Implement compliance and audit trails"
  }
];

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('Seeding businesses...');
    
    for (const biz of businesses) {
      // Calculate composite score
      const weights = {
        guaranteed_demand: 0.20,
        automation_level: 0.15,
        token_efficiency: 0.15,
        profit_margin: 0.15,
        maintenance_cost: 0.10,
        legal_risk: 0.10,
        competition_saturation: 0.10,
      };
      
      const compositeScore = Math.round(
        biz.guaranteed_demand * weights.guaranteed_demand +
        biz.automation_level * weights.automation_level +
        biz.token_efficiency * weights.token_efficiency +
        biz.profit_margin * weights.profit_margin +
        (100 - biz.maintenance_cost) * weights.maintenance_cost +
        (100 - biz.legal_risk) * weights.legal_risk +
        (100 - biz.competition_saturation) * weights.competition_saturation
      );
      
      let scoreTier = 'experimental';
      if (compositeScore >= 90) scoreTier = 'prime';
      else if (compositeScore >= 70) scoreTier = 'stable';
      else if (compositeScore < 50) scoreTier = 'archived';
      
      await client.query(`
        INSERT INTO businesses (
          name, description, vertical,
          guaranteed_demand, automation_level, token_efficiency, profit_margin,
          maintenance_cost, legal_risk, competition_saturation,
          composite_score, score_tier,
          estimated_revenue_per_hour, estimated_token_cost_per_hour,
          estimated_infra_cost_per_day, setup_cost, setup_time_hours,
          min_agents_required, recommended_models, required_apis,
          infra_requirements, implementation_guide, is_active
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
        )
        ON CONFLICT DO NOTHING
      `, [
        biz.name, biz.description, biz.vertical,
        biz.guaranteed_demand, biz.automation_level, biz.token_efficiency, biz.profit_margin,
        biz.maintenance_cost, biz.legal_risk, biz.competition_saturation,
        compositeScore, scoreTier,
        biz.estimated_revenue_per_hour, biz.estimated_token_cost_per_hour,
        biz.estimated_infra_cost_per_day, biz.setup_cost, biz.setup_time_hours,
        biz.min_agents_required, biz.recommended_models, biz.required_apis,
        biz.infra_requirements, biz.implementation_guide, true
      ]);
      
      console.log(`  ✓ ${biz.name} (Score: ${compositeScore}, Tier: ${scoreTier})`);
    }
    
    console.log('\\nSeeding complete!');
    
  } catch (error) {
    console.error('Error seeding:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
