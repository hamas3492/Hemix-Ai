import type { PricingPlan, FAQItem, Feature } from "@/types";

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Starter",
    price: 0,
    period: "forever",
    description: "Perfect for trying things out and light usage.",
    features: [
      "10 messages / day",
      "Access to AgentRouter Auto",
      "Basic code generation",
      "5 saved conversations",
      "Community support",
    ],
    popular: false,
    cta: "Start Free",
  },
  {
    id: "pro",
    name: "Pro",
    price: 20,
    period: "month",
    description: "For professionals who need power and flexibility.",
    features: [
      "Unlimited messages",
      "Access to all AI models",
      "GPT-5, Claude Sonnet 4.5, Claude Sonnet 4",
      "File & image uploads",
      "Priority response speed",
      "API access",
      "Email support",
    ],
    popular: true,
    cta: "Get Pro",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 99,
    period: "month",
    description: "For teams and organizations at scale.",
    features: [
      "Everything in Pro",
      "Team workspace",
      "Custom model fine-tuning",
      "SSO & SAML",
      "Dedicated support",
      "99.9% uptime SLA",
      "Custom integrations",
    ],
    popular: false,
    cta: "Contact Sales",
  },
];

export const FAQS: FAQItem[] = [
  {
    question: "What is Hemix AI?",
    answer: "Hemix AI is a premium AI chatbot platform that brings together the world's best language models — GPT-5, Claude Sonnet 4.5, Claude Sonnet 4, and more — into one beautiful, unified interface.",
  },
  {
    question: "Which AI models are supported?",
    answer: "We currently support GPT-5, Claude Sonnet 4.5, and Claude Sonnet 4. All powered by the AgentRouter unified API.",
  },
  {
    question: "Can I use my own API keys?",
    answer: "Yes. On the Pro plan and above, you can connect your own API keys. Your keys are encrypted and never exposed.",
  },
  {
    question: "Is my data private and secure?",
    answer: "Absolutely. Your conversations are encrypted in transit and at rest. We never train models on your data. You can export or delete your data at any time.",
  },
  {
    question: "How does streaming work?",
    answer: "Hemix AI streams responses in real-time, so you see the answer as it's generated — just like ChatGPT. This gives you instant feedback and faster perceived performance.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes, you can upgrade, downgrade, or cancel your plan at any time from your billing settings. No contracts, no hidden fees.",
  },
];

export const FEATURES: Feature[] = [
  {
    icon: "Zap",
    title: "Lightning Fast",
    description: "Streaming responses with sub-second latency. Get answers before you finish your coffee.",
  },
  {
    icon: "Brain",
    title: "Multi-Model",
    description: "Switch between GPT-5, Claude Sonnet 4.5, Claude Sonnet 4, and more — all in one conversation.",
  },
  {
    icon: "Code2",
    title: "Code Intelligence",
    description: "Syntax-highlighted code blocks with copy support. Write, debug, and ship faster.",
  },
  {
    icon: "Shield",
    title: "Privacy First",
    description: "End-to-end encryption. Your conversations never train models. Full data export.",
  },
  {
    icon: "Image",
    title: "Multimodal",
    description: "Upload images and files. Get visual analysis, document understanding, and more.",
  },
  {
    icon: "Layers",
    title: "Organized",
    description: "Pin important chats, search history, and keep your workspace tidy.",
  },
];

export const AI_CAPABILITIES = [
  {
    icon: "PenTool",
    title: "Writing & Content",
    description: "Draft emails, blog posts, marketing copy, and creative stories with expert-level quality.",
    examples: ["Blog posts", "Email drafts", "Ad copy", "Storytelling"],
  },
  {
    icon: "Code2",
    title: "Code Generation",
    description: "Write, debug, and explain code across 40+ programming languages with full syntax highlighting.",
    examples: ["Python", "TypeScript", "Rust", "SQL"],
  },
  {
    icon: "Calculator",
    title: "Analysis & Reasoning",
    description: "Solve complex problems, analyze data, and get step-by-step reasoning for any question.",
    examples: ["Math problems", "Data analysis", "Logic puzzles", "Research"],
  },
  {
    icon: "Languages",
    title: "Translation",
    description: "Translate between 95+ languages with native fluency and cultural context awareness.",
    examples: ["English", "中文", "Español", "Français"],
  },
  {
    icon: "Sparkles",
    title: "Creative Tasks",
    description: "Generate ideas, brainstorm, write poetry, design concepts, and explore creative directions.",
    examples: ["Brainstorming", "Poetry", "Design ideas", "Names"],
  },
  {
    icon: "GraduationCap",
    title: "Learning",
    description: "Get personalized tutoring, explanations, and study guides for any subject.",
    examples: ["Tutoring", "Study guides", "Explanations", "Practice"],
  },
];

export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export const FOOTER_LINKS = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Models", href: "#capabilities" },
    { label: "API", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Security", href: "#" },
    { label: "DPA", href: "#" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Community", href: "#" },
    { label: "Status", href: "#" },
  ],
};
