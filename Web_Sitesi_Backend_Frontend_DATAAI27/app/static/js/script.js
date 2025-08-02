// app/static/js/script.js - FİNAL VERSİYON (Estetik Rapor Metni ile)

document.addEventListener("DOMContentLoaded", () => {
  // --- GLOBAL DEĞİŞKENLER ---
  const API_BASE_URL =
    "https://kalpkrizibackendmodel-production.up.railway.app";

  // --- GÜVENLİ STORAGE FONKSİYONLARI (Aynı kaldı) ---
  function safeSetStorage(key, value) {
    try {
      if (typeof Storage !== "undefined") {
        sessionStorage.setItem(key, JSON.stringify(value));
        return true;
      }
    } catch (error) {
      console.warn("Storage hatası:", error);
    }
    return false;
  }
  function safeGetStorage(key) {
    try {
      if (typeof Storage !== "undefined") {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      }
    } catch (error) {
      console.warn("Storage okuma hatası:", error);
    }
    return null;
  }
  function safeRemoveStorage(key) {
    try {
      if (typeof Storage !== "undefined") {
        sessionStorage.removeItem(key);
      }
    } catch (error) {
      console.warn("Storage silme hatası:", error);
    }
  }

  // --- RİSK HESAPLAMA FORMU GÖNDERME MANTIĞI (Aynı kaldı) ---
  const riskForm = document.getElementById("risk-form");
  // script.js içindeki if(riskForm) { ... } bloğunun tamamını bununla değiştir

  if (riskForm) {
    riskForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const submitButton = riskForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = "Hesaplanıyor...";

      const formData = new FormData(riskForm);
      const data = {};
      formData.forEach((value, key) => {
        data[key] = key === "oldpeak" ? parseFloat(value) : Number(value);
      });

      try {
        console.log("API'ye Gönderilen Final Veri:", data);
        const response = await fetch(`${API_BASE_URL}/predict?explain=true`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Hatası: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log("API'den Gelen Yanıt:", result);

        if (safeSetStorage("predictionResult", result)) {
          window.location.href = "/rapor";
        } else {
          const params = new URLSearchParams({ data: JSON.stringify(result) });
          window.location.href = `/rapor?${params.toString()}`;
        }
      } catch (error) {
        // <-- DOĞRU PARANTEZLER BURADA
        alert("Risk hesaplanırken bir sorun oluştu: " + error.message);
        submitButton.disabled = false;
        submitButton.textContent = "Kalp Krizi Riskini Hesapla";
      }
    });
  }
  // --- RAPOR SAYFASI VERİ YÜKLEME MANTIĞI (ESTETİK GÖRÜNÜM İÇİN YENİLENDİ) ---
  if (window.location.pathname === "/rapor") {
    let result = safeGetStorage("predictionResult");

    if (!result) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has("data")) {
        try {
          result = JSON.parse(urlParams.get("data"));
        } catch (e) {
          console.error("URL verisi okunamadı:", e);
          result = null;
        }
      }
    }

    const explanationEl = document.getElementById("risk-explanation-content");

    if (result && typeof result === "object") {
      const riskPercentage = Math.round(
        (result.prediction_probability || 0) * 100
      );

      // Gerekli HTML elemanlarını seçiyoruz
      const percentageEl = document.getElementById("risk-percentage-element");
      const statusEl = document.getElementById("risk-status-element");
      const gaugeEl = document.querySelector(".risk-gauge");

      let durumEtiketi, durumClass;

      // 1. Durumu belirle (Yüksek/Düşük)
      if (result.prediction === 1) {
        durumEtiketi = "Yüksek Risk";
        durumClass = "high-risk";
      } else {
        durumEtiketi = "Düşük Risk";
        durumClass = "low-risk";
      }

      // 2. API'den gelen uzun metni parçalara ayır ve HTML olarak formatla
      const rawExplanation = result.explanation || "Açıklama bulunamadı.";
      // Öneriler kısmını "1. **" gibi bir ifadeyle ayırıyoruz.
      const introParts = rawExplanation.split("1. **");
      const introText = introParts[0]; // Ana açıklama metni
      const recommendationsText =
        introParts.length > 1 ? "1. **" + introParts[1] : ""; // Öneriler metni

      let formattedHTML = `<p>${introText}</p>`; // Ana paragrafı ekle

      if (recommendationsText) {
        formattedHTML += `<h5 style="margin-top: 1.5rem; color: #333;">Öneriler:</h5><ul>`;

        // "1. **...** 2. **...**" gibi kısımları ayırmak için Regex kullanıyoruz
        const recommendationItems = recommendationsText
          .split(/\d+\.\s*\*\*/)
          .filter((item) => item.trim() !== "");

        recommendationItems.forEach((item) => {
          // Başlık (örn: Sağlıklı Beslenme:) ve açıklamayı ayır
          const itemParts = item.split(":**");
          const title = itemParts[0];
          const description = itemParts[1] || "";
          formattedHTML += `<li style="margin-bottom: 0.75rem;"><strong>${title}:</strong>${description}</li>`;
        });

        formattedHTML += `</ul>`;
      }

      formattedHTML += `<p style="margin-top: 1rem; font-style: italic; font-size: 0.9rem;"><strong>Not:</strong> Bu tahmin tıbbi bir teşhis yerine geçmez.</p>`;

      // 3. Oluşturulan HTML'i ve diğer verileri sayfaya bas
      if (percentageEl) {
        percentageEl.textContent = `${riskPercentage}%`;
        percentageEl.style.color =
          durumClass === "high-risk" ? "#e74c3c" : "#27ae60";
      }
      if (statusEl) {
        statusEl.textContent = durumEtiketi;
        statusEl.className = `status-indicator ${durumClass}`;
      }
      if (gaugeEl) {
        gaugeEl.style.setProperty("--risk-percentage", riskPercentage);
        const gaugeColor = durumClass === "high-risk" ? "#e74c3c" : "#27ae60";
        gaugeEl.style.setProperty("--gauge-color", gaugeColor);
      }
      if (explanationEl) {
        // .innerHTML kullanarak HTML etiketlerinin render edilmesini sağlıyoruz
        explanationEl.innerHTML = formattedHTML;
      }

      safeRemoveStorage("predictionResult"); // Veriyi kullandıktan sonra temizle
    } else {
      // Sonuç yoksa varsayılan metni göster
      if (explanationEl) {
        explanationEl.innerHTML =
          "<p>Geçerli bir sonuç bulunamadı. Lütfen önce risk hesaplama sayfasından bir analiz yapın.</p>";
      }
    }
  }
  // --- CHATBOT MANTIĞI (Aynı kaldı) ---
  const chatbotContainer = document.querySelector(".chatbot-container");
  const toggleBtn = document.getElementById("chatbot-toggle-btn");
  const closeBtn = document.getElementById("close-chat-btn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () =>
      chatbotContainer.classList.add("active")
    );
  }
  if (closeBtn) {
    closeBtn.addEventListener("click", () =>
      chatbotContainer.classList.remove("active")
    );
  }
  // ... (Chatbot'un geri kalan kodu aynı)

  const sendChatBtn = document.getElementById("send-chat-btn");
  if (sendChatBtn) {
    const chatInput = document.getElementById("chat-input");
    const chatBody = document.querySelector(".chat-body");
    const handleSendMessage = async () => {
      const question = chatInput.value.trim();
      if (question === "") return;

      const userMessageDiv = document.createElement("div");
      userMessageDiv.className = "message user";
      userMessageDiv.textContent = question;
      if (chatBody) chatBody.appendChild(userMessageDiv);

      chatInput.value = "";
      sendChatBtn.disabled = true;

      try {
        const response = await fetch(`${API_BASE_URL}/ask-ai`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: question }),
        });
        if (!response.ok) {
          throw new Error("AI servisinden yanıt alınamadı.");
        }
        const data = await response.json();
        const aiMessageDiv = document.createElement("div");
        aiMessageDiv.className = "message assistant";
        aiMessageDiv.textContent = data.answer || "Yanıt alınamadı";
        if (chatBody) chatBody.appendChild(aiMessageDiv);
      } catch (error) {
        console.error("Chatbot hatası:", error);
        const errorMessageDiv = document.createElement("div");
        errorMessageDiv.className = "message assistant";
        errorMessageDiv.textContent = "Üzgünüm, bir sorun oluştu.";
        if (chatBody) chatBody.appendChild(errorMessageDiv);
      } finally {
        sendChatBtn.disabled = false;
        if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
      }
    };
    sendChatBtn.addEventListener("click", handleSendMessage);
    if (chatInput) {
      chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleSendMessage();
      });
    }
  }
});
