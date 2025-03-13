// Fonction pour vérifier si nous sommes sur une page POS
function isPOSPage() {
    const url = window.location.href;
    return url.includes('/pos/ui') && url.includes('config_id=');
}

function injectScriptsHTML() {
    // Vérifier si l'élément existe déjà pour éviter les doublons
    if (document.getElementById('calc-container')) {
        console.log('La calculatrice est déjà affichée.');
        return;
    }

    // Charger le fichier HTML
    fetch(chrome.runtime.getURL('assets/html/calculatrice.html'))
        .then(response => response.text())
        .then(html => {
            // Création du conteneur

            const container = document.createElement('div');
            container.id = 'calc-container';
            container.innerHTML = html;
            container.style.position = 'absolute';
            container.style.top = '0';
            container.style.left = '0';
            container.style.right = '0';
            container.style.bottom = '0';
            //container.style.transform = 'translate(-50%, -50%)';
            //container.style.width = '400px';
            //container.style.height = '500px';
            container.style.background = '#FFFFFF';
            container.style.color = '#212529';
            container.style.padding = '0';
            container.style.zIndex = '9999';
            container.style.borderRadius = '0px';

            // Ajout container dans order-container
            orderContainer = document.querySelector('.leftpane .order-container');

            // Bouton de fermeture
            const closeButton = document.createElement('button');
            closeButton.innerText = 'Fermer';
            closeButton.setAttribute('class', 'fermer');

            closeButton.addEventListener('click', function () {
                orderContainer.removeChild(container);
            });

            // Ajout bouton dans container
            container.appendChild(closeButton);

            // Fixe parent pour container enfant
            orderContainer.style.position = 'relative'
            //document.body.appendChild(container);
            orderContainer.appendChild(container);

            // on recupere les infos X2 X3

            // Sélectionne les éléments
            const AfficherMontantTotal = document.querySelector('.order-summary .total');
            const divAfficheValeur = document.querySelector('.AfficheValeur');
            const divAfficheValeur3 = document.querySelector('.AfficheValeur .nb3');
            const montantInput = document.querySelector(".formCb .montantTotal");

            // Sélectionne les boutons
            const buttonX2 = document.querySelector(".buttonFormCalculatrice .x2");
            const buttonX3 = document.querySelector(".buttonFormCalculatrice .x3");

            // Sélectionne les éléments d'affichage
            const afficheValeur1 = document.querySelector(".AfficheValeur .nb1 p");
            const afficheValeur2 = document.querySelector(".AfficheValeur .nb2 p");
            const afficheValeur3 = document.querySelector(".AfficheValeur .nb3 p");

            // Met à jour l'input avec le montant
            if (montantInput && AfficherMontantTotal) {
                montantInput.textContent = AfficherMontantTotal.textContent;
            }

            // Fonction pour nettoyer et convertir en nombre
            function convertirMontant(montantTexte) {
                // Supprime "$", les espaces et remplace la virgule par un point
                let montantNettoye = montantTexte.replace(/[^0-9,]/g, "").replace(",", ".");
                return parseFloat(montantNettoye) || 0;
            }
            // Fonction pour répartir en échéances X2 ou X3
            function calculerEcheancier(nombreEcheances) {
                let montantTotal = convertirMontant(montantInput.textContent); // Nettoie et convertit
                let montantArrondi = Math.floor(montantTotal / nombreEcheances); // Partie entière pour tous
                let premierPaiement = montantArrondi + (montantTotal - (montantArrondi * nombreEcheances)); // Ajoute les centimes au premier
            
                let echeancier = new Array(nombreEcheances).fill(montantArrondi); // Remplit avec des nombres entiers
                echeancier[0] = premierPaiement; // Corrige le premier paiement
            
                return echeancier;
            }
            // Événements des boutons
            if (montantInput) {

                // Fonction pour formater un nombre en monnaie ($ 1 234,56)
                function formatMontant(value) {
                    return "$ " + value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }

                buttonX2.addEventListener("click", () => {
                    let echeances = calculerEcheancier(2);
                    afficheValeur1.innerHTML = formatMontant(echeances[0]);
                    afficheValeur2.innerHTML = formatMontant(echeances[1]);
                
                    divAfficheValeur3.style.display = 'none';
                    divAfficheValeur.style.display = 'block';
                });
                
                buttonX3.addEventListener("click", () => {
                    let echeances = calculerEcheancier(3);
                    afficheValeur1.innerHTML = formatMontant(echeances[0]);
                    afficheValeur2.innerHTML = formatMontant(echeances[1]);
                    afficheValeur3.innerHTML = formatMontant(echeances[2]);
                
                    divAfficheValeur3.style.display = 'block';
                    divAfficheValeur.style.display = 'block';
                });
            } else {
                console.error("L'input n'a pas été trouvé !");
            }



        })
        .catch(error => console.error('Erreur lors du chargement de la calculatrice:', error));
}


// Fonction principale d'initialisation
function initPOSCalculatrice() {
    console.log('Extension calculatrice charger');

    // Ne continuer que si nous sommes sur une page POS
    if (!isPOSPage()) {
        console.log('Page non-POS détectée, extension inactive');
        return;
    }

    console.log('Page POS détectée, activation de l\'extension calculatrice');

    // Fonction pour créer le bouton du tiroir caisse
    function createCalculatriceButton() {
        try {
            const button = document.createElement('button');
            button.className = 'control-button btn btn-light rounded-0 fw-bolder calc-button';
            button.innerHTML = '<i class="fa fa-calculator me-1" role="img" aria-label="Échéancier" title="Échéancier"></i> Calcul CB ×2 ×3';

            button.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                injectScriptsHTML();

                console.log('Extension calcul échéancier chargée');

            });

            return button;
        } catch (error) {
            console.error('Erreur lors de la création du bouton:', error);
            return null;
        }
    }

    // Fonction pour injecter le bouton
    function injectButton() {
        try {
            console.log('Tentative d\'injection du bouton calculatrice');
            // On cherche tous les conteneurs possibles
            const possibleContainers = [
                '.control-buttons',
                '.pos .control-buttons',
                '.pos-content .control-buttons',
                '.pos .buttons .control-buttons'
            ];

            console.log('Recherche des conteneurs possibles...');
            for (const selector of possibleContainers) {
                const container = document.querySelector(selector);
                if (container) {
                    console.log(`Conteneur trouvé avec le sélecteur: ${selector}`);
                    if (!document.querySelector('.calc-button')) {
                        const button = createCalculatriceButton();
                        if (button) {
                            container.appendChild(button);
                            console.log('Bouton calculatrice ajouté avec succès');
                            return true;
                        }
                    } else {
                        console.log('Le bouton existe déjà');
                        return false;
                    }
                }
            }
            console.log('Aucun conteneur trouvé pour le moment');
            return false;
        } catch (error) {
            console.error('Erreur lors de l\'injection du bouton:', error);
            return false;
        }
    }

    // Variable pour compter les tentatives
    let attempts = 0;
    const MAX_ATTEMPTS = 5; // 30 secondes maximum

    // Fonction pour vérifier périodiquement et injecter le bouton
    function checkAndInject() {
        attempts++;
        if (attempts === 1) {
            console.log('Démarrage des tentatives d\'injection...');
        }

        if (injectButton()) {
            console.log('Injection réussie, arrêt des vérifications périodiques');
            return;
        }

        if (attempts >= MAX_ATTEMPTS) {
            console.log('Nombre maximum de tentatives atteint, arrêt des vérifications');
            return;
        }

        setTimeout(checkAndInject, 1000);
    }

    // Démarrer la vérification périodique
    checkAndInject();

    // Observer les changements dans le DOM pour les nouvelles opportunités d'injection
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length && !document.querySelector('.calc-button')) {
                injectButton();
                break;
            }
        }
    });

    // Démarrer l'observation du DOM
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    console.log('Observateur DOM démarré');
}



// Démarrer l'extension
initPOSCalculatrice();