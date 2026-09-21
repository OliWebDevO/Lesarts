/* ============================================
   LESARTS — Interface atelier (prototype)
   Suivi des commandes par statut (Lot 06 / 07)
   ============================================ */

(function () {
  'use strict';

  const list = document.getElementById('orders-list');
  if (!list) return;

  const STORAGE_KEY = 'lesarts-orders';

  /* Flux de production du devis : à produire → en cours → prêt → retiré.
     `action` est le libellé du bouton qui fait passer à l'étape suivante. */
  const FLOW = [
    { id: 'a-produire', label: 'À produire', action: 'Démarrer la production' },
    { id: 'en-cours', label: 'En cours à l\'atelier', action: 'Expédié au magasin' },
    { id: 'pret', label: 'Prêt — en magasin', action: 'Retiré par le client' },
    { id: 'retire', label: 'Retiré', action: null },
  ];

  const emptyState = document.getElementById('empty-state');
  let activeFilter = 'tous';
  let searchQuery = '';

  function readOrders() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function writeOrders(orders) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      /* Quota plein ou stockage bloqué : l'affichage courant reste valide. */
    }
  }

  /* Les références proviennent de données saisies côté client : on les échappe
     avant de les réinjecter dans un attribut HTML. */
  function escapeAttr(value) {
    return String(value).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[c]);
  }

  function statusIndex(status) {
    const i = FLOW.findIndex((s) => s.id === status);
    return i === -1 ? 0 : i;
  }

  /* Toast : Toastify est chargé avant ce script. Repli silencieux si le CDN
     ne répond pas, pour ne pas casser la page. */
  function toast(message, variant) {
    if (typeof Toastify !== 'function') return;
    Toastify({
      text: message,
      duration: 3500,
      gravity: 'top',
      position: 'right',
      close: true,
      stopOnFocus: true,
      className: 'toast toast--' + (variant || 'info'),
    }).showToast();
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  /* Recherche : insensible à la casse et aux accents, pour que « Lefevre »
     trouve « Lefèvre » — la saisie au comptoir est rarement accentuée. */
  function normalize(value) {
    return String(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }

  /* Un seul champ interroge le nom, le prénom, la référence et la date. La
     date est testée sous plusieurs formes (21/09/2026, 21-09, 2026-09-21)
     pour accepter la façon dont chacun la tape. */
  function matchesSearch(order, query) {
    if (!query) return true;

    const d = new Date(order.createdAt);
    const pad = (n) => String(n).padStart(2, '0');
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();

    const haystack = [
      order.client.firstname,
      order.client.lastname,
      `${order.client.firstname} ${order.client.lastname}`,
      order.client.email,
      order.reference,
      formatDate(order.createdAt),
      `${day}/${month}`,
      `${day}-${month}-${year}`,
      `${year}-${month}-${day}`,
    ].map(normalize).join(' | ');

    // Chaque mot doit être présent : « dubois 21/09 » croise nom et date.
    return normalize(query)
      .split(/\s+/)
      .filter(Boolean)
      .every((term) => haystack.includes(term));
  }

  function render() {
    const orders = readOrders();

    FLOW.forEach((step) => {
      const el = document.getElementById('stat-' + step.id);
      if (el) el.textContent = orders.filter((o) => o.status === step.id).length;
    });

    // Les deux filtres se combinent : statut d'abord, puis recherche.
    const visible = orders
      .filter((o) => activeFilter === 'tous' || o.status === activeFilter)
      .filter((o) => matchesSearch(o, searchQuery));

    list.innerHTML = '';

    // Trois cas distincts, pour que l'utilisateur sache pourquoi c'est vide.
    if (orders.length === 0) {
      emptyState.hidden = false;
      emptyState.innerHTML = 'Aucune commande pour le moment. Passez une commande depuis le '
        + '<a href="app.html">configurateur</a> pour la voir apparaître ici.';
    } else if (visible.length === 0) {
      emptyState.hidden = false;
      emptyState.textContent = searchQuery
        ? `Aucun résultat pour « ${searchQuery} ».`
        : 'Aucune commande dans ce statut.';
    } else {
      emptyState.hidden = true;
    }

    visible.forEach((order) => {
      const idx = statusIndex(order.status);
      const step = FLOW[idx];

      const card = document.createElement('article');
      card.className = 'order-card';
      card.dataset.status = order.status;

      const steps = FLOW.map((s, i) => `
        <li class="order-card__step${i <= idx ? ' is-done' : ''}">
          <span class="order-card__dot" aria-hidden="true"></span>
          <span>${s.label}</span>
        </li>`).join('');

      card.innerHTML = `
        <button type="button" class="order-card__delete" data-ref="${escapeAttr(order.reference)}"
                aria-label="Supprimer la commande ${escapeAttr(order.reference)}">
          <span aria-hidden="true">✕</span>
        </button>

        <div class="order-card__head">
          <div>
            <span class="order-card__ref">${order.reference}</span>
            <span class="order-card__date">${formatDate(order.createdAt)}</span>
          </div>
          <span class="order-card__badge" data-status="${order.status}">${step.label}</span>
        </div>

        <div class="order-card__body">
          <div class="order-card__client">
            <strong>${order.client.firstname} ${order.client.lastname}</strong>
            <a href="mailto:${order.client.email}">${order.client.email}</a>
          </div>

          <dl class="order-card__specs">
            <div><dt>Baguette</dt><dd>${order.frame.baguette}</dd></div>
            <div><dt>Passe-partout</dt><dd>${order.frame.passePartout}</dd></div>
            <div><dt>Verre</dt><dd>${order.frame.verre}</dd></div>
            <div><dt>Format</dt><dd>${order.frame.format}</dd></div>
          </dl>
        </div>

        <ol class="order-card__flow">${steps}</ol>

        <div class="order-card__foot">
          <span class="order-card__total">${order.totalLabel}</span>
          <div class="order-card__actions">
            <button type="button" class="order-card__print" data-ref="${escapeAttr(order.reference)}">Bon d'atelier</button>
            ${step.action
              ? `<button type="button" class="order-card__advance" data-ref="${escapeAttr(order.reference)}">${step.action}</button>`
              : '<span class="order-card__done">Commande clôturée</span>'}
          </div>
        </div>
      `;

      list.appendChild(card);
    });
  }

  /* ---- Bon d'atelier ---- */

  /* Cotes de coupe à partir du format fini. Valeurs de démonstration : la
     feuillure (rebate) et le jeu de montage dépendent du profil réel de chaque
     baguette et viendront du catalogue fournisseur. */
  const REBATE = 0.7;   // recouvrement de la baguette sur l'œuvre, par côté (cm)
  const PLAY = 0.2;     // jeu de montage verre/carton (cm)

  function cutList(order) {
    const w = Number(order.frame.width) || 0;
    const h = Number(order.frame.height) || 0;

    // Le verre et le carton se coupent au format fini moins le jeu.
    const glassW = (w - PLAY).toFixed(1);
    const glassH = (h - PLAY).toFixed(1);

    // Longueur de baguette : chaque montant porte le format fini ; la coupe à
    // 45° ajoute deux fois la largeur du profil, comptée ici via la feuillure.
    const barW = (w + REBATE * 2).toFixed(1);
    const barH = (h + REBATE * 2).toFixed(1);
    const linear = (2 * (Number(barW) + Number(barH)) / 100).toFixed(2);

    return { w, h, glassW, glassH, barW, barH, linear };
  }

  function printSheet(order) {
    const c = cutList(order);
    const sheet = document.getElementById('workshop-sheet');

    // Les commandes passées avant l'ajout de l'échéance n'ont pas de dueAt :
    // on la déduit de la date de commande plutôt que d'afficher un vide.
    let dueDate = order.dueAt;
    if (!dueDate) {
      const d = new Date(order.createdAt);
      d.setDate(d.getDate() + 14);
      dueDate = d.toISOString();
    }
    const due = formatDate(dueDate);

    const esc = (v) => escapeAttr(v == null ? '—' : v);

    sheet.innerHTML = `
      <header class="sheet__head">
        <div>
          <p class="sheet__brand">LESARTS · Atelier</p>
          <h2 class="sheet__ref">${esc(order.reference)}</h2>
        </div>
        <dl class="sheet__meta">
          <div><dt>Commandé le</dt><dd>${esc(formatDate(order.createdAt))}</dd></div>
          <div><dt>À livrer pour</dt><dd class="sheet__due">${esc(due)}</dd></div>
        </dl>
      </header>

      <section class="sheet__block">
        <h3>Client</h3>
        <p class="sheet__client">${esc(order.client.firstname)} ${esc(order.client.lastname)}</p>
        <p class="sheet__muted">${esc(order.client.email)}</p>
      </section>

      <section class="sheet__block">
        <h3>Format fini</h3>
        <p class="sheet__format">${esc(c.w)} × ${esc(c.h)} cm</p>
      </section>

      <section class="sheet__block">
        <h3>Dimensions de coupe</h3>
        <table class="sheet__table">
          <thead>
            <tr><th>Élément</th><th>Largeur</th><th>Hauteur</th><th>Détail</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Baguette — ${esc(order.frame.baguette)}</td>
              <td>${esc(c.barW)} cm</td>
              <td>${esc(c.barH)} cm</td>
              <td>${esc(c.linear)} ml · coupe 45°</td>
            </tr>
            <tr>
              <td>Verre — ${esc(order.frame.verre)}</td>
              <td>${esc(c.glassW)} cm</td>
              <td>${esc(c.glassH)} cm</td>
              <td>jeu ${PLAY} cm</td>
            </tr>
            <tr>
              <td>Passe-partout — ${esc(order.frame.passePartout)}</td>
              <td>${esc(c.glassW)} cm</td>
              <td>${esc(c.glassH)} cm</td>
              <td>fenêtre ${esc((c.w - REBATE * 2).toFixed(1))} × ${esc((c.h - REBATE * 2).toFixed(1))} cm</td>
            </tr>
            <tr>
              <td>Carton de fond</td>
              <td>${esc(c.glassW)} cm</td>
              <td>${esc(c.glassH)} cm</td>
              <td>jeu ${PLAY} cm</td>
            </tr>
          </tbody>
        </table>
        <p class="sheet__note">
          Cotes calculées pour une feuillure de ${REBATE} cm par côté. À ajuster
          selon le profil réel de la baguette.
        </p>
      </section>

      <footer class="sheet__foot">
        <div class="sheet__check"><span class="sheet__box"></span> Coupe</div>
        <div class="sheet__check"><span class="sheet__box"></span> Montage</div>
        <div class="sheet__check"><span class="sheet__box"></span> Contrôle</div>
      </footer>
    `;

    window.print();
  }

  /* Avancer d'une étape = cocher l'expédition puis la réception en magasin. */
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.order-card__advance');
    if (!btn) return;

    const orders = readOrders();
    const order = orders.find((o) => o.reference === btn.dataset.ref);
    if (!order) return;

    const next = FLOW[statusIndex(order.status) + 1];
    if (!next) return;

    order.status = next.id;
    order.history = order.history || [];
    order.history.push({ status: next.id, at: new Date().toISOString() });

    writeOrders(orders);
    render();
    toast(`${order.reference} — ${next.label}`, 'success');
  });

  /* ---- Suppression d'une commande ---- */

  const deleteModal = document.getElementById('delete-modal');
  const deleteConfirm = document.getElementById('delete-confirm');
  const deleteCancel = document.getElementById('delete-cancel');
  const deleteRef = document.getElementById('delete-ref');
  let pendingRef = null;
  let lockedScrollY = 0;

  /* Figer le body neutralise Lenis (desktop) comme normalizeScroll (tablette) :
     la modale, dans le top layer, n'est pas affectée par position:fixed. */
  function lockScroll() {
    lockedScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.width = '100%';
  }

  function unlockScroll() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, lockedScrollY);
  }

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.order-card__print');
    if (!btn) return;

    const order = readOrders().find((o) => o.reference === btn.dataset.ref);
    if (order) printSheet(order);
  });

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.order-card__delete');
    if (!btn || !deleteModal) return;

    pendingRef = btn.dataset.ref;
    deleteRef.textContent = pendingRef;
    lockScroll();
    deleteModal.showModal();
  });

  if (deleteModal) {
    deleteCancel.addEventListener('click', () => deleteModal.close());

    deleteConfirm.addEventListener('click', () => {
      const ref = pendingRef;
      writeOrders(readOrders().filter((o) => o.reference !== ref));
      deleteModal.close('deleted');
      toast(`Commande ${ref} supprimée`, 'error');
    });

    /* 'close' couvre le bouton, la croix et Échap : un seul point de sortie.
       pendingRef n'est remis à null qu'ici, après la suppression éventuelle. */
    deleteModal.addEventListener('close', () => {
      unlockScroll();
      pendingRef = null;
      render();
    });
  }

  document.querySelectorAll('.admin__filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin__filter').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      activeFilter = btn.dataset.filter;
      render();
    });
  });

  /* ---- Recherche ---- */

  const searchInput = document.getElementById('order-search');
  const searchClear = document.getElementById('search-clear');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value.trim();
      searchClear.hidden = searchQuery === '';
      render();
    });

    // Échap vide le champ sans quitter le clavier : réflexe attendu au comptoir.
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && searchInput.value) {
        e.preventDefault();
        searchInput.value = '';
        searchQuery = '';
        searchClear.hidden = true;
        render();
      }
    });

    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      searchClear.hidden = true;
      searchInput.focus();
      render();
    });
  }

  render();
})();
