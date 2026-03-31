"use client";

import React, { useEffect, useState } from "react";
import ContactForm from "./ContactForm";

const ContactSection = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchContactData = async () => {
    try {
      const res = await fetch("/api/store/contact-section", { cache: "no-store" });

      if (!res.ok) {
        throw new Error("API request failed");
      }

      let json = {};
      try {
        json = await res.json();
      } catch {
        console.error("Empty or invalid JSON response");
        return;
      }

      if (json.success && json.data) {
        setData(json.data);
      } else {
        console.error(json.message || "No data found");
      }
    } catch (err) {
      console.error("GET ERROR:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactData();
  }, []);

  if (loading) {
    return <p className="text-center py-10">Loading...</p>;
  }

  if (!data) {
    return (
      <p className="text-center py-10 text-red-500">
        Contact info not found.
      </p>
    );
  }

  return (
    <section className="bg-gray-100 py-12 text-gray-900">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          {/* ✅ Icon from Cloudinary */}
          {data.icon?.url && (
            <img
              src={data.icon.url}
              alt="Contact Icon"
              className="w-16 h-16 object-contain"
            />
          )}

          <h2 className="text-3xl font-bold">
            {data.title?.trim() || data.companyName?.trim() || "Contact us"}
          </h2>
          {data.subtitle?.trim() ? (
            <p className="text-lg text-gray-600">{data.subtitle.trim()}</p>
          ) : null}
          {data.description?.trim() ? (
            <p className="text-gray-700">{data.description.trim()}</p>
          ) : null}

          <div className="space-y-2">
            {data.address && <p>📍 {data.address}</p>}
            {data.phone && <p>📞 {data.phone}</p>}
            {data.email && <p>✉️ {data.email}</p>}
          </div>
        </div>

        <ContactForm />
      </div>
    </section>
  );
};

export default ContactSection;
