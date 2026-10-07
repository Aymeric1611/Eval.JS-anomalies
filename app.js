/**
 * ==============================================================================
 * TP JavaScript — BTS SIO 2ème Année
 * Sujet : Le Registre des Anomalies Mystiques (GlitchZero)
 * Fichier : app.js
 * 
 * Contraintes respectées :
 * 1. In-Memory State (Gestion d'état purement en mémoire, pas de stockage persistant)
 * 2. Génération déclarative (Array.prototype.map + join('') injecté dans innerHTML)
 * 3. Filtrage non destructif via Array.prototype.filter()
 * 4. Optimisation événementielle (Délégation d'événements & Event Bubbling)
 * 5. Bonus 1 : Cagnotte totale calculée via Array.prototype.reduce()
 * 6. Bonus 2 : Recherche textuelle multicritère (titre & description)
 * ==============================================================================
 */

// ==============================================================================
// 1. ÉTAT DE L'APPLICATION (IN-MEMORY STATE)
// ==============================================================================

/**
 * Jeu d'essai initial (au moins 3 objets prédéfinis respectant le modèle attendu)
 * L'utilisation de const garantit la référence constante au tableau.
 */
const bugs = [
  {
    id: 1711200001,
    titre: "Le CSS fantôme",
    auteur: "Alexandre",
    severite: "Critique",
    description: "La navbar disparaît uniquement les soirs de pleine lune sur Safari iOS.",
    recompense: 150
  },
  {
    id: 1711200002,
    titre: "Bouton de validation volant",
    auteur: "Sonia",
    severite: "Moyenne",
    description: "Le bouton se déplace de 20px vers la gauche dès qu'on essaie de le survoler avec la souris.",
    recompense: 75
  },
  {
    id: 1711200003,
    titre: "Faute de frappe dans le footer",
    auteur: "Thomas",
    severite: "Basse",
    description: "Mention « Tous droits réservés » écrite avec une coquille (« Tous drois réservés »).",
    recompense: 20
  }
];

/**
 * Variable globale représentant le filtre courant de sévérité.
 * Valeurs possibles : "Tous" | "Critique" | "Moyenne" | "Basse"
 */
let filtreActif = "Tous";

/**
 * Variable globale pour le mot-clé de recherche (Bonus)
 */
let rechercheTerme = "";

// ==============================================================================
// 2. SÉLECTION DES ÉLÉMENTS DU DOM
// ==============================================================================
const bugGrid = document.getElementById("bug-grid");
const counterBugs = document.getElementById("counter-bugs");
const totalBountyEl = document.getElementById("total-bounty");
const filterBar = document.getElementById("filter-bar");
const bugForm = document.getElementById("bug-form");
const searchInput = document.getElementById("search-input");
const btnClearSearch = document.getElementById("btn-clear-search");

// ==============================================================================
// 3. UTILITAIRES D'AFFICHAGE & SÉCURITÉ
// ==============================================================================

/**
 * Sécurise les entrées textuelles contre les failles XSS
 * avant injection dans les templates HTML.
 * @param {string} str - La chaîne brute saisie par l'utilisateur
 * @returns {string} - La chaîne échappée
 */
const escapeHTML = (str = "") => {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Affiche une brève notification toast dans l'interface
 * @param {string} message - Message à afficher
 * @param {"success" | "resolve"} type - Type visuel du toast
 */
const showToast = (message, type = "success") => {
  let toastContainer = document.querySelector(".toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === "resolve" ? "⚔️" : "✨"}</span>
    <span>${escapeHTML(message)}</span>
  `;

  toastContainer.appendChild(toast);

  // Disparition automatique après 3.2 secondes
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(15px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3200);
};

// ==============================================================================
// 4. MOTEUR DE RENDU DÉCLARATIF (filter, map & join)
// ==============================================================================

/**
 * Fonction maîtresse chargée de synchroniser l'affichage avec l'état de l'application.
 * 1. Filtrage non destructif via .filter()
 * 2. Génération déclarative des templates HTML via .map() et .join('')
 * 3. Injection dans #bug-grid via innerHTML
 * 4. Mise à jour du compteur global et du bonus cagnotte (.reduce())
 */
const renderBugs = () => {
  // --- 1. Filtrage non destructif (filter) ---
  // On applique d'abord le filtre de sévérité
  let bugsFiltres = filtreActif === "Tous"
    ? bugs
    : bugs.filter((bug) => bug.severite.toLowerCase() === filtreActif.toLowerCase());

  // Combinaison avec le filtre de recherche textuelle (Bonus)
  if (rechercheTerme.trim() !== "") {
    const termeNormalise = rechercheTerme.trim().toLowerCase();
    bugsFiltres = bugsFiltres.filter((bug) => {
      const matchTitre = bug.titre.toLowerCase().includes(termeNormalise);
      const matchDesc = (bug.description || "").toLowerCase().includes(termeNormalise);
      const matchAuteur = bug.auteur.toLowerCase().includes(termeNormalise);
      return matchTitre || matchDesc || matchAuteur;
    });
  }

  // --- 2. Mise à jour des compteurs et du bonus cagnotte ---
  // Compteur global d'anomalies visibles
  counterBugs.textContent = bugsFiltres.length;

  // BONUS 1 : Cagnotte totale calculée via Array.prototype.reduce()
  const totalBounty = bugsFiltres.reduce((accumulateur, bug) => {
    return accumulateur + (Number(bug.recompense) || 0);
  }, 0);

  // Formatage du nombre avec séparateur de milliers
  totalBountyEl.textContent = totalBounty.toLocaleString("fr-FR");

  // --- 3. Gestion de l'état vide (si aucun résultat) ---
  if (bugsFiltres.length === 0) {
    bugGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛸</div>
        <h3 class="empty-title">Aucune anomalie mystique détectée</h3>
        <p class="empty-desc">
          Aucun ticket ne correspond au filtre de sévérité 
          <strong>« ${escapeHTML(filtreActif)} »</strong>
          ${rechercheTerme ? ` ou au mot-clé <strong>« ${escapeHTML(rechercheTerme)} »</strong>` : ""}.
        </p>
        <button type="button" id="btn-reset-filters" class="btn-reset-filters">
          Réinitialiser les filtres
        </button>
      </div>
    `;

    // Écouteur spécifique pour réinitialiser depuis l'état vide
    const btnReset = document.getElementById("btn-reset-filters");
    if (btnReset) {
      btnReset.addEventListener("click", () => {
        filtreActif = "Tous";
        rechercheTerme = "";
        searchInput.value = "";
        btnClearSearch.hidden = true;
        updateActiveFilterButton("Tous");
        renderBugs();
      });
    }
    return;
  }

  // --- 4. Génération déclarative des cartes avec .map() et .join('') ---
  const cardsHtml = bugsFiltres
    .map((bug) => {
      // Destructuration ES6 des propriétés du bug
      const { id, titre, auteur, severite, description, recompense } = bug;
      const severiteClass = severite.toLowerCase();

      return `
        <article class="card" data-card-id="${id}">
          <!-- En-tête de la carte : Badge sévérité & Prime -->
          <div class="card-header">
            <span class="badge-severite ${severiteClass}">
              <span class="filter-dot dot-${severiteClass}"></span>
              ${escapeHTML(severite)}
            </span>
            <span class="card-bounty" title="Prime accordée pour la résolution">
              ⚡ ${Number(recompense) || 0} pts
            </span>
          </div>

          <!-- Corps de la carte : Titre, description, auteur, ID -->
          <div class="card-body">
            <h3 class="card-title">${escapeHTML(titre)}</h3>
            <p class="card-description">
              ${escapeHTML(description || "Aucune description surnaturelle renseignée.")}
            </p>
            <div class="card-meta">
              <span class="author-chip">
                <span>👤</span> ${escapeHTML(auteur)}
              </span>
              <span class="bug-id-tag">#${id}</span>
            </div>
          </div>

          <!-- Pied de carte : Bouton Résoudre avec data-id requis -->
          <div class="card-footer">
            <button 
              type="button" 
              class="btn-resolve" 
              data-id="${id}"
              aria-label="Résoudre et supprimer le ticket ${id}"
            >
              <span>⚔️</span>
              <span>Résoudre</span>
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  // Injection unique dans le DOM (performance optimale)
  bugGrid.innerHTML = cardsHtml;
};

// ==============================================================================
// 5. GESTION DU SYSTÈME DE FILTRAGE (Étape 3)
// ==============================================================================

/**
 * Met à jour la classe CSS .active sur les boutons de filtre
 * @param {string} filterValue - Valeur du filtre actif ("Tous", "Critique", ...)
 */
const updateActiveFilterButton = (filterValue) => {
  const filterButtons = filterBar.querySelectorAll(".btn-filter");
  filterButtons.forEach((btn) => {
    if (btn.dataset.filter.toLowerCase() === filterValue.toLowerCase()) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
};

/**
 * Délégation d'événements sur le conteneur des filtres
 */
filterBar.addEventListener("click", (event) => {
  const btn = event.target.closest(".btn-filter");
  if (!btn) return;

  const nouveauFiltre = btn.dataset.filter;
  if (!nouveauFiltre) return;

  // Mise à jour de la variable d'état
  filtreActif = nouveauFiltre;

  // Mise à jour visuelle du bouton actif
  updateActiveFilterButton(filtreActif);

  // Recalcul et réaffichage immédiat
  renderBugs();
});

// ==============================================================================
// 6. GESTION DU CHAMP DE RECHERCHE TEXTUELLE (Bonus 2)
// ==============================================================================
searchInput.addEventListener("input", (event) => {
  rechercheTerme = event.target.value;
  btnClearSearch.hidden = rechercheTerme.length === 0;
  renderBugs();
});

btnClearSearch.addEventListener("click", () => {
  searchInput.value = "";
  rechercheTerme = "";
  btnClearSearch.hidden = true;
  searchInput.focus();
  renderBugs();
});

// ==============================================================================
// 7. SAISIE ET AJOUT DE DONNÉES (Étape 4)
// ==============================================================================
bugForm.addEventListener("submit", (event) => {
  // Neutralisation du rechargement de page par défaut
  event.preventDefault();

  // Extraction et nettoyage des valeurs du formulaire
  const titreInput = document.getElementById("bug-titre");
  const auteurInput = document.getElementById("bug-auteur");
  const severiteInput = document.getElementById("bug-severite");
  const recompenseInput = document.getElementById("bug-recompense");
  const descriptionInput = document.getElementById("bug-description");

  const titre = titreInput.value.trim();
  const auteur = auteurInput.value.trim();
  const severite = severiteInput.value;
  const recompense = Number(recompenseInput.value) || 0;
  const description = descriptionInput.value.trim();

  // Validation minimale
  if (!titre || !auteur) {
    alert("Veuillez renseigner les champs obligatoires (Titre et Auteur).");
    return;
  }

  // Création du nouvel objet bug respectant le modèle attendu
  const newBug = {
    id: Date.now(), // Identifiant unique basé sur le timestamp
    titre,
    auteur,
    severite,
    description: description || "Aucune description fournie.",
    recompense
  };

  // Ajout au tableau source bugs en mémoire
  bugs.push(newBug);

  // Réinitialisation du formulaire
  bugForm.reset();

  // Valeur de récompense par défaut agréable
  recompenseInput.value = "50";

  // Notification utilisateur
  showToast(`Anomalie « ${newBug.titre} » enregistrée avec succès !`, "success");

  // Rafraîchissement de l'interface
  renderBugs();
});

// ==============================================================================
// 8. SUPPRESSION PAR DÉLÉGATION D'ÉVÉNEMENTS (Étape 5)
// ==============================================================================

/**
 * UN SEUL écouteur sur le conteneur parent (#bug-grid).
 * Grâce à l'Event Bubbling, le clic remonte depuis le bouton jusqu'au conteneur.
 */
bugGrid.addEventListener("click", (event) => {
  // 1. Vérifier si l'élément cliqué (ou l'un de ses enfants) est le bouton de résolution
  const btnResolve = event.target.closest(".btn-resolve");
  if (!btnResolve) return;

  // 2. Récupérer l'identifiant cible du bug via dataset (data-id)
  const bugId = Number(btnResolve.dataset.id);

  // 3. Trouver l'index correspondant dans le tableau source bugs
  const bugIndex = bugs.findIndex((b) => b.id === bugId);

  if (bugIndex !== -1) {
    const bugSupprime = bugs[bugIndex];

    // Suppression de l'objet dans le tableau source
    bugs.splice(bugIndex, 1);

    // Notification utilisateur
    showToast(`Anomalie « ${bugSupprime.titre} » éliminée de la prod !`, "resolve");

    // 4. Réexécuter renderBugs() pour recalculer l'affichage
    renderBugs();
  }
});

// ==============================================================================
// 9. INITIALISATION AU CHARGEMENT DE LA PAGE
// ==============================================================================
document.addEventListener("DOMContentLoaded", () => {
  // Premier rendu à partir des données prédéfinies
  renderBugs();
});
