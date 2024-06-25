import { Knex } from 'knex'

const AUTOMATIONS_TABLE_NAME_NEW = 'beta_automations'
const AUTOMATION_RUNS_TABLE_NAME_NEW = 'beta_automation_runs'
const AUTOMATION_FUNCTION_RUNS_TABLE_NAME_NEW = 'beta_automation_function_runs'
const AUTOMATION_FUNCTION_RUNS_RESULT_VERSIONS_TABLE_NAME_NEW =
  'beta_automation_function_runs_result_versions'

const tableNames = [
  AUTOMATION_FUNCTION_RUNS_RESULT_VERSIONS_TABLE_NAME_NEW,
  AUTOMATION_FUNCTION_RUNS_TABLE_NAME_NEW,
  AUTOMATION_RUNS_TABLE_NAME_NEW,
  AUTOMATIONS_TABLE_NAME_NEW
]

const currentBetaTableCreationScript = `
create table beta_automations
(
    "automationId"         varchar(255)                                          not null,
    "automationRevisionId" varchar(255)                                          not null,
    "automationName"       varchar(255)                                          not null,
    "projectId"            varchar(255)                                          not null
        constraint automations_projectid_foreign
            references streams
            on delete cascade,
    "modelId"              varchar(255)                                          not null
        constraint automations_modelid_foreign
            references branches
            on delete cascade,
    "createdAt"            timestamp(3) with time zone default CURRENT_TIMESTAMP not null,
    "updatedAt"            timestamp(3) with time zone default CURRENT_TIMESTAMP not null,
    "webhookId"            varchar(255)
        constraint automations_webhookid_foreign
            references webhooks_config
            on delete set null,
    constraint automations_pkey
        primary key ("automationId", "automationRevisionId")
);

create table beta_automation_runs
(
    "automationId"         varchar(255)                                          not null,
    "automationRevisionId" varchar(255)                                          not null,
    "versionId"            varchar(255)                                          not null
        constraint automation_runs_versionid_foreign
            references commits
            on delete cascade,
    "automationRunId"      varchar(255)                                          not null
        constraint automation_runs_pkey
            primary key,
    "createdAt"            timestamp(3) with time zone default CURRENT_TIMESTAMP not null,
    "updatedAt"            timestamp(3) with time zone default CURRENT_TIMESTAMP not null,
    constraint automation_runs_automationid_automationrevisionid_foreign
        foreign key ("automationId", "automationRevisionId") references beta_automations
            on delete cascade
);

create table beta_automation_function_runs
(
    "automationRunId" varchar(255)                                                not null
        constraint automation_function_runs_automationrunid_foreign
            references beta_automation_runs
            on delete cascade,
    "functionId"      varchar(255)                                                not null,
    elapsed           real                                                        not null,
    status            varchar(255)                                                not null,
    "contextView"     varchar(255),
    "statusMessage"   varchar(255),
    results           jsonb,
    "functionName"    varchar(255) default 'majestic function'::character varying not null,
    "functionLogo"    text,
    constraint automation_function_runs_pkey
        primary key ("automationRunId", "functionId")
);

create table beta_automation_function_runs_result_versions
(
    "automationRunId" varchar(255) not null,
    "functionId"      varchar(255) not null,
    "resultVersionId" varchar(255) not null
        constraint automation_function_runs_result_versions_resultversionid_foreig
            references commits
            on delete cascade,
    constraint automation_function_runs_result_versions_pkey
        primary key ("automationRunId", "functionId", "resultVersionId"),
    constraint automation_function_runs_result_versions_automationrunid_functi
        foreign key ("automationRunId", "functionId") references beta_automation_function_runs
            on delete cascade
);
`

export async function up(knex: Knex): Promise<void> {
  // Delete in order
  for (const tableName of tableNames) {
    await knex.schema.dropTableIfExists(tableName)
  }
}

export async function down(knex: Knex): Promise<void> {
  // recreate tables from script
  await knex.raw(currentBetaTableCreationScript)
}
