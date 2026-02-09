// script.js

// ---------- Dados ----------
let tarefas = [];

// ---------- Utilidades ----------
function formatarDataBR(data) {
  if (!data) return '';
  const partes = String(data).split('-');
  if (partes.length === 3) {
    const [yyyy, mm, dd] = partes;
    return `${dd}/${mm}/${yyyy}`;
  }
  // fallback
  try {
    return new Date(data).toLocaleDateString('pt-BR');
  } catch {
    return String(data);
  }
}

function formatarNumeroBR(valor) {
  const num = Number(valor);
  if (!Number.isFinite(num)) return 'R$ 0,00';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function somatorioCustos() {
  return tarefas.reduce((soma, t) => soma + (Number.isFinite(t.custo) ? t.custo : 0), 0);
}

function mostrarToast(mensagem, tipo = 'info') {
  // Requer Bootstrap 5 (bundle) e contêiner no HTML
  const container = document.getElementById('toast-container');
  if (!container) {
    alert(mensagem);
    return;
  }

  const bgMap = {
    success: 'text-bg-success',
    danger: 'text-bg-danger',
    warning: 'text-bg-warning',
    info: 'text-bg-primary'
  };
  const bgClass = bgMap[tipo] || bgMap.info;

  const id = `toast-${Date.now()}`;
  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center ${bgClass} border-0`;
  toastEl.id = id;
  toastEl.role = 'status';
  toastEl.ariaLive = 'polite';
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${mensagem}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button>
    </div>
  `;
  container.appendChild(toastEl);

  const toast = new bootstrap.Toast(toastEl, { delay: 2500 });
  toast.show();
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

// ---------- CRUD & Render ----------
function listarTarefas() {

  const lista = document.getElementById('lista-tarefas');
  if (!lista) return;

  lista.innerHTML = '';
  const frag = document.createDocumentFragment();

  tarefas.forEach((tarefa) => {
    const card = document.createElement('div');
    card.className = 'card p-3 shadow-sm tarefa-card';
    card.setAttribute('draggable', 'true');
    card.dataset.id = String(tarefa.id);

    if (tarefa.custo >= 1000) {
      card.classList.add('border', 'border-warning', 'bg-warning', 'bg-opacity-25');
      card.style.boxShadow = '0 0 10px 2px #ffc107';
    }

    // Drag & Drop
    card.ondragstart = (e) => {
      e.dataTransfer.setData('text/plain', String(tarefa.id));
      card.classList.add('opacity-50');
    };
    card.ondragend = () => {
      card.classList.remove('opacity-50');
    };
    card.ondragover = (e) => e.preventDefault();
    card.ondrop = (e) => {
      e.preventDefault();
      const draggedId = parseInt(e.dataTransfer.getData('text/plain'), 10);
      const targetId = tarefa.id;
      if (draggedId !== targetId) {
        moverTarefaDragDrop(draggedId, targetId);
      }
    };

    // Cabeçalho + ações
    const header = document.createElement('div');
    header.className = 'd-flex justify-content-between align-items-start';

    const titulo = document.createElement('h5');
    titulo.className = 'card-title mb-2';
    titulo.textContent = `#${tarefa.id} — ${tarefa.nome}`;

    const btns = document.createElement('div');
    btns.className = 'btn-group btn-group-sm';
    btns.innerHTML = `
      <button type="button" class="btn btn-outline-secondary" data-acao="editar" data-id="${tarefa.id}">Editar</button>
      <button type="button" class="btn btn-outline-danger" data-acao="excluir" data-id="${tarefa.id}">Excluir</button>
    `;

    header.append(titulo, btns);

    // Detalhes
    const detalhes = document.createElement('ul');
    detalhes.className = 'list-unstyled small mb-0';
    detalhes.innerHTML = `
      <li><strong>Custo:</strong> ${formatarNumeroBR(tarefa.custo)}</li>
      <li><strong>Data Limite:</strong> ${formatarDataBR(tarefa.dataLimite)}</li>
      <li><strong>Ordem:</strong> ${tarefa.ordem}</li>
    `;

    card.append(header, detalhes);
    frag.appendChild(card);
  });

  lista.appendChild(frag);

  // Rodapé: somatório
  const rodape = document.getElementById('rodape-tarefas');
  if (rodape) {
    rodape.innerHTML = `Somatório dos custos: <strong>${formatarNumeroBR(somatorioCustos())}</strong>`;
  }
}

function incluirTarefa(nome, custo, dataLimite) {
  const nomeTrim = String(nome || '').trim();

  if (!nomeTrim || custo === undefined || !dataLimite) {
    mostrarToast('Todos os campos são obrigatórios!', 'danger');
    return;
  }

  if (tarefas.some(t => t.nome.toLowerCase() === nomeTrim.toLowerCase())) {
    mostrarToast('Já existe uma tarefa com esse nome!', 'danger');
    return;
  }

  const custoNum = Number(custo);
  if (Number.isNaN(custoNum) || custoNum < 0) {
    mostrarToast('Custo inválido!', 'danger');
    return;
  }

  const novoId = tarefas.length ? Math.max(...tarefas.map(t => t.id)) + 1 : 1;
  const novaOrdem = tarefas.length ? Math.max(...tarefas.map(t => t.ordem)) + 1 : 1;

  tarefas.push({
    id: novoId,
    nome: nomeTrim,
    custo: custoNum,
    dataLimite,
    ordem: novaOrdem
  });

  listarTarefas();
  mostrarToast('Tarefa incluída com sucesso!', 'success');
  limparCampos();
}

function editarTarefa(id, novoNome, novoCusto, novaDataLimite) {
  const tarefa = tarefas.find(t => t.id === id);
  if (!tarefa) return;

  const nomeTrim = String(novoNome || '').trim();
  if (!nomeTrim || novoCusto === undefined || !novaDataLimite) {
    mostrarToast('Todos os campos são obrigatórios!', 'danger');
    return;
  }

  if (tarefas.some(t => t.nome.toLowerCase() === nomeTrim.toLowerCase() && t.id !== id)) {
    mostrarToast('Já existe uma tarefa com esse nome!', 'danger');
    return;
  }

  const custoNum = Number(novoCusto);
  if (Number.isNaN(custoNum) || custoNum < 0) {
    mostrarToast('Custo inválido!', 'danger');
    return;
  }

  tarefa.nome = nomeTrim;
  tarefa.custo = custoNum;
  tarefa.dataLimite = novaDataLimite;

  listarTarefas();
  mostrarToast('Tarefa editada com sucesso!', 'success');
}

function excluirTarefa(id) {
  tarefas = tarefas.filter(t => t.id !== id);
  // Recalcula ordem
  tarefas.forEach((t, i) => (t.ordem = i + 1));
  listarTarefas();
}

function moverTarefaDragDrop(draggedId, targetId) {
  const draggedIdx = tarefas.findIndex(t => t.id === draggedId);
  const targetIdx = tarefas.findIndex(t => t.id === targetId);
  if (draggedIdx < 0 || targetIdx < 0) return; // corrigido: ||

  const [draggedTarefa] = tarefas.splice(draggedIdx, 1);
  tarefas.splice(targetIdx, 0, draggedTarefa);
  tarefas.forEach((t, i) => (t.ordem = i + 1));

  listarTarefas();
}

// ---------- Modais ----------
function editarTarefaPrompt(id) {
  const tarefa = tarefas.find(t => t.id === id);
  if (!tarefa) return;

  const modalHtml = `
    <div class="modal fade" id="modalEditar" tabindex="-1" aria-labelledby="modalEditarLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h6 class="modal-title" id="modalEditarLabel">Editar Tarefa #${tarefa.id}</h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label" for="editarNome">Nome</label>
              <input type="text" id="editarNome" class="form-control" value="${tarefa.nome}" required />
            </div>
            <div class="mb-3">
              <label class="form-label" for="editarCusto">Custo (R$)</label>
              <input type="number" id="editarCusto" class="form-control" min="0" step="0.01" value="${tarefa.custo}" required />
            </div>
            <div class="mb-3">
              <label class="form-label" for="editarDataLimite">Data Limite</label>
              <input type="date" id="editarDataLimite" class="form-control" value="${tarefa.dataLimite}" required />
            </div>
            <div id="editarErro" class="text-danger d-none small"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button class="btn btn-primary" id="btn-confirmar-editar">Salvar</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modalEl = document.getElementById('modalEditar');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();

  document.getElementById('btn-confirmar-editar').onclick = () => {
    const novoNome = document.getElementById('editarNome').value.trim();
    const novoCusto = document.getElementById('editarCusto').value;
    const novaDataLimite = document.getElementById('editarDataLimite').value;
    const erroDiv = document.getElementById('editarErro');

    if (!novoNome || novoCusto === '' || novaDataLimite === '') {
      erroDiv.textContent = 'Todos os campos são obrigatórios!';
      erroDiv.classList.remove('d-none');
      return;
    } else {
      erroDiv.classList.add('d-none');
    }

    editarTarefa(id, novoNome, novoCusto, novaDataLimite);
    modal.hide();
  };

  modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
}

function excluirTarefaPrompt(id) {
  const tarefa = tarefas.find(t => t.id === id);
  if (!tarefa) return;

  const modalHtml = `
    <div class="modal fade" id="modalExcluir" tabindex="-1" aria-labelledby="modalExcluirLabel" aria-hidden="true">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h6 class="modal-title" id="modalExcluirLabel">Confirmar Exclusão</h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
          </div>
          <div class="modal-body">
            Deseja realmente excluir a tarefa <strong>${tarefa.nome}</strong>?
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Não</button>
            <button class="btn btn-danger" id="btn-confirmar-excluir">Sim</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modalEl = document.getElementById('modalExcluir');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();

  document.getElementById('btn-confirmar-excluir').onclick = () => {
    excluirTarefa(id);
    modal.hide();
  };

  modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
}

// ---------- Inicialização ----------
function limparCampos() {
  const nomeInput = document.getElementById('inputNome');
  const custoInput = document.getElementById('inputCusto');
  const dataInput = document.getElementById('inputDataLimite');
  if (nomeInput) nomeInput.value = '';
  if (custoInput) custoInput.value = '';
  if (dataInput) dataInput.value = '';
}

function inicializar() {
  listarTarefas();

  const form = document.getElementById('form-tarefa');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = document.getElementById('inputNome').value;
      const custo = document.getElementById('inputCusto').value;
      const dataLimite = document.getElementById('inputDataLimite').value;
      incluirTarefa(nome, custo, dataLimite);
    });
  }

  // Delegação de eventos para Editar/Excluir
  const lista = document.getElementById('lista-tarefas');
  if (lista) {
    lista.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-acao]');
      if (!btn) return;
      const id = Number(btn.dataset.id);
      if (btn.dataset.acao === 'editar') return editarTarefaPrompt(id);
      if (btn.dataset.acao === 'excluir') return excluirTarefaPrompt(id);
    });
  }

}

window.addEventListener('DOMContentLoaded', inicializar);