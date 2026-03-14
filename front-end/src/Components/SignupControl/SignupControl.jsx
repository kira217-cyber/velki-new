import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const SignupControl = () => {
  const [showSignupButton, setShowSignupButton] = useState(true);
  const [signupLink, setSignupLink] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const baseUrl = import.meta.env.VITE_API_URL;

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/navbar`);
      if (res.data) {
        setShowSignupButton(
          typeof res.data.showSignupButton === "boolean"
            ? res.data.showSignupButton
            : true
        );
        setSignupLink(res.data.signupLink || "");
      }
    } catch (err) {
      console.error("Failed to load signup settings", err);
      toast.error("Unable to load signup button settings");
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await axios.post(`${baseUrl}/api/navbar`, {
        showSignupButton,
        signupLink: signupLink.trim(),
      });
      toast.success("Signup button settings updated");
    } catch (err) {
      console.error("Failed to update signup settings", err);
      toast.error("Could not save signup settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#e4d9c8]">
      <div className="bg-black text-white p-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Signup Button Control</h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-5 flex flex-col gap-5 text-black"
      >
        <div>
          <label className="font-semibold block mb-2">
            Signup Button Visibility
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setShowSignupButton(true)}
              className={`px-4 py-2 rounded border transition-all ${
                showSignupButton
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white border-gray-300"
              }`}
            >
              Show
            </button>
            <button
              type="button"
              onClick={() => setShowSignupButton(false)}
              className={`px-4 py-2 rounded border transition-all ${
                !showSignupButton
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white border-gray-300"
              }`}
            >
              Hide
            </button>
          </div>
        </div>

        {showSignupButton && (
          <div>
            <label className="font-semibold block mb-2" htmlFor="signup-link">
              Signup Redirect Link
            </label>
            <input
              id="signup-link"
              type="text"
              placeholder="https://example.com/signup"
              value={signupLink}
              onChange={(e) => setSignupLink(e.target.value)}
              className="w-full rounded border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            />
            <p className="text-sm text-gray-600 mt-1">
              এই লিংকের দিকে Sign Up বাটন ক্লিক করলে ইউজার রিডাইরেক্ট হবে।
            </p>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isSaving}
            className="bg-yellow-600 cursor-pointer text-white px-5 py-2 rounded hover:bg-yellow-700 transition disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignupControl;
