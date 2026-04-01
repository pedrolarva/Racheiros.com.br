// === App.js — Hash Router + Views ===
(function () {
  let currentMap = null; // referência do mapa Leaflet ativo

  function cleanupMap() {
    if (currentMap) {
      currentMap.remove();
      currentMap = null;
    }
  }

  // === Router ===
  function navigate() {
    const hash = location.hash || '#/';
    const homeView = document.getElementById('home-view');
    const appView = document.getElementById('app-view');

    cleanupMap();

    // Match routes
    if (hash === '#/' || hash === '#' || hash === '') {
      homeView.style.display = '';
      appView.style.display = 'none';
      appView.innerHTML = '';
      updateActiveNav(hash);
      if (typeof window.initHomeAnimations === 'function') {
        window.initHomeAnimations();
      }
      return;
    }

    // Show app view, hide home
    homeView.style.display = 'none';
    appView.style.display = '';
    window.scrollTo(0, 0);

    if (hash === '#/mapa') {
      renderMapa(appView);
    } else if (hash === '#/calendario') {
      renderCalendario(appView);
    } else if (hash === '#/novo-racha') {
      renderNovoRacha(appView);
    } else if (hash.startsWith('#/racha/')) {
      const id = hash.split('#/racha/')[1];
      renderDetalheRacha(appView, id);
    } else {
      location.hash = '#/';
      return;
    }

    updateActiveNav(hash);
  }

  function updateActiveNav(hash) {
    document.querySelectorAll('.nav a').forEach(function (a) {
      a.classList.remove('nav-active');
      var href = a.getAttribute('href');
      if (href === hash) {
        a.classList.add('nav-active');
      }
    });
  }

  // === View: Mapa ===
  function renderMapa(container) {
    var esportes = RacheirosData.ESPORTES;
    var filtersHTML = esportes.map(function (e) {
      return '<button class="filter-btn active" data-esporte="' + e.id + '">' + e.emoji + ' ' + e.nome + '</button>';
    }).join('');

    container.innerHTML =
      '<div class="map-page">' +
        '<div class="map-filters">' + filtersHTML + '</div>' +
        '<div id="map" class="map-container"></div>' +
        '<a href="#/novo-racha" class="fab-button" title="Criar Racha">＋</a>' +
      '</div>';

    // Init Leaflet map
    var map = L.map('map').setView([-23.5505, -46.6333], 13);
    currentMap = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function (pos) {
        map.setView([pos.coords.latitude, pos.coords.longitude], 13);
      }, function () { /* fallback already set */ });
    }

    // Layer groups per sport
    var layers = {};
    esportes.forEach(function (e) {
      layers[e.id] = L.layerGroup().addTo(map);
    });

    // Add markers
    var rachas = RacheirosData.listarRachas();
    rachas.forEach(function (r) {
      var esp = RacheirosData.getEsporte(r.esporte);
      var icon = L.divIcon({
        html: '<span style="font-size:24px">' + esp.emoji + '</span>',
        className: 'emoji-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      var marker = L.marker([r.lat, r.lng], { icon: icon });
      var vagasRestantes = r.vagas - r.participantes;
      marker.bindPopup(
        '<div class="racha-popup">' +
          '<h4>' + esp.emoji + ' ' + _escapeHtml(r.titulo) + '</h4>' +
          '<p>' + esp.nome + '</p>' +
          '<p>' + _formatDate(r.data) + ' às ' + r.horario + '</p>' +
          '<p>' + vagasRestantes + ' vaga' + (vagasRestantes !== 1 ? 's' : '') + ' restante' + (vagasRestantes !== 1 ? 's' : '') + '</p>' +
          '<a class="popup-link" href="#/racha/' + r.id + '">Ver Detalhes →</a>' +
        '</div>'
      );

      if (layers[r.esporte]) {
        marker.addTo(layers[r.esporte]);
      }
    });

    // Filter buttons
    container.querySelectorAll('.filter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var esporte = this.dataset.esporte;
        this.classList.toggle('active');
        if (this.classList.contains('active')) {
          map.addLayer(layers[esporte]);
        } else {
          map.removeLayer(layers[esporte]);
        }
      });
    });

    // Fix Leaflet render
    setTimeout(function () { map.invalidateSize(); }, 100);
  }

  // === View: Calendário ===
  function renderCalendario(container) {
    var mesAtual = new Date();
    mesAtual.setDate(1);

    container.innerHTML =
      '<div class="calendar-page">' +
        '<div class="calendar-header">' +
          '<div class="calendar-nav">' +
            '<button id="cal-prev">◀</button>' +
            '<h2 id="cal-title"></h2>' +
            '<button id="cal-next">▶</button>' +
          '</div>' +
          '<a href="#/novo-racha" class="btn-criar-racha">+ Criar Racha</a>' +
        '</div>' +
        '<div class="calendar-weekdays">' +
          '<span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>' +
        '</div>' +
        '<div id="cal-grid" class="calendar-grid"></div>' +
        '<div id="rachas-do-dia" class="rachas-do-dia"></div>' +
      '</div>';

    var selectedDate = null;

    function renderGrid() {
      var year = mesAtual.getFullYear();
      var month = mesAtual.getMonth();
      var meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

      document.getElementById('cal-title').textContent = meses[month] + ' ' + year;

      var firstDay = new Date(year, month, 1).getDay();
      var totalDays = new Date(year, month + 1, 0).getDate();
      var prevMonthDays = new Date(year, month, 0).getDate();

      var rachas = RacheirosData.listarRachas();
      var rachasByDate = {};
      rachas.forEach(function (r) {
        if (!rachasByDate[r.data]) rachasByDate[r.data] = [];
        rachasByDate[r.data].push(r);
      });

      var today = new Date();
      var todayStr = today.toISOString().split('T')[0];

      var html = '';

      // Previous month days
      for (var i = firstDay - 1; i >= 0; i--) {
        html += '<div class="calendar-day other-month">' + (prevMonthDays - i) + '</div>';
      }

      // Current month days
      for (var d = 1; d <= totalDays; d++) {
        var dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        var classes = 'calendar-day';
        if (dateStr === todayStr) classes += ' today';
        if (dateStr === selectedDate) classes += ' selected';
        var count = rachasByDate[dateStr] ? rachasByDate[dateStr].length : 0;
        if (count > 0) classes += ' has-events';

        html += '<div class="' + classes + '" data-date="' + dateStr + '">' +
          d +
          (count > 0 ? '<span class="event-count">' + count + '</span>' : '') +
        '</div>';
      }

      // Next month days
      var totalCells = firstDay + totalDays;
      var remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
      for (var n = 1; n <= remaining; n++) {
        html += '<div class="calendar-day other-month">' + n + '</div>';
      }

      document.getElementById('cal-grid').innerHTML = html;

      // Click handlers for days
      document.querySelectorAll('.calendar-day:not(.other-month)').forEach(function (dayEl) {
        dayEl.addEventListener('click', function () {
          selectedDate = this.dataset.date;
          renderGrid();
          mostrarRachasDoDia(selectedDate);
        });
      });

      // Show today's events by default
      if (selectedDate) {
        mostrarRachasDoDia(selectedDate);
      }
    }

    function mostrarRachasDoDia(dateStr) {
      var rachas = RacheirosData.filtrarRachas({ data: dateStr });
      var div = document.getElementById('rachas-do-dia');

      var dateObj = new Date(dateStr + 'T12:00:00');
      var titulo = dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

      if (rachas.length === 0) {
        div.innerHTML =
          '<h3>Rachas em ' + titulo + '</h3>' +
          '<div class="empty-day">' +
            '<p>Nenhum racha neste dia</p>' +
            '<a href="#/novo-racha">Criar um racha →</a>' +
          '</div>';
        return;
      }

      var items = rachas.map(function (r) {
        var esp = RacheirosData.getEsporte(r.esporte);
        return '<a href="#/racha/' + r.id + '" class="racha-item">' +
          '<span class="racha-item-emoji">' + esp.emoji + '</span>' +
          '<div class="racha-item-info">' +
            '<h4>' + _escapeHtml(r.titulo) + '</h4>' +
            '<p>' + esp.nome + ' · ' + r.horario + '</p>' +
          '</div>' +
          '<span class="racha-item-vagas">' + r.participantes + '/' + r.vagas + ' vagas</span>' +
        '</a>';
      }).join('');

      div.innerHTML =
        '<h3>Rachas em ' + titulo + '</h3>' +
        '<div class="rachas-list">' + items + '</div>';
    }

    document.getElementById('cal-prev').addEventListener('click', function () {
      mesAtual.setMonth(mesAtual.getMonth() - 1);
      selectedDate = null;
      renderGrid();
      document.getElementById('rachas-do-dia').innerHTML = '';
    });

    document.getElementById('cal-next').addEventListener('click', function () {
      mesAtual.setMonth(mesAtual.getMonth() + 1);
      selectedDate = null;
      renderGrid();
      document.getElementById('rachas-do-dia').innerHTML = '';
    });

    renderGrid();
  }

  // === View: Novo Racha ===
  function renderNovoRacha(container) {
    var today = new Date().toISOString().split('T')[0];
    var esportesOptions = RacheirosData.ESPORTES.map(function (e) {
      return '<option value="' + e.id + '">' + e.emoji + ' ' + e.nome + '</option>';
    }).join('');

    container.innerHTML =
      '<div class="form-page">' +
        '<h2>Criar Novo Racha</h2>' +
        '<form id="form-racha">' +
          '<div class="form-group">' +
            '<label for="esporte">Esporte *</label>' +
            '<select id="esporte" required>' +
              '<option value="">Selecione o esporte</option>' +
              esportesOptions +
            '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label for="titulo">Título *</label>' +
            '<input type="text" id="titulo" placeholder="Ex: Pelada do Parque" required maxlength="100">' +
          '</div>' +
          '<div class="form-group">' +
            '<label for="descricao">Descrição</label>' +
            '<textarea id="descricao" placeholder="Detalhes do racha..." maxlength="500"></textarea>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group">' +
              '<label for="data">Data *</label>' +
              '<input type="date" id="data" required min="' + today + '">' +
            '</div>' +
            '<div class="form-group">' +
              '<label for="horario">Horário *</label>' +
              '<input type="time" id="horario" required>' +
            '</div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group">' +
              '<label for="vagas">Vagas *</label>' +
              '<input type="number" id="vagas" min="2" max="50" value="10" required>' +
            '</div>' +
            '<div class="form-group">' +
              '<label for="endereco">Endereço</label>' +
              '<input type="text" id="endereco" placeholder="Ex: Parque Ibirapuera">' +
            '</div>' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Local no mapa * (clique para selecionar)</label>' +
            '<div id="mini-map" class="mini-map"></div>' +
            '<p class="map-hint">Clique no mapa para marcar o local do racha</p>' +
            '<input type="hidden" id="lat">' +
            '<input type="hidden" id="lng">' +
          '</div>' +
          '<div class="form-actions">' +
            '<button type="submit" class="btn-form-primary">Criar Racha</button>' +
            '<a href="#/mapa" class="btn-form-secondary">Cancelar</a>' +
          '</div>' +
        '</form>' +
      '</div>';

    // Mini map
    var miniMap = L.map('mini-map').setView([-23.5505, -46.6333], 12);
    currentMap = miniMap;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(miniMap);

    var marker = null;

    miniMap.on('click', function (e) {
      var lat = e.latlng.lat;
      var lng = e.latlng.lng;
      document.getElementById('lat').value = lat;
      document.getElementById('lng').value = lng;

      if (marker) {
        marker.setLatLng(e.latlng);
      } else {
        marker = L.marker(e.latlng).addTo(miniMap);
      }
    });

    // Geolocation for mini map
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function (pos) {
        miniMap.setView([pos.coords.latitude, pos.coords.longitude], 13);
      });
    }

    setTimeout(function () { miniMap.invalidateSize(); }, 100);

    // Form submit
    document.getElementById('form-racha').addEventListener('submit', function (e) {
      e.preventDefault();

      // Clear errors
      this.querySelectorAll('.field-error').forEach(function (el) { el.classList.remove('field-error'); });
      this.querySelectorAll('.field-error-msg').forEach(function (el) { el.remove(); });

      var esporte = document.getElementById('esporte').value;
      var titulo = document.getElementById('titulo').value.trim();
      var descricao = document.getElementById('descricao').value.trim();
      var data = document.getElementById('data').value;
      var horario = document.getElementById('horario').value;
      var vagas = document.getElementById('vagas').value;
      var endereco = document.getElementById('endereco').value.trim();
      var lat = document.getElementById('lat').value;
      var lng = document.getElementById('lng').value;

      var hasError = false;

      function showError(fieldId, msg) {
        var group = document.getElementById(fieldId).closest('.form-group');
        group.classList.add('field-error');
        var msgEl = document.createElement('p');
        msgEl.className = 'field-error-msg';
        msgEl.textContent = msg;
        group.appendChild(msgEl);
        hasError = true;
      }

      if (!esporte) showError('esporte', 'Selecione um esporte');
      if (!titulo) showError('titulo', 'Informe o título do racha');
      if (!data) showError('data', 'Informe a data');
      if (!horario) showError('horario', 'Informe o horário');
      if (!vagas || vagas < 2) showError('vagas', 'Mínimo de 2 vagas');
      if (!lat || !lng) {
        var mapGroup = document.getElementById('mini-map').closest('.form-group');
        mapGroup.classList.add('field-error');
        var msgEl = document.createElement('p');
        msgEl.className = 'field-error-msg';
        msgEl.textContent = 'Clique no mapa para selecionar o local';
        mapGroup.appendChild(msgEl);
        hasError = true;
      }

      if (hasError) return;

      var novoRacha = RacheirosData.criarRacha({
        esporte: esporte,
        titulo: titulo,
        descricao: descricao,
        data: data,
        horario: horario,
        vagas: vagas,
        endereco: endereco,
        lat: lat,
        lng: lng
      });

      location.hash = '#/racha/' + novoRacha.id;
    });
  }

  // === View: Detalhe do Racha ===
  function renderDetalheRacha(container, id) {
    var racha = RacheirosData.buscarRacha(id);

    if (!racha) {
      container.innerHTML =
        '<div class="not-found">' +
          '<h2>😕 Racha não encontrado</h2>' +
          '<a href="#/mapa">← Voltar ao Mapa</a>' +
        '</div>';
      return;
    }

    var esp = RacheirosData.getEsporte(racha.esporte);
    var pct = Math.round((racha.participantes / racha.vagas) * 100);
    var lotado = racha.participantes >= racha.vagas;

    var dateObj = new Date(racha.data + 'T' + racha.horario + ':00');
    var dataFormatada = dateObj.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) + ' às ' + racha.horario;

    container.innerHTML =
      '<div class="racha-detail">' +
        '<button class="btn-voltar" onclick="history.back()">← Voltar</button>' +
        '<div class="detail-esporte">' +
          '<span class="emoji-lg">' + esp.emoji + '</span>' +
          '<span class="esporte-nome">' + esp.nome + '</span>' +
        '</div>' +
        '<h2>' + _escapeHtml(racha.titulo) + '</h2>' +
        (racha.descricao ? '<p class="descricao">' + _escapeHtml(racha.descricao) + '</p>' : '') +
        '<div class="detail-info">' +
          '<div class="detail-info-item"><i class="fas fa-calendar"></i> ' + dataFormatada + '</div>' +
          (racha.endereco ? '<div class="detail-info-item"><i class="fas fa-map-marker-alt"></i> ' + _escapeHtml(racha.endereco) + '</div>' : '') +
          '<div class="detail-info-item"><i class="fas fa-users"></i> Participantes: <span id="part-count">' + racha.participantes + '</span> de ' + racha.vagas + ' vagas</div>' +
        '</div>' +
        '<div class="progress-bar"><div class="progress-bar-inner" id="progress-bar" style="width:' + pct + '%"></div></div>' +
        '<p class="vagas-text" id="vagas-text">' + (racha.vagas - racha.participantes) + ' vaga' + ((racha.vagas - racha.participantes) !== 1 ? 's' : '') + ' restante' + ((racha.vagas - racha.participantes) !== 1 ? 's' : '') + '</p>' +
        '<div id="detail-map" class="detail-map"></div>' +
        (lotado
          ? '<button class="btn-lotado" disabled>Racha Lotado</button>'
          : '<button class="btn-entrar" id="btn-entrar">Entrar no Racha</button>') +
      '</div>';

    // Mini map
    var detailMap = L.map('detail-map').setView([racha.lat, racha.lng], 15);
    currentMap = detailMap;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(detailMap);

    var icon = L.divIcon({
      html: '<span style="font-size:28px">' + esp.emoji + '</span>',
      className: 'emoji-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
    L.marker([racha.lat, racha.lng], { icon: icon }).addTo(detailMap);

    setTimeout(function () { detailMap.invalidateSize(); }, 100);

    // Enter button
    var btnEntrar = document.getElementById('btn-entrar');
    if (btnEntrar) {
      btnEntrar.addEventListener('click', function () {
        var success = RacheirosData.entrarNoRacha(id);
        if (success) {
          var updated = RacheirosData.buscarRacha(id);
          var newPct = Math.round((updated.participantes / updated.vagas) * 100);
          var restantes = updated.vagas - updated.participantes;

          document.getElementById('part-count').textContent = updated.participantes;
          document.getElementById('progress-bar').style.width = newPct + '%';
          document.getElementById('vagas-text').textContent = restantes + ' vaga' + (restantes !== 1 ? 's' : '') + ' restante' + (restantes !== 1 ? 's' : '');

          this.textContent = 'Você está neste racha! ✓';
          this.classList.add('entered');
          this.disabled = true;
        }
      });
    }
  }

  // === Helpers ===
  function _escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function _formatDate(dateStr) {
    var d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  }

  // === Init ===
  window.addEventListener('hashchange', navigate);
  document.addEventListener('DOMContentLoaded', navigate);
})();
