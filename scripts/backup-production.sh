#!/usr/bin/env bash
set -Eeuo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
backup_dir="${BACKUP_DIR:-${project_dir}/backups/production}"
timestamp="$(date -u +%Y%m%d-%H%M%S)"
backup_file="${backup_dir}/nexo-contabil-${timestamp}.dump"

umask 077
mkdir -p "${backup_dir}"

cd "${project_dir}"
docker compose -f compose.production.yaml exec -T postgres \
  pg_dump \
  --username="${POSTGRES_USER:-nexo}" \
  --dbname="${POSTGRES_DB:-nexo_contabil}" \
  --format=custom \
  --no-owner \
  --no-privileges > "${backup_file}"

sha256sum "${backup_file}" > "${backup_file}.sha256"
pg_restore --list "${backup_file}" > /dev/null

if [[ -n "${AWS_S3_BACKUP_URI:-}" ]]; then
  aws s3 cp "${backup_file}" "${AWS_S3_BACKUP_URI%/}/$(basename "${backup_file}")" \
    --sse AES256 \
    --only-show-errors
  aws s3 cp "${backup_file}.sha256" "${AWS_S3_BACKUP_URI%/}/$(basename "${backup_file}.sha256")" \
    --sse AES256 \
    --only-show-errors
fi

printf 'Backup validado: %s\n' "${backup_file}"
