# Les Arts — Plan des 3 Prototypes de Site Web

**Projet :** Site web pour une galerie d'art et atelier d'encadrement (Les Arts)  
**Date :** 2026-05-18  
**Références analysées :** framelondon.com · olivervdb.com · theframeshop.be · justframeit.be · atelier-cadrart.com

---

## Besoins communs aux 3 variantes

Chaque prototype couvrira les 6 besoins identifiés dans le PDF :

| # | Section | Notes |
|---|---------|-------|
| 1 | **Galerie & magasin d'encadrement** | Vitrine des réalisations, catalogue de cadres |
| 2 | **Services + photos** | Présentation des prestations avec visuels de l'espace |
| 3 | **E-commerce** | Boutique en ligne (cadres standards, tirages, accessoires) |
| 4 | **Contact** | Formulaire + carte + horaires + infos pratiques |
| 5 | **About Us** | Histoire, équipe, valeurs, atelier |
| 6 | **Newsletter** | Inscription + intégration Instagram feed |

---

## Structure des dossiers

```
Lesarts - Prototypes/
├── Variante-1-Belge/
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── assets/
├── Variante-2-Minimaliste/
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── assets/
└── Variante-3-FrameLondon/
    ├── index.html
    ├── css/
    ├── js/
    └── assets/
```

---

## Pipeline d'agents par variante

Chaque variante suit le même pipeline de 6 agents dans cet ordre :

```
1. ux-ui-expert          → Design system + wireframes + mockup HTML/CSS
2. static-web-expert     → Build complet HTML/CSS/JS
3. animation-gsap-expert → Animations scroll, transitions, micro-interactions
4. seo-expert            → Meta tags, Open Graph, structured data
5. testing-qa-expert     → Tests fonctionnels, responsive, cross-browser
6. performance-security-expert → Audit perf + sécurité pré-livraison
```

Les étapes **4, 5, 6** peuvent tourner en parallèle (indépendantes).  
Les étapes **1 → 2 → 3** sont séquentielles (chaque étape dépend de la précédente).

---

---

# VARIANTE 1 — "Belgian Market"

> **Inspiration :** theframeshop.be · justframeit.be  
> **Positionnement :** Artisanat belge, e-commerce pratique, bilingue FR/NL, accessible

## Analyse des références

**theframeshop.be** — Fonctionnel, e-commerce first. Trust badges (Bancontact, SSL, livraison gratuite), galerie de réalisations, configurateur de cadres en ligne, rating client. Manque de raffinement visuel mais bonne structure e-commerce. Badges paiement belges très présents.

**justframeit.be** — Plus soigné. Orange brand color, hero avec photo lifestyle, grille de produits populaires, 3 modes de service (online / shop visit / pickup), +3000 clients satisfaits. Bonne UX, clair et fonctionnel. "Handmade in Belgium" mis en avant.

**Problèmes courants à éviter :** Pop-up intrusif au chargement · Trop de trust badges qui cheapifient · Logos Bancontact/Visa trop gros · Navigation surchargée

## Direction créative

- **Palette :** Fond blanc `#FFFFFF`, accents chaleureux `#C4996C` (or terracotta), texte `#1A1A1A`, gris léger `#F5F5F2`
- **Typographie :** Sans-serif robuste pour les titres (ex. DM Sans ou Plus Jakarta Sans), body lisible
- **Ton :** Chaleureux, artisanal, professionnel · "L'artisanat belge à votre service"
- **Langue :** FR principal, toggle NL/FR dans la navigation
- **Différenciateur :** Configurateur de cadres interactif + confiance belge (Bancontact, livraison Bpost)

## Structure des pages (one-pager avec ancres)

### Header / Navigation
- Logo "Les Arts" à gauche
- Menu : Galerie | Services | Boutique | À propos | Contact
- Toggle langue FR/NL
- Icône panier (e-commerce)
- CTA "Prendre RDV" en accent

### Section 1 — Hero
- Photo pleine largeur de l'atelier ou d'un encadrement en cours
- Titre : "L'art de l'encadrement, fait à la main en Belgique"
- 3 badges : ✓ Artisanat belge · ✓ Sur mesure · ✓ Livraison gratuite dès 75€
- CTA primaire : "Configurer mon cadre" → e-commerce
- CTA secondaire : "Voir les réalisations"

### Section 2 — Services (3 colonnes)
- Encadrement sur mesure
- Galerie d'art
- Restauration & conservation
- Chaque service : icône illustrée + titre + texte court + lien

### Section 3 — Galerie / Réalisations
- Grille masonry 3 colonnes avec filtre par type (peinture, photo, poster, miroir)
- Hover reveal : type de cadre + matériau utilisé
- CTA "Voir toutes les réalisations"

### Section 4 — E-commerce aperçu
- "Nos cadres les plus populaires"
- Grille de 4 produits : photo + nom + prix
- CTA "Voir toute la boutique"

### Section 5 — Processus (How It Works)
- 4 étapes : Choisir → Mesurer → Commander → Recevoir
- Icônes simples, fond gris clair

### Section 6 — Témoignages
- 3-4 avis clients avec étoiles
- Score global + lien Google Reviews

### Section 7 — À propos
- Photo de l'atelier / équipe
- Texte : histoire, valeurs, expertise
- Stat : "X années d'expérience · X réalisations · X clients satisfaits"

### Section 8 — Instagram Feed
- Grille 6 photos récentes @lesarts
- CTA "Nous suivre sur Instagram"

### Section 9 — Contact + Newsletter
- Formulaire de contact
- Carte Google Maps intégrée
- Horaires d'ouverture
- Inscription newsletter

### Footer
- Liens légaux (CGV, mentions légales, RGPD)
- Logos paiement : Bancontact · Mastercard · Visa
- Réseaux sociaux

## Design System

```
Couleurs :
  --color-bg:       #FFFFFF
  --color-surface:  #F5F5F2
  --color-text:     #1A1A1A
  --color-text-2:   #5C5C5C
  --color-accent:   #C4996C
  --color-accent-2: #8B6343

Typographie :
  --font-display:   'DM Sans', sans-serif (700, 600)
  --font-body:      'DM Sans', sans-serif (400, 500)
  --scale-base:     1rem
  --scale-ratio:    1.250 (desktop) / 1.125 (mobile)

Espacement : multiples de 8px (8, 16, 24, 32, 48, 64, 80, 96, 128px)
Grid : 12 col desktop / 8 col tablet / 4 col mobile
```

## Animations (GSAP)

- Fade-in + translateY des sections au scroll (ScrollTrigger)
- Hover cards produits : légère élévation + shadow
- Filtre galerie : flip animation (GSAP Flip)
- Compteurs animés pour les stats (ScrollTrigger onEnter)
- Navigation : underline slide sur hover

---

---

# VARIANTE 2 — "Minimaliste & Chic"

> **Inspiration :** olivervdb.com (typographie éditoriale, whitespace généreux) · The Brixton Framers · Galeries d'art contemporain  
> **Positionnement :** Luxe sobre, galerie d'art fine, encadrement haut de gamme, clientèle collectionneurs et institutions

## Analyse des références

**olivervdb.com** — Monochrome, très typographique. Titre hero en serif display avec jeu de ponctuation ("Shopping * Concepts"). Whitespace extrêmement généreux. Navigation minimaliste. Sections espacées, aérées. Editorial Swiss-style. Signature : accent typographique (astérisque).

**The Brixton Framers** — Minimal, photos en N&B ou tons neutres, peu de texte, beaucoup d'espace.

**Problème à éviter :** Le minimalisme ne doit pas vider le site de son contenu. Chaque élément qui reste doit être parfait.

## Direction créative

- **Palette :** Blanc pur `#FFFFFF` + noir `#0A0A0A` + un seul accent très discret `#D4B896` (or pâle, utilisé avec parcimonie)
- **Typographie :** Serif élégant pour les titres (ex. Cormorant Garamond ou Playfair Display), sans-serif fin pour le body (ex. Inter Light)
- **Ratio typographique :** 1.333 (Perfect Fourth) sur desktop — hiérarchie très prononcée
- **Ton :** Silencieux, contemplatif · "L'art mérite un écrin parfait"
- **Signature visuelle :** Grandes marges, texte aligné sur une grille stricte, ponctuation décorative (em dash, guillemets typographiques)
- **Photos :** N&B ou tons très désaturés, jamais de couleurs saturées dans les visuels

## Structure des pages (one-pager)

### Header / Navigation
- Logo textuel "Les Arts" en serif, très petit, en haut à gauche
- Menu horizontal ultra-minimal : Galerie · Encadrement · Atelier · Contact
- Pas de CTA dans la nav — le site est la démonstration

### Section 1 — Hero
- Fond blanc, pas de photo de fond
- Grande citation typographique en 2 lignes :  
  `L'art de cadrer —`  
  `le monde.`
- Sous-titre minuscule : "Galerie & atelier d'encadrement · Bruxelles"
- Scroll indicator : un simple trait vertical animé
- Pas de CTA hero — la page invite à descendre

### Section 2 — Galerie (statement)
- 2-3 grandes photos pleine largeur qui se succèdent verticalement
- Légende minimaliste en bas à droite : "Huile sur toile · Cadre chêne blanc · 2024"
- Pas de grille — photos respirent seules

### Section 3 — Services
- Liste typographique simple :
  ```
  01 — Encadrement sur mesure
  02 — Conservation & restauration
  03 — Galerie & exposition
  04 — Conseils artistiques
  ```
- Chaque item se développe au clic (accordion discret)
- Fond blanc, texte noir, ratio typographique fort

### Section 4 — Le processus
- Layout horizontal scrollable (une étape par "carte" sans fond)
- Texte seul, pas d'icônes
- Titre : "De l'œuvre au mur en 4 étapes"

### Section 5 — Réalisations
- Grille asymétrique 2 colonnes : grande photo / petite photo alternées
- Hover : titre de la pièce + matériaux en overlay blanc semi-transparent
- Filtres discrets : Tous · Peinture · Photographie · Miroir · Affiche

### Section 6 — Atelier
- Photo pleine largeur de l'atelier en N&B
- Texte court en overlay, aligné en bas à gauche
- "Un atelier ouvert, sur rendez-vous"

### Section 7 — Témoignages
- Citations longues, une par page, en grand serif italique
- Fond légèrement gris `#F8F8F8`
- Pas d'étoiles — les mots suffisent

### Section 8 — Newsletter + Contact
- Formulaire email minimaliste (un seul champ visible)
- Adresse et horaires en typographie fine
- Pas de carte Google — adresse seule

### Footer
- 2 lignes seulement : copyright · mentions légales
- Réseaux sociaux en icônes minimalistes

## Design System

```
Couleurs :
  --color-bg:       #FFFFFF
  --color-surface:  #F8F8F8
  --color-text:     #0A0A0A
  --color-text-2:   #767676
  --color-accent:   #D4B896
  (accent utilisé uniquement pour les underlines et séparateurs)

Typographie :
  --font-display:   'Cormorant Garamond', serif (300, 400, 700 italic)
  --font-body:      'Inter', sans-serif (300, 400)
  --scale-base:     1rem
  --scale-ratio:    1.333 (Perfect Fourth) desktop / 1.200 mobile
  Fluid type avec clamp() sur tous les headings

Espacement : 8px base — sections espacées à 128px–160px
Grid : 12 col avec gouttières 32px desktop
Max-width contenu : 65ch pour le corps de texte
```

## Animations (GSAP)

- Hero : révélation de texte mot par mot avec SplitText (délai 0.05s par mot)
- Images : fade-in très lent (duration 1.2s) au scroll avec léger parallaxe vertical
- Sections numérotées : le numéro compte de 0 à N en scroll (ScrollTrigger)
- Accordions services : timeline GSAP fluide (height + opacity)
- Navigation : aucun hover flashy — juste un underline qui s'étend lentement
- Cursor custom : petit cercle qui grossit sur les éléments cliquables

---

---

# VARIANTE 3 — "Frame London"

> **Inspiration directe :** framelondon.com  
> **Positionnement :** Conservation premium, musées et galeries, artisanat de haute qualité, clientèle institutions et collectionneurs avertis

## Analyse de Frame London

**Observations visuelles (captures d'écran analysées) :**
- **Logo :** `[FRAME]` entre crochets — très reconnaissable, typographie bold
- **Fond :** Crème chaud `#F5F0E8` — jamais blanc pur, toujours chaleureux
- **Navigation :** 5 items + icône panier · tout en caps · très épuré
- **Hero :** Photo pleine largeur de l'artisan au travail · texte en serif italique sur l'image
- **Testimonials :** Citation longue avec attribution institution (Whitechapel Gallery)
- **Split layout :** Photo gauche / texte droite (ou inversé) avec asymétrie assumée
- **CTA :** Boutons noirs plein avec texte blanc caps · "FRAMES" · "OUR WORK" · "LEARN MORE"
- **Bannière mid-page :** Photo pleine largeur + CTA centré "Materials and Conservation"
- **Footer :** 4 colonnes thématiques (Our Clients · Frame Editions · Latest news · Sustainability) + newsletter
- **Infos pratiques :** "By appointment only · Tue – Sat 10 – 5PM" — exclusivité assumée
- **Ton :** "Conservation framing for the museum, gallery and home"

## Direction créative

- **Palette :** Crème `#F5F0E8`, noir `#1A1816`, texte secondaire `#6B6560`, accent kaki `#8B7355`
- **Typographie :** Serif classique pour les titres (ex. EB Garamond ou Libre Baskerville), sans humaniste pour le body (ex. Lato ou Source Sans)
- **Ton :** Premium artisanal, conservation, institutions · "Conservation framing for art that matters"
- **Signature :** Fond crème chaud sur tout le site, logo entre crochets `[Les Arts]`, photos lifestyle de l'atelier

## Structure des pages (one-pager)

### Header / Navigation
- Logo `[Les Arts]` entre crochets, bold, à gauche
- Menu : GALERIE · ENCADREMENTS · À PROPOS · RESSOURCES · BOUTIQUE
- Icône panier à droite
- Fond crème, border-bottom très fine

### Section 1 — Hero
- Photo pleine largeur : artisan en train de travailler, tons chauds
- Texte overlay en bas à gauche, serif italique :  
  `"L'encadrement de conservation,`  
  `pour le musée, la galerie et la maison."`
- Pas de bouton CTA dans le hero — la photo parle

### Section 2 — Testimonial slider
- Grande citation en serif, centré :  
  `"Le meilleur encadreur de Bruxelles, sans aucun doute."`
- Attribution : nom, titre, institution
- Flèches navigation gauche/droite discrètes

### Section 3 — Explore notre gamme (split layout)
- Photo gauche : gros plan sur les moulures bois/métal
- Texte droit :
  - Titre : "Explorez notre gamme"
  - Sous-titre : "Qualité, fait main, sur mesure."
  - Texte : "Du profil bois aux boîtes métal soudées et acrylique — nos cadres sont créés pour votre art"
  - CTA : bouton noir "ENCADREMENTS"

### Section 4 — Notre travail (split layout inversé)
- Texte gauche :
  - "Notre travail exposé"
  - "Musée, galerie et maison."
  - "Découvrez nos cadres dans les grandes galeries et chez nos clients"
  - CTA : bouton noir "NOS RÉALISATIONS"
- Photo droite : œuvre encadrée accrochée dans un intérieur élégant

### Section 5 — Bannière pleine largeur
- Photo immersive : mains de l'artisan au travail (gros plan)
- Texte overlay : "Matériaux & Conservation — ce que nous faisons et comment nous le faisons"
- CTA centré : bouton blanc "EN SAVOIR PLUS"

### Section 6 — Navigation thématique (4 colonnes)
- Nos Clients | Éditions | Actualités | Durabilité
- Chaque colonne : titre + 3-4 liens texte
- Fond crème légèrement plus foncé `#EDE8DF`

### Section 7 — Newsletter
- Centre de page, fond crème
- Titre : "Restez informé"
- 3 champs : Prénom · Nom · Email
- CTA : "S'INSCRIRE À LA NEWSLETTER"

### Section 8 — Instagram
- Grille 4-6 photos · fond crème
- Lien "@lesarts"

### Footer
- Informations pratiques à gauche : "Sur rendez-vous uniquement · Mar–Sam 10h–18h"
- Adresse complète
- Email + téléphone
- Liens : CGV · Politique de confidentialité · RGPD
- CTA : "NOUS TROUVER" (carte)

## Design System

```
Couleurs :
  --color-bg:       #F5F0E8
  --color-surface:  #EDE8DF
  --color-text:     #1A1816
  --color-text-2:   #6B6560
  --color-accent:   #8B7355
  --color-btn:      #1A1816  (boutons noirs)
  --color-btn-text: #F5F0E8  (texte boutons)

Typographie :
  --font-display:   'EB Garamond', serif (400, 400 italic, 700)
  --font-body:      'Lato', sans-serif (300, 400, 700)
  --scale-ratio:    1.250 desktop / 1.125 mobile
  Fluid type avec clamp()

Boutons : fond noir · texte crème · tout en majuscules · lettre-spacing 0.1em
         padding 14px 28px · pas de border-radius (carré)

Espacement : 8px base · sections 80px–120px
Grid : 12 col desktop / 4 col mobile
```

## Animations (GSAP)

- Hero photo : légère mise à l'échelle au chargement (scale 1.05 → 1.0, duration 1.8s)
- Testimonial slider : transition horizontale douce avec GSAP
- Split layouts : image et texte arrivent de directions opposées (x: ±60px → 0)
- Bannière pleine largeur : parallaxe léger (ScrollTrigger scrub)
- Liens nav : underline qui s'étend de gauche à droite au hover
- Boutons : légère élévation (translateY -2px) + shadow au hover
- Instagram grid : fade-in en cascade avec stagger 0.1s

---

---

# Récapitulatif des agents par variante

| Étape | Agent | Variante 1 | Variante 2 | Variante 3 |
|-------|-------|-----------|-----------|-----------|
| 1 | `ux-ui-expert` | Design system belge + wireframes | Design system minimaliste + wireframes | Design system Frame London + wireframes |
| 2 | `static-web-expert` | HTML/CSS/JS complet | HTML/CSS/JS complet | HTML/CSS/JS complet |
| 3 | `animation-gsap-expert` | GSAP scroll + filtres galerie | GSAP SplitText + parallaxe lent | GSAP parallaxe + testimonials slider |
| 4 | `seo-expert` | SEO local Bruxelles + schema.org | SEO galerie d'art + Open Graph | SEO premium + structured data |
| 5 | `testing-qa-expert` | Tests fonctionnels + responsive | Tests fonctionnels + responsive | Tests fonctionnels + responsive |
| 6 | `performance-security-expert` | Audit perf + sécurité | Audit perf + sécurité | Audit perf + sécurité |

**Total agents mobilisés : 6 agents × 3 variantes = 18 passages d'agents**  
(Les étapes 4, 5, 6 de chaque variante peuvent tourner en parallèle — gain de temps ×3)

---

# Ordre de lancement recommandé

```
Phase 1 (séquentiel par variante, 3 variantes en parallèle) :
  → ux-ui-expert    ×3 (en parallèle)
  → static-web-expert ×3 (en parallèle, après UX)
  → animation-gsap-expert ×3 (en parallèle, après build)

Phase 2 (tout en parallèle) :
  → seo-expert ×3 + testing-qa-expert ×3 + performance-security-expert ×3
     (9 agents simultanés)
```

---

# Notes de différenciation

| Critère | V1 Belge | V2 Minimaliste | V3 Frame London |
|---------|---------|---------------|----------------|
| Public cible | Grand public belge | Collectionneurs, institutions | Institutions, connaisseurs |
| Langue | FR/NL bilingue | FR uniquement | FR avec option EN |
| E-commerce | Priorité haute | Présent mais discret | Boutique éditoriale |
| Photos | Colorées, lifestyle | N&B ou désaturées | Chaudes, artisanales |
| CTA | Verts/orange, fréquents | Rares, textuels | Noirs carrés, espacés |
| Trust signals | Bancontact, SSL, avis | Aucun badge | Citations d'institutions |
| Prise de RDV | Bouton visible | Formulaire épuré | "Sur rendez-vous uniquement" |
| Fond | Blanc | Blanc | Crème chaud |
