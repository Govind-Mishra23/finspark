import { useState, useEffect, useCallback, useRef } from "react";
import {
  FileText,
  Upload,
  ShieldCheck,
  CheckCircle,
  RotateCcw,
  ChevronRight,
  XCircle,
  DollarSign,
  UploadCloud,
  UserCircle,
} from "lucide-react";
import InsightX from "../lib/insightx-sdk";
import { useTenant } from "../context/TenantContext";
import PageHeader from "../components/PageHeader";
import api from "../lib/api";

export default function LoanDemo() {
  const { auth, currentTenant } = useTenant();
  const hasTrackedView = useRef(false);
  const [demoUserId] = useState(() => {
    let id = localStorage.getItem("demo_user_id");
    if (!id) {
      id = "user_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("demo_user_id", id);
    }
    return id;
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [eventLog, setEventLog] = useState([]);
  const [sdkReady, setSdkReady] = useState(false);
  const [resettingAnalytics, setResettingAnalytics] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    income: 50000,
    loanAmount: 10000,
    term: 12,
    purpose: "personal",
    documentUploaded: false,
    kycAgreed: false,
  });

  const [outcome, setOutcome] = useState(null); // 'approved' or 'rejected'

  useEffect(() => {
    const apiKey = currentTenant?.apiKey || auth?.apiKey;
    const tenantName = currentTenant?.name || "demo";

    if (apiKey) {
      InsightX.init({
        apiKey,
        endpoint: "",
        tenantId: tenantName,
        batchSize: 1,
        flushInterval: 2000,
        debug: true,
      });

      InsightX.onEvent(({ eventName, timestamp }) => {
        setEventLog((prev) => [
          { eventName, time: new Date(timestamp).toLocaleTimeString() },
          ...prev,
        ]);
      });

      setSdkReady(true);

      // Track that the user viewed the demo (only once per mount, safe for StrictMode)
      if (currentStep === 0 && !hasTrackedView.current) {
        InsightX.trackEvent("Loan_Apply_Viewed", { userId: demoUserId });
        hasTrackedView.current = true;
      }
    }

    return () => InsightX.destroy();
  }, [auth, currentTenant, demoUserId]);

  const updateForm = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = async () => {
    setProcessing(true);

    if (currentStep === 0) {
      // Step 1: Basic Info Submission
      InsightX.trackEvent("Loan_Apply_Clicked", {
        userId: demoUserId,
        loanAmount: formData.loanAmount,
        purpose: formData.purpose,
        term: formData.term,
      });
      await new Promise((r) => setTimeout(r, 800)); // simulate network delay
    } else if (currentStep === 1) {
      // Step 2: Document Upload
      InsightX.trackEvent("Document_Upload_Started", { userId: demoUserId });
      await new Promise((r) => setTimeout(r, 1500));
      InsightX.trackEvent("Document_Upload_Completed", {
        userId: demoUserId,
        fileType: "payslip_pdf",
      });
    } else if (currentStep === 2) {
      // Step 3: KYC & Final Verification
      InsightX.trackEvent("KYC_Verification_Started", { userId: demoUserId });
      await new Promise((r) => setTimeout(r, 2000));
      InsightX.trackEvent("KYC_Verification_Completed", { userId: demoUserId });

      // Determine Outcome Simple Algorithm: Debt-to-Income check
      // If loan amount is more than 3x annual income, reject
      const maxAllowed = formData.income * 3;
      if (formData.loanAmount > maxAllowed) {
        setOutcome("rejected");
        InsightX.trackEvent("Loan_Rejected", {
          userId: demoUserId,
          reason: "debt_to_income_too_high",
          loanAmount: formData.loanAmount,
        });
      } else {
        setOutcome("approved");
        InsightX.trackEvent("Loan_Approved", {
          userId: demoUserId,
          loanAmount: formData.loanAmount,
        });
      }
    }

    setProcessing(false);
    setCurrentStep((prev) => prev + 1);
  };

  const reset = () => {
    setCurrentStep(0);
    setOutcome(null);
    setEventLog([]);
    setFormData({
      name: "",
      income: 50000,
      loanAmount: 10000,
      term: 12,
      purpose: "personal",
      documentUploaded: false,
      kycAgreed: false,
    });
    InsightX.trackEvent("Loan_Apply_Viewed", { userId: demoUserId });
  };

  const clearAnalyticsData = async () => {
    if (resettingAnalytics) return;

    const ok = window.confirm(
      "Clear all analytics data for this tenant? This removes tracked events used by dashboard reports.",
    );
    if (!ok) return;

    const tenantApiKey = currentTenant?.apiKey || auth?.apiKey;
    if (!tenantApiKey) {
      setResetError("Missing API key. Please sign in again.");
      return;
    }

    setResettingAnalytics(true);
    setResetMessage("");
    setResetError("");

    try {
      const res = await api.delete("/analytics/reset", {
        headers: {
          "x-api-key": tenantApiKey,
          ...(auth?.role === "admin" ? { "x-admin-key": tenantApiKey } : {}),
        },
      });

      setEventLog([]);
      setResetMessage(
        res?.data?.message || "Analytics data cleared successfully.",
      );
    } catch (err) {
      setResetError(
        err?.response?.data?.error || "Failed to clear analytics data.",
      );
    } finally {
      setResettingAnalytics(false);
    }
  };

  const steps = ["Application", "Documents", "Verification", "Decision"];

  return (
    <div className="animate-in">
      <PageHeader
        title="Interactive Loan Application"
        subtitle="A realistic funnel. Watch the SDK capture interactions instantly."
      />

      <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
        {/* Main Application UI */}
        <div className="flex-1 bg-white rounded-3xl p-8 border border-gray-100 shadow-xl relative overflow-hidden">
          {/* Top Step Progress Indicator */}
          <div className="flex justify-between items-center mb-10 relative z-10">
            {steps.map((label, index) => {
              const active = currentStep === index;
              const completed = currentStep > index;
              return (
                <div
                  key={label}
                  className="flex flex-col items-center flex-1 relative"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold z-10 transition-all ${
                      completed
                        ? "bg-emerald-500 text-white shadow-md"
                        : active
                          ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-lg"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {completed ? "✓" : index + 1}
                  </div>
                  <div
                    className={`text-xs mt-2 font-semibold ${completed ? "text-emerald-600" : active ? "text-blue-600" : "text-gray-400"}`}
                  >
                    {label}
                  </div>
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div
                      className={`absolute top-4 left-1/2 w-full h-[2px] transition-all -z-1 ${completed ? "bg-emerald-500" : "bg-gray-100"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Form Content Area */}
          <div className="min-h-[360px] flex flex-col justify-center">
            {/* Step 0: Basic Details */}
            {currentStep === 0 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 font-display">
                  Let's build your loan offer
                </h3>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Legal Name
                      </label>
                      <div className="relative">
                        <UserCircle
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) => updateForm("name", e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Loan Purpose
                      </label>
                      <select
                        value={formData.purpose}
                        onChange={(e) => updateForm("purpose", e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="personal">Personal Loan</option>
                        <option value="auto">Auto Loan</option>
                        <option value="business">Business Expansion</option>
                        <option value="home">Home Improvement</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="text-sm font-semibold text-gray-700">
                        Annual Income
                      </label>
                      <span className="text-lg font-bold text-blue-600">
                        ${formData.income.toLocaleString()}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="20000"
                      max="250000"
                      step="5000"
                      value={formData.income}
                      onChange={(e) => {
                        updateForm("income", parseInt(e.target.value));
                        if (parseInt(e.target.value) % 50000 === 0)
                          InsightX.trackEvent("Income_Slider_Used", {
                            userId: demoUserId,
                            val: e.target.value,
                          });
                      }}
                      className="w-full accent-blue-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="text-sm font-semibold text-gray-700">
                        Requested Loan Amount
                      </label>
                      <span className="text-xl font-bold text-emerald-600">
                        ${formData.loanAmount.toLocaleString()}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1000"
                      max="100000"
                      step="1000"
                      value={formData.loanAmount}
                      onChange={(e) =>
                        updateForm("loanAmount", parseInt(e.target.value))
                      }
                      className="w-full accent-emerald-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="mt-10 flex justify-end">
                  <button
                    disabled={!formData.name || processing || !sdkReady}
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3.5 rounded-xl font-bold shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all flex items-center gap-2"
                  >
                    {processing ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Check Eligibility"
                    )}
                    {!processing && <ChevronRight size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Document Upload */}
            {currentStep === 1 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <h3 className="text-2xl font-bold text-gray-900 mb-2 font-display">
                  Verify your income
                </h3>
                <p className="text-gray-500 mb-8">
                  Please upload a recent payslip or tax return to verify your
                  declared income of{" "}
                  <strong>${formData.income.toLocaleString()}</strong>.
                </p>

                <div
                  className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${formData.documentUploaded ? "border-emerald-500 bg-emerald-50" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"}`}
                  onClick={() => {
                    updateForm("documentUploaded", true);
                    InsightX.trackEvent("File_Dropped", { userId: demoUserId });
                  }}
                >
                  {formData.documentUploaded ? (
                    <>
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                        <FileText size={32} />
                      </div>
                      <h4 className="font-bold text-emerald-900 text-lg">
                        payslip_2024.pdf
                      </h4>
                      <p className="text-emerald-600 text-sm mt-1">
                        2.4 MB • Uploaded successfully
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mb-4">
                        <UploadCloud size={32} />
                      </div>
                      <h4 className="font-bold text-gray-900 text-lg">
                        Click to browse or drag file here
                      </h4>
                      <p className="text-gray-500 text-sm mt-1">
                        Supports PDF, JPG, PNG up to 10MB
                      </p>
                    </>
                  )}
                </div>

                <div className="mt-10 flex justify-end">
                  <button
                    disabled={!formData.documentUploaded || processing}
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2"
                  >
                    {processing ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Continue"
                    )}
                    {!processing && <ChevronRight size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: KYC & Final Verification */}
            {currentStep === 2 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <h3 className="text-2xl font-bold text-gray-900 mb-2 font-display">
                  Final Verification
                </h3>
                <p className="text-gray-500 mb-8">
                  Review your terms and complete your identity check.
                </p>

                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-500">Loan Amount</span>
                    <span className="font-bold text-gray-900">
                      ${formData.loanAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-500">
                      Annual Percentage Rate (APR)
                    </span>
                    <span className="font-bold text-emerald-600">6.49%</span>
                  </div>
                  <hr className="my-3 border-gray-200" />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">
                      Est. Monthly Payment
                    </span>
                    <span className="text-xl font-black text-blue-600">
                      $
                      {Math.round((formData.loanAmount / formData.term) * 1.05)}
                      /mo
                    </span>
                  </div>
                </div>

                <label className="flex items-start gap-3 cursor-pointer p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                      checked={formData.kycAgreed}
                      onChange={(e) => {
                        updateForm("kycAgreed", e.target.checked);
                        if (e.target.checked)
                          InsightX.trackEvent("Terms_Consented", {
                            userId: demoUserId,
                          });
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 leading-relaxed">
                    I agree to the{" "}
                    <a
                      href="#"
                      className="text-blue-600 font-medium hover:underline"
                    >
                      Terms of Service
                    </a>{" "}
                    and authorize a soft credit inquiry to finalize my
                    application. This will not impact my credit score.
                  </span>
                </label>

                <div className="mt-10 flex justify-end">
                  <button
                    disabled={!formData.kycAgreed || processing}
                    onClick={handleNext}
                    className="bg-gray-900 hover:bg-black disabled:opacity-50 text-white px-8 py-3.5 rounded-xl font-bold shadow-xl transition-all flex items-center gap-2"
                  >
                    {processing ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Sign & Submit Application"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Complete / Outcome */}
            {currentStep === 3 && outcome && (
              <div className="animate-in zoom-in-95 duration-500 flex flex-col items-center justify-center text-center py-8">
                {outcome === "approved" ? (
                  <>
                    <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 ring-8 ring-emerald-50/50">
                      <CheckCircle size={48} />
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
                      Approved! 🎉
                    </h3>
                    <p className="text-gray-500 max-w-sm mb-8">
                      Congratulations {formData.name}, your $
                      {formData.loanAmount.toLocaleString()} loan has been
                      instantly approved based on your application.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-50/50">
                      <XCircle size={48} />
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
                      Application Declined
                    </h3>
                    <p className="text-gray-500 max-w-sm mb-8">
                      We're sorry {formData.name}, but we cannot approve a $
                      {formData.loanAmount.toLocaleString()} loan for your
                      stated income bracket at this time.
                    </p>
                  </>
                )}

                <button
                  className="px-6 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-sm"
                  onClick={reset}
                >
                  <RotateCcw size={18} />
                  Run Another Simulation
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Event Log Panel */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="bg-slate-900 text-slate-300 rounded-3xl p-6 border border-slate-800 shadow-xl flex-1 max-h-[600px] flex flex-col font-mono text-sm relative overflow-hidden">
            {/* Glossy top reflection */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <h4 className="font-bold text-white tracking-widest text-xs uppercase">
                  SDK Stream
                </h4>
              </div>
              <div className="text-[10px] text-slate-500 bg-slate-800 px-2 py-1 rounded-md">
                User: {demoUserId.split("_")[1]}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
              {eventLog.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3 opacity-60">
                  <ShieldCheck size={32} />
                  <span className="text-center text-xs leading-relaxed max-w-[200px]">
                    Waiting for interaction... Interact with the UI to see
                    captured events.
                  </span>
                </div>
              ) : (
                eventLog.map((e, i) => (
                  <div
                    key={i}
                    className="animate-in fade-in slide-in-from-bottom-2 flex gap-3 group"
                  >
                    <div className="text-slate-600 text-[10px] mt-0.5 shrink-0 w-12">
                      {e.time.split(" ")[0]}
                    </div>
                    <div className="flex-1">
                      <div className="text-emerald-400 font-semibold mb-0.5 group-hover:text-emerald-300 transition-colors">
                        {e.eventName}
                      </div>
                      <div className="h-px w-full bg-slate-800 mt-2" />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Gradient fade at bottom of terminal */}
            <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
          </div>

          <div className="bg-blue-50 text-blue-800 rounded-2xl p-5 border border-blue-100 text-sm leading-relaxed shadow-sm">
            <span className="font-bold block mb-1">💡 Real-World Demo</span>
            Try intentionally causing an approval or rejection by adjusting the
            income and loan amount sliders.
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <button
              onClick={clearAnalyticsData}
              disabled={resettingAnalytics}
              className="w-full px-4 py-2.5 rounded-xl font-semibold text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {resettingAnalytics
                ? "Clearing Analytics..."
                : "Clear Analytics Data"}
            </button>
            {resetMessage && (
              <p className="text-xs text-emerald-600 mt-2">{resetMessage}</p>
            )}
            {resetError && (
              <p className="text-xs text-red-600 mt-2">{resetError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
