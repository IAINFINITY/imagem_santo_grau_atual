document.addEventListener("DOMContentLoaded", () => {
  // Verifica sessão pelo Supabase
  let currentUser = null;
  const ensureAuth = async () => {
    try {
      if (window.sb) {
        const { data: { user } } = await window.sb.auth.getUser();
        currentUser = user || null;
      }
    } catch (_) { currentUser = null; }
    if (!currentUser) {
      window.location.href = "index.html";
      return false;
    }
    return true;
  };

  // Encapsula restante da lógica após autenticação
  (async () => {
    const ok = await ensureAuth();
    if (!ok) return;

  const greeting = document.getElementById("greeting");
  const email = (currentUser?.email) || localStorage.getItem("rememberEmail") || "";
  if (email && greeting) {
    const name = email.split("@")[0];
    greeting.textContent = `Olá, ${name}!`;
  }

  const logoutBtn = document.getElementById("logout-btn");
  logoutBtn?.addEventListener("click", async () => {
    try { await window.sb?.auth.signOut(); } catch (_) {}
    window.location.href = "index.html";
  });

  // ===== Modal: Criar nova imagem =====
  const modal = document.getElementById("create-modal");
  const openBtn = document.querySelector(".action-plus");
  const closeBtn = document.querySelector(".modal-close");
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

  // Estado da imagem selecionada para o cliente (via input, drop ou paste)
  let clientImage = null;

  function handleNewClientImage(file) {
    if (!file || !isImage(file)) return;
    clientImage = file;
    renderPreview(clientPreview, clientImage);
  }

  // Função para abrir seletor de arquivo sem depender de input fixo
  async function openImagePicker() {
    try {
      if (window.showOpenFilePicker) {
        const [handle] = await window.showOpenFilePicker({
          types: [{ description: "Imagens", accept: { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] } }],
          multiple: false
        });
        const file = await handle.getFile();
        return file || null;
      }
    } catch (_) { /* fallback abaixo */ }
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.style.display = "none";
      document.body.appendChild(input);
      input.addEventListener("change", () => {
        const file = input.files?.[0] || null;
        document.body.removeChild(input);
        resolve(file);
      });
      input.click();
    });
  }

  // Abrir seletor de arquivo ao clicar/teclar na área
  clientPreview?.addEventListener("click", async () => {
    const file = await openImagePicker();
    handleNewClientImage(file);
  });
  clientPreview?.addEventListener("keydown", async (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); const file = await openImagePicker(); handleNewClientImage(file); }
  });

  // Drag & Drop
  clientPreview?.addEventListener("dragover", (e) => { e.preventDefault(); clientPreview.classList.add("dragover"); });
  clientPreview?.addEventListener("dragleave", () => clientPreview.classList.remove("dragover"));
  clientPreview?.addEventListener("drop", (e) => {
    e.preventDefault();
    clientPreview.classList.remove("dragover");
    const file = e.dataTransfer?.files?.[0];
    handleNewClientImage(file);
  });

  // Paste (Ctrl+V) de imagem
  clientPreview?.addEventListener("paste", (e) => {
    const items = e.clipboardData?.items || [];
    for (const item of items) {
      if (item.type && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) { handleNewClientImage(file); break; }
      }
    }
  });

  // Sem input fixo: seleção ocorre via openImagePicker, drag & drop ou paste.

  // ===== Dropzone: Modelo de óculos =====
  let glassesImage = null;
  function handleNewGlassesImage(file) {
    if (!file || !isImage(file)) return;
    glassesImage = file;
    renderPreview(glassesPreview, glassesImage);
  }

  glassesPreview?.addEventListener("click", async () => {
    const file = await openImagePicker();
    handleNewGlassesImage(file);
  });
  glassesPreview?.addEventListener("keydown", async (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); const file = await openImagePicker(); handleNewGlassesImage(file); }
  });
  glassesPreview?.addEventListener("dragover", (e) => { e.preventDefault(); glassesPreview.classList.add("dragover"); });
  glassesPreview?.addEventListener("dragleave", () => glassesPreview.classList.remove("dragover"));
  glassesPreview?.addEventListener("drop", (e) => {
    e.preventDefault();
    glassesPreview.classList.remove("dragover");
    const file = e.dataTransfer?.files?.[0];
    handleNewGlassesImage(file);
  });
  glassesPreview?.addEventListener("paste", (e) => {
    const items = e.clipboardData?.items || [];
    for (const item of items) {
      if (item.type && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) { handleNewGlassesImage(file); break; }
      }
    }
  });
  // Sem input fixo: seleção ocorre via openImagePicker, drag & drop ou paste.

  startMagicBtn?.addEventListener("click", async () => {
    setText(modalMessage, "");
    if (webhookResponseEl) webhookResponseEl.textContent = "";
    const client = clientImage;
    const glasses = glassesImage;

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
  })();
});