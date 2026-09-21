/* ============================================
   LESARTS — Configurateur d'encadrement (prototype)
   ============================================ */

(function () {
  'use strict';

  const frameMat = document.getElementById('frame-mat');
  const frameBorder = document.getElementById('frame-border');
  const frameGlass = document.getElementById('frame-glass');
  const dimWidth = document.getElementById('dim-width');
  const dimHeight = document.getElementById('dim-height');

  if (!frameMat || !frameBorder || !frameGlass) return;

  const state = {
    baguette: { value: 'chene-naturel', label: 'Chêne naturel', color: '#C9A876', price: 42 },
    'passe-partout': { value: 'ivoire', label: 'Ivoire', color: '#F3EEE3', price: 18 },
    verre: { value: 'clair', label: 'Clair', opacity: 0.05, price: 15 },
  };

  // Valeurs de départ relevées dans le HTML : une seule source de vérité,
  // pas de doublon à maintenir entre le markup et le script.
  const DEFAULTS = {
    state: JSON.parse(JSON.stringify(state)),
    width: dimWidth.value,
    height: dimHeight.value,
  };

  function updatePreview() {
    frameBorder.style.backgroundColor = state.baguette.color;

    // Sans passe-partout, l'œuvre vient directement contre la feuillure.
    if (state['passe-partout'].value === 'aucun') {
      frameMat.style.padding = '0';
      frameMat.style.backgroundColor = 'transparent';
      frameMat.style.boxShadow = 'none';
    } else {
      frameMat.style.padding = '';
      frameMat.style.backgroundColor = state['passe-partout'].color;
      frameMat.style.boxShadow = '';
    }

    frameGlass.style.setProperty('--glass-opacity', state.verre.opacity);

    // Le cadre adopte le rapport largeur/hauteur saisi par le client.
    const w = parseFloat(dimWidth.value);
    const h = parseFloat(dimHeight.value);
    if (w > 0 && h > 0) {
      frameBorder.style.aspectRatio = `${w} / ${h}`;

      // Si le cadre est plus large que la zone d'aperçu, c'est la largeur qui
      // limite ; sinon la hauteur. Sans cette bascule, un format panoramique
      // ou très haut sort de la scène ou se retrouve écrasé.
      const stage = frameBorder.parentElement;
      const box = stage.getBoundingClientRect();
      const styles = getComputedStyle(stage);
      const availW = box.width - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
      const availH = box.height - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom);
      frameBorder.classList.toggle('is-landscape', w / h > availW / availH);
    }
  }

  // Dernier état calculé, réutilisé à l'enregistrement de la commande.
  let current = {};

  function updateSummary() {
    const w = parseFloat(dimWidth.value) || 0;
    const h = parseFloat(dimHeight.value) || 0;

    const perimeterM = (2 * (w + h)) / 100;
    const areaM2 = (w * h) / 10000;

    const total =
      perimeterM * state.baguette.price +
      areaM2 * state['passe-partout'].price +
      areaM2 * state.verre.price;

    current = {
      baguette: state.baguette.label,
      passePartout: state['passe-partout'].label,
      verre: state.verre.label,
      format: `${w} × ${h} cm`,
      width: w,
      height: h,
      total: total,
      totalLabel: total > 0 ? `${total.toFixed(2).replace('.', ',')} €` : '— €',
    };

    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    set('summary-baguette', current.baguette);
    set('summary-passe-partout', current.passePartout);
    set('summary-verre', current.verre);
    set('summary-format', current.format);
    set('summary-total', current.totalLabel);

    set('order-baguette', current.baguette);
    set('order-passe-partout', current.passePartout);
    set('order-verre', current.verre);
    set('order-format', current.format);
    set('order-total', current.totalLabel);
  }

  function refresh() {
    updatePreview();
    updateSummary();
  }

  document.querySelectorAll('.config-swatches').forEach((group) => {
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.swatch');
      if (!btn) return;

      const material = btn.dataset.material;

      group.querySelectorAll('.swatch').forEach((s) => {
        s.classList.remove('is-active');
        s.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');

      if (material === 'verre') {
        state.verre = {
          value: btn.dataset.value,
          label: btn.querySelector('.swatch__label').textContent,
          opacity: parseFloat(btn.dataset.opacity),
          price: parseFloat(btn.dataset.price),
        };
      } else {
        state[material] = {
          value: btn.dataset.value,
          label: btn.querySelector('.swatch__label').textContent,
          color: btn.dataset.color,
          price: parseFloat(btn.dataset.price),
        };
      }

      refresh();
    });
  });

  [dimWidth, dimHeight].forEach((input) => {
    input.addEventListener('input', refresh);
  });

  /* ---- Commander : glissement vers l'écran du formulaire ---- */

  const orderCta = document.getElementById('order-cta');
  const orderSection = document.getElementById('order-section');

  // smoothScrollTo vient de main.js (Lenis, avec repli natif).
  function scrollToSection(target) {
    if (typeof smoothScrollTo === 'function') {
      smoothScrollTo(target);
    } else {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }

  if (orderCta && orderSection) {
    orderCta.addEventListener('click', () => scrollToSection(orderSection));
  }

  const orderBack = document.getElementById('order-back');
  const configuratorSection = document.querySelector('.configurator');

  if (orderBack && configuratorSection) {
    orderBack.addEventListener('click', () => scrollToSection(configuratorSection));
  }

  /* ---- Modale de confirmation ---- */

  const modal = document.getElementById('confirm-modal');
  const modalClose = document.getElementById('confirm-close');
  let lockedScrollY = 0;

  // Commande en attente de validation : remplie à la soumission, écrite
  // seulement si le vendeur clique « Valider la commande ».
  let pendingOrder = null;

  /* Figer le body neutralise les DEUX moteurs de scroll du site : Lenis sur
     desktop (qui scrolle window quoi qu'il arrive, donc overflow:hidden ne
     suffit pas) et ScrollTrigger.normalizeScroll sur tablette. La modale est
     dans le top layer, donc insensible au body en position:fixed. */
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

  /* Toast : Toastify est chargé avant ce script. Le repli silencieux évite de
     casser la page si le CDN ne répond pas. */
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

  /* Remet le configurateur dans son état d'ouverture : matériaux, dimensions
     et surbrillance des échantillons. */
  function resetConfigurator() {
    Object.assign(state, JSON.parse(JSON.stringify(DEFAULTS.state)));
    dimWidth.value = DEFAULTS.width;
    dimHeight.value = DEFAULTS.height;

    document.querySelectorAll('.config-swatches').forEach((group) => {
      group.querySelectorAll('.swatch').forEach((s) => {
        const material = s.dataset.material;
        const key = material === 'verre' ? 'verre' : material;
        const isDefault = s.dataset.value === DEFAULTS.state[key].value;
        s.classList.toggle('is-active', isDefault);
        s.setAttribute('aria-pressed', isDefault ? 'true' : 'false');
      });
    });

    refresh();
  }

  function openConfirm(firstname, lastname) {
    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };
    set('confirm-client', `${firstname} ${lastname}`);
    set('confirm-baguette', current.baguette);
    set('confirm-passe-partout', current.passePartout);
    set('confirm-verre', current.verre);
    set('confirm-format', current.format);
    set('confirm-total', current.totalLabel);

    lockScroll();
    modal.showModal();
  }

  /* ---- Enregistrement de la commande (prototype : localStorage) ---- */

  const STORAGE_KEY = 'lesarts-orders';
  const orderForm = document.getElementById('order-form');
  const orderStatus = document.getElementById('order-status');

  function readOrders() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const firstname = document.getElementById('client-firstname').value.trim();
      const lastname = document.getElementById('client-lastname').value.trim();
      const email = document.getElementById('client-email').value.trim();

      if (!firstname || !lastname || !email) {
        orderStatus.dataset.state = 'error';
        orderStatus.textContent = 'Merci de compléter tous les champs.';
        return;
      }

      // Rien n'est enregistré ici : la commande n'est écrite qu'à la validation
      // depuis la modale. On mémorise seulement ce qui sera envoyé.
      pendingOrder = {
        client: { firstname, lastname, email },
        frame: {
          baguette: current.baguette,
          passePartout: current.passePartout,
          verre: current.verre,
          format: current.format,
          width: current.width,
          height: current.height,
        },
        total: current.total,
        totalLabel: current.totalLabel,
      };

      orderStatus.textContent = '';
      delete orderStatus.dataset.state;
      openConfirm(firstname, lastname);
    });
  }

  /* Trois sorties possibles, distinguées par la valeur passée à close() :
     - 'validated' : la commande vient d'être écrite → tout réinitialiser
     - 'edit'      : retour au configurateur en gardant la saisie en cours
     - ''          : croix ou Échap → abandon, remise à l'état initial */
  if (modal) {
    const modalValidate = document.getElementById('confirm-validate');
    const modalEdit = document.getElementById('confirm-edit');

    modalClose.addEventListener('click', () => modal.close(''));
    modalEdit.addEventListener('click', () => modal.close('edit'));

    modalValidate.addEventListener('click', () => {
      if (!pendingOrder) return;

      const orders = readOrders();
      const reference = 'LA-' + String(orders.length + 1).padStart(4, '0');

      // Délai atelier de 10 jours ouvrés, arrondi au jour : sert d'échéance sur
      // le bon d'atelier et permet de repérer les commandes en retard.
      const due = new Date();
      due.setDate(due.getDate() + 14);

      orders.push({
        reference,
        createdAt: new Date().toISOString(),
        dueAt: due.toISOString(),
        client: pendingOrder.client,
        frame: pendingOrder.frame,
        total: pendingOrder.total,
        totalLabel: pendingOrder.totalLabel,
        status: 'a-produire',
      });

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
      } catch (e) {
        toast("Impossible d'enregistrer la commande.", 'error');
        return;
      }

      toast(`Commande ${reference} envoyée à l'atelier`, 'success');
      modal.close('validated');
    });

    modal.addEventListener('close', () => {
      unlockScroll();

      const outcome = modal.returnValue;

      if (outcome === 'validated') {
        pendingOrder = null;
        orderForm.reset();
        resetConfigurator();
      } else if (outcome !== 'edit') {
        // Croix ou Échap : la commande est abandonnée.
        pendingOrder = null;
        orderForm.reset();
        resetConfigurator();
        toast('Commande annulée', 'info');
      }
      // 'edit' : on ne touche à rien, la saisie reste telle quelle.

      // unlockScroll() rétablit position:static ET l'offset dans le même tick ;
      // sans cette frame, smoothScrollTo mesurerait contre un body encore figé.
      requestAnimationFrame(() => {
        if (configuratorSection) scrollToSection(configuratorSection);
      });
    });
  }

  refresh();
})();
