"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import PageBanner from "@/components/store/PageBanner";

export default function FAQPage() {
  const [faqs, setFaqs] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    async function loadFaqs() {
      try {
        const res = await fetch("/api/admin/faq");
        const data = await res.json();

        if (Array.isArray(data)) setFaqs(data);
        else if (data.faqs && Array.isArray(data.faqs)) setFaqs(data.faqs);
        else setFaqs([]);
      } catch (error) {
        console.error("FAQ load error:", error);
        setFaqs([]);
      }
    }

    loadFaqs();
  }, []);

  const filteredFaqs = faqs.filter((faq) => {
    const t = searchText.toLowerCase();
    return (
      faq.question.toLowerCase().includes(t) ||
      faq.answer.toLowerCase().includes(t)
    );
  });

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div>
      <PageBanner
        accent="default"
        title="FAQ"
        subtitle="Search common questions or browse the list."
        crumbs={[{ label: "Home", href: "/" }, { label: "FAQ" }]}
      />
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="relative mb-10">
        <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search your question..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-[var(--store-border)] focus:ring-2 focus:ring-[var(--store-primary)]/40 outline-none shadow-sm bg-white"
        />
      </div>

      <div className="space-y-4">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => (
            <div
              key={faq._id}
              className="bg-white rounded-2xl shadow-sm border transition hover:shadow-md"
            >
              <button
                className="w-full flex justify-between items-center p-5 text-left"
                onClick={() => toggleFAQ(index)}
              >
                <h3 className="font-semibold text-lg text-gray-800">
                  {faq.question}
                </h3>
                <ChevronDown
                  className={`transition-transform duration-300 ${
                    activeIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              {activeIndex === index && (
                <div className="px-5 pb-5 text-gray-600 leading-relaxed animate-fadeIn">
                  {faq.answer}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-10">
            No matching FAQs found.
         </p>
        )}
      </div>
    </section>
    </div>
  );
}
