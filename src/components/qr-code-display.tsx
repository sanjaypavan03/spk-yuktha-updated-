/**
 * QR Code Display Component
 * Generates and displays a QR code for emergency information
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, CheckCircle } from 'lucide-react';

interface QRCodeDisplayProps {
  qrData: string;
  size?: number;
  showDescription?: boolean;
  copyableUrl?: string;
}

export function QRCodeDisplay({
  qrData,
  size = 200,
  showDescription = true,
  copyableUrl,
}: QRCodeDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Encode QR data and generate URL using QR code API
    const encodedData = encodeURIComponent(qrData);
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}`;
    setQrCodeUrl(url);
    setIsLoading(false);
  }, [qrData, size]);

  const handleCopy = async () => {
    if (!copyableUrl) return;
    try {
      await navigator.clipboard.writeText(copyableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {isLoading ? (
        <div className="flex items-center justify-center w-[200px] h-[200px] bg-muted rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="p-2 bg-white rounded-lg border border-border shadow-sm">
          <Image
            src={qrCodeUrl}
            width={size}
            height={size}
            alt="Emergency QR Code"
            data-ai-hint="qr code"
            priority
          />
        </div>
      )}

      {showDescription && (
        <p className="text-xs text-muted-foreground text-center">
          First responders can scan this code to view your emergency information instantly.
        </p>
      )}

      {copyableUrl && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="w-full max-w-xs"
        >
          {copied ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </>
          )}
        </Button>
      )}
    </div>
  );
}
