# TESTS — v0.7.0

## Corrections intégrées
- Version affichée dans l'application : **v0.7.0**.
- Version des données : **0.7.0**.
- Cache PWA/service worker : **deauville-planning-0.7.0**.
- Les assets `index.html`, CSS, JS et manifest sont versionnés en `?v=0.7.0`.
- Le service worker est enregistré avec `updateViaCache: "none"` et forcé à vérifier sa mise à jour.
- Le service worker utilise une stratégie réseau d'abord : une nouvelle version publiée est donc récupérée immédiatement quand le réseau est disponible.
- Les anciennes clés localStorage v0.2/v0.3/v0.4/v0.5 sont migrées vers la clé v0.7 afin de ne pas perdre le planning personnel existant.
- Correction définitive de la fonction de détection de conflit (suppression de la condition erronée `s.start<undefined`).

## Données
- 132 séances issues du programme officiel intégré.
- 29 contraintes issues du planning Jury « VOTRE PLANNING ».
- 0 contrainte `juryExtra` : les inaugurations de cabines de plage ne sont pas des obligations Jury.
- Les alias « American Nightmare » / « Gremlins, l’Amérique parasitée » sont conservés.

## Tests techniques
- `node --check app.js` : OK.
- `node --check sw.js` : OK.
- JSON `data.json` : valide.
- Aucune référence active à la version 0.2.0 ou 0.5.0 dans l'interface, les données ou le cache.
