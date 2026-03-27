'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Download, X, Loader2 } from "lucide-react";
import { generatePDF } from "@/lib/offer-letter-pdf";

export default function PreviewPage() {
  const params = useParams();
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const storedHtml = localStorage.getItem(`offer-letter-${params.id}`);
    if (storedHtml) {
      setHtml(storedHtml);
    }
    setLoading(false);
  }, [params.id]);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      await generatePDF(html, `offer-letter-${params.id}.pdf`);
      alert('PDF downloaded successfully');
    } catch (error) {
      console.error('[v0] Error generating PDF:', error);
      alert(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="sticky top-0 bg-white border-b shadow-sm p-4 flex justify-between items-center z-10">
        <h1 className="text-lg font-semibold">Offer Letter Preview</h1>
        <div className="flex gap-2">
          <Button onClick={handleDownloadPDF} disabled={downloading}>
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
          <Button onClick={() => window.close()} variant="outline">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex justify-center p-8">
        <div 
          className="bg-white shadow-lg rounded-lg overflow-hidden"
          style={{ maxWidth: '850px', width: '100%' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
