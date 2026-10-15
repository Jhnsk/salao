// Configurações do salão — altere aqui seu número e endereço
const CONFIG = {
  whatsapp: "5511999999999", // DDI + DDD + número, somente dígitos
  endereco: "Rua Oscar Freire, 1000 - Jardins, São Paulo - SP, 01426-001",
  // Dia da semana: 0 = domingo ... 6 = sábado. null = fechado
  horarios: {
    0: null,
    1: null,
    2: { inicio: 9, fim: 19 },
    3: { inicio: 9, fim: 19 },
    4: { inicio: 9, fim: 19 },
    5: { inicio: 9, fim: 19 },
    6: { inicio: 8, fim: 17 },
  },
};

const whatsappLink = (mensagem = "") =>
  `https://wa.me/${CONFIG.whatsapp}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ""}`;

// Mapa e botão "Como chegar"
const enderecoCodificado = encodeURIComponent(CONFIG.endereco);
document.getElementById("mapa").src =
  `https://maps.google.com/maps?q=${enderecoCodificado}&z=16&output=embed`;
document.getElementById("btn-rota").href =
  `https://www.google.com/maps/dir/?api=1&destination=${enderecoCodificado}`;

document.getElementById("whatsapp-float").href = whatsappLink(
  "Olá! Gostaria de mais informações sobre os serviços do Bella Flor Salão."
);
document.getElementById("ano").textContent = new Date().getFullYear();

// Header com sombra ao rolar
const header = document.querySelector(".header");
const atualizarHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 10);
window.addEventListener("scroll", atualizarHeader, { passive: true });
atualizarHeader();

// Menu mobile
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.getElementById("menu");

const fecharMenu = () => {
  nav.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Abrir menu");
};

menuToggle.addEventListener("click", () => {
  const aberto = nav.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(aberto));
  menuToggle.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
});
nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", fecharMenu));

// Animação de entrada
const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  reveals.forEach((el) => observer.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("is-visible"));
}

// Formulário de agendamento
const form = document.getElementById("form-agendamento");
const campoNome = document.getElementById("nome");
const campoServico = document.getElementById("servico");
const campoData = document.getElementById("data");
const campoHorario = document.getElementById("horario");
const campoObs = document.getElementById("obs");

const paraISO = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split("T")[0];
};
const lerData = (valor) => {
  const [ano, mes, dia] = valor.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
};

campoData.min = paraISO(new Date());

const preencherHorarios = () => {
  campoHorario.innerHTML = "";
  const opcaoInicial = new Option(campoData.value ? "Selecione" : "Escolha a data", "");
  campoHorario.add(opcaoInicial);

  if (!campoData.value) return;

  const data = lerData(campoData.value);
  const expediente = CONFIG.horarios[data.getDay()];
  if (!expediente) {
    opcaoInicial.textContent = "Fechado neste dia";
    return;
  }

  const agora = new Date();
  const ehHoje = paraISO(data) === paraISO(agora);

  for (let h = expediente.inicio; h < expediente.fim; h++) {
    for (const m of [0, 30]) {
      if (ehHoje && (h < agora.getHours() || (h === agora.getHours() && m <= agora.getMinutes()))) continue;
      const hora = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      campoHorario.add(new Option(hora, hora));
    }
  }

  if (campoHorario.options.length === 1) {
    opcaoInicial.textContent = "Sem horários hoje";
  }
};

campoData.addEventListener("change", () => {
  preencherHorarios();
  validarCampo(campoData);
});
preencherHorarios();

const mostrarErro = (campo, mensagem) => {
  const field = campo.closest(".field");
  field.classList.toggle("has-error", Boolean(mensagem));
  field.querySelector(".error").textContent = mensagem;
  campo.setAttribute("aria-invalid", mensagem ? "true" : "false");
};

const validarCampo = (campo) => {
  let mensagem = "";
  const valor = campo.value.trim();

  if (campo === campoNome && valor.length < 2) mensagem = "Informe seu nome.";
  if (campo === campoServico && !valor) mensagem = "Selecione um serviço.";
  if (campo === campoData) {
    if (!valor) mensagem = "Escolha uma data.";
    else if (valor < campoData.min) mensagem = "Escolha uma data a partir de hoje.";
    else if (!CONFIG.horarios[lerData(valor).getDay()]) mensagem = "Estamos fechados neste dia.";
  }
  if (campo === campoHorario && !valor) mensagem = "Escolha um horário.";

  mostrarErro(campo, mensagem);
  return !mensagem;
};

[campoNome, campoServico, campoHorario].forEach((campo) =>
  campo.addEventListener("change", () => validarCampo(campo))
);

// Botões "Agendar" dos cards preenchem o serviço
document.querySelectorAll("[data-servico]").forEach((botao) => {
  botao.addEventListener("click", () => {
    campoServico.value = botao.dataset.servico;
    mostrarErro(campoServico, "");
    document.getElementById("agendamento").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => campoNome.focus({ preventScroll: true }), 600);
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const campos = [campoNome, campoServico, campoData, campoHorario];
  const validos = campos.map(validarCampo);
  const primeiroInvalido = campos[validos.indexOf(false)];
  if (primeiroInvalido) {
    primeiroInvalido.focus();
    return;
  }

  const dataFormatada = lerData(campoData.value).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const linhas = [
    "Olá! Gostaria de agendar um horário no Bella Flor Salão.",
    "",
    `*Nome:* ${campoNome.value.trim()}`,
    `*Serviço:* ${campoServico.value}`,
    `*Data:* ${dataFormatada}`,
    `*Horário:* ${campoHorario.value}`,
  ];
  if (campoObs.value.trim()) linhas.push(`*Observações:* ${campoObs.value.trim()}`);

  window.open(whatsappLink(linhas.join("\n")), "_blank", "noopener");
});
