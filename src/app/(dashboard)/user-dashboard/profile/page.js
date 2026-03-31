"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import countriesData from "@/lib/countries.json";
import {
  FaEdit,
  FaUserCircle,
  FaSave,
  FaPhoneAlt,
  FaBriefcase,
  FaMapMarkerAlt,
  FaEnvelope,
} from "react-icons/fa";

export default function ProfilePage() {
  const [countries] = useState(countriesData);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
const [deleteReason, setDeleteReason] = useState("");


  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    _id: "",
    name: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    maritalStatus: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
    occupation: "",
    company: "",
    profilePic: "",
  });


  // Load states when country changes
  useEffect(() => {
    if (profile.country) {
      const selectedCountry = countries.find((c) => c.name === profile.country);
      setStates(selectedCountry?.states || []);
    }
  }, [profile.country]);

  // Load cities when state changes
  useEffect(() => {
    if (profile.state) {
      const selectedState = states.find((s) => s.name === profile.state);
      setCities(selectedState?.cities || []);
    }
  }, [profile.state, states]);

  // Load profile on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return showError("No logged-in user found. Please login again.");

    const userData = JSON.parse(storedUser);
    if (!userData._id) return showError("Invalid user data. Please login again.");

    fetchProfile(userData._id);
  }, []);

const handleDeleteAccount = async () => {
  if (!deleteReason) {
    alert("Please select a reason");
    return;
  }

  try {
    setLoading(true);

    const res = await fetch("/api/user/delete-account", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: deleteReason,
      }),
    });

    const data = await res.json();

    if (data.success) {
      localStorage.clear();
      sessionStorage.clear();

      alert(
        "Your account deletion request has been submitted. Your account will be permanently deleted within 7 days."
      );

      window.location.href = "/login";
    } else {
      alert(data.message || "Failed to submit delete request");
    }
  } catch {
    alert("Server error");
  } finally {
    setLoading(false);
    setShowDeleteModal(false);
  }
};



  // Fetch profile
  const fetchProfile = async (userId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/user/get-profile?id=${encodeURIComponent(userId)}`);
      const data = await res.json();

      if (data.success && data.user) setProfile(data.user);
      else showError(data.message || "User not found.");
    } catch {
      showError("Error fetching profile");
    } finally {
      setLoading(false);
    }
  };

  // Input handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // File handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024)
      return showError("File size exceeds 3MB. Please choose a smaller image.");

    setProfile((prev) => ({
      ...prev,
      profilePic: file,
    }));
  };

  // Save profile
const handleSave = async () => {
  setLoading(true);

  try {
    const formData = new FormData();

    for (const key in profile) {
      if (profile[key]) formData.append(key, profile[key]);
    }

    const res = await fetch("/api/user/update-profile", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.success) {
      const updatedUser = {
        _id: data.user._id,
        name: data.user.name || "",
        phone: data.user.phone || "",
        profilePic: data.user.profilePic?.url || "",
        email: data.user.email || "",
        address: data.user.address || "",
        city: data.user.city || "",
        state: data.user.state || "",
        pincode: data.user.pincode || "",
        country: data.user.country || "India",
        occupation: data.user.occupation || "",
        company: data.user.company || "",
      };

      setProfile(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.dispatchEvent(new Event("userAuthChanged"));
      setEditMode(false);
      showSuccess("Profile updated successfully");
    } else {
      showError(data.message);
    }
  } catch {
    showError("Server error");
  }

  setLoading(false);
};


  const showError = (msg) => {
    setMessage(msg);
    setMessageType("error");
  };

  const showSuccess = (msg) => {
    setMessage(msg);
    setMessageType("success");
  };

  // NEXT BUTTON HANDLER
  const handleNext = () => {
    if (activeTab === "profile") setActiveTab("address");
    else if (activeTab === "address") setActiveTab("professional");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100 flex flex-col items-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-4xl relative"
      >
        {/* Profile Picture */}
        <div className="absolute -top-14 left-1/2 transform -translate-x-1/2">
          <div
            className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg cursor-pointer"
            onClick={() => editMode && fileInputRef.current.click()}
          >
            {profile.profilePic ? (
              <img
                src={
                  typeof profile.profilePic === "string"
                    ? profile.profilePic
                    : URL.createObjectURL(profile.profilePic)
                }
                className="object-cover w-full h-full"
              />
            ) : (
              <FaUserCircle className="text-purple-400 w-full h-full" />
            )}
            {editMode && (
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center text-white text-sm">
                <FaEdit /> Edit
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Header */}
        <div className="mt-16 text-center">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-1">
            {profile.name || "No Name"}
          </h1>
          <p className="text-gray-500">{profile.email || "No email provided"}</p>

          <button
            onClick={() => setEditMode(!editMode)}
            disabled={loading}
            className="mt-4 inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-full font-medium transition disabled:opacity-70"
          >
            <FaEdit /> {editMode ? "Cancel Edit" : "Edit Profile"}
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex justify-center gap-4 border-b pb-3">
          {["profile", "address", "professional"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`capitalize px-4 py-2 font-semibold ${
                activeTab === tab
                  ? "text-purple-600 border-b-2 border-purple-500"
                  : "text-gray-500 hover:text-purple-400"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tabs Content */}
        <div className="mt-6 space-y-4">
          {activeTab === "profile" && (
            <ProfileTab profile={profile} handleChange={handleChange} editMode={editMode} />
          )}
          {activeTab === "address" && (
            <AddressTab
              profile={profile}
              handleChange={handleChange}
              editMode={editMode}
              countries={countries}
              states={states}
              cities={cities}
            />
          )}
          {activeTab === "professional" && (
            <ProfessionalTab
              profile={profile}
              handleChange={handleChange}
              editMode={editMode}
            />
          )}
        </div>

        {/* Bottom Buttons */}
        {editMode && (
          <div className="mt-6">
            {activeTab !== "professional" ? (
              <button
                onClick={handleNext}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-semibold"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave /> Save Changes
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Delete Account */}
<div className="mt-10 border-t pt-6">

  <button
    onClick={() => setShowDeleteModal(true)}
    disabled={loading}
    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition disabled:opacity-60"
  >
    Delete Account Permanently
  </button>
</div>

{showDeleteModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
      <h3 className="text-xl font-bold text-red-600 mb-2">
        Request Account Deletion
      </h3>

      <p className="text-sm text-gray-600 mb-4">
        Your account will be scheduled for deletion and permanently removed
        within <b>7 days</b>. You will not be able to login during this period.
      </p>

      <label className="block text-sm font-semibold mb-1">
        Reason for deleting account
      </label>

      <select
        value={deleteReason}
        onChange={(e) => setDeleteReason(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 mb-3"
      >
        <option value="">Select a reason</option>
        <option value="privacy">Privacy concerns</option>
        <option value="not_useful">App not useful</option>
        <option value="duplicate">Created duplicate account</option>
        <option value="other">Other</option>
      </select>

      {deleteReason === "other" && (
        <textarea
          placeholder="Please specify your reason"
          className="w-full border rounded-lg px-3 py-2 mb-3"
          onChange={(e) => setDeleteReason(e.target.value)}
        />
      )}

      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={() => setShowDeleteModal(false)}
          className="px-4 py-2 rounded-lg bg-gray-200"
        >
          Cancel
        </button>

        <button
          onClick={handleDeleteAccount}
          disabled={!deleteReason || loading}
          className="px-4 py-2 rounded-lg bg-red-600 text-white disabled:opacity-50"
        >
          Confirm Delete
        </button>
      </div>
    </div>
  </div>
)}



        {/* Alert */}
        {message && (
          <p
            className={`mt-4 text-center ${
              messageType === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}
      </motion.div>
    </div>
  );
}

/* ───────────── Input Component ───────────── */

function Input({ label, icon, disabled, ...props }) {
  return (
    <div>
      <label className="block text-gray-700 font-semibold mb-1">{label}</label>
      <div
        className={`flex items-center border rounded-xl px-3 py-2 ${
          disabled ? "bg-gray-100" : "focus-within:ring-2 focus-within:ring-purple-400"
        }`}
      >
        {icon && <span className="text-gray-400 mr-2">{icon}</span>}
        <input {...props} disabled={disabled} className="w-full outline-none bg-transparent" />
      </div>
    </div>
  );
}

/* ───────────── Select Component ───────────── */

function Select({ label, options = [], disabled, ...props }) {
  return (
    <div>
      <label className="block text-gray-700 font-semibold mb-1">{label}</label>
      <select
        {...props}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-xl ${
          disabled ? "bg-gray-100" : "focus:ring-2 focus:ring-purple-400"
        }`}
      >
        <option value="">Select {label}</option>
        {options.map((opt, i) => (
          <option key={i} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ───────────── Tabs ───────────── */

function ProfileTab({ profile, handleChange, editMode }) {
  return (
    <>
      <Input label="Full Name" name="name" value={profile.name} onChange={handleChange} disabled={!editMode} />

      <Input label="Email" name="email" value={profile.email} icon={<FaEnvelope />} onChange={handleChange} disabled={!editMode} />

      <Input label="Phone" name="phone" value={profile.phone} icon={<FaPhoneAlt />} onChange={handleChange} disabled={!editMode} />

      <Select
        label="Gender"
        name="gender"
        value={profile.gender}
        disabled={!editMode}
        options={["Male", "Female", "Other"]}
        onChange={handleChange}
      />

      <Input label="Date of Birth" type="date" name="dob" value={profile.dob} onChange={handleChange} disabled={!editMode} />
<Select
        label="maritalStatus"
        name="maritalStatus"
        value={profile.maritalStatus || ""}
        disabled={!editMode}
        options={[, "Single", "Married"]}
        onChange={handleChange}
      />

    </>
  );
}

function AddressTab({ profile, handleChange, editMode, countries, states, cities }) {
  return (
    <>
      <Input label="Address" name="address" value={profile.address} icon={<FaMapMarkerAlt />} onChange={handleChange} disabled={!editMode} />

      <Select
        label="Country"
        name="country"
        value={profile.country}
        disabled={!editMode}
        options={countries.map((c) => c.name)}
        onChange={handleChange}
      />

      <Select
        label="State"
        name="state"
        value={profile.state}
        disabled={!editMode || !profile.country}
        options={states.map((s) => s.name)}
        onChange={handleChange}
      />

      <Select
        label="City"
        name="city"
        value={profile.city}
        disabled={!editMode || !profile.state}
        options={cities.map((c) => c.name)}
        onChange={handleChange}
      />

      <Input label="Pincode" name="pincode" value={profile.pincode} onChange={handleChange} disabled={!editMode} />
    </>
  );
}

function ProfessionalTab({ profile, handleChange, editMode }) {
  return (
    <>
      <Input label="Occupation" name="occupation" value={profile.occupation} icon={<FaBriefcase />} onChange={handleChange} disabled={!editMode} />
      <Input label="Company" name="company" value={profile.company} onChange={handleChange} disabled={!editMode} />
    </>
  );
}
