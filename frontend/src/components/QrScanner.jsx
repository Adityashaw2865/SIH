import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { X, Camera } from "lucide-react";

/**
 * Camera-based QR code scanner.
 *
 * Reads live frames from the device camera via getUserMedia, decodes
 * them locally in the browser with jsQR — no image or video data ever
 * leaves the device — and calls onScan(text) the moment a QR code is
 * recognized. Used to scan an ABHA card's QR code, which encodes the
 * patient's ABHA number as plain text.
 *
 * onScan: (decodedText: string) => void — called once, on first successful decode.
 * onCancel: () => void — called when the patient backs out of the scanner.
 */
export default function QrScanner({ onScan, onCancel, hint }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const doneRef = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    doneRef.current = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        rafRef.current = requestAnimationFrame(tick);
      } catch (err) {
        if (!cancelled) {
          setError("Couldn't access the camera. Please allow camera permission, or use manual entry instead.");
        }
      }
    }

    function tick() {
      if (doneRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert"
      });
      if (code?.data) {
        doneRef.current = true;
        onScan(code.data);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    start();
    return () => {
      cancelled = true;
      doneRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, [onScan]);

  return (
    <div className="rounded-2xl overflow-hidden border-2 border-teal-light bg-black relative">
      <button
        type="button"
        onClick={onCancel}
        className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 text-ink flex items-center justify-center"
        aria-label="Cancel scan"
      >
        <X size={18} />
      </button>
      {error ? (
        <div className="aspect-video flex flex-col items-center justify-center gap-2 text-white text-sm text-center px-6 py-8">
          <Camera size={28} className="text-white/70" />
          <p>{error}</p>
        </div>
      ) : (
        <video ref={videoRef} className="w-full aspect-video object-cover" playsInline muted />
      )}
      <canvas ref={canvasRef} className="hidden" />
      {!error && <div className="absolute inset-x-0 bottom-3 text-center">
          <p className="text-white text-xs bg-black/50 inline-block px-3 py-1 rounded-full">
            {hint || "Point the camera at your ABHA QR code"}
          </p>
        </div>}
    </div>
  );
}