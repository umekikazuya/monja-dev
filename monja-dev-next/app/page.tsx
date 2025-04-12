"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [themes, setThemes] = useState<string[]>([]);
  const [currentTheme, setCurrentTheme] = useState<string>("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    // カメラの初期化
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
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
        context.drawImage(
          videoRef.current,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        setCapturedImage(canvasRef.current.toDataURL("image/jpeg"));
      }
    }
    setCountdown(null);
  };

  return (
    <div>
      <h1>時限シャッターカメラ</h1>
      <video ref={videoRef} autoPlay playsInline style={{ display: capturedImage ? "none" : "block" }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      {countdown !== null && <h2>カウントダウン: {countdown}</h2>}
      {currentTheme && <h3>お題: {currentTheme}</h3>}
      {capturedImage && <img src={capturedImage} alt="Captured" />}
      <button onClick={startCountdown} disabled={countdown !== null}>
        撮影開始
      </button>
    </div>
  );
}
