import React, { useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { XMarkIcon } from './icons';

interface BarcodeScannerModalProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ onScanSuccess, onClose }) => {
  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    const qrCodeSuccessCallback = (decodedText: string, decodedResult: any) => {
      html5QrCode.stop().then(() => {
        onScanSuccess(decodedText);
      }).catch(err => {
        console.error("Failed to stop scanner", err);
        onScanSuccess(decodedText); // Proceed even if stop fails
      });
    };
    
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    let startPromise = html5QrCode.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        (errorMessage) => { /* Optional error callback */ }
    );
    
    startPromise.catch((err) => {
        console.log(`Unable to start scanning, error: ${err}`);
        // Fallback for devices without a back camera
        html5QrCode.start(
            { facingMode: "user" },
            config,
            qrCodeSuccessCallback,
            (errorMessage) => { /* Optional error callback */ }
        ).catch(err => {
            alert("Could not start camera. Please grant camera permissions.")
            console.error("Camera start error", err);
            onClose();
        });
    });


    return () => {
      // Cleanup function to stop the scanner when the component unmounts
      html5QrCode.stop().catch(err => {
        // It might already be stopped, so errors here are often safe to ignore
        console.log("Scanner cleanup failed to stop. It might already be stopped.", err);
      });
    };
  }, [onScanSuccess, onClose]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 z-20">
        <XMarkIcon className="w-8 h-8" />
      </button>
      <div id="reader" className="w-full h-full"></div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="w-[250px] h-[250px] border-4 border-dashed border-white/80 rounded-2xl"></div>
      </div>
      <p className="absolute bottom-10 text-white text-lg bg-black/50 px-4 py-2 rounded-lg">
        Point camera at a barcode
      </p>
    </div>
  );
};

export default BarcodeScannerModal;
