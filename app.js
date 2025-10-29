function isValidEmail(email) {
  // Validação simples de e-mail
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setText(el, text) {
  if (!el) return;
  el.textContent = text || "";
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const emailEl = document.getElementById("email");
  const passwordEl = document.getElementById("password");
  const rememberEl = document.getElementById("remember");
  const emailError = document.getElementById("email-error");
  const passwordError = document.getElementById("password-error");
  const formMessage = document.getElementById("form-message");
  const submitBtn = document.getElementById("submit-btn");
  const signupLink = document.getElementById("signup-link");
  const forgotLink = document.getElementById("forgot-link");
  const resetSection = document.getElementById("reset-section");
  const newPasswordEl = document.getElementById("new-password");
  const confirmPasswordEl = document.getElementById("confirm-password");
  const newPasswordError = document.getElementById("new-password-error");
  const confirmPasswordError = document.getElementById("confirm-password-error");
  const resetMessage = document.getElementById("reset-message");
  const updatePasswordBtn = document.getElementById("update-password-btn");

  // Prefill de e-mail se o usuário escolheu lembrar
  const savedEmail = localStorage.getItem("rememberEmail");
  if (savedEmail) {
    emailEl.value = savedEmail;
    rememberEl.checked = true;
  }

  // Botão de alternância de senha removido conforme solicitado

  // Limpar erro ao digitar
  emailEl.addEventListener("input", () => setText(emailError, ""));
  passwordEl.addEventListener("input", () => setText(passwordError, ""));

  // Se já estiver autenticado no Supabase, ir direto para o dashboard
  (async () => {
    if (window.sb) {
      const { data: { user } } = await window.sb.auth.getUser();
      if (user) {
        window.location.href = "dashboard.html";
        return;
      }

      // Mostrar seção de redefinição quando acessado via link do e-mail (PASSWORD_RECOVERY)
      window.sb.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          resetSection?.removeAttribute("hidden");
          setText(resetMessage, "Defina sua nova senha.");
        }
      });
    }
  })();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setText(formMessage, "");

    const email = emailEl.value.trim();
    const password = passwordEl.value;

    let valid = true;

    // Validações de email
    if (!email) {
      setText(emailError, "Informe seu e-mail.");
      valid = false;
    } else if (!isValidEmail(email)) {
      setText(emailError, "Formato de e-mail inválido.");
      valid = false;
    } else {
      setText(emailError, "");
    }

    // Validações de senha
    if (!password) {
      setText(passwordError, "Informe sua senha.");
      valid = false;
    } else if (password.length < 6) {
      setText(passwordError, "A senha deve ter ao menos 6 caracteres.");
      valid = false;
    } else {
      setText(passwordError, "");
    }

    if (!valid) return;

    if (!window.sb) {
      setText(formMessage, "Erro interno: Supabase não carregado.");
      formMessage.classList.add("error");
      return;
    }

    submitBtn.disabled = true;
    setText(formMessage, "Entrando...");

    try {
      const { data, error } = await window.sb.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Persistir e-mail se lembrar-me estiver marcado
      if (rememberEl.checked) {
        localStorage.setItem("rememberEmail", email);
      } else {
        localStorage.removeItem("rememberEmail");
      }

      setText(formMessage, "Login realizado. Redirecionando...");
      formMessage.classList.remove("error");
      formMessage.classList.add("success");
      window.location.href = "dashboard.html";
    } catch (err) {
      setText(formMessage, err.message || String(err));
      formMessage.classList.remove("success");
      formMessage.classList.add("error");
    } finally {
      submitBtn.disabled = false;
    }
  });

  // Cadastro rápido usando o mesmo email/senha do formulário
  signupLink?.addEventListener("click", async (e) => {
    e.preventDefault();
    setText(formMessage, "");

    const email = emailEl.value.trim();
    const password = passwordEl.value;

    if (!isValidEmail(email)) { setText(emailError, "Informe um e-mail válido."); return; }
    if (!password || password.length < 6) { setText(passwordError, "Senha de 6+ caracteres."); return; }

    if (!window.sb) { setText(formMessage, "Supabase não carregado."); formMessage.classList.add("error"); return; }

    submitBtn.disabled = true;
    setText(formMessage, "Criando conta...");
    try {
      const { data, error } = await window.sb.auth.signUp({ email, password });
      if (error) throw error;
      if (data.user && !data.session) {
        // Confirmação por e-mail ativada
        setText(formMessage, "Conta criada. Verifique seu e-mail para confirmar.");
        formMessage.classList.remove("error");
        formMessage.classList.add("success");
        return;
      }
      setText(formMessage, "Cadastro concluído. Redirecionando...");
      formMessage.classList.remove("error");
      formMessage.classList.add("success");
      window.location.href = "dashboard.html";
    } catch (err) {
      setText(formMessage, err.message || String(err));
      formMessage.classList.remove("success");
      formMessage.classList.add("error");
    } finally {
      submitBtn.disabled = false;
    }
  });

  // Esqueci minha senha: envia e-mail de recuperação
  forgotLink?.addEventListener("click", async (e) => {
    e.preventDefault();
    setText(formMessage, "");
    const email = emailEl.value.trim();
    if (!isValidEmail(email)) { setText(emailError, "Informe um e-mail válido para recuperar a senha."); emailEl.focus(); return; }
    if (!window.sb) { setText(formMessage, "Supabase não carregado."); formMessage.classList.add("error"); return; }
    submitBtn.disabled = true;
    setText(formMessage, "Enviando e-mail de recuperação...");
    try {
      const redirectTo = window.location.origin + "/index.html";
      const { error } = await window.sb.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setText(formMessage, "Se o e-mail existir, enviaremos um link para redefinir sua senha.");
      formMessage.classList.remove("error");
      formMessage.classList.add("success");
    } catch (err) {
      setText(formMessage, err.message || String(err));
      formMessage.classList.remove("success");
      formMessage.classList.add("error");
    } finally {
      submitBtn.disabled = false;
    }
  });

  // Atualizar senha quando em modo de recuperação
  updatePasswordBtn?.addEventListener("click", async () => {
    setText(resetMessage, "");
    setText(newPasswordError, "");
    setText(confirmPasswordError, "");
    const newPwd = newPasswordEl?.value || "";
    const confirmPwd = confirmPasswordEl?.value || "";
    if (!newPwd || newPwd.length < 6) { setText(newPasswordError, "A senha deve ter ao menos 6 caracteres."); return; }
    if (newPwd !== confirmPwd) { setText(confirmPasswordError, "As senhas não coincidem."); return; }
    if (!window.sb) { setText(resetMessage, "Supabase não carregado."); return; }
    try {
      const { error } = await window.sb.auth.updateUser({ password: newPwd });
      if (error) throw error;
      setText(resetMessage, "Senha atualizada. Faça login com a nova senha.");
      resetMessage.classList.remove("error");
      resetMessage.classList.add("success");
      // Opcional: encerrar sessão de recuperação
      try { await window.sb.auth.signOut(); } catch (_) {}
      resetSection?.setAttribute("hidden", "true");
    } catch (err) {
      setText(resetMessage, err.message || String(err));
      resetMessage.classList.remove("success");
      resetMessage.classList.add("error");
    }
  });
});