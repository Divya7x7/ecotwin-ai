import { useEffect, useRef, useState } from "react";
import "./App.css";
import { supabase } from "./supabase";

const FUNCTION_NAME = "analyze-waste";

// supabase-js hides the real error body on non-2xx responses; read it so the
// user sees the backend's actual message (rate limit, image too large, etc.).
async function readFunctionError(functionError) {
  try {
    const response = functionError?.context;
    if (response && typeof response.json === "function") {
      const body = await response.json();
      if (body?.error) return body.error;
    }
  } catch {
    // fall through to the generic message
  }
  return "Could not reach the AI service. Please try again in a moment.";
}

function App() {
  const [activeTab, setActiveTab] = useState("Home");
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // Free the preview URL when it changes or the component unmounts.
  useEffect(() => {
    return () => {
      if (selectedImage) URL.revokeObjectURL(selectedImage);
    };
  }, [selectedImage]);

  function openPicker() {
    fileInputRef.current?.click();
  }

  function handleImage(event) {
    const file = event.target.files?.[0];

    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image.");
        event.target.value = "";
        return;
      }

      setSelectedImage(URL.createObjectURL(file));
      setSelectedFile(file);
      setAnalysis(null);
      setError("");
      setScanning(false);
      setActiveTab("Scan");
    }

    // Allow the same image to be selected again.
    event.target.value = "";
  }

  function resizeImage(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        try {
          const maxDimension = 1280;
          const scale = Math.min(
            1,
            maxDimension / Math.max(image.width, image.height)
          );

          const canvas = document.createElement("canvas");
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);

          const context = canvas.getContext("2d");
          if (!context) {
            throw new Error("Could not process this image.");
          }

          // White background so transparent PNGs don't turn black in JPEG.
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);

          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

          URL.revokeObjectURL(objectUrl);
          resolve(dataUrl);
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          reject(err);
        }
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(
          new Error(
            "Could not read this image. Try a JPEG, PNG or WebP photo."
          )
        );
      };

      image.src = objectUrl;
    });
  }

  async function startScan() {
    if (scanning) return;

    if (!selectedFile) {
      openPicker();
      return;
    }

    setScanning(true);
    setError("");
    setAnalysis(null);

    try {
      const imageDataUrl = await resizeImage(selectedFile);

      const { data, error: functionError } = await supabase.functions.invoke(
        FUNCTION_NAME,
        { body: { imageDataUrl } }
      );

      if (functionError) {
        throw new Error(await readFunctionError(functionError));
      }

      if (!data?.success || !data?.analysis) {
        throw new Error(data?.error || "The image analysis failed.");
      }

      setAnalysis(data.analysis);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setScanning(false);
    }
  }

  function retakePhoto() {
    setSelectedImage(null);
    setSelectedFile(null);
    setAnalysis(null);
    setError("");
    setScanning(false);
    openPicker();
  }

  return (
    <div className="app">
      <header className="navbar">
        <div className="brand">
          <span className="brand-icon">♻</span>
          <span>
            EcoTwin<span className="brand-ai"> AI</span>
          </span>
        </div>

        <span className="status">● Sustainability starts here</span>
      </header>

      <main className="main-content">
        <section className="hero">
          <p className="eyebrow">YOUR PERSONAL ECO ASSISTANT</p>

          <h1>
            Waste less.
            <br />
            <span>Live better.</span>
          </h1>

          <p className="hero-text">
            Scan any waste item. Discover where it belongs,
            how to reuse it, and how to make a difference.
          </p>

          <button className="primary-button" onClick={openPicker}>
            <span>◎</span> Scan Your Waste
          </button>

          {/* No `capture` attribute: on phones the browser then offers both
              "Take photo" and "Choose from library". */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={handleImage}
          />

          <p className="small-note">Use your camera or upload an image</p>
        </section>

        <section className="scan-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">SMART WASTE SCANNER</p>
              <h2>
                {activeTab === "Scan"
                  ? "Your scan"
                  : "What are you throwing away?"}
              </h2>
            </div>

            <span className="leaf-icon">✳</span>
          </div>

          <div className="image-area">
            {selectedImage ? (
              <img
                className="preview-image"
                src={selectedImage}
                alt="Selected waste item"
              />
            ) : (
              <div className="empty-state">
                <div className="camera-icon">◎</div>
                <h3>Your next scan starts here</h3>
                <p>Take a photo of a waste item to get started.</p>
              </div>
            )}
          </div>

          {selectedImage && (
            <div className="image-actions">
              <button
                className="secondary-button"
                onClick={retakePhoto}
                disabled={scanning}
              >
                Retake Photo
              </button>

              <button
                className="primary-button"
                onClick={startScan}
                disabled={scanning}
              >
                {scanning ? "Analysing..." : "Analyse Image"}
              </button>
            </div>
          )}

          {scanning && (
            <div className="demo-result" role="status">
              <h3>Analysing your image...</h3>
              <p>
                EcoTwin AI is identifying the item and checking disposal
                guidance.
              </p>
            </div>
          )}

          {error && (
            <div className="demo-result error-result" role="alert">
              <h3>Analysis failed</h3>
              <p>{error}</p>
            </div>
          )}

          {analysis && (
            <div className="demo-result">
              <h3>AI Waste Analysis</h3>

              <p><strong>Item:</strong> {analysis.item}</p>
              <p><strong>Likely material:</strong> {analysis.material}</p>
              <p><strong>Confidence:</strong> {analysis.confidence}</p>
              <p><strong>Suggested bin:</strong> {analysis.bin}</p>

              <p><strong>How to dispose:</strong></p>
              <p>{analysis.disposal}</p>

              {analysis.reuseIdeas?.length > 0 && (
                <>
                  <p><strong>Reuse ideas:</strong></p>
                  <ul>
                    {analysis.reuseIdeas.map((idea, index) => (
                      <li key={index}>{idea}</li>
                    ))}
                  </ul>
                </>
              )}

              {analysis.caution && (
                <p><strong>Note:</strong> {analysis.caution}</p>
              )}
            </div>
          )}

          <div className="feature-row">
            <div className="feature">
              <span>⌕</span>
              <p>Identify</p>
            </div>
            <div className="feature">
              <span>♻</span>
              <p>Recycle</p>
            </div>
            <div className="feature">
              <span>↗</span>
              <p>Reuse</p>
            </div>
          </div>
        </section>

        <section className="steps-section">
          <p className="eyebrow">SIMPLE. SMART. SUSTAINABLE.</p>
          <h2>Three steps to better waste decisions.</h2>

          <div className="steps-grid">
            <article className="step-card">
              <span className="step-number">01</span>
              <h3>Scan it</h3>
              <p>Capture a photo of the item you want to discard.</p>
            </article>

            <article className="step-card">
              <span className="step-number">02</span>
              <h3>Understand it</h3>
              <p>Identify the material and get disposal guidance.</p>
            </article>

            <article className="step-card">
              <span className="step-number">03</span>
              <h3>Act on it</h3>
              <p>Find ways to reuse, recycle, or reduce waste.</p>
            </article>
          </div>
        </section>
      </main>

      <footer>
        <div className="brand">
          <span className="brand-icon">♻</span>
          EcoTwin AI
        </div>
        <p>Better decisions. Less waste.</p>
      </footer>
    </div>
  );
}

export default App;
