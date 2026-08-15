# Estrategia de ramas y política de contribución

## Regla fundamental
**Queda terminantemente prohibido realizar commits, pushs o merges directos sobre la rama `main`.**

Todo el código debe ser introducido exclusivamente a través de Pull Requests (PR) desde ramas auxiliares (`feature/*`).

## Flujo de trabajo obligatorio
1. Crear una rama de trabajo desde `develop` (o `main` en casos de hotfix).
2. Realizar los commits en dicha rama.
3. Abrir un Pull Request hacia `develop` (o `main`).
4. Esperar la aprobación de al menos **1 (o 2)** revisores.
5. Verificar que todos los tests automatizados (CI) pasen correctamente.
6. Realizar el merge mediante el botón de "Squash and merge" o "Merge pull request" en GitHub (nunca localmente mediante `git merge`).

## Excepciones
No existen excepciones para commits directos. En caso de emergencia (hotfix crítico), se debe seguir el mismo flujo, pero la revisión puede ser aprobada por un único supervisor.

## Consecuencias del incumplimiento
Cualquier push forzado (`--force`) o merge directo sobre `main` será revertido inmediatamente y el responsable deberá justificarlo en la retrospectiva del sprint.
