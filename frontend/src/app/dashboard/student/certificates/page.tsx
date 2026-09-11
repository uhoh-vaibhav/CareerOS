"use client";

import { useState, useEffect, useRef } from "react";
import { Sidebar, STUDENT_LINKS } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { Card } from "@/components/Card";
import { uploadCertificateRequest, getCertificatesRequest, deleteCertificateRequest, Certificate } from "@/lib/api";

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [title, setTitle] = useState("");
  const [issuer, setIssuer] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await getCertificatesRequest();
      setCertificates(res || []);
    } catch (err: any) {
      console.error("Failed to load certificates", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setError(null);
    setUploading(true);

    try {
      await uploadCertificateRequest(title, issuer, file as File);
      setTitle("");
      setIssuer("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchCertificates();
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this certificate?")) return;
    try {
      await deleteCertificateRequest(id);
      setCertificates(certificates.filter(c => c.id !== id));
    } catch (err: any) {
      alert("Failed to delete certificate: " + err.message);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav role="Student" />
      <div className="flex flex-1">
        <Sidebar links={STUDENT_LINKS} />
        <main className="flex-1 p-6 space-y-6 bg-background">
          <div className="max-w-5xl">
            <h1 className="text-2xl font-bold text-navy">Credential Wallet</h1>
            <p className="text-sm text-text-muted mt-1">
              Store and manage your professional certificates, awards, and credentials in one verified location.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">
            
            {/* Upload Column */}
            <div className="lg:col-span-1">
              <Card title="Add New Credential" tone="blue">
                <form onSubmit={handleUpload} className="space-y-4 mt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Title (Required)</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. AWS Certified Developer"
                      className="text-sm border border-gray-300 rounded-lg p-2.5 w-full focus:ring-2 focus:ring-navy outline-none transition-all shadow-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Issuing Organization</label>
                    <input
                      type="text"
                      value={issuer}
                      onChange={(e) => setIssuer(e.target.value)}
                      placeholder="e.g. Amazon Web Services"
                      className="text-sm border border-gray-300 rounded-lg p-2.5 w-full focus:ring-2 focus:ring-navy outline-none transition-all shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Upload Document (Optional)</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 text-center hover:bg-gray-100 transition-colors">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".pdf,image/*"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        className="text-xs w-full cursor-pointer"
                      />
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded-lg border border-red-100">{error}</p>}

                  <button
                    type="submit"
                    disabled={uploading || !title.trim()}
                    className="btn-primary text-sm w-full py-2.5 shadow-sm"
                  >
                    {uploading ? "Saving..." : "Save Credential to Wallet"}
                  </button>
                </form>
              </Card>
            </div>

            {/* List Column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Verified Credentials ({certificates.length})
                </h2>
              </div>
              
              {loading ? (
                <p className="text-sm text-text-muted animate-pulse">Syncing wallet...</p>
              ) : certificates.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-gray-300 rounded-2xl text-center bg-gray-50">
                  <div className="text-4xl mb-4 opacity-50">??</div>
                  <h3 className="font-bold text-navy mb-1">Your wallet is empty</h3>
                  <p className="text-sm text-gray-500">Add your first certificate or award using the form on the left.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {certificates.map(cert => (
                    <div key={cert.id} className="relative group flex flex-col p-5 border border-gray-200 rounded-2xl shadow-sm bg-white hover:shadow-md hover:border-blue-300 transition-all">
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-inner">
                            {cert.title.charAt(0).toUpperCase()}
                          </div>
                          <button
                            onClick={() => handleDelete(cert.id)}
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete certificate"
                          >
                            ?
                          </button>
                        </div>
                        <h3 className="font-bold text-navy leading-tight mb-1">{cert.title}</h3>
                        {cert.issuer && <p className="text-sm text-gray-600 font-medium">{cert.issuer}</p>}
                        <p className="text-xs text-gray-400 mt-2">
                          Added {new Date(cert.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {cert.fileUrl && (
                        <a 
                          href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}${cert.fileUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-4 text-center block w-full py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-bold text-navy rounded-lg transition-colors"
                        >
                          View Original Document
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
