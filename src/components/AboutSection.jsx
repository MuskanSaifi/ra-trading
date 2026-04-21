"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const AboutSection = () => {
  const [about, setAbout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";

useEffect(() => {
  async function fetchAbout() {
    try {
      const res = await fetch("/api/store/about", {
        cache: "no-store",
      });
      const data = await res.json();
      setAbout(data?.about);
    } catch (error) {
      console.log("Error fetching about:", error);
    } finally {
      setLoading(false);
    }
  }

  fetchAbout();
}, []);



  if (loading) return <p>Loading...</p>;
  if (!about) return <p>No data found!</p>;

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-100">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* LEFT */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            {about?.title}
          </h2>

          <p className="text-lg text-gray-600 mt-3">{about?.subtitle}</p>

          <p className="mt-5 text-gray-700 leading-relaxed">
            {about?.description}
          </p>

          {/* ✅ Stats */}
       {/* ✅ Premium Stats */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-10">
  {about?.stats?.map((s, i) => (
    <motion.div
      key={i}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.1 }}
      viewport={{ once: true }}
      className="bg-white/70 backdrop-blur-lg border border-gray-200 rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      <div className="flex items-center gap-3">
        {/* Icon Circle */}
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#5a1f1f] text-white text-lg shadow">
          ✓
        </div>

        <div>
          <h3 className="text-xl font-bold text-gray-900 leading-tight">
            {s.value}
          </h3>
          <p className="text-gray-600 text-sm">{s.label}</p>
        </div>
      </div>
    </motion.div>
  ))}
</div>
        </motion.div>

        {/* RIGHT - use img with onError to handle 404/deleted Cloudinary images */}
        {about?.image?.url && !imageError && (
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
            className="relative w-full h-[450px]"
          >
            <img
              src={about.image.url}
              alt="About us"
              className="rounded-xl shadow-xl object-cover w-full h-full"
              onError={() => setImageError(true)}
            />
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default AboutSection;
