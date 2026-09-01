# Sources et arbitrages — V2.0.0

## Sources fournies
- `0.pdf` — planning Jury CANAL+, 4 pages.
- `26-07-24-fcadguideprat-web-page-105x148-1.pdf` — Guide pratique officiel, 32 pages.

## Règles de priorité
- Le Guide pratique sert de source principale pour la liste des œuvres et les séances publiques.
- Le PDF Jury sert de source principale pour le planning fixe du Jury CANAL+, les trajets et le check-in.
- Les éléments présents dans les deux sources ne sont pas dupliqués dans le modèle : une séance publique reste une séance, tandis que son bloc Jury est une contrainte fixe séparée.

## Points à surveiller
- `The Accompanist` apparaît à 1h40 dans la liste des Premières (guide, p.22), mais le planning Jury prévoit la projection du 10 septembre de 20h00 à 21h50 (PDF Jury, p.4). V2 conserve 1h40 comme durée de l'œuvre issue de la liste des films et 20h00–21h50 comme bloc Jury fixe.
- Le programme du 13 septembre comporte des remises de prix à 11h30, 14h00 et 20h30 ; elles sont modélisées comme événements, pas comme œuvres.
- `Gremlins, l’Amérique parasitée` et `American Nightmare` sont un même workId. `Gremlins 2 : La nouvelle génération` possède un autre workId.
