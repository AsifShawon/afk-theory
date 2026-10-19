export interface FaqItem {
  question: string
  answer: string
}

export interface FaqCategory {
  category: string
  questions: FaqItem[]
}

export const DEFAULT_FAQ_DATA: FaqCategory[] = [
  {
    category: "Orders & Account",
    questions: [
      {
        question: "How do I place an order on AFK THEORY?",
        answer:
          "Browse our drop catalog, select your size and color variant, and click 'Add to Bag'. Complete checkout with direct Cash on Delivery (COD) anywhere in Bangladesh.",
      },
      {
        question: "Do I need to create an account to purchase?",
        answer:
          "No, guest checkout is supported. However, creating an account lets you track your parcel status, save addresses, and access member drops.",
      },
      {
        question: "Can I modify or cancel my order after placing it?",
        answer:
          "Orders are processed rapidly in our Dhaka fulfillment hub. If you need to modify your size or address, please email support@afktheory.com immediately with your Order ID.",
      },
    ],
  },
  {
    category: "Shipping & Delivery",
    questions: [
      {
        question: "What are the delivery charges and timelines across Bangladesh?",
        answer:
          "Inside Dhaka: ৳60 (24–48 hours). Dhaka Suburban (Savar, Gazipur, Keraniganj): ৳100 (2–3 business days). Outside Dhaka (All 64 districts): ৳130 (3–5 business days).",
      },
      {
        question: "How can I track my package?",
        answer:
          "Once your parcel is dispatched from our Dhaka warehouse, you will receive an SMS and email notification with your live courier tracking link.",
      },
      {
        question: "Do you offer international shipping?",
        answer:
          "Currently, AFK THEORY exclusively serves customers located in Bangladesh with express domestic delivery.",
      },
    ],
  },
  {
    category: "Exchanges & Returns",
    questions: [
      {
        question: "What is the AFK THEORY exchange window?",
        answer:
          "We offer a 48-hour size exchange guarantee from the moment of delivery handover. The item must be unworn, unwashed, with all original tags attached.",
      },
      {
        question: "How do I request a size exchange?",
        answer:
          "Email support@afktheory.com with your Order ID, parcel photo, and requested replacement size. For addresses inside Dhaka, doorstep exchange is available.",
      },
    ],
  },
  {
    category: "Streetwear Fit & Fabric",
    questions: [
      {
        question: "How does the Drop Shoulder silhouette fit?",
        answer:
          "AFK THEORY Drop Shoulder tees feature relaxed, lowered shoulder seams, a boxy chest width, and a structured drape. Choose your standard size for the intended streetwear fit, or size down if you prefer a closer cut.",
      },
      {
        question: "How should I wash AFK THEORY garments?",
        answer:
          "Machine wash cold (30°C or below) inside out with similar dark tones. Do not bleach or tumble dry on high heat. Warm iron on the reverse side.",
      },
    ],
  },
  {
    category: "Payment Methods",
    questions: [
      {
        question: "Which payment options are supported at launch?",
        answer:
          "At launch, Cash on Delivery (COD) is the exclusive payment method across all 64 districts of Bangladesh. You pay cash directly to the delivery agent upon receiving your package.",
      },
    ],
  },
]
