// === RacheirosData — Camada de persistência localStorage ===
const RacheirosData = (function () {
  const STORAGE_KEY = 'racheiros_rachas';

  const ESPORTES = [
    { id: 'futebol', nome: 'Futebol', emoji: '⚽' },
    { id: 'basquete', nome: 'Basquete', emoji: '🏀' },
    { id: 'volei', nome: 'Vôlei', emoji: '🏐' },
    { id: 'tenis', nome: 'Tênis', emoji: '🎾' },
    { id: 'corrida', nome: 'Corrida', emoji: '🏃' },
    { id: 'natacao', nome: 'Natação', emoji: '🏊' },
    { id: 'ciclismo', nome: 'Ciclismo', emoji: '🚴' },
    { id: 'beach-tennis', nome: 'Beach Tennis', emoji: '🏸' }
  ];

  function _getEsporte(id) {
    return ESPORTES.find(e => e.id === id) || ESPORTES[0];
  }

  function _getSeed() {
    const now = new Date();
    return [
      {
        id: 'seed1',
        titulo: 'Pelada do Ibirapuera',
        descricao: 'Futebol society no campo do Ibirapuera. Traga caneleira!',
        esporte: 'futebol',
        data: _futureDate(now, 1),
        horario: '19:00',
        vagas: 14,
        participantes: 8,
        lat: -23.5874,
        lng: -46.6576,
        endereco: 'Parque Ibirapuera, São Paulo'
      },
      {
        id: 'seed2',
        titulo: 'Basquete na Vila Mariana',
        descricao: 'Jogo de basquete 3x3 na quadra do parque. Todos os níveis!',
        esporte: 'basquete',
        data: _futureDate(now, 2),
        horario: '17:30',
        vagas: 6,
        participantes: 4,
        lat: -23.5920,
        lng: -46.6388,
        endereco: 'Praça Joaquim Floriano, Vila Mariana'
      },
      {
        id: 'seed3',
        titulo: 'Vôlei de Praia no CERET',
        descricao: 'Partida de vôlei na areia. Duplas rotativas.',
        esporte: 'volei',
        data: _futureDate(now, 3),
        horario: '09:00',
        vagas: 12,
        participantes: 6,
        lat: -23.5580,
        lng: -46.6220,
        endereco: 'Parque CERET, Tatuapé'
      },
      {
        id: 'seed4',
        titulo: 'Tênis no Pinheiros',
        descricao: 'Partida de tênis simples. Quadra reservada por 2h.',
        esporte: 'tenis',
        data: _futureDate(now, 4),
        horario: '08:00',
        vagas: 4,
        participantes: 2,
        lat: -23.5670,
        lng: -46.6920,
        endereco: 'Clube Pinheiros, São Paulo'
      },
      {
        id: 'seed5',
        titulo: 'Corrida no Parque Villa-Lobos',
        descricao: 'Corrida em grupo, 5km. Ritmo moderado, todos são bem-vindos.',
        esporte: 'corrida',
        data: _futureDate(now, 5),
        horario: '06:30',
        vagas: 20,
        participantes: 12,
        lat: -23.5470,
        lng: -46.7250,
        endereco: 'Parque Villa-Lobos, Alto de Pinheiros'
      },
      {
        id: 'seed6',
        titulo: 'Beach Tennis na Paulista',
        descricao: 'Beach tennis em quadra coberta. Venha experimentar!',
        esporte: 'beach-tennis',
        data: _futureDate(now, 6),
        horario: '20:00',
        vagas: 8,
        participantes: 3,
        lat: -23.5630,
        lng: -46.6540,
        endereco: 'Arena Beach, Av. Paulista'
      }
    ];
  }

  function _futureDate(now, daysAhead) {
    const d = new Date(now);
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  function _load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { return JSON.parse(raw); } catch (e) { /* corrupted */ }
    }
    const seed = _getSeed();
    _save(seed);
    return seed;
  }

  function _save(rachas) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rachas));
  }

  function listarRachas() {
    return _load();
  }

  function buscarRacha(id) {
    return _load().find(r => r.id === id) || null;
  }

  function criarRacha(dados) {
    const rachas = _load();
    const novo = {
      id: Date.now().toString(36),
      titulo: dados.titulo,
      descricao: dados.descricao || '',
      esporte: dados.esporte,
      data: dados.data,
      horario: dados.horario,
      vagas: parseInt(dados.vagas, 10) || 10,
      participantes: 0,
      lat: parseFloat(dados.lat),
      lng: parseFloat(dados.lng),
      endereco: dados.endereco || ''
    };
    rachas.push(novo);
    _save(rachas);
    return novo;
  }

  function entrarNoRacha(id) {
    const rachas = _load();
    const racha = rachas.find(r => r.id === id);
    if (!racha || racha.participantes >= racha.vagas) return false;
    racha.participantes++;
    _save(rachas);
    return true;
  }

  function filtrarRachas(filtros) {
    let rachas = _load();
    if (filtros.esporte) {
      rachas = rachas.filter(r => r.esporte === filtros.esporte);
    }
    if (filtros.data) {
      rachas = rachas.filter(r => r.data === filtros.data);
    }
    return rachas;
  }

  return {
    ESPORTES: ESPORTES,
    getEsporte: _getEsporte,
    listarRachas: listarRachas,
    buscarRacha: buscarRacha,
    criarRacha: criarRacha,
    entrarNoRacha: entrarNoRacha,
    filtrarRachas: filtrarRachas
  };
})();
