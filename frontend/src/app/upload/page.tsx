"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      setError("Select a CSV file first.");
      return;
    }
    if (!backendBase) {
      setError("Backend URL is not configured (NEXT_PUBLIC_BACKEND_URL).");
      return;
    }

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const presignRes = await fetch(`${backendBase}/upload-url`, { method: "POST" });
      if (!presignRes.ok) {
        throw new Error(`Upload URL request failed (${presignRes.status})`);
      }
      const { upload } = await presignRes.json();
      const formData = new FormData();
      Object.entries(upload.fields as Record<string, string>).forEach(([k, v]) => {
        formData.append(k, v);
      });
      formData.append("file", file);

      const uploadRes = await fetch(upload.url, { method: "POST", body: formData });
      if (!uploadRes.ok) {
        throw new Error(`S3 upload failed (${uploadRes.status})`);
      }

      setStatus("File uploaded. Ingestion and matching will start shortly.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container flex flex-col gap-6 pb-16 pt-12">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-primary">User CSV Upload</p>
          <h1 className="text-2xl font-semibold">Kick off ingestion & matching</h1>
          <p className="text-muted-foreground">Uploads go straight to S3 via a presigned URL, then Lambda parses and triggers n8n Workflow B.</p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Select CSV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button onClick={handleUpload} disabled={loading}>
              {loading ? "Uploading..." : "Upload and Ingest"}
            </Button>
            {status ? <Alert variant="default" title="Success">{status}</Alert> : null}
            {error ? <Alert variant="destructive" title="Error">{error}</Alert> : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
