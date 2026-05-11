# Déploiement — Clever Cloud

Ce dépôt est prêt à être hébergé sur Clever Cloud. Le workflow réplique l'UX Vercel : **1 push de branche → 1 URL preview**.

- `main` → app prod `chargemap-sandbox` (`https://chargemap-sandbox.cleverapps.io`)
- toute autre branche → `chargemap-sandbox-<slug>` (`https://chargemap-sandbox-<slug>.cleverapps.io`)
- suppression de branche → app preview supprimée automatiquement

Tout est géré par [.github/workflows/deploy.yml](.github/workflows/deploy.yml). Il faut faire le setup une seule fois côté Clever Cloud + GitHub Secrets.

## 1. Préparer l'organisation Clever Cloud

1. Se connecter sur https://console.clever-cloud.com.
2. Identifier l'organisation Chargemap (ou en créer une si pas encore fait), noter l'**ORGA_ID** (visible dans l'URL de l'orga : `…/organisations/orga_xxxxxxxx`).
3. Générer un couple **token / secret** API :
   ```bash
   npm install -g clever-tools
   clever login
   ```
   Cette commande ouvre un navigateur, puis écrit `~/.config/clever-cloud/clever-tools.json`. Récupérer les champs `token` et `secret` dans ce fichier.

## 2. Configurer les secrets GitHub

Dans le repo GitHub → **Settings → Secrets and variables → Actions**, ajouter :

| Nom               | Valeur                                       |
| ----------------- | -------------------------------------------- |
| `CLEVER_TOKEN`    | champ `token` du JSON ci-dessus              |
| `CLEVER_SECRET`   | champ `secret` du JSON ci-dessus             |
| `CLEVER_ORGA_ID` | l'ORGA_ID (format `orga_xxxxxxxx`)            |

## 3. Premier déploiement

Pousser n'importe quelle branche déclenche la création automatique de l'app sur Clever Cloud (runtime **Static Apache**, taille **nano**), avec les env vars suivantes :

| Variable                | Valeur               |
| ----------------------- | -------------------- |
| `CC_WEBROOT`            | `/.output/public`    |
| `CC_OVERRIDE_BUILDCACHE`| `/.output/public`    |
| `CC_PRE_BUILD_HOOK`     | `npm install`        |
| `CC_POST_BUILD_HOOK`    | `npm run generate`   |
| `CC_NODE_VERSION`       | `20`                 |

Le workflow appelle `clever create`, fixe les env vars, puis `clever deploy`. L'URL est `https://<app-name>.cleverapps.io`.

## 4. Domaine custom (optionnel)

Pour mapper un domaine type `sandbox.chargemap.com` sur l'app prod :

1. Dans Clever Cloud → app `chargemap-sandbox` → **Domain names** → ajouter le domaine.
2. Côté DNS Chargemap → ajouter un `CNAME` vers `<app-id>.cleverapps.io`.
3. Le TLS Let's Encrypt est provisionné automatiquement.

## 5. Workflow AB test

Pour partager une variante A/B :

1. `git checkout -b ab/variant-foo`
2. coder la variante
3. `git push origin ab/variant-foo`
4. Récupérer l'URL dans les logs de l'Action ou directement : `https://chargemap-sandbox-ab-variant-foo.cleverapps.io`
5. Une fois la décision prise, `git push origin --delete ab/variant-foo` → l'app preview est nettoyée automatiquement.

## 6. Pricing indicatif

- App nano Static Apache : ~5 €/mois par app active.
- Compter ~10-30 €/mois pour la prod + 2 à 5 previews simultanées.

## 7. Désactiver Vercel

Une fois la prod Clever Cloud validée :

1. Supprimer `vercel.json` et `.vercel/`.
2. Désactiver le projet Vercel (ou le passer en lecture seule).
3. Mettre à jour le DNS si besoin.

## Notes

- Le workflow GitHub utilise `clever-tools` en CLI. Les flags exacts peuvent varier entre les versions majeures — si une commande échoue au premier run, vérifier `clever <commande> --help` et ajuster [.github/workflows/deploy.yml](.github/workflows/deploy.yml).
- Le `.htaccess` dans `public/` est embarqué dans le build et garantit le fallback SPA (toutes les routes deep servent `index.html`).
- Le projet reste en SPA pur (`ssr: false`) — aucun runtime Node n'est utilisé côté Clever Cloud, seulement Apache pour servir les fichiers statiques.
