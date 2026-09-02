# TESTS — v0.3

Corrections de cette étape :
- Les inaugurations de cabines de plage du Guide ne sont plus considérées comme des obligations Jury.
- Le planning obligatoire provient uniquement de `VOTRE PLANNING` dans le PDF Jury.
- Les projections communes Guide/Jury ne sont pas dupliquées.
- Le swipe est attaché à l'application entière avec touch events + pointer fallback.
- Le sélecteur de date reste disponible.
- Le détail d'un créneau libre affiche de nouveau ses horaires explicites.
- Correction du bug d'affichage des durées qui produisait des nombres bruts au lieu de `HH:MM`.
- Les séances compatibles affichent titre + horaires + salle + catégorie.
- Le planning personnel reste persistant via localStorage.

- v0.4 : durée des créneaux libres calculée sur des minutes numériques, suppression du bug d'affichage en nombres bruts.
- v0.4 : bouton × du panneau rendu réellement cliquable/tactile avec gestion click + pointerup et zone tactile 44px.

- v0.5 : swipe horizontal protégé contre les mouvements verticaux et limité à exactement un changement de jour par geste.
- v0.5 : touchcancel géré pour éviter les gestes fantômes.
