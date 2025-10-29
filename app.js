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

  form.addEventListener("submit", (e) => {
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

    // Simulação de envio
    submitBtn.disabled = true;
    setText(formMessage, "Verificando credenciais...");

    setTimeout(() => {
      // Aqui você integraria com sua API real de autenticação
      // Exemplo: fetch('/api/login', {method: 'POST', body: JSON.stringify({email, password})})

      // Persistir e-mail se lembrar-me estiver marcado
      if (rememberEl.checked) {
        localStorage.setItem("rememberEmail", email);
      } else {
        localStorage.removeItem("rememberEmail");
      }

      // Marcar sessão autenticada (simulada)
      localStorage.setItem("auth", "true");
      localStorage.setItem("authEmail", email);

      setText(formMessage, "Login simulado com sucesso. Redirecionando...");
      formMessage.classList.remove("error");
      formMessage.classList.add("success");

      // Redirecionar para o dashboard
      window.location.href = "dashboard.html";
    }, 800);
  });
});