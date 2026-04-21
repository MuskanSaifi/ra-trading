"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";

const MAIN_OPTIONS = [
  "I want to buy in bulk",
  "I am a distributor",
  "I own a salon",
  "Product details",
  "Talk to support",
];

const PRODUCT_OPTIONS = ["Shampoo", "Conditioner", "Both"];
const QTY_OPTIONS = ["Small (10–50 units)", "Medium (50–200 units)", "Large (200+ units)"];
const PRODUCT_INFO_OPTIONS = [
  "Herbal Shampoo",
  "Anti-Dandruff Shampoo",
  "Damage Repair Conditioner",
  "Smooth & Shine Range",
];
const SUPPORT_OPTIONS = ["Pricing", "MOQ", "Delivery time", "Custom branding"];

const SUPPORT_REPLY = {
  Pricing: "Pricing depends on quantity. Share details to get best deal.",
  MOQ: "Minimum order varies based on requirement.",
  "Delivery time": "Delivery across India within 3–7 days.",
  "Custom branding": "Private labeling available for bulk orders.",
};

export default function ChatbotWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [inputError, setInputError] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [inputMode, setInputMode] = useState(null);
  const [stage, setStage] = useState("main");
  const [leadSaved, setLeadSaved] = useState(false);
  const [lead, setLead] = useState({
    userType: "",
    productInterest: "",
    quantity: "",
    name: "",
    mobile: "",
    message: "",
  });
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: "bot",
      text: "Hi 👋 Welcome to RA Trading! We supply bulk shampoo & conditioner across India 🇮🇳. How can we help you?",
    },
  ]);
  const [options, setOptions] = useState(MAIN_OPTIONS);
  const listRef = useRef(null);
  const exitIntentShown = useRef(false);
  const timeoutsRef = useRef([]);

  const whatsappText = encodeURIComponent(
    `Hi RA Trading, I want wholesale pricing.\nName: ${lead.name || "-"}\nMobile: ${
      lead.mobile || "-"
    }\nRequirement: ${lead.quantity || "-"}\nProduct: ${lead.productInterest || "-"}`
  );
  const whatsappLink = `https://wa.me/919716994211?text=${whatsappText}`;

  useEffect(() => {
    const openTimer = window.setTimeout(() => setOpen(true), 5000);
    const onMouseOut = (e) => {
      if (exitIntentShown.current) return;
      if (e.clientY <= 0) {
        exitIntentShown.current = true;
        addBotMessage("Wait! Get best wholesale prices today. Share your number now 📞");
        setOpen(true);
      }
    };
    document.addEventListener("mouseout", onMouseOut);
    return () => {
      window.clearTimeout(openTimer);
      document.removeEventListener("mouseout", onMouseOut);
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, typing, open]);

  function queueTimeout(fn, delay) {
    const id = window.setTimeout(fn, delay);
    timeoutsRef.current.push(id);
  }

  function addUserMessage(text) {
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), from: "user", text }]);
  }

  function addBotMessage(text, delay = 700) {
    setTyping(true);
    queueTimeout(() => {
      setTyping(false);
      setMessages((prev) => [...prev, { id: Date.now() + Math.random(), from: "bot", text }]);
    }, delay);
  }

  async function saveLead(finalLead) {
    const res = await fetch("/api/chatbot-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...finalLead,
        pagePath: pathname || "",
      }),
    });
    const json = await res.json();
    if (!json?.success) {
      throw new Error(json?.error || "Unable to submit lead");
    }
  }

  function askName() {
    setStage("name");
    setOptions([]);
    setInputMode("name");
    addBotMessage("Please enter your name");
  }

  function askMobile() {
    setStage("mobile");
    setInputMode("mobile");
    setOptions([]);
    addBotMessage("Please enter your mobile number");
  }

  function handleMainChoice(choice) {
    addUserMessage(choice);
    setInputError("");
    if (choice === "Product details") {
      setStage("productDetails");
      addBotMessage("Here are our popular ranges:", 600);
      queueTimeout(() => {
        addBotMessage(PRODUCT_INFO_OPTIONS.map((p) => `• ${p}`).join("\n"), 200);
        queueTimeout(() => {
          addBotMessage("Do you want pricing details?", 250);
          setOptions(["Yes", "No"]);
          setStage("productPricingPrompt");
        }, 300);
      }, 750);
      return;
    }
    if (choice === "Talk to support") {
      setStage("support");
      setLead((prev) => ({ ...prev, userType: "support" }));
      addBotMessage("Sure, choose support topic 👇");
      setOptions(SUPPORT_OPTIONS);
      return;
    }

    const typeMap = {
      "I want to buy in bulk": "bulk-buyer",
      "I am a distributor": "distributor",
      "I own a salon": "salon-owner",
    };
    setLead((prev) => ({ ...prev, userType: typeMap[choice] || "buyer" }));
    setStage("productInterest");
    addBotMessage("What products are you interested in?");
    setOptions(PRODUCT_OPTIONS);
  }

  function handleSupportChoice(choice) {
    addUserMessage(choice);
    const reply = SUPPORT_REPLY[choice] || "Please share details to help you better.";
    setLead((prev) => ({ ...prev, message: `${choice}: ${reply}` }));
    addBotMessage(reply);
    queueTimeout(() => {
      setOptions(["Share my details", "Back to main menu"]);
      setStage("supportNext");
      addBotMessage("Want us to call you with exact details?");
    }, 700);
  }

  function handleProductPricingPrompt(choice) {
    addUserMessage(choice);
    if (choice === "Yes") {
      setLead((prev) => ({ ...prev, userType: "product-details" }));
      askName();
      return;
    }
    setStage("main");
    setOptions(MAIN_OPTIONS);
    addBotMessage("No worries. Explore products anytime, or ask us anything else 😊");
  }

  async function onInputSubmit(e) {
    e.preventDefault();
    setInputError("");
    const value = inputValue.trim();
    if (!inputMode) return;

    if (inputMode === "name") {
      if (!value) {
        setInputError("Name is required");
        return;
      }
      addUserMessage(value);
      setLead((prev) => ({ ...prev, name: value }));
      setInputValue("");
      askMobile();
      return;
    }

    if (inputMode === "mobile") {
      const digits = value.replace(/\D/g, "");
      if (digits.length !== 10) {
        setInputError("Mobile must be 10 digits");
        return;
      }

      addUserMessage(digits);
      const finalLead = { ...lead, mobile: digits };
      setLead(finalLead);
      setInputValue("");
      setInputMode(null);

      try {
        await saveLead(finalLead);
        setLeadSaved(true);
        addBotMessage(
          `Thank you ${finalLead.name}! Our team will contact you shortly on ${digits} with best pricing.`,
          900
        );
        queueTimeout(() => {
          setStage("done");
          setOptions(["Chat on WhatsApp", "View Products", "Request Call Back"]);
        }, 950);
      } catch (err) {
        setInputError(err.message);
      }
    }
  }

  function onOptionClick(choice) {
    if (stage === "main") return handleMainChoice(choice);
    if (stage === "productInterest") {
      addUserMessage(choice);
      setLead((prev) => ({ ...prev, productInterest: choice }));
      setStage("quantity");
      addBotMessage("What is your approximate requirement?");
      setOptions(QTY_OPTIONS);
      return;
    }
    if (stage === "quantity") {
      addUserMessage(choice);
      setLead((prev) => ({ ...prev, quantity: choice }));
      askName();
      return;
    }
    if (stage === "productPricingPrompt") return handleProductPricingPrompt(choice);
    if (stage === "support") return handleSupportChoice(choice);
    if (stage === "supportNext") {
      addUserMessage(choice);
      if (choice === "Share my details") {
        askName();
      } else {
        setStage("main");
        setOptions(MAIN_OPTIONS);
        addBotMessage("Sure. How can we help you next?");
      }
      return;
    }
    if (stage === "done") {
      addUserMessage(choice);
      if (choice === "Chat on WhatsApp") {
        window.open(whatsappLink, "_blank", "noopener,noreferrer");
      } else if (choice === "View Products") {
        window.location.href = "/shop";
      } else {
        setStage("name");
        setLeadSaved(false);
        setLead((prev) => ({ ...prev, message: "Request callback", name: "", mobile: "" }));
        setInputMode("name");
        setOptions([]);
        addBotMessage("Sure! Please share your name to request a call back.");
      }
    }
  }

  return (
    <div className="fixed bottom-5 right-4 md:right-6 z-[70]">
      {open && (
        <div className="mb-3 w-[min(24rem,calc(100vw-1.5rem))] max-w-sm rounded-2xl border border-[var(--store-border)] bg-white shadow-2xl overflow-hidden transition-all duration-300">
          <div className="flex items-center justify-between bg-[var(--store-ink)] px-4 py-3 text-white">
            <div>
              <p className="text-sm font-bold">RA Trading Assistant</p>
              <p className="text-[11px] text-gray-300">Wholesale help in Hinglish</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 hover:bg-white/10"
              aria-label="Close chatbot"
            >
              <X size={16} />
            </button>
          </div>

          <div ref={listRef} className="max-h-[48vh] overflow-y-auto p-3 space-y-2 bg-slate-50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line ${
                  m.from === "bot"
                    ? "bg-white border border-[var(--store-border)] text-slate-700"
                    : "ml-auto bg-[var(--store-primary)] text-white font-medium"
                }`}
              >
                {m.text}
              </div>
            ))}
            {typing && (
              <div className="max-w-[88%] rounded-2xl px-3 py-2 text-sm bg-white border border-[var(--store-border)] text-slate-500">
                Typing...
              </div>
            )}
          </div>

          <div className="p-3 border-t border-[var(--store-border)] bg-white space-y-2">
            {options.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {options.map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => onOptionClick(opt)}
                    className="rounded-full border border-[var(--store-border)] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-[var(--store-primary)]/40 hover:text-[var(--store-primary)]"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {inputMode && (
              <form onSubmit={onInputSubmit} className="space-y-2">
                <input
                  type={inputMode === "mobile" ? "tel" : "text"}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={inputMode === "mobile" ? "Enter 10 digit mobile" : "Enter your name"}
                  className="w-full rounded-xl border border-[var(--store-border)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--store-primary)]/40"
                />
                {inputError && <p className="text-xs text-red-600">{inputError}</p>}
                <button
                  type="submit"
                  className="w-full rounded-xl bg-[var(--store-primary)] px-3 py-2 text-sm font-semibold text-white hover:brightness-95"
                >
                  Submit
                </button>
              </form>
            )}

            {leadSaved && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-xs font-semibold text-green-700 hover:underline"
              >
                Open WhatsApp chat
              </a>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="ml-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--store-primary)] text-white shadow-xl hover:brightness-95 transition"
        aria-label="Open chatbot"
      >
        <MessageCircle size={22} />
      </button>
    </div>
  );
}

