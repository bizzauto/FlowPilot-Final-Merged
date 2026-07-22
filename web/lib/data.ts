export const stats = [
  { label: "Contacts", value: "12,840", delta: "+8.2%" },
  { label: "Open Deals", value: "342", delta: "+4.6%" },
  { label: "WhatsApp Chats", value: "1,920", delta: "+12.1%" },
  { label: "Revenue", value: "₹18.4L", delta: "+22.4%" },
];

export const chart = [
  { label: "Mon", value: 42 },
  { label: "Tue", value: 58 },
  { label: "Wed", value: 35 },
  { label: "Thu", value: 71 },
  { label: "Fri", value: 64 },
  { label: "Sat", value: 49 },
  { label: "Sun", value: 38 },
];

export const stages = [
  "NEW",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
];

export const contacts = [
  {
    id: "1",
    name: "Aarav Sharma",
    email: "aarav@example.com",
    phone: "+91 98765 11111",
    stage: "QUALIFIED",
    score: 87,
    tags: ["Hot"],
  },
  {
    id: "2",
    name: "Priya Verma",
    email: "priya@example.com",
    phone: "+91 98765 22222",
    stage: "PROPOSAL",
    score: 72,
    tags: ["Warm"],
  },
  {
    id: "3",
    name: "Rohan Mehta",
    email: "rohan@example.com",
    phone: "+91 98765 33333",
    stage: "NEW",
    score: 44,
    tags: ["Cold"],
  },
  {
    id: "4",
    name: "Sara Khan",
    email: "sara@example.com",
    phone: "+91 98765 44444",
    stage: "NEGOTIATION",
    score: 91,
    tags: ["Hot"],
  },
  {
    id: "5",
    name: "Vikram Iyer",
    email: "vikram@example.com",
    phone: "+91 98765 55555",
    stage: "WON",
    score: 78,
    tags: ["Warm"],
  },
];

export const conversations = [
  {
    id: "1",
    name: "Aarav Sharma",
    channel: "WhatsApp",
    preview: "Can we schedule a demo tomorrow?",
    unread: 2,
    messages: [
      { from: "them", text: "Hi, I saw your product." },
      { from: "me", text: "Hello Aarav! Happy to help." },
      { from: "them", text: "Can we schedule a demo tomorrow?" },
    ],
  },
  {
    id: "2",
    name: "Priya Verma",
    channel: "Email",
    preview: "Please send proposal.",
    unread: 0,
    messages: [
      { from: "them", text: "Please send proposal." },
      { from: "me", text: "Sure, sending in 10 minutes." },
    ],
  },
  {
    id: "3",
    name: "Sara Khan",
    channel: "Instagram",
    preview: "What is the pricing?",
    unread: 1,
    messages: [
      { from: "them", text: "What is the pricing?" },
    ],
  },
];

export const campaigns = [
  {
    id: "1",
    name: "Diwali Sale Blast",
    channel: "WhatsApp",
    status: "Sent",
    reach: 1240,
    replies: 218,
  },
  {
    id: "2",
    name: "Q3 Newsletter",
    channel: "Email",
    status: "Sent",
    reach: 8900,
    replies: 312,
  },
  {
    id: "3",
    name: "Webinar Reminder",
    channel: "SMS",
    status: "Scheduled",
    reach: 0,
    replies: 0,
  },
  {
    id: "4",
    name: "Cart Recovery",
    channel: "Email",
    status: "Active",
    reach: 560,
    replies: 42,
  },
];

export const reportRows = [
  { source: "WhatsApp Ads", leads: 420, deals: 86, revenue: "₹4.2L" },
  { source: "Google Ads", leads: 310, deals: 54, revenue: "₹3.1L" },
  { source: "Instagram", leads: 260, deals: 41, revenue: "₹2.4L" },
  { source: "Email", leads: 190, deals: 32, revenue: "₹1.8L" },
  { source: "Referral", leads: 120, deals: 48, revenue: "₹2.9L" },
];