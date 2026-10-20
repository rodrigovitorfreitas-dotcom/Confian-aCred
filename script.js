// Controla o botão que abre e fecha o menu de navegação.
var botaoMenu = document.getElementById("botao-menu");
var menu = document.getElementById("menu");

botaoMenu.addEventListener("click", function () {
  // Verifica se o menu já está aberto antes de decidir o que fazer.
  if (menu.style.display === "block") {
    menu.style.display = "none";
    botaoMenu.setAttribute("aria-expanded", "false");
  } else {
    menu.style.display = "block";
    botaoMenu.setAttribute("aria-expanded", "true");
  }
});

// Controla todas as perguntas usando a mesma lógica reutilizável.
var perguntas = document.querySelectorAll(".pergunta");

perguntas.forEach(function (pergunta) {
  var resposta = document.getElementById(
    pergunta.getAttribute("aria-controls")
  );

  resposta.hidden = true;
  pergunta.addEventListener("click", function () {
    var aberta = pergunta.getAttribute("aria-expanded") === "true";
    pergunta.setAttribute("aria-expanded", String(!aberta));
    resposta.hidden = aberta;
  });
});

// Fecha o menu depois de escolher uma seção em telas pequenas.
menu.querySelectorAll("a").forEach(function (link) {
  link.addEventListener("click", function () {
    if (window.innerWidth <= 700) {
      menu.style.display = "none";
      botaoMenu.setAttribute("aria-expanded", "false");
    }
  });
});

var formatadorMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// Configuração local usada enquanto não existe um endpoint PHP.
// No futuro, estes dados poderão ser substituídos por uma resposta validada
// do servidor sem alterar a lógica de cálculo abaixo.
var configuracaoTaxa = {
  valorMensal: 0.0185,
  texto: "1,85% ao mês",
  fonte:
    "Fonte: parâmetro demonstrativo local. Não é uma taxa oficial e não representa uma condição comercial real.",
  referencia: "Data de referência: 20/10/2026, sem consulta oficial.",
};

var valorInput = document.getElementById("valor");
var parcelasInput = document.getElementById("parcelas");
var taxaValor = document.getElementById("taxa-valor");
var taxaFonte = document.getElementById("taxa-fonte");
var taxaReferencia = document.getElementById("taxa-referencia");
var parcelasMinimas = 48;
var parcelasMaximas = 108;

// Recebe somente dados já validados. Um endpoint PHP futuro deverá entregar
// a taxa mensal e os metadados da fonte neste mesmo formato.
function aplicarConfiguracaoTaxa(novaConfiguracao) {
  if (
    !novaConfiguracao ||
    !Number.isFinite(novaConfiguracao.valorMensal) ||
    novaConfiguracao.valorMensal < 0 ||
    typeof novaConfiguracao.texto !== "string" ||
    typeof novaConfiguracao.fonte !== "string" ||
    typeof novaConfiguracao.referencia !== "string"
  ) {
    throw new Error("Configuração de taxa inválida.");
  }

  configuracaoTaxa = novaConfiguracao;
  taxaValor.textContent = configuracaoTaxa.texto;
  taxaFonte.textContent = configuracaoTaxa.fonte;
  taxaReferencia.textContent = configuracaoTaxa.referencia;
}

aplicarConfiguracaoTaxa(configuracaoTaxa);

// Converte um texto monetário brasileiro em número de reais.
function converterMoedaParaNumero(valorFormatado) {
  var texto = valorFormatado.trim().replace(/[^\d,.-]/g, "");

  if (texto === "") {
    return NaN;
  }

  var ultimoPonto = texto.lastIndexOf(".");
  var ultimaVirgula = texto.lastIndexOf(",");
  var separadorDecimal = ultimaVirgula > ultimoPonto ? "," : ".";

  if (ultimoPonto === -1 && ultimaVirgula === -1) {
    return Number(texto);
  }

  var partes = texto.split(separadorDecimal);
  var parteInteira = partes[0].replace(/[^\d-]/g, "");
  var parteDecimal = (partes[1] || "").replace(/\D/g, "").slice(0, 2);
  var numero = Number(parteInteira + "." + parteDecimal);

  return numero;
}

// Formata o valor digitado usando o padrão brasileiro sem alterar o cálculo.
function formatarValorDigitado(evento) {
  var campo = evento.target;
  var valorDigitado = campo.value;
  var apenasDigitos = valorDigitado.replace(/\D/g, "");

  if (apenasDigitos === "") {
    campo.value = "";
    return;
  }

  var valorNumerico;
  var possuiSeparador = /[,.]/.test(valorDigitado);

  var campoJaFormatado = valorDigitado.startsWith("R$") &&
    campo.selectionStart === valorDigitado.length;

  if (campoJaFormatado) {
    valorNumerico = Number(apenasDigitos) / 100;
  } else if (possuiSeparador) {
    valorNumerico = converterMoedaParaNumero(valorDigitado);
  } else {
    valorNumerico = Number(apenasDigitos) / 100;
  }

  if (Number.isFinite(valorNumerico)) {
    campo.value = formatadorMoeda.format(valorNumerico);
  }
}

valorInput.addEventListener("input", formatarValorDigitado);

// Realiza a simulação quando o usuário informa o valor e a quantidade de parcelas.
var botaoCalcular = document.getElementById("botao-calcular");
var resultado = document.getElementById("resultado");

botaoCalcular.addEventListener("click", function () {
  var valorNumerico = converterMoedaParaNumero(valorInput.value);
  var parcelasNumericas = Number(parcelasInput.value);
  var taxa = configuracaoTaxa.valorMensal;

  if (
    !Number.isFinite(valorNumerico) ||
    valorNumerico <= 0 ||
    !Number.isInteger(parcelasNumericas) ||
    parcelasNumericas < parcelasMinimas ||
    parcelasNumericas > parcelasMaximas ||
    !Number.isFinite(taxa) ||
    taxa < 0
  ) {
    resultado.textContent =
      "Revise os dados: informe um valor maior que zero e entre 48 e 108 parcelas inteiras.";
    return;
  }

  // Fórmula Price para parcela fixa. A condição separada evita divisão por zero.
  var valorParcela =
    taxa === 0
      ? valorNumerico / parcelasNumericas
      : (valorNumerico * taxa) /
        (1 - Math.pow(1 + taxa, -parcelasNumericas));
  var totalEstimado = valorParcela * parcelasNumericas;

  resultado.innerHTML =
    "<strong>Resultado estimado</strong>" +
    "<dl>" +
    "<dt>Valor solicitado</dt><dd>" +
    formatadorMoeda.format(valorNumerico) +
    "</dd>" +
    "<dt>Parcelas</dt><dd>" +
    parcelasNumericas +
    "</dd>" +
    "<dt>Valor de cada parcela</dt><dd>" +
    formatadorMoeda.format(valorParcela) +
    "</dd>" +
    "<dt>Total estimado</dt><dd>" +
    formatadorMoeda.format(totalEstimado) +
    "</dd>" +
    "</dl>" +
    "<small>Taxa utilizada: " +
    configuracaoTaxa.texto +
    ". Referência demonstrativa, sem caráter comercial.</small>";
});
