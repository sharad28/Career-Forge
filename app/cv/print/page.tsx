"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { marked } from "marked";

function PrintContent() {
  const params = useSearchParams();
  const company = params.get("company") || "";
  const role = params.get("role") || "";
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set page title for PDF filename
    const parts = ["CV"];
    if (company) parts.push(company);
    if (role) parts.push(role);
    document.title = parts.join(" - ");

    fetch("/api/cv")
      .then((r) => r.json())
      .then(async (d) => {
        if (d.content) {
          const rendered = await marked(d.content, {
            breaks: true,
            gfm: true,
          });
          setHtml(rendered);
        }
        setLoading(false);
      });
  }, [company, role]);

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-gray-500">Loading CV...</p>
      </div>
    );
  }

  return (
    <>
      {/* Print controls - hidden in print */}
      <div className="print-controls no-print">
        <div className="controls-inner">
          <div>
            <h2 className="controls-title">CV Preview</h2>
            {company && role && (
              <p className="controls-subtitle">
                Tailored for {company} — {role}
              </p>
            )}
          </div>
          <div className="controls-actions">
            <button onClick={() => window.history.back()} className="btn-back">
              ← Back
            </button>
            <button onClick={handlePrint} className="btn-print">
              Save as PDF
            </button>
          </div>
        </div>
      </div>

      {/* CV content */}
      <div className="cv-page">
        <article
          className="cv-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      <style>{`
        /* Reset for print page */
        body {
          background: #f5f5f5 !important;
          color: #111 !important;
          margin: 0;
          padding: 0;
        }

        /* Hide the app sidebar and main padding */
        aside,
        nav {
          display: none !important;
        }
        main {
          padding: 0 !important;
          margin: 0 !important;
          max-width: 100% !important;
        }

        /* Controls bar */
        .print-controls {
          background: #1a1a2e;
          border-bottom: 1px solid #2a2a4a;
          padding: 16px 32px;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .controls-inner {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .controls-title {
          font-size: 16px;
          font-weight: 600;
          color: #ededed;
          margin: 0;
        }
        .controls-subtitle {
          font-size: 13px;
          color: #888;
          margin: 4px 0 0;
        }
        .controls-actions {
          display: flex;
          gap: 12px;
        }
        .btn-back {
          background: transparent;
          border: 1px solid #444;
          color: #ccc;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        }
        .btn-back:hover {
          background: #2a2a2a;
        }
        .btn-print {
          background: #6366f1;
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
        .btn-print:hover {
          background: #5558e6;
        }

        /* CV Page */
        .cv-page {
          max-width: 800px;
          margin: 32px auto;
          background: white;
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.15);
          border-radius: 4px;
          padding: 48px 56px;
        }

        /* CV Content Typography */
        .cv-content {
          font-family: "Georgia", "Times New Roman", serif;
          font-size: 13px;
          line-height: 1.6;
          color: #222;
        }
        .cv-content h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 4px;
          color: #111;
          border-bottom: 2px solid #333;
          padding-bottom: 8px;
        }
        .cv-content h2 {
          font-size: 15px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 20px 0 8px;
          color: #333;
          border-bottom: 1px solid #ccc;
          padding-bottom: 4px;
        }
        .cv-content h3 {
          font-size: 14px;
          font-weight: 600;
          margin: 12px 0 4px;
          color: #222;
        }
        .cv-content p {
          margin: 4px 0;
        }
        .cv-content ul {
          margin: 4px 0;
          padding-left: 20px;
        }
        .cv-content li {
          margin: 2px 0;
        }
        .cv-content strong {
          font-weight: 700;
        }
        .cv-content em {
          font-style: italic;
          color: #555;
        }
        .cv-content a {
          color: #222;
          text-decoration: none;
        }
        .cv-content hr {
          border: none;
          border-top: 1px solid #ddd;
          margin: 16px 0;
        }
        .cv-content code {
          font-family: inherit;
          background: none;
          padding: 0;
        }

        /* Print styles */
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
          .cv-page {
            box-shadow: none;
            margin: 0;
            padding: 0;
            border-radius: 0;
          }
          .cv-content {
            font-size: 11pt;
          }
          @page {
            margin: 0.6in 0.7in;
            size: letter;
          }
        }
      `}</style>
    </>
  );
}

export default function PrintPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-white">
          <p className="text-gray-500">Loading...</p>
        </div>
      }
    >
      <PrintContent />
    </Suspense>
  );
}
