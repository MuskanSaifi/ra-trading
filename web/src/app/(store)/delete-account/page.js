"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Mail, Trash2 } from "lucide-react";

export default function DeleteAccountPage() {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Load company/store details from backend
  useEffect(() => {
    async function loadStore() {
      try {
        const res = await fetch("/api/store/contact-section", {
          cache: "force-cache",
        });
        const data = await res.json();
        if (data.success && data.data) {
          setStore(data.data);
        }
      } catch (err) {
        console.error("Failed to load store info");
      } finally {
        setLoading(false);
      }
    }
    loadStore();
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto mt-20 p-6 text-center text-gray-500">
        Loading account details...
      </div>
    );
  }

  const companyName = store?.companyName || store?.title || "Our Company";

  return (
   <div className="max-w-2xl mx-auto my-16 px-6">
  {/* 🔴 Header */}
  <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
    <div className="flex items-center gap-3 text-red-600 mb-3">
      <AlertTriangle size={26} />
      <h1 className="text-2xl font-bold">
        Account Deletion – {companyName}
      </h1>
    </div>

    <p className="text-sm text-red-700 leading-relaxed">
      This page explains how you can request the deletion of your{" "}
      <b>{companyName}</b> account. Once a deletion request is submitted, your
      account will be permanently removed after a short processing period.
    </p>
  </div>

  {/* 📋 Steps */}
  <div className="bg-white shadow-xl rounded-2xl p-6 mb-8">
    <h2 className="text-lg font-semibold mb-4">
      Steps to request account deletion
    </h2>

    <ol className="space-y-3 text-sm text-gray-700 list-decimal list-inside">
      <li>Open the <b>{companyName}</b> mobile application</li>
      <li>Login using your registered mobile number (OTP verification)</li>
      <li>Go to the <b>Profile</b> section</li>
      <li>Scroll down and tap on <b>Delete Account</b></li>
      <li>
        Select a reason for deletion and confirm your request
      </li>
    </ol>
  </div>

  {/* ⚠️ Important Information */}
  <div className="bg-gray-50 border rounded-2xl p-6 mb-8">
    <h3 className="text-md font-semibold mb-3">
      Important information about account deletion
    </h3>

    <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
      <li>
        Your account deletion request will be processed within <b>7 days</b>
      </li>
      <li>
        During this period, your account may be temporarily disabled
      </li>
      <li>
        All personal data, order history, wishlist, and saved information will
        be permanently removed after deletion
      </li>
      <li>
        Once deleted, the account <b>cannot be recovered</b>
      </li>
    </ul>
  </div>

  {/* 📧 Support */}
  <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
    <Mail className="text-indigo-600 mt-1" size={22} />
    <div className="text-sm text-gray-700">
      <p className="font-semibold mb-1">Need assistance?</p>
      <p>
        If you face any issues related to account deletion, please contact our
        support team at{" "}
        <b className="text-indigo-700">
          {store?.email || "support@yourdomain.com"}
        </b>
      </p>
    </div>
  </div>

  {/* 🔒 Footer note */}
  <p className="text-xs text-center text-gray-500 mt-10">
    This page is provided in accordance with Google Play’s user data and account
    deletion policy.
  </p>
</div>

  );
}
