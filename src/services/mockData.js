export const INITIAL_USERS = [
  {
    id: 1,
    first_name: "Ayoub",
    last_name: "Khamil",
    name: "Ayoub Khamil",
    email: "ayoub.khamil@watermelon-hub.com",
    password: "ayoub1234",
    role: "manager",
    status: "active",
    created_at: "2026-09-01T09:00:00Z"
  },
  {
    id: 2,
    first_name: "Khalid",
    last_name: "Khamil",
    name: "Khalid Khamil",
    email: "khalid.khamil@watermelon-hub.com",
    password: "khalid1234",
    role: "agent",
    status: "active",
    created_at: "2026-09-01T10:00:00Z"
  }
];

export const INITIAL_COURSES = [
  {
    id: 101,
    title: "BPO Tier 1 Customer Operations & Escalation Mastery",
    description: "Core operational onboarding covering ticketing workflows, customer de-escalation protocols, and compliance requirements.",
    status: "published",
    created_at: "2026-01-20T10:00:00Z",
    sections: [
      {
        id: 1,
        course_id: 101,
        title: "Section 1: Foundations & Call Etiquette",
        order: 1,
        items: [
          {
            id: 11,
            section_id: 1,
            title: "Executive Welcome & Culture Overview",
            type: "video",
            content_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            text_content: ""
          },
          {
            id: 12,
            section_id: 1,
            title: "Standard Operating Procedures: Active Listening",
            type: "text",
            content_url: "",
            text_content: `<h3>Active Listening in High-Paced BPO Environments</h3>
<p>Active listening is the cornerstone of frontline customer success. When an inbound caller explains their problem, follow the <strong>L.A.S.T. framework</strong>:</p>
<ul>
  <li><strong>Listen:</strong> Allow the customer to speak uninterrupted for the first 45 seconds without interjection.</li>
  <li><strong>Acknowledge:</strong> Validate their frustration with empathetic, neutral statements (e.g. <em>"I completely understand why that would be frustrating, and I am here to help you get this resolved today."</em>).</li>
  <li><strong>Solve:</strong> Diagnose the root cause using the knowledge base standard tree.</li>
  <li><strong>Thank:</strong> Conclude the call by thanking them for their patience and confirming resolution.</li>
</ul>
<p>Remember: Never promise timelines or compensation that exceed your tier 1 delegation authority limits.</p>`
          }
        ]
      },
      {
        id: 2,
        course_id: 101,
        title: "Section 2: Escalation Protocols & Compliance",
        order: 2,
        items: [
          {
            id: 21,
            section_id: 2,
            title: "Managing Difficult Scenarios & De-escalation",
            type: "video",
            content_url: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
            text_content: ""
          },
          {
            id: 22,
            section_id: 2,
            title: "Tier 1 Knowledge & Escalation Assessment",
            type: "quiz",
            content_url: "",
            text_content: "",
            questions: [
              {
                id: 201,
                item_id: 22,
                type: "multiple_choice",
                prompt: "What is the very first step in the L.A.S.T. framework during an inbound customer dispute?",
                options: [
                  { id: 1, text: "Immediately offer a partial refund", is_correct: false },
                  { id: 2, text: "Listen uninterrupted for the initial phase", is_correct: true },
                  { id: 3, text: "Transfer the caller to a team lead", is_correct: false },
                  { id: 4, text: "Place the caller on hold to read notes", is_correct: false }
                ]
              },
              {
                id: 202,
                item_id: 22,
                type: "multiple_answer",
                prompt: "Which of the following scenarios are valid immediate escalation triggers to a Tier 2 Manager? (Select all correct)",
                options: [
                  { id: 5, text: "Customer requesting formal legal action or regulatory filing", is_correct: true },
                  { id: 6, text: "Customer asking for general order tracking updates", is_correct: false },
                  { id: 7, text: "Suspected account takeover / security credential compromise", is_correct: true },
                  { id: 8, text: "Customer asking how to reset their forgotten password", is_correct: false }
                ]
              },
              {
                id: 203,
                item_id: 22,
                type: "true_false",
                prompt: "Frontline Tier 1 agents are authorized to issue discretionary refunds greater than $500 without prior manager sign-off.",
                options: [
                  { id: 9, text: "True", is_correct: false },
                  { id: 10, text: "False", is_correct: true }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 102,
    title: "PCI-DSS Data Security & Privacy Compliance 2026",
    description: "Mandatory security compliance training for all contact center personnel handling cardholder and personal data.",
    status: "published",
    created_at: "2026-02-01T11:00:00Z",
    sections: [
      {
        id: 3,
        course_id: 102,
        title: "Section 1: Data Masking & Secure Data Entry",
        order: 1,
        items: [
          {
            id: 31,
            section_id: 3,
            title: "Handling Cardholder Data in the CRM",
            type: "text",
            content_url: "",
            text_content: `<h3>Cardholder Data Security Standards (PCI-DSS)</h3>
<p>Under strict PCI-DSS Level 1 compliance rules, agents must adhere to the following:</p>
<ol>
  <li><strong>Never record CVV/CVC codes:</strong> Never write down or repeat the 3- or 4-digit security code.</li>
  <li><strong>Pause Screen Recording:</strong> Ensure the secure pause toggle is engaged prior to reading credit card data into the payment gateway.</li>
  <li><strong>Clean Desk Policy:</strong> No personal phones, writing pads, or unauthorized USB devices are permitted in the production floor environment.</li>
</ol>`
          },
          {
            id: 32,
            section_id: 3,
            title: "PCI-DSS Compliance Check",
            type: "quiz",
            content_url: "",
            text_content: "",
            questions: [
              {
                id: 301,
                item_id: 32,
                type: "multiple_choice",
                prompt: "Which of the following elements must NEVER be written down or stored under any circumstances?",
                options: [
                  { id: 11, text: "Customer first name", is_correct: false },
                  { id: 12, text: "CVV / CVC card security code", is_correct: true },
                  { id: 13, text: "Ticket ID number", is_correct: false }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 103,
    title: "Omnichannel Live Chat & Tone Calibration",
    description: "Guidelines for multi-chat concurrency, macro usage, and maintaining empathetic tone across asynchronous channels.",
    status: "draft",
    created_at: "2026-02-15T15:30:00Z",
    sections: [
      {
        id: 4,
        course_id: 103,
        title: "Section 1: Concurrency Best Practices",
        order: 1,
        items: [
          {
            id: 41,
            section_id: 4,
            title: "Balancing 3+ Concurrent Chats",
            type: "text",
            content_url: "",
            text_content: "<p>Draft module for managing multiple chat queues efficiently.</p>"
          }
        ]
      }
    ]
  }
];

// Initial assignments mapping
export const INITIAL_ASSIGNMENTS = [];
