// Defina aqui o endpoint do seu webhook
// Exemplo: window.WEBHOOK_URL = "https://seu-dominio.com/webhook";
window.WEBHOOK_URL = "https://webhookauto.iainfinity.com.br/webhook/282d008e-97df-4481-a2a7-b447ef3a2786";

// ===== Supabase (público) =====
// URL e chave anônima do seu projeto Supabase (ok expor no front-end)
window.SUPABASE_URL = "https://xeppuroidbwtbwnivwjc.supabase.co";
window.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlcHB1cm9pZGJ3dGJ3bml2d2pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NTAwOTcsImV4cCI6MjA3NzMyNjA5N30.r9RX56u2in6ghth-CuNE-aYaWsxq5WJa8PMikBka4HE";

// Cria o cliente global do Supabase
if (window.supabase) {
  window.sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
} else {
  console.warn("Supabase SDK não carregado. Adicione <script src=\"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2\"></script> antes dos seus scripts.");
  window.sb = null;
}