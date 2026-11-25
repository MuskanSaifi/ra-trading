// /src/app/help/page.js
"use client";

import { useState } from "react";
import { FaEnvelope, FaPhone, FaComments } from "react-icons/fa";

export default function HelpPage() {
  const faqCategories = [
    {
      category: "Orders",
      faqs: [
        {
          question: "How can I place an order?",
          answer: "Browse products, add items to your cart, and checkout using the available payment methods. You can review your order before finalizing.",
        },
        {
          question: "Can I cancel or modify my order?",
          answer: "Orders can be modified or canceled within 1 hour of placement. After that, please contact our support team.",
        },
      ],
    },
    {
      category: "Shipping",
      faqs: [
        {
          question: "What are the shipping options?",
          answer: "We offer Standard and Express shipping. Free standard shipping for orders above ₹999.",
        },
        {
          question: "How do I track my order?",
          answer: "Go to the Track Order page and enter your Order ID to see real-time updates on your shipment.",
        },
      ],
    },
    {
      category: "Returns & Refunds",
      faqs: [
        {
          question: "What is the return policy?",
          answer: "You can return most products within 15 days of delivery. Some items like perishables and personal care products are non-returnable.",
        },
        {
          question: "How do I request a refund?",
          answer: "Submit a return request via your account or contact our support. Refunds are processed within 5-7 business days after receiving the returned product.",
        },
      ],
    },
    {
      category: "Payments",
      faqs: [
        {
          question: "Which payment methods are accepted?",
          answer: "We accept Credit/Debit Cards, UPI, Net Banking, and Cash on Delivery (COD) for select locations.",
        },
        {
          question: "Is online payment secure?",
          answer: "Yes, all transactions are encrypted and handled by secure payment gateways. We do not store your card details.",
        },
      ],
    },
  ];

  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [formMessage, setFormMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setFormMessage("Please fill all required fields.");
      return;
    }
    // Simulated submission
    setFormMessage("Your message has been sent. Our support team will contact you soon!");
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      <div className="max-w-6xl w-full bg-white rounded-2xl shadow-lg p-10">
        <h1 className="text-5xl font-bold text-gray-800 mb-8 text-center">Help & Support</h1>
        <p className="text-center text-gray-600 mb-10">
          Find answers to common questions or contact our support team directly.
        </p>

        {/* FAQ Section */}
        <div className="space-y-10">
          {faqCategories.map((category, idx) => (
            <div key={idx}>
              <h2 className="text-3xl font-semibold text-gray-800 mb-4">{category.category}</h2>
              <div className="space-y-3">
                {category.faqs.map((faq, index) => (
                  <details
                    key={index}
                    className="border rounded-lg p-4 cursor-pointer bg-gray-50 hover:bg-gray-100 transition duration-200"
                  >
                    <summary className="font-medium text-gray-800">{faq.question}</summary>
                    <p className="mt-2 text-gray-600">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-16">
          <h2 className="text-4xl font-semibold text-gray-800 mb-6 text-center">Contact Us</h2>
          <div className="flex flex-col sm:flex-row justify-around items-start sm:items-center gap-6 mb-8">
            <div className="flex items-center gap-2 text-gray-700">
              <FaEnvelope className="text-blue-500" /> ratrading417@gmail.com
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <FaPhone className="text-green-500" /> +91 97169 94211
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <FaComments className="text-purple-500" /> Live Chat Available 9AM-6PM IST
            </div>
          </div>

          {/* Contact Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-gray-50 p-6 rounded-xl shadow-inner space-y-4 max-w-2xl mx-auto"
          >
            <input
              type="text"
              placeholder="Your Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <input
              type="email"
              placeholder="Your Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Subject (Optional)"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <textarea
              placeholder="Your Message"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              rows={5}
            ></textarea>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition"
            >
              Send Message
            </button>
            {formMessage && (
              <p className="text-center text-green-600 font-medium mt-2">{formMessage}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
