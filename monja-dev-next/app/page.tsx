"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [themes, setThemes] = useState<string[]>([]);
  const [currentTheme, setCurrentTheme] = useState<string>("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showFlash, setShowFlash] = useState<boolean>(false);
  const [videoWidth, setVideoWidth] = useState<number>(640);
  const [videoHeight, setVideoHeight] = useState<number>(480);

  useEffect(() => {
    // カメラの初期化
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // ビデオのロード完了時にサイズを取得
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              setVideoWidth(videoRef.current.videoWidth);
              setVideoHeight(videoRef.current.videoHeight);
              // キャンバスのサイズも同じに設定
              if (canvasRef.current) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
              }
            }
          };
        }
      } catch (err) {
        console.error("カメラの起動に失敗しました", err);
      }
    }

    // お題の読み込み
    async function loadThemes() {
      try {
        const response = await fetch("/themes.json");
        const data = await response.json();
        setThemes(data);
      } catch (err) {
        console.error("お題の読み込みに失敗しました", err);
      }
    }

    initCamera();
    loadThemes();
  }, []);

  const startCountdown = () => {
    if (!themes.length) return;
    setCurrentTheme(themes[Math.floor(Math.random() * themes.length)]);
    let count = 3;
    setCountdown(count);

    const interval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        capturePhoto();
      }
    }, 1000);
  };

  const capturePhoto = () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        // フラッシュ効果を表示
        setShowFlash(true);
        
        // 動画の実際のサイズでキャプチャ
        context.drawImage(
          videoRef.current,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        
        setCapturedImage(canvasRef.current.toDataURL("image/jpeg"));
        
        // 500ミリ秒後にフラッシュを消す
        setTimeout(() => {
          setShowFlash(false);
        }, 500);
      }
    }
    setCountdown(null);
  };

  const resetCamera = () => {
    setCapturedImage(null);
    setCurrentTheme("");
  };

  return (
    <div className="camera-container">
      <h1>時限シャッターカメラ</h1>
      <div className="camera-view" style={{ position: "relative", width: `${videoWidth}px`, maxWidth: "100%", margin: "0 auto" }}>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          style={{ 
            display: capturedImage ? "none" : "block",
            width: "100%",
            height: "auto"
          }} 
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />
        
        {/* フラッシュ効果 */}
        {showFlash && (
          <div 
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "white",
              opacity: 0.7,
              zIndex: 10,
              animation: "flash 0.5s ease-out"
            }}
          />
        )}
        
        {/* 撮影した画像 */}
        {capturedImage && (
          <div className="captured-image-container" style={{ position: "relative" }}>
            <img 
              src={capturedImage} 
              alt="Captured" 
              style={{ 
                width: "100%",
                height: "auto",
                animation: "fadeIn 0.5s ease-in"
              }} 
            />
            <div 
              className="image-caption" 
              style={{
                position: "absolute",
                bottom: "10px",
                left: "0",
                right: "0",
                textAlign: "center",
                backgroundColor: "rgba(0,0,0,0.5)",
                color: "white",
                padding: "5px",
                animation: "slideUp 0.7s ease-out"
              }}
            >
              お題: {currentTheme}
            </div>
          </div>
        )}
        
        {countdown !== null && (
          <div className="countdown" style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "72px",
            color: "white",
            textShadow: "0 0 10px rgba(0,0,0,0.8)",
            zIndex: 5
          }}>
            {countdown}
          </div>
        )}
      </div>
      
      <div className="controls" style={{ marginTop: "20px", textAlign: "center" }}>
        {!capturedImage ? (
          <button 
            onClick={startCountdown} 
            disabled={countdown !== null}
            style={{
              padding: "10px 20px",
              fontSize: "18px",
              backgroundColor: countdown !== null ? "#ccc" : "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: countdown !== null ? "default" : "pointer"
            }}
          >
            撮影開始
          </button>
        ) : (
          <button 
            onClick={resetCamera}
            style={{
              padding: "10px 20px",
              fontSize: "18px",
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            もう一度撮る
          </button>
        )}
      </div>
      
      <style jsx>{`
        @keyframes flash {
          0% { opacity: 0.9; }
          100% { opacity: 0; }
        }
        
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes slideUp {
          0% { transform: translateY(30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
