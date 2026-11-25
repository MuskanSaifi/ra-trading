"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FAQ() {
  const [faqs, setFaqs] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/faq");
      const data = await res.json();
      if (data.success) setFaqs(data.faqs);
    }
    load();
  }, []);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>

      <div className="space-y-4">
        {faqs.slice(0, 6).map((f, index) => (
          <div
            key={f._id}
            className="border border-gray-200 rounded-2xl shadow-sm bg-white"
          >
            <button
              onClick={() => toggle(index)}
              className="w-full flex justify-between items-center px-6 py-4 text-left"
            >
              <span className="font-semibold text-gray-800">{f.question}</span>
              <ChevronDown
                className={`transition-transform duration-300 ${
                  openIndex === index ? "rotate-180" : ""
                }`}
              />
            </button>

            {openIndex === index && (
              <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed">
                {f.answer}
              </div>
            )}
          </div>
        ))}

        {faqs.length === 0 && (
          <p className="text-center text-gray-500">No FAQs available.</p>
        )}

        {faqs.length > 6 && (
          <div className="text-center mt-8">
            <a
              href="/faq"
              className="inline-block px-6 py-2 rounded-full bg-black text-white hover:bg-gray-800 transition"
            >
              View All FAQs
            </a>
          </div>
        )}
      </div>
    </section>
  );
}