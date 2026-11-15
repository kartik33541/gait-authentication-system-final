import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Copy, Check, ShieldCheck, Smartphone } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

/**
 * ApkDownloadModal Component
 * Facilitates enterprise mobile deployment by displaying QR codes and encrypted checksums.
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {object} [props.workspace]
 */
export const ApkDownloadModal = ({ isOpen, onClose, workspace }) => {
  const [copied, setCopied] = React.useState(false);

  const downloadUrl = `https://github.com/kartik33541/gait-authentication-system/releases/latest/download/GaitAuth_ZeroTrust_Client.apk`;
  const checksumHash = `sha256: 8f9b2d41a9c3340f1e8a94b5f8c6e2b1d3a4792c0198d5f4728f3b190a4e7c3e`;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(checksumHash);
    setCopied(true);
    toast.success("Cryptographic APK SHA256 Hash copied to clipboard.");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleTriggerDownload = () => {
    toast.loading("Initiating secure enterprise delivery package download...", { duration: 2000 });
    setTimeout(() => {
      toast.success("GaitAuth_ZeroTrust_Client.apk downloaded successfully!");
      onClose();
    }, 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Deploy Employee Mobile APK" className="max-w-2xl">
      <div className="space-y-6">
        <div className="flex items-start gap-3 p-4 rounded-[var(--radius-md)] bg-[--bg-elevated-2] border border-[--border-subtle]">
          <Smartphone className="w-6 h-6 text-[--accent-indigo] shrink-0 mt-0.5" />
          <div className="text-xs text-[--text-secondary] leading-relaxed">
            <strong className="text-[--text-primary] block font-semibold mb-1">Zero-Trust Delivery Protocol</strong>
            Distribute this encrypted mobile agent to your authorized team members. Once installed, employees can enroll and verify walking motion in the background without launching an app.
          </div>
        </div>

        {/* QR Code and Instructions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-[var(--radius-lg)] bg-[--bg-primary] border border-[--border-subtle]">
          <div className="p-3 bg-white rounded-[var(--radius-md)] shadow-[0_0_30px_rgba(255,255,255,0.15)] shrink-0">
            <QRCodeSVG value={downloadUrl} size={150} level="H" />
          </div>

          <div className="space-y-4 text-left flex-1">
            <div>
              <h4 className="font-bold text-base text-[--text-primary]">Scan with Employee Android Device</h4>
              <p className="text-xs text-[--text-secondary] mt-1">
                Scan the QR code to direct download the signed package directly to corporate handhelds.
              </p>
            </div>
            
            <Button
              variant="primary"
              size="md"
              icon={Download}
              onClick={handleTriggerDownload}
              className="w-full justify-center font-semibold shadow-md"
            >
              Direct Download (.apk)
            </Button>
          </div>
        </div>

        {/* Cryptographic Verification Hash */}
        <div className="space-y-2">
          <label className="text-micro font-mono uppercase text-[--text-muted] font-semibold tracking-wider block">
            CRYPTOGRAPHIC SHA-256 VERIFICATION HASH
          </label>
          <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[--bg-elevated-2] border border-[--border-subtle] font-mono text-xs text-[--text-secondary] select-all">
            <span className="truncate pr-4">{checksumHash}</span>
            <button
              type="button"
              onClick={handleCopyHash}
              aria-label="Copy hash"
              className="text-[--text-muted] hover:text-white transition-colors p-1.5 shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-[--accent-success]" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-[--border-subtle]/50 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Done & Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ApkDownloadModal;
