#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_PATH="$ROOT_DIR/FocoJornadaIOS.xcodeproj"
SCHEME="FocoJornadaIOS"
ARCHIVE_DIR="${ARCHIVE_DIR:-$ROOT_DIR/Archives}"
MARKETING_VERSION="${MARKETING_VERSION:-1.0.0}"
CURRENT_PROJECT_VERSION="${CURRENT_PROJECT_VERSION:-1}"
DEVELOPMENT_TEAM="${DEVELOPMENT_TEAM:-}"

if [[ -z "$DEVELOPMENT_TEAM" ]]; then
  echo "Erro: define DEVELOPMENT_TEAM com o Team ID da tua conta Apple Developer." >&2
  echo "Exemplo: DEVELOPMENT_TEAM=ABCDE12345 bash ios/scripts/archive.sh" >&2
  exit 2
fi

if ! command -v xcodegen >/dev/null 2>&1; then
  echo "Erro: XcodeGen não está instalado. Instala-o antes de criar o arquivo." >&2
  exit 3
fi

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "Erro: xcodebuild não está disponível. Executa este script num Mac com Xcode." >&2
  exit 4
fi

mkdir -p "$ARCHIVE_DIR"
ARCHIVE_PATH="$ARCHIVE_DIR/FocoJornada-${MARKETING_VERSION}-${CURRENT_PROJECT_VERSION}.xcarchive"

cd "$ROOT_DIR"
xcodegen generate

xcodebuild \
  -project "$PROJECT_PATH" \
  -scheme "$SCHEME" \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE_PATH" \
  DEVELOPMENT_TEAM="$DEVELOPMENT_TEAM" \
  MARKETING_VERSION="$MARKETING_VERSION" \
  CURRENT_PROJECT_VERSION="$CURRENT_PROJECT_VERSION" \
  -allowProvisioningUpdates \
  archive

echo
echo "Arquivo criado em: $ARCHIVE_PATH"
echo "Abre o arquivo no Xcode Organizer para validar a assinatura e enviar para App Store Connect/TestFlight."
