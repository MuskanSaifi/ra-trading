import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import UserDashboardShell from "./UserDashboardShell";
import jwt from "jsonwebtoken";
import "../../globals.css";
import { connectDB } from "@/lib/dbConnect";
import User from "@/models/User";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UserDashboardLayout({ children }) {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    // ✅ No token → go to login
    if (!token) redirect("/login");

    // ✅ Verify JWT signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Find user and ensure token matches DB (single-device login)
    const user = await User.findById(decoded.id);

    if (!user) redirect("/login");

    if (user.authToken !== token) {
      console.warn("⚠️ Token mismatch: likely logged out or new device login");
      redirect("/login");
    }

    // ✅ If all good → render dashboard
    return (
      <>
        <header className="sticky top-0 z-50 w-full">
          <Navbar />
        </header>
        <UserDashboardShell>{children}</UserDashboardShell>
        <Footer />
      </>
    );
  } catch (err) {
    // Avoid noisy logs for expected auth redirects (and during build)
    if (process.env.NODE_ENV !== "production") {
      console.error("❌ Token verification failed:", err.message);
    }
    redirect("/login");
  }
}
