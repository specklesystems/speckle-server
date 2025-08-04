import { isTsMode } from '@/root'
import { FsMigrations } from 'knex/lib/migrations/migrate/sources/fs-migrations'

/**
 * Default FS migration source, adjusted to ignore migration file extensions - treat .js and .ts the same
 */
export class SpeckleFsMigrations extends FsMigrations {
  constructor(params: { sortDirsSeparately?: boolean; migrationDirs: string[] }) {
    super(params.migrationDirs, params.sortDirsSeparately || false, [])
    this.loadExtensions = isTsMode ? ['.ts'] : ['.js']
  }

  getMigrationName(migration: { file: string }): string {
    // Replace .ts w/ .js, if in TS mode
    const fileName = migration.file.replace(/\.ts$/, '.js')
    return fileName
  }
}
