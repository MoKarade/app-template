#!/usr/bin/env bash
# Graphe de code LOCAL du dépôt (graphifyy, AST Tree-sitter) : 0 jeton, 0 clé, 0 réseau hors installation.
# Usage : scripts/graphe.sh [update | query "<question>" | affected "<symbole>" | path "A" "B" | explain "<symbole>" | god-nodes]
# Détail, limites et mesure : docs/claude/12-graphe-code.md. Sortie dans graphify-out/ (ignoré par git, jamais committé).
set -euo pipefail

VERSION="0.9.93" # épinglée : le paquet sort une version presque chaque jour
racine="$(git rev-parse --show-toplevel)"
cd "$racine" # toujours `update .` depuis la racine : un chemin absolu serait écrit dans graphify-out/.graphify_root

venv="${GRAPHE_VENV:-${XDG_CACHE_HOME:-$HOME/.cache}/graphe-venv-$VERSION}"
if [ ! -x "$venv/bin/graphify" ]; then
  python3 -m venv "$venv"
  "$venv/bin/pip" install --quiet "graphifyy[sql]==$VERSION" # [sql] : sans lui, les migrations .sql donnent 0 nœud
fi

# Coupe tout backend LLM : `label` et `cluster-only` se replient sinon sur `claude -p` (quota Claude).
export GRAPHIFY_BACKEND=none

commande="${1:-update}"
[ "$#" -gt 0 ] && shift
case "$commande" in
  update) exec "$venv/bin/graphify" update . "$@" ;;
  query | affected | path | explain | god-nodes) exec "$venv/bin/graphify" "$commande" "$@" ;;
  *) echo "usage : scripts/graphe.sh [update | query | affected | path | explain | god-nodes]" >&2; exit 2 ;;
esac
