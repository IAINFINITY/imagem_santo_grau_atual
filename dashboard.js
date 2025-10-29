document.addEventListener("DOMContentLoaded", () => {
  const isAuthed = localStorage.getItem("auth") === "true";
  if (!isAuthed) {
    window.location.href = "index.html";
    return;
  }

  const greeting = document.getElementById("greeting");
  const email = localStorage.getItem("authEmail") || localStorage.getItem("rememberEmail") || "";
  if (email && greeting) {
    const name = email.split("@")[0];
    greeting.textContent = `Olá, ${name}!`;
  }

  const logoutBtn = document.getElementById("logout-btn");
  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("auth");
    localStorage.removeItem("authEmail");
    window.location.href = "index.html";
  });

  // ===== Modal: Criar nova imagem =====
  const modal = document.getElementById("create-modal");
  const openBtn = document.querySelector(".action-plus");
  const closeBtn = document.querySelector(".modal-close");
  const clientFile = document.getElementById("client-file");
  const glassesFile = document.getElementById("glasses-file");
  const clientPreview = document.getElementById("client-preview");
  const glassesPreview = document.getElementById("glasses-preview");
  const startMagicBtn = document.getElementById("start-magic");
  const modalMessage = document.getElementById("modal-message");
  const webhookResponseEl = document.getElementById("webhook-response");
  const loading = document.getElementById("loading-overlay");

  function setText(el, text) { if (el) el.textContent = text || ""; }
  function openModal() { modal?.classList.add("open"); setText(modalMessage, ""); if (webhookResponseEl) webhookResponseEl.textContent = ""; closeBtn?.focus(); }
  function closeModal() { modal?.classList.remove("open"); }
  function isImage(file) { return file && file.type && file.type.startsWith("image/"); }
  function renderPreview(container, file) {
    if (!container) return;
    container.innerHTML = "";
    if (!file || !isImage(file)) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement("img");
      img.src = e.target?.result;
      img.alt = "Pré-visualização";
      container.appendChild(img);
    };
    reader.readAsDataURL(file);
  }

  openBtn?.addEventListener("click", (e) => { e.preventDefault(); openModal(); });
  closeBtn?.addEventListener("click", () => closeModal());
  modal?.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  clientFile?.addEventListener("change", () => renderPreview(clientPreview, clientFile.files?.[0]));
  glassesFile?.addEventListener("change", () => renderPreview(glassesPreview, glassesFile.files?.[0]));

  startMagicBtn?.addEventListener("click", async () => {
    setText(modalMessage, "");
    if (webhookResponseEl) webhookResponseEl.textContent = "";
    const client = clientFile?.files?.[0];
    const glasses = glassesFile?.files?.[0];

    if (!client) { setText(modalMessage, "Selecione a imagem do cliente."); return; }
    if (!isImage(client)) { setText(modalMessage, "Arquivo do cliente deve ser uma imagem."); return; }
    if (!glasses) { setText(modalMessage, "Selecione a imagem do modelo de óculos."); return; }
    if (!isImage(glasses)) { setText(modalMessage, "Arquivo do modelo deve ser uma imagem."); return; }

    startMagicBtn.disabled = true;
    setText(modalMessage, "Enviando imagens para o webhook...");
    loading?.classList.add("show");

    try {
      const webhookUrl = (window.WEBHOOK_URL || localStorage.getItem("webhookUrl") || "").trim();
      if (!webhookUrl) {
        setText(modalMessage, "Defina o webhook em window.WEBHOOK_URL (config.js) ou localStorage 'webhookUrl'.");
        startMagicBtn.disabled = false;
        return;
      }

      const formData = new FormData();
      formData.append("client", client);
      formData.append("glasses", glasses);
      formData.append("email", email || "");
      formData.append("timestamp", new Date().toISOString());

      const resp = await fetch(webhookUrl, {
        method: "POST",
        body: formData
      });

      const contentType = resp.headers.get("content-type") || "";
      let bodyText = "";
      let pretty = "";
      try {
        if (contentType.includes("application/json")) {
          const json = await resp.clone().json();
          pretty = JSON.stringify(json, null, 2);
        } else {
          bodyText = await resp.clone().text();
          pretty = bodyText || "(sem corpo)";
        }
      } catch (_) {
        // Se parsing falhar (CORS ou corpo vazio)
        pretty = bodyText || "(sem corpo ou sem permissões CORS para leitura)";
      }

      if (webhookResponseEl) webhookResponseEl.textContent = pretty;
      const statusMsg = resp.ok ? "Webhook acionado com sucesso." : `Webhook respondeu ${resp.status}.`;
      setText(modalMessage, statusMsg);
      if (!resp.ok) throw new Error(statusMsg);
    } catch (err) {
      const errMsg = `Falha ao acionar o webhook: ${err.message || err}`;
      setText(modalMessage, errMsg);
      if (webhookResponseEl && !webhookResponseEl.textContent) webhookResponseEl.textContent = errMsg;
    } finally {
      startMagicBtn.disabled = false;
      loading?.classList.remove("show");
    }
  });
});