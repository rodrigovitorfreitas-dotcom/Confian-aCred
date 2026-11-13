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

/* =========================================================
   Melhorias visuais e animações
   (não alteram o funcionamento do menu, FAQ e simulador acima)
   ========================================================= */
(function () {
  var raiz = document.documentElement;
  raiz.classList.add("js");

  var movimentoReduzido = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // ---------- Revelar elementos ao rolar ----------
  var elementosRevelar = document.querySelectorAll("[data-reveal], .passos");

  if ("IntersectionObserver" in window && !movimentoReduzido) {
    var observadorRevelar = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (entrada) {
          if (entrada.isIntersecting) {
            entrada.target.classList.add("visivel");
            observadorRevelar.unobserve(entrada.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    elementosRevelar.forEach(function (el) {
      observadorRevelar.observe(el);
    });
  } else {
    elementosRevelar.forEach(function (el) {
      el.classList.add("visivel");
    });
  }

  // ---------- Cabeçalho, barra de progresso e voltar ao topo ----------
  var cabecalho = document.getElementById("topo");
  var progresso = document.querySelector(".progresso-rolagem");
  var voltarTopo = document.querySelector(".voltar-topo");
  var linksMenu = document.querySelectorAll('#menu a[href^="#"]');
  var secoes = Array.prototype.map
    .call(linksMenu, function (link) {
      return document.querySelector(link.getAttribute("href"));
    })
    .filter(Boolean);
  var aguardandoQuadro = false;

  function aoRolar() {
    var topo = window.scrollY;
    var altura = document.documentElement.scrollHeight - window.innerHeight;

    cabecalho.classList.toggle("rolado", topo > 30);
    voltarTopo.classList.toggle("visivel", topo > 700);
    progresso.style.transform =
      "scaleX(" + (altura > 0 ? topo / altura : 0) + ")";

    // destaca no menu a seção que está na tela
    var atual = null;
    secoes.forEach(function (secao) {
      if (secao.getBoundingClientRect().top <= window.innerHeight * 0.35) {
        atual = secao.id;
      }
    });
    linksMenu.forEach(function (link) {
      link.classList.toggle("ativo", link.getAttribute("href") === "#" + atual);
    });

    aguardandoQuadro = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (!aguardandoQuadro) {
        aguardandoQuadro = true;
        window.requestAnimationFrame(aoRolar);
      }
    },
    { passive: true }
  );
  aoRolar();

  // ---------- Cartão do hero com inclinação 3D ----------
  var cartaoHero = document.querySelector(".hero-cartao");
  var visualHero = document.querySelector(".hero-visual");

  if (cartaoHero && visualHero && !movimentoReduzido && window.matchMedia("(hover: hover)").matches) {
    visualHero.addEventListener("mousemove", function (evento) {
      var area = cartaoHero.getBoundingClientRect();
      var x = (evento.clientX - area.left) / area.width - 0.5;
      var y = (evento.clientY - area.top) / area.height - 0.5;
      cartaoHero.style.transform =
        "rotateY(" + x * 12 + "deg) rotateX(" + -y * 12 + "deg)";
    });
    visualHero.addEventListener("mouseleave", function () {
      cartaoHero.style.transform = "";
    });
  }

  // ---------- Efeito de onda no botão calcular + animação do resultado ----------
  var botaoSimular = document.getElementById("botao-calcular");
  var caixaResultado = document.getElementById("resultado");

  botaoSimular.addEventListener("click", function (evento) {
    var area = botaoSimular.getBoundingClientRect();
    var tamanho = Math.max(area.width, area.height);
    var onda = document.createElement("span");
    onda.className = "onda";
    onda.style.width = onda.style.height = tamanho + "px";
    onda.style.left = (evento.clientX || area.left + area.width / 2) - area.left - tamanho / 2 + "px";
    onda.style.top = (evento.clientY || area.top + area.height / 2) - area.top - tamanho / 2 + "px";
    botaoSimular.appendChild(onda);
    setTimeout(function () {
      onda.remove();
    }, 700);

    caixaResultado.classList.remove("atualizado");
    void caixaResultado.offsetWidth; // reinicia a animação
    caixaResultado.classList.add("atualizado");
  });

  // ---------- Galeria de fotos e vídeos ----------
  var icones = {
    foto:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 8"/></svg>',
    video:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>',
  };

  function idYoutube(url) {
    var achado = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/.exec(url || "");
    return achado ? achado[1] : null;
  }

  function criarEspacoVazio(tipo, texto) {
    var vazio = document.createElement("div");
    vazio.className = "galeria-vazio";
    vazio.innerHTML = icones[tipo] + "<small>" + texto + "</small>";
    return vazio;
  }

  var itensGaleria = Array.prototype.slice.call(
    document.querySelectorAll(".galeria-item")
  );

  itensGaleria.forEach(function (item) {
    var tipo = item.dataset.tipo === "video" ? "video" : "foto";
    var src = (item.dataset.src || "").trim();
    var capa = (item.dataset.capa || "").trim();
    var legenda = item.dataset.legenda || "";
    var yt = idYoutube(src);

    if (tipo === "foto" && src) {
      var img = document.createElement("img");
      img.src = src;
      img.alt = legenda;
      img.loading = "lazy";
      item.appendChild(img);
    } else if (tipo === "video" && (capa || yt)) {
      var capaImg = document.createElement("img");
      capaImg.src = capa || "https://img.youtube.com/vi/" + yt + "/hqdefault.jpg";
      capaImg.alt = legenda;
      capaImg.loading = "lazy";
      item.appendChild(capaImg);
    } else if (tipo === "video" && src) {
      var previa = document.createElement("video");
      previa.src = src + "#t=0.5";
      previa.muted = true;
      previa.preload = "metadata";
      previa.setAttribute("playsinline", "");
      item.appendChild(previa);
    } else {
      item.appendChild(
        criarEspacoVazio(tipo, tipo === "video" ? "Vídeo em breve" : "Foto em breve")
      );
    }

    if (tipo === "video") {
      var play = document.createElement("span");
      play.className = "galeria-play";
      play.innerHTML = icones.play;
      item.appendChild(play);
    }

    var rotulo = document.createElement("span");
    rotulo.className = "galeria-legenda";
    rotulo.innerHTML =
      "<span></span><span class=\"galeria-tag\">" + (tipo === "video" ? "Vídeo" : "Foto") + "</span>";
    rotulo.firstChild.textContent = legenda;
    item.appendChild(rotulo);
    item.setAttribute("aria-label", (tipo === "video" ? "Assistir: " : "Ver foto: ") + legenda);
  });

  // Filtros
  var filtros = document.querySelectorAll(".filtro");
  filtros.forEach(function (filtro) {
    filtro.addEventListener("click", function () {
      var escolhido = filtro.dataset.filtro;
      filtros.forEach(function (f) {
        var ativo = f === filtro;
        f.classList.toggle("ativo", ativo);
        f.setAttribute("aria-pressed", String(ativo));
      });
      itensGaleria.forEach(function (item) {
        var mostrar = escolhido === "todos" || item.dataset.tipo === escolhido;
        item.classList.toggle("oculto", !mostrar);
        item.classList.toggle("item-grande", mostrar && escolhido === "todos" && item === itensGaleria[0]);
      });
    });
  });

  // Visualizador (lightbox)
  var lightbox = document.getElementById("lightbox");
  var areaMidia = lightbox.querySelector(".lightbox-midia");
  var areaLegenda = lightbox.querySelector(".lightbox-legenda");
  var indiceAtual = 0;
  var ultimoFoco = null;

  function itensVisiveis() {
    return itensGaleria.filter(function (item) {
      return !item.classList.contains("oculto");
    });
  }

  function mostrarItem(indice) {
    var lista = itensVisiveis();
    if (!lista.length) return;
    indiceAtual = (indice + lista.length) % lista.length;
    var item = lista[indiceAtual];
    var tipo = item.dataset.tipo === "video" ? "video" : "foto";
    var src = (item.dataset.src || "").trim();
    var yt = idYoutube(src);
    var legenda = item.dataset.legenda || "";

    areaMidia.innerHTML = "";

    if (!src) {
      var caixa = document.createElement("div");
      caixa.className = "lightbox-vazio";
      var vazio = criarEspacoVazio(tipo, tipo === "video" ? "Vídeo em breve" : "Foto em breve");
      var aviso = document.createElement("p");
      aviso.textContent = "Em breve você poderá conhecer mais da Confiança Cred por aqui.";
      vazio.appendChild(aviso);
      caixa.appendChild(vazio);
      areaMidia.appendChild(caixa);
    } else if (tipo === "video" && yt) {
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + yt + "?autoplay=1&rel=0";
      iframe.title = legenda;
      iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      iframe.allowFullscreen = true;
      areaMidia.appendChild(iframe);
    } else if (tipo === "video") {
      var video = document.createElement("video");
      video.src = src;
      video.controls = true;
      video.autoplay = true;
      video.setAttribute("playsinline", "");
      areaMidia.appendChild(video);
    } else {
      var foto = document.createElement("img");
      foto.src = src;
      foto.alt = legenda;
      areaMidia.appendChild(foto);
    }

    areaLegenda.textContent = legenda;
  }

  function abrirLightbox(item) {
    ultimoFoco = item;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    mostrarItem(itensVisiveis().indexOf(item));
    lightbox.querySelector(".lightbox-fechar").focus();
  }

  function fecharLightbox() {
    lightbox.hidden = true;
    areaMidia.innerHTML = ""; // para vídeos em reprodução
    document.body.style.overflow = "";
    if (ultimoFoco) ultimoFoco.focus();
  }

  itensGaleria.forEach(function (item) {
    item.addEventListener("click", function () {
      abrirLightbox(item);
    });
  });

  lightbox.querySelector(".lightbox-fechar").addEventListener("click", fecharLightbox);
  lightbox.querySelector(".lightbox-anterior").addEventListener("click", function () {
    mostrarItem(indiceAtual - 1);
  });
  lightbox.querySelector(".lightbox-proximo").addEventListener("click", function () {
    mostrarItem(indiceAtual + 1);
  });
  lightbox.addEventListener("click", function (evento) {
    if (evento.target === lightbox) fecharLightbox();
  });
  document.addEventListener("keydown", function (evento) {
    if (lightbox.hidden) return;
    if (evento.key === "Escape") fecharLightbox();
    if (evento.key === "ArrowLeft") mostrarItem(indiceAtual - 1);
    if (evento.key === "ArrowRight") mostrarItem(indiceAtual + 1);
  });
})();
