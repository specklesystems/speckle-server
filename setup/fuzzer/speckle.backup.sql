--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4
-- Dumped by pg_dump version 17.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: api_tokens; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.api_tokens (
    id character varying(10) NOT NULL,
    "tokenDigest" character varying(255),
    owner character varying(10) NOT NULL,
    name character varying(512),
    "lastChars" character varying(6),
    revoked boolean DEFAULT false,
    lifespan bigint DEFAULT '3154000000000'::bigint,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.api_tokens OWNER TO speckle;

--
-- Name: authorization_codes; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.authorization_codes (
    id character varying(255) NOT NULL,
    "appId" character varying(255),
    "userId" character varying(255),
    challenge character varying(255) NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    lifespan bigint DEFAULT '600000'::bigint
);


ALTER TABLE public.authorization_codes OWNER TO speckle;

--
-- Name: automation_function_runs; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.automation_function_runs (
    id text NOT NULL,
    "runId" text NOT NULL,
    "functionId" text NOT NULL,
    "functionReleaseId" text NOT NULL,
    elapsed real NOT NULL,
    status text NOT NULL,
    "contextView" text,
    "statusMessage" text,
    results jsonb,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.automation_function_runs OWNER TO speckle;

--
-- Name: automation_revision_functions; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.automation_revision_functions (
    "automationRevisionId" text NOT NULL,
    "functionId" text NOT NULL,
    "functionReleaseId" text NOT NULL,
    "functionInputs" text,
    id text DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE public.automation_revision_functions OWNER TO speckle;

--
-- Name: automation_revisions; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.automation_revisions (
    id text NOT NULL,
    "automationId" text,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    active boolean DEFAULT false NOT NULL,
    "userId" text,
    "publicKey" character varying(255) NOT NULL
);


ALTER TABLE public.automation_revisions OWNER TO speckle;

--
-- Name: automation_run_triggers; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.automation_run_triggers (
    "automationRunId" text NOT NULL,
    "triggeringId" text NOT NULL,
    "triggerType" text NOT NULL
);


ALTER TABLE public.automation_run_triggers OWNER TO speckle;

--
-- Name: automation_runs; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.automation_runs (
    id text NOT NULL,
    "automationRevisionId" text NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status character varying(255) NOT NULL,
    "executionEngineRunId" text
);


ALTER TABLE public.automation_runs OWNER TO speckle;

--
-- Name: automation_tokens; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.automation_tokens (
    "automationId" text NOT NULL,
    "automateToken" text NOT NULL
);


ALTER TABLE public.automation_tokens OWNER TO speckle;

--
-- Name: automation_triggers; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.automation_triggers (
    "automationRevisionId" text NOT NULL,
    "triggerType" text NOT NULL,
    "triggeringId" text NOT NULL
);


ALTER TABLE public.automation_triggers OWNER TO speckle;

--
-- Name: automations; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.automations (
    id text NOT NULL,
    name text NOT NULL,
    "projectId" text,
    enabled boolean NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "executionEngineAutomationId" text DEFAULT ''::text,
    "userId" text,
    "isTestAutomation" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.automations OWNER TO speckle;

--
-- Name: blob_storage; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.blob_storage (
    id character varying(255) NOT NULL,
    "streamId" character varying(10) NOT NULL,
    "userId" character varying(10),
    "objectKey" character varying(255),
    "fileName" character varying(255) NOT NULL,
    "fileType" character varying(255) NOT NULL,
    "fileSize" integer,
    "uploadStatus" integer DEFAULT 0 NOT NULL,
    "uploadError" character varying(255),
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP,
    "fileHash" character varying(255)
);


ALTER TABLE public.blob_storage OWNER TO speckle;

--
-- Name: branch_commits; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.branch_commits (
    "branchId" character varying(10) NOT NULL,
    "commitId" character varying(255) NOT NULL
);


ALTER TABLE public.branch_commits OWNER TO speckle;

--
-- Name: branches; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.branches (
    id character varying(10) NOT NULL,
    "streamId" character varying(10) NOT NULL,
    "authorId" character varying(10),
    name character varying(512) NOT NULL,
    description character varying(65536),
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.branches OWNER TO speckle;

--
-- Name: comment_links; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.comment_links (
    "commentId" character varying(10),
    "resourceId" character varying(255) NOT NULL,
    "resourceType" character varying(255) NOT NULL,
    CONSTRAINT "comment_links_resourceType_check" CHECK ((("resourceType")::text = ANY ((ARRAY['stream'::character varying, 'commit'::character varying, 'object'::character varying, 'comment'::character varying])::text[])))
);


ALTER TABLE public.comment_links OWNER TO speckle;

--
-- Name: comment_views; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.comment_views (
    "commentId" character varying(10) NOT NULL,
    "userId" character varying(10) NOT NULL,
    "viewedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.comment_views OWNER TO speckle;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.comments (
    id character varying(10) NOT NULL,
    "streamId" character varying(10) NOT NULL,
    "authorId" character varying(10) NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP,
    text text,
    screenshot text,
    data jsonb,
    archived boolean DEFAULT false NOT NULL,
    "parentComment" character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.comments OWNER TO speckle;

--
-- Name: commits; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.commits (
    id character varying(10) NOT NULL,
    "referencedObject" character varying(255) NOT NULL,
    author character varying(10),
    message character varying(65536) DEFAULT 'no message'::character varying,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP,
    "sourceApplication" character varying(1024),
    "totalChildrenCount" integer,
    parents text[]
);


ALTER TABLE public.commits OWNER TO speckle;

--
-- Name: email_verifications; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.email_verifications (
    id character varying(255) NOT NULL,
    email character varying(255),
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.email_verifications OWNER TO speckle;

--
-- Name: file_uploads; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.file_uploads (
    id character varying(255) NOT NULL,
    "streamId" character varying(10),
    "branchName" character varying(255) NOT NULL,
    "userId" character varying(255) NOT NULL,
    "fileName" character varying(255) NOT NULL,
    "fileType" character varying(255) NOT NULL,
    "fileSize" integer,
    "uploadComplete" boolean DEFAULT false NOT NULL,
    "uploadDate" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP,
    "convertedStatus" integer DEFAULT 0 NOT NULL,
    "convertedLastUpdate" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP,
    "convertedMessage" character varying(255),
    "convertedCommitId" character varying(255)
);


ALTER TABLE public.file_uploads OWNER TO speckle;

--
-- Name: gendo_ai_renders; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.gendo_ai_renders (
    id text NOT NULL,
    "userId" text,
    "projectId" text,
    "modelId" text,
    "versionId" text,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "gendoGenerationId" text,
    status text NOT NULL,
    prompt text NOT NULL,
    camera jsonb NOT NULL,
    "baseImage" text NOT NULL,
    "responseImage" text
);


ALTER TABLE public.gendo_ai_renders OWNER TO speckle;

--
-- Name: gendo_user_credits; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.gendo_user_credits (
    "userId" character varying(255) NOT NULL,
    "resetDate" timestamp(3) with time zone NOT NULL,
    used integer NOT NULL
);


ALTER TABLE public.gendo_user_credits OWNER TO speckle;

--
-- Name: knex_migrations; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.knex_migrations (
    id integer NOT NULL,
    name character varying(255),
    batch integer,
    migration_time timestamp with time zone
);


ALTER TABLE public.knex_migrations OWNER TO speckle;

--
-- Name: knex_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: speckle
--

CREATE SEQUENCE public.knex_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.knex_migrations_id_seq OWNER TO speckle;

--
-- Name: knex_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: speckle
--

ALTER SEQUENCE public.knex_migrations_id_seq OWNED BY public.knex_migrations.id;


--
-- Name: knex_migrations_lock; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.knex_migrations_lock (
    index integer NOT NULL,
    is_locked integer
);


ALTER TABLE public.knex_migrations_lock OWNER TO speckle;

--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE; Schema: public; Owner: speckle
--

CREATE SEQUENCE public.knex_migrations_lock_index_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.knex_migrations_lock_index_seq OWNER TO speckle;

--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: speckle
--

ALTER SEQUENCE public.knex_migrations_lock_index_seq OWNED BY public.knex_migrations_lock.index;


--
-- Name: object_children_closure; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.object_children_closure (
    parent character varying(255) NOT NULL,
    child character varying(255) NOT NULL,
    "minDepth" integer DEFAULT 1 NOT NULL,
    "streamId" character varying(10) NOT NULL
);


ALTER TABLE public.object_children_closure OWNER TO speckle;

--
-- Name: object_preview; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.object_preview (
    "streamId" character varying(10) NOT NULL,
    "objectId" character varying(255) NOT NULL,
    "previewStatus" integer DEFAULT 0 NOT NULL,
    priority integer DEFAULT 1 NOT NULL,
    "lastUpdate" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    preview jsonb
);


ALTER TABLE public.object_preview OWNER TO speckle;

--
-- Name: objects; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.objects (
    id character varying(255) NOT NULL,
    "speckleType" character varying(1024) DEFAULT 'Base'::character varying NOT NULL,
    "totalChildrenCount" integer,
    "totalChildrenCountByDepth" jsonb,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    data jsonb,
    "streamId" character varying(10) NOT NULL
);


ALTER TABLE public.objects OWNER TO speckle;

--
-- Name: personal_api_tokens; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.personal_api_tokens (
    "tokenId" character varying(255),
    "userId" character varying(255)
);


ALTER TABLE public.personal_api_tokens OWNER TO speckle;

--
-- Name: previews; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.previews (
    id character varying(255) NOT NULL,
    data bytea
);


ALTER TABLE public.previews OWNER TO speckle;

--
-- Name: pwdreset_tokens; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.pwdreset_tokens (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    email character varying(256) NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pwdreset_tokens OWNER TO speckle;

--
-- Name: ratelimit_actions; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.ratelimit_actions (
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    action character varying(255) NOT NULL,
    source character varying(255) NOT NULL
);


ALTER TABLE public.ratelimit_actions OWNER TO speckle;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.refresh_tokens (
    id character varying(255) NOT NULL,
    "tokenDigest" character varying(255) NOT NULL,
    "appId" character varying(255),
    "userId" character varying(255),
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    lifespan bigint DEFAULT '15770000000'::bigint
);


ALTER TABLE public.refresh_tokens OWNER TO speckle;

--
-- Name: regions; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.regions (
    key character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.regions OWNER TO speckle;

--
-- Name: scheduled_tasks; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.scheduled_tasks (
    "taskName" character varying(255) NOT NULL,
    "lockExpiresAt" timestamp(3) with time zone NOT NULL
);


ALTER TABLE public.scheduled_tasks OWNER TO speckle;

--
-- Name: scopes; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.scopes (
    name character varying(512) NOT NULL,
    description character varying(512) NOT NULL,
    public boolean DEFAULT true
);


ALTER TABLE public.scopes OWNER TO speckle;

--
-- Name: server_access_requests; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.server_access_requests (
    id character varying(10) NOT NULL,
    "requesterId" character varying(10) NOT NULL,
    "resourceType" character varying(255) NOT NULL,
    "resourceId" character varying(255),
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.server_access_requests OWNER TO speckle;

--
-- Name: server_acl; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.server_acl (
    "userId" character varying(10) NOT NULL,
    role character varying(255) NOT NULL
);


ALTER TABLE public.server_acl OWNER TO speckle;

--
-- Name: server_apps; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.server_apps (
    id character varying(10) NOT NULL,
    secret character varying(10),
    name character varying(256) NOT NULL,
    description character varying(512),
    "termsAndConditionsLink" character varying(256),
    logo character varying(524288),
    public boolean DEFAULT false,
    "trustByDefault" boolean DEFAULT false,
    "authorId" character varying(255),
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "redirectUrl" character varying(100) NOT NULL
);


ALTER TABLE public.server_apps OWNER TO speckle;

--
-- Name: server_apps_scopes; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.server_apps_scopes (
    "appId" character varying(255) NOT NULL,
    "scopeName" character varying(255) NOT NULL
);


ALTER TABLE public.server_apps_scopes OWNER TO speckle;

--
-- Name: server_config; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.server_config (
    id integer DEFAULT 0 NOT NULL,
    name character varying(255) DEFAULT 'My new Speckle Server'::character varying,
    company character varying(255) DEFAULT 'Unknown Company'::character varying,
    description character varying(255) DEFAULT 'This a community deployment of a Speckle Server.'::character varying,
    "adminContact" character varying(255) DEFAULT 'n/a'::character varying,
    "termsOfService" character varying(255) DEFAULT 'n/a'::character varying,
    "canonicalUrl" character varying(255),
    completed boolean DEFAULT false,
    "inviteOnly" boolean DEFAULT false,
    "guestModeEnabled" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.server_config OWNER TO speckle;

--
-- Name: server_invites; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.server_invites (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    target character varying(256) NOT NULL,
    "inviterId" character varying(256) NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP,
    message character varying(1024),
    token character varying(256) DEFAULT ''::character varying NOT NULL,
    resource jsonb DEFAULT '{}'::jsonb NOT NULL,
    "updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.server_invites OWNER TO speckle;

--
-- Name: sso_providers; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.sso_providers (
    id text NOT NULL,
    "providerType" text NOT NULL,
    "encryptedProviderData" text NOT NULL,
    "createdAt" timestamp(3) with time zone NOT NULL,
    "updatedAt" timestamp(3) with time zone NOT NULL
);


ALTER TABLE public.sso_providers OWNER TO speckle;

--
-- Name: stream_acl; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.stream_acl (
    "userId" character varying(10) NOT NULL,
    "resourceId" character varying(10) NOT NULL,
    role character varying(255) NOT NULL
);


ALTER TABLE public.stream_acl OWNER TO speckle;

--
-- Name: stream_activity; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.stream_activity (
    "streamId" character varying(10),
    "time" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "resourceType" character varying(255),
    "resourceId" character varying(255),
    "actionType" character varying(255),
    "userId" character varying(255),
    info jsonb,
    message character varying(255)
);


ALTER TABLE public.stream_activity OWNER TO speckle;

--
-- Name: stream_commits; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.stream_commits (
    "streamId" character varying(10) NOT NULL,
    "commitId" character varying(255) NOT NULL
);


ALTER TABLE public.stream_commits OWNER TO speckle;

--
-- Name: stream_favorites; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.stream_favorites (
    "streamId" character varying(10) NOT NULL,
    "userId" character varying(10) NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP,
    cursor integer NOT NULL
);


ALTER TABLE public.stream_favorites OWNER TO speckle;

--
-- Name: stream_favorites_cursor_seq; Type: SEQUENCE; Schema: public; Owner: speckle
--

CREATE SEQUENCE public.stream_favorites_cursor_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stream_favorites_cursor_seq OWNER TO speckle;

--
-- Name: stream_favorites_cursor_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: speckle
--

ALTER SEQUENCE public.stream_favorites_cursor_seq OWNED BY public.stream_favorites.cursor;


--
-- Name: streams; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.streams (
    id character varying(10) NOT NULL,
    name character varying(512) DEFAULT 'Unnamed Stream'::character varying NOT NULL,
    description character varying(65536),
    "isPublic" boolean DEFAULT true,
    "clonedFrom" character varying(10),
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP,
    "allowPublicComments" boolean DEFAULT false,
    "isDiscoverable" boolean DEFAULT false NOT NULL,
    "workspaceId" character varying(255),
    "regionKey" text
);


ALTER TABLE public.streams OWNER TO speckle;

--
-- Name: streams_meta; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.streams_meta (
    "streamId" character varying(10) NOT NULL,
    key character varying(255) NOT NULL,
    value json,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.streams_meta OWNER TO speckle;

--
-- Name: token_resource_access; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.token_resource_access (
    "tokenId" character varying(10) NOT NULL,
    "resourceId" character varying(255) NOT NULL,
    "resourceType" character varying(255) NOT NULL
);


ALTER TABLE public.token_resource_access OWNER TO speckle;

--
-- Name: token_scopes; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.token_scopes (
    "tokenId" character varying(255) NOT NULL,
    "scopeName" character varying(255) NOT NULL
);


ALTER TABLE public.token_scopes OWNER TO speckle;

--
-- Name: user_emails; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.user_emails (
    id character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    "primary" boolean DEFAULT false,
    verified boolean DEFAULT false,
    "userId" character varying(255) NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_emails OWNER TO speckle;

--
-- Name: user_notification_preferences; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.user_notification_preferences (
    "userId" character varying(10) NOT NULL,
    preferences jsonb NOT NULL
);


ALTER TABLE public.user_notification_preferences OWNER TO speckle;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.user_roles (
    name character varying(256) NOT NULL,
    description character varying(256) NOT NULL,
    "resourceTarget" character varying(256) NOT NULL,
    "aclTableName" character varying(256) NOT NULL,
    weight integer DEFAULT 100 NOT NULL,
    public boolean DEFAULT true
);


ALTER TABLE public.user_roles OWNER TO speckle;

--
-- Name: user_server_app_tokens; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.user_server_app_tokens (
    "appId" character varying(255) NOT NULL,
    "userId" character varying(255) NOT NULL,
    "tokenId" character varying(255) NOT NULL
);


ALTER TABLE public.user_server_app_tokens OWNER TO speckle;

--
-- Name: user_sso_sessions; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.user_sso_sessions (
    "userId" character varying(255) NOT NULL,
    "providerId" character varying(255) NOT NULL,
    "createdAt" timestamp(3) with time zone NOT NULL,
    "validUntil" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_sso_sessions OWNER TO speckle;

--
-- Name: users; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.users (
    id character varying(10) NOT NULL,
    suuid character varying(255) DEFAULT gen_random_uuid(),
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP,
    name character varying(512) NOT NULL,
    bio character varying(2048),
    company character varying(512),
    email character varying(255) NOT NULL,
    verified boolean DEFAULT false,
    avatar character varying(524288),
    profiles jsonb,
    "passwordDigest" character varying(255),
    ip character varying(50)
);


ALTER TABLE public.users OWNER TO speckle;

--
-- Name: users_meta; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.users_meta (
    "userId" character varying(10) NOT NULL,
    key character varying(255) NOT NULL,
    value json,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.users_meta OWNER TO speckle;

--
-- Name: webhooks_config; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.webhooks_config (
    id character varying(255) NOT NULL,
    "streamId" character varying(10),
    url text,
    description text,
    triggers jsonb,
    secret character varying(255),
    enabled boolean DEFAULT true,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.webhooks_config OWNER TO speckle;

--
-- Name: webhooks_events; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.webhooks_events (
    id character varying(255) NOT NULL,
    "webhookId" character varying(255),
    status integer DEFAULT 0 NOT NULL,
    "statusInfo" text DEFAULT 'Pending'::text NOT NULL,
    "lastUpdate" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    payload text
);


ALTER TABLE public.webhooks_events OWNER TO speckle;

--
-- Name: workspace_acl; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.workspace_acl (
    "userId" text NOT NULL,
    "workspaceId" text NOT NULL,
    role text NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.workspace_acl OWNER TO speckle;

--
-- Name: workspace_checkout_sessions; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.workspace_checkout_sessions (
    "workspaceId" text NOT NULL,
    id text NOT NULL,
    url text NOT NULL,
    "workspacePlan" text NOT NULL,
    "paymentStatus" text NOT NULL,
    "billingInterval" text NOT NULL,
    "createdAt" timestamp(3) with time zone NOT NULL,
    "updatedAt" timestamp(3) with time zone NOT NULL
);


ALTER TABLE public.workspace_checkout_sessions OWNER TO speckle;

--
-- Name: workspace_creation_state; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.workspace_creation_state (
    "workspaceId" text NOT NULL,
    completed boolean NOT NULL,
    state jsonb NOT NULL
);


ALTER TABLE public.workspace_creation_state OWNER TO speckle;

--
-- Name: workspace_domains; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.workspace_domains (
    id text NOT NULL,
    domain text NOT NULL,
    verified boolean NOT NULL,
    "createdAt" timestamp(3) with time zone NOT NULL,
    "updatedAt" timestamp(3) with time zone NOT NULL,
    "createdByUserId" text,
    "workspaceId" text
);


ALTER TABLE public.workspace_domains OWNER TO speckle;

--
-- Name: workspace_plans; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.workspace_plans (
    "workspaceId" text NOT NULL,
    name text NOT NULL,
    status text NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.workspace_plans OWNER TO speckle;

--
-- Name: workspace_regions; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.workspace_regions (
    "workspaceId" text NOT NULL,
    "regionKey" character varying(255) NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.workspace_regions OWNER TO speckle;

--
-- Name: workspace_sso_providers; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.workspace_sso_providers (
    "workspaceId" character varying(255) NOT NULL,
    "providerId" character varying(255) NOT NULL
);


ALTER TABLE public.workspace_sso_providers OWNER TO speckle;

--
-- Name: workspace_subscriptions; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.workspace_subscriptions (
    "workspaceId" text NOT NULL,
    "createdAt" timestamp(3) with time zone NOT NULL,
    "updatedAt" timestamp(3) with time zone NOT NULL,
    "currentBillingCycleEnd" timestamp(3) with time zone NOT NULL,
    "billingInterval" text NOT NULL,
    "subscriptionData" jsonb NOT NULL
);


ALTER TABLE public.workspace_subscriptions OWNER TO speckle;

--
-- Name: workspaces; Type: TABLE; Schema: public; Owner: speckle
--

CREATE TABLE public.workspaces (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) with time zone NOT NULL,
    "updatedAt" timestamp(3) with time zone NOT NULL,
    logo text,
    "domainBasedMembershipProtectionEnabled" boolean DEFAULT false,
    "discoverabilityEnabled" boolean DEFAULT false,
    "defaultLogoIndex" integer DEFAULT 0 NOT NULL,
    "defaultProjectRole" text DEFAULT 'stream:contributor'::text NOT NULL,
    slug text DEFAULT "substring"(md5((random())::text), 0, 15) NOT NULL,
    CONSTRAINT "workspaces_defaultProjectRole_check" CHECK (("defaultProjectRole" = ANY (ARRAY['stream:reviewer'::text, 'stream:contributor'::text])))
);


ALTER TABLE public.workspaces OWNER TO speckle;

--
-- Name: knex_migrations id; Type: DEFAULT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.knex_migrations ALTER COLUMN id SET DEFAULT nextval('public.knex_migrations_id_seq'::regclass);


--
-- Name: knex_migrations_lock index; Type: DEFAULT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.knex_migrations_lock ALTER COLUMN index SET DEFAULT nextval('public.knex_migrations_lock_index_seq'::regclass);


--
-- Name: stream_favorites cursor; Type: DEFAULT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.stream_favorites ALTER COLUMN cursor SET DEFAULT nextval('public.stream_favorites_cursor_seq'::regclass);


--
-- Data for Name: api_tokens; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.api_tokens (id, "tokenDigest", owner, name, "lastChars", revoked, lifespan, "createdAt", "lastUsed") FROM stdin;
103b2cf861	$2b$10$sXlCE3EMfJ1uJbRE0B/W7.yVmq6uhbTaQk4hv9Pr1da.nb6bxKz4i	97553902db	all	f08d12	f	3154000000000	2024-12-31 18:20:52.507493+00	2024-12-31 18:20:52.507493+00
76dcc62da6	$2b$10$/ogEcKpuc4tIl7/C6Z7xSOY9UpFmg/I1LczjsE74Pu7dNI6l20oDi	97553902db	Speckle Web Manager-token	cf8995	f	3154000000000	2024-12-31 18:20:13.022497+00	2024-12-31 18:20:52.602+00
\.


--
-- Data for Name: authorization_codes; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.authorization_codes (id, "appId", "userId", challenge, "createdAt", lifespan) FROM stdin;
\.


--
-- Data for Name: automation_function_runs; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.automation_function_runs (id, "runId", "functionId", "functionReleaseId", elapsed, status, "contextView", "statusMessage", results, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: automation_revision_functions; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.automation_revision_functions ("automationRevisionId", "functionId", "functionReleaseId", "functionInputs", id) FROM stdin;
\.


--
-- Data for Name: automation_revisions; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.automation_revisions (id, "automationId", "createdAt", active, "userId", "publicKey") FROM stdin;
\.


--
-- Data for Name: automation_run_triggers; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.automation_run_triggers ("automationRunId", "triggeringId", "triggerType") FROM stdin;
\.


--
-- Data for Name: automation_runs; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.automation_runs (id, "automationRevisionId", "createdAt", "updatedAt", status, "executionEngineRunId") FROM stdin;
\.


--
-- Data for Name: automation_tokens; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.automation_tokens ("automationId", "automateToken") FROM stdin;
\.


--
-- Data for Name: automation_triggers; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.automation_triggers ("automationRevisionId", "triggerType", "triggeringId") FROM stdin;
\.


--
-- Data for Name: automations; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.automations (id, name, "projectId", enabled, "createdAt", "updatedAt", "executionEngineAutomationId", "userId", "isTestAutomation") FROM stdin;
\.


--
-- Data for Name: blob_storage; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.blob_storage (id, "streamId", "userId", "objectKey", "fileName", "fileType", "fileSize", "uploadStatus", "uploadError", "createdAt", "fileHash") FROM stdin;
\.


--
-- Data for Name: branch_commits; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.branch_commits ("branchId", "commitId") FROM stdin;
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.branches (id, "streamId", "authorId", name, description, "createdAt", "updatedAt") FROM stdin;
12d47076c2	815704124b	97553902db	main	default branch	2024-12-31 18:20:13.449+00	2024-12-31 18:20:13.449+00
eb9f7ac487	815704124b	97553902db	fuzzy	\N	2024-12-31 18:20:22.054+00	2024-12-31 18:20:22.054+00
\.


--
-- Data for Name: comment_links; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.comment_links ("commentId", "resourceId", "resourceType") FROM stdin;
\.


--
-- Data for Name: comment_views; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.comment_views ("commentId", "userId", "viewedAt") FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.comments (id, "streamId", "authorId", "createdAt", "updatedAt", text, screenshot, data, archived, "parentComment") FROM stdin;
\.


--
-- Data for Name: commits; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.commits (id, "referencedObject", author, message, "createdAt", "sourceApplication", "totalChildrenCount", parents) FROM stdin;
\.


--
-- Data for Name: email_verifications; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.email_verifications (id, email, "createdAt") FROM stdin;
26e9f15af9c55a268ff6	fuzztest@example.org	2024-12-31 18:20:12.443+00
\.


--
-- Data for Name: file_uploads; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.file_uploads (id, "streamId", "branchName", "userId", "fileName", "fileType", "fileSize", "uploadComplete", "uploadDate", "convertedStatus", "convertedLastUpdate", "convertedMessage", "convertedCommitId") FROM stdin;
\.


--
-- Data for Name: gendo_ai_renders; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.gendo_ai_renders (id, "userId", "projectId", "modelId", "versionId", "createdAt", "updatedAt", "gendoGenerationId", status, prompt, camera, "baseImage", "responseImage") FROM stdin;
\.


--
-- Data for Name: gendo_user_credits; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.gendo_user_credits ("userId", "resetDate", used) FROM stdin;
\.


--
-- Data for Name: knex_migrations; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.knex_migrations (id, name, batch, migration_time) FROM stdin;
28	000-core.js	1	2024-12-31 18:18:10.955+00
29	2020-05-29-apps.js	1	2024-12-31 18:18:11.025+00
30	20201222100048_add_sourceapp_to_commits.js	1	2024-12-31 18:18:11.028+00
31	20201222101522_add_totalchildrencount_to_commits.js	1	2024-12-31 18:18:11.032+00
32	20201223120532_add_commit_parents_simplification.js	1	2024-12-31 18:18:11.043+00
33	20201230111428_add_scopes_public_field.js	1	2024-12-31 18:18:11.047+00
34	20210225130308_add_roles_public_field.js	1	2024-12-31 18:18:11.052+00
35	20210303185834_invites.js	1	2024-12-31 18:18:11.065+00
36	20210304111614_pwdreset.js	1	2024-12-31 18:18:11.075+00
37	20210314101154_add_invitefield_to_serverinfo.js	1	2024-12-31 18:18:11.078+00
38	20210322190000_add_streamid_to_objects.js	1	2024-12-31 18:18:11.129+00
39	20210426200000-previews.js	1	2024-12-31 18:18:11.148+00
40	20210603160000_optional_user_references.js	1	2024-12-31 18:18:11.16+00
41	20210616173000_stream_activity.js	1	2024-12-31 18:18:11.169+00
42	20210701180000-webhooks.js	1	2024-12-31 18:18:11.193+00
43	20210915130000-fileuploads.js	1	2024-12-31 18:18:11.205+00
44	20211119105730_de_duplicate_users.js	1	2024-12-31 18:18:11.208+00
45	20220118181256-email-verifications.js	1	2024-12-31 18:18:11.218+00
46	20220222173000_comments.js	1	2024-12-31 18:18:11.246+00
47	20220315140000_ratelimit.js	1	2024-12-31 18:18:11.261+00
48	20220318121405_add_stream_favorites.js	1	2024-12-31 18:18:11.277+00
49	20220412150558_stream-public-comments.js	1	2024-12-31 18:18:11.28+00
50	202206030936_add_asset_storage.js	1	2024-12-31 18:18:11.286+00
51	202206231429_add_file_hash_to_blobs.js	1	2024-12-31 18:18:11.289+00
52	20220629110918_server_invites_rework.js	1	2024-12-31 18:18:11.303+00
53	20220707135553_make_users_email_not_nullable.js	1	2024-12-31 18:18:11.31+00
54	20220722092821_add_invite_token_field.js	1	2024-12-31 18:18:11.317+00
55	20220722110643_fix_comments_delete_cascade.js	1	2024-12-31 18:18:11.328+00
56	20220727091536_blobs-id-length-removal.js	1	2024-12-31 18:18:11.331+00
57	20220803104832_ts_test.js	1	2024-12-31 18:18:11.332+00
58	20220819091523_add_stream_discoverable_field.js	1	2024-12-31 18:18:11.333+00
59	20220823100915_migrate_streams_to_lower_precision_timestamps.js	1	2024-12-31 18:18:11.349+00
60	20220825082631_drop_email_verifications_used_col.js	1	2024-12-31 18:18:11.359+00
61	20220825123323_usernotificationpreferences.js	1	2024-12-31 18:18:11.367+00
62	20220829102231_add_server_access_requests_table.js	1	2024-12-31 18:18:11.379+00
63	20220921084935_fix_branch_nullability.js	1	2024-12-31 18:18:11.385+00
64	20220929141717_scheduled_tasks.js	1	2024-12-31 18:18:11.389+00
65	20221104104921_webhooks_drop_stream_fk.js	1	2024-12-31 18:18:11.392+00
66	20221122133014_add_user_onboarding_data.js	1	2024-12-31 18:18:11.394+00
67	20221213124322_migrate_more_table_precisions.js	1	2024-12-31 18:18:11.43+00
68	20230316091225_create_users_meta_table.js	1	2024-12-31 18:18:11.438+00
69	20230316132827_remove_user_is_onboarding_complete_col.js	1	2024-12-31 18:18:11.442+00
70	20230330082209_stricter_file_uploads_schema.js	1	2024-12-31 18:18:11.469+00
71	20230517122919_clean_up_invalid_stream_invites.js	1	2024-12-31 18:18:11.472+00
72	20230713094611_create_streams_meta_table.js	1	2024-12-31 18:18:11.478+00
73	20230727150957_serverGuestMode.js	1	2024-12-31 18:18:11.48+00
74	20230818075729_add_invite_server_role_support.js	1	2024-12-31 18:18:11.482+00
75	20230905162038_automations.js	1	2024-12-31 18:18:11.498+00
76	20230907131636_migrate_invites_to_lower_precision_timestamps.js	1	2024-12-31 18:18:11.511+00
77	20230912114629_automations_tables_normalization.js	1	2024-12-31 18:18:11.538+00
78	20230914071540_make_function_run_results_nullable.js	1	2024-12-31 18:18:11.542+00
79	20230919080704_add_webhook_config_timestamps.js	1	2024-12-31 18:18:11.545+00
80	20230920130032_fix_project_delete_cascade.js	1	2024-12-31 18:18:11.555+00
81	20231025100054_automation_function_name_and_logo.js	1	2024-12-31 18:18:11.557+00
82	20240109101048_create_token_resource_access_table.js	1	2024-12-31 18:18:11.565+00
83	20240304143445_rename_tables.js	1	2024-12-31 18:18:11.573+00
84	20240305120620_automate.js	1	2024-12-31 18:18:11.616+00
85	20240321092858_triggers.js	1	2024-12-31 18:18:11.65+00
86	20240404075414_revision_active.js	1	2024-12-31 18:18:11.654+00
87	20240404173455_automation_token.js	1	2024-12-31 18:18:11.686+00
88	20240507075055_add_function_run_timestamps.js	1	2024-12-31 18:18:11.691+00
89	20240507140149_add_encryption_support.js	1	2024-12-31 18:18:11.7+00
90	20240522130000_gendo.js	1	2024-12-31 18:18:11.722+00
91	20240523192300_add_is_test_automation_column.js	1	2024-12-31 18:18:11.727+00
92	20240620105859_drop_beta_tables.js	1	2024-12-31 18:18:11.743+00
93	20240621174016_workspaces.js	1	2024-12-31 18:18:11.774+00
94	20240628112300_dropCreatorId.js	1	2024-12-31 18:18:11.779+00
95	20240703084247_user-emails.js	1	2024-12-31 18:18:11.793+00
96	20240710154658_user_emails_backfill.js	1	2024-12-31 18:18:11.8+00
97	20240716094858_generalized_invite_record_resources.js	1	2024-12-31 18:18:11.805+00
98	20240716134617_migrate_to_resources_array.js	1	2024-12-31 18:18:11.82+00
99	20240801000000_logos.js	1	2024-12-31 18:18:11.824+00
100	20240802212846_cascadeDeleteWorkspaceProjects.js	1	2024-12-31 18:18:11.83+00
101	20240806160740_workspace_domains.js	1	2024-12-31 18:18:11.846+00
102	20240807174901_add_column_domainBasedMembershipProtection.js	1	2024-12-31 18:18:11.849+00
103	20240808091944_add_workspace_discovery_flag.js	1	2024-12-31 18:18:11.851+00
104	20240808140602_add_invite_updated_at.js	1	2024-12-31 18:18:11.854+00
105	20240813125251_workspaceAclWithTimestamps.js	1	2024-12-31 18:18:11.859+00
106	20240820131619_fallbackWorkspaceLogo.js	1	2024-12-31 18:18:11.861+00
107	20240910163614_add_column_defaultProjectRole.js	1	2024-12-31 18:18:11.865+00
108	20240912134548_add_workspace_slug.js	1	2024-12-31 18:18:11.875+00
109	20240926112407_copy_workspace_slug.js	1	2024-12-31 18:18:11.877+00
110	20240930141322_workspace_sso.js	1	2024-12-31 18:18:11.901+00
111	20241014092507_workspace_sso_expiration.js	1	2024-12-31 18:18:11.905+00
112	20241018132400_workspace_checkout.js	1	2024-12-31 18:18:11.928+00
113	20241031081827_create_regions_table.js	1	2024-12-31 18:18:11.938+00
114	20241101055531_project_region.js	1	2024-12-31 18:18:11.944+00
115	20241102055157_project_region_nofk.js	1	2024-12-31 18:18:11.948+00
116	20241105070219_create_workspace_regions_table.js	1	2024-12-31 18:18:11.96+00
117	20241105144301_cascade_delete_workspace_plans.js	1	2024-12-31 18:18:11.965+00
118	20241120063859_cascade_delete_checkout_session.js	1	2024-12-31 18:18:11.975+00
119	20241120140402_gendo_credits.js	1	2024-12-31 18:18:11.98+00
120	20241126084242_workspace_plan_rename.js	1	2024-12-31 18:18:11.985+00
121	20241126142602_workspace_plan_date.js	1	2024-12-31 18:18:11.99+00
122	20241128153315_workspace_creation_state.js	1	2024-12-31 18:18:12.018+00
123	20241202183039_workspace_start_trial.js	1	2024-12-31 18:18:12.02+00
124	20241203212110_cascade_delete_automations.js	1	2024-12-31 18:18:12.034+00
\.


--
-- Data for Name: knex_migrations_lock; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.knex_migrations_lock (index, is_locked) FROM stdin;
1	0
\.


--
-- Data for Name: object_children_closure; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.object_children_closure (parent, child, "minDepth", "streamId") FROM stdin;
\.


--
-- Data for Name: object_preview; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.object_preview ("streamId", "objectId", "previewStatus", priority, "lastUpdate", preview) FROM stdin;
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.objects (id, "speckleType", "totalChildrenCount", "totalChildrenCountByDepth", "createdAt", data, "streamId") FROM stdin;
\.


--
-- Data for Name: personal_api_tokens; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.personal_api_tokens ("tokenId", "userId") FROM stdin;
103b2cf861	97553902db
\.


--
-- Data for Name: previews; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.previews (id, data) FROM stdin;
\.


--
-- Data for Name: pwdreset_tokens; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.pwdreset_tokens (id, email, "createdAt") FROM stdin;
\.


--
-- Data for Name: ratelimit_actions; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.ratelimit_actions ("timestamp", action, source) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.refresh_tokens (id, "tokenDigest", "appId", "userId", "createdAt", lifespan) FROM stdin;
2ae2e16b37	$2b$10$5vBmyUXjCAcE5YEJIa6sJebJkN9ouvOJQUWvoa9vtZhuBDkXSN6KG	spklwebapp	97553902db	2024-12-31 18:20:13.099546+00	15770000000
\.


--
-- Data for Name: regions; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.regions (key, name, description, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: scheduled_tasks; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.scheduled_tasks ("taskName", "lockExpiresAt") FROM stdin;
\.


--
-- Data for Name: scopes; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.scopes (name, description, public) FROM stdin;
apps:read	See created or authorized applications.	f
apps:write	Register new applications.	f
streams:read	Read your streams, and any associated information (branches, commits, objects).	t
streams:write	Create streams on your behalf, and any associated data (branches, commits, objects).	t
profile:read	Read your profile information.	t
profile:email	Read the email address you registered with.	t
profile:delete	Delete the account with all associated data.	f
users:read	Read other users' profiles.	t
server:stats	Request server stats from the API. Only works in conjunction with a "server:admin" role.	t
users:email	Access the emails of other users.	f
server:setup	Edit server information. Note: Only server admins will be able to use this token.	f
tokens:read	Access API tokens.	f
tokens:write	Create and delete API tokens.	f
users:invite	Invite others to join this server.	f
workspace:create	Required for the creation of a workspace	t
workspace:update	Required for editing workspace information	t
workspace:read	Required for reading workspace data	t
workspace:delete	Required for deleting workspaces	t
workspace:billing	Scope for managing workspace billing	f
\.


--
-- Data for Name: server_access_requests; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.server_access_requests (id, "requesterId", "resourceType", "resourceId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: server_acl; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.server_acl ("userId", role) FROM stdin;
97553902db	server:admin
\.


--
-- Data for Name: server_apps; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.server_apps (id, secret, name, description, "termsAndConditionsLink", logo, public, "trustByDefault", "authorId", "createdAt", "redirectUrl") FROM stdin;
spklwebapp	spklwebapp	Speckle Web Manager	The Speckle Web Manager is your one-stop place to manage and coordinate your data.	\N	\N	t	t	\N	2024-12-31 18:19:22.529507+00	http://127.0.0.1:3000
spklpwerbi	spklpwerbi	Speckle Connector For PowerBI	The Speckle Connector For Excel. For more info check the docs here: https://speckle.guide/user/powerbi.html.	\N	\N	t	t	\N	2024-12-31 18:19:22.529538+00	https://oauth.powerbi.com/views/oauthredirect.html
spklexcel	spklexcel	Speckle Connector For Excel	The Speckle Connector For Excel. For more info, check the docs here: https://speckle.guide/user/excel.	\N	\N	t	t	\N	2024-12-31 18:19:22.53074+00	https://speckle-excel.netlify.app
sca	sca	Speckle Connector	A Speckle Desktop Connectors.	\N	\N	t	t	\N	2024-12-31 18:19:22.531507+00	http://localhost:29363
sdm	sdm	Speckle Desktop Manager	Manages local installations of Speckle connectors, kits and everything else.	\N	\N	t	t	\N	2024-12-31 18:19:22.529487+00	speckle://account
spklautoma	spklautoma	Speckle Automate	Our automation platform	\N	\N	t	t	\N	2024-12-31 18:19:22.531456+00	undefined/authn/callback
explorer	explorer	Speckle Explorer	GraphiQL Playground with authentication.	\N	\N	t	t	\N	2024-12-31 18:19:22.529498+00	http://127.0.0.1:3000/explorer
\.


--
-- Data for Name: server_apps_scopes; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.server_apps_scopes ("appId", "scopeName") FROM stdin;
spklpwerbi	streams:read
spklpwerbi	profile:read
spklpwerbi	profile:email
spklpwerbi	users:read
spklpwerbi	users:invite
explorer	apps:read
sdm	streams:read
explorer	apps:write
sdm	streams:write
sdm	profile:read
sdm	profile:email
sdm	users:read
spklwebapp	apps:read
explorer	streams:read
explorer	streams:write
explorer	profile:read
explorer	profile:email
explorer	profile:delete
sdm	users:invite
spklwebapp	apps:write
explorer	users:read
explorer	server:stats
explorer	users:email
explorer	server:setup
explorer	tokens:read
explorer	tokens:write
explorer	users:invite
spklwebapp	streams:read
spklwebapp	streams:write
spklwebapp	profile:read
spklwebapp	profile:email
spklwebapp	profile:delete
spklwebapp	users:read
spklwebapp	server:stats
explorer	workspace:create
spklwebapp	users:email
explorer	workspace:update
spklwebapp	server:setup
explorer	workspace:read
explorer	workspace:delete
explorer	workspace:billing
spklwebapp	tokens:read
spklwebapp	tokens:write
spklwebapp	users:invite
spklwebapp	workspace:create
spklwebapp	workspace:update
spklwebapp	workspace:read
spklwebapp	workspace:delete
spklwebapp	workspace:billing
spklexcel	streams:read
spklexcel	streams:write
spklexcel	profile:read
spklexcel	profile:email
spklexcel	users:read
spklexcel	users:invite
sca	streams:read
sca	streams:write
sca	profile:read
sca	profile:email
sca	users:read
sca	users:invite
spklautoma	profile:email
spklautoma	profile:read
spklautoma	users:read
spklautoma	tokens:write
spklautoma	streams:read
spklautoma	streams:write
\.


--
-- Data for Name: server_config; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.server_config (id, name, company, description, "adminContact", "termsOfService", "canonicalUrl", completed, "inviteOnly", "guestModeEnabled") FROM stdin;
0	My new Speckle Server	Unknown Company	This a community deployment of a Speckle Server.	n/a	n/a	\N	f	f	f
\.


--
-- Data for Name: server_invites; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.server_invites (id, target, "inviterId", "createdAt", message, token, resource, "updatedAt") FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.sso_providers (id, "providerType", "encryptedProviderData", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: stream_acl; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.stream_acl ("userId", "resourceId", role) FROM stdin;
97553902db	815704124b	stream:owner
\.


--
-- Data for Name: stream_activity; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.stream_activity ("streamId", "time", "resourceType", "resourceId", "actionType", "userId", info, message) FROM stdin;
\N	2024-12-31 18:20:12.778522+00	user	97553902db	user_create	97553902db	{"user": {"id": "97553902db", "ip": null, "bio": null, "name": "Fuzz Test", "email": "fuzztest@example.org", "suuid": "c6efe652-18c1-4a31-9f61-3c45a5e2cb23", "avatar": null, "company": null, "profiles": null, "verified": false, "createdAt": "2024-12-31T18:20:12.399Z", "passwordDigest": "$2b$10$M3DQYaqxyrc9.B2rHwEfLOi.y7u55eFvm20E1fiKF23FxhO0DEFpe"}}	User created
815704124b	2024-12-31 18:20:13.452134+00	stream	815704124b	stream_create	97553902db	{"input": {"id": "815704124b", "name": "Tall Pyramid", "isPublic": true, "createdAt": "2024-12-31T18:20:13.443Z", "regionKey": null, "updatedAt": "2024-12-31T18:20:13.443Z", "clonedFrom": null, "description": "", "workspaceId": null, "isDiscoverable": true, "allowPublicComments": false}}	Stream Tall Pyramid created
815704124b	2024-12-31 18:20:22.057942+00	branch	eb9f7ac487	branch_create	97553902db	{"branch": {"id": "eb9f7ac487", "name": "fuzzy", "authorId": "97553902db", "streamId": "815704124b", "createdAt": "2024-12-31T18:20:22.054Z", "updatedAt": "2024-12-31T18:20:22.054Z", "description": null}}	Branch created: fuzzy (eb9f7ac487)
\.


--
-- Data for Name: stream_commits; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.stream_commits ("streamId", "commitId") FROM stdin;
\.


--
-- Data for Name: stream_favorites; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.stream_favorites ("streamId", "userId", "createdAt", cursor) FROM stdin;
\.


--
-- Data for Name: streams; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.streams (id, name, description, "isPublic", "clonedFrom", "createdAt", "updatedAt", "allowPublicComments", "isDiscoverable", "workspaceId", "regionKey") FROM stdin;
815704124b	Fuzz's First Project	Welcome to Speckle! This is your sample project, designed by Beijia Gu - feel free to do whatever you want with it!	t	\N	2024-12-31 18:20:13.443+00	2024-12-31 18:20:13.463+00	f	t	\N	\N
\.


--
-- Data for Name: streams_meta; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.streams_meta ("streamId", key, value, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: token_resource_access; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.token_resource_access ("tokenId", "resourceId", "resourceType") FROM stdin;
\.


--
-- Data for Name: token_scopes; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.token_scopes ("tokenId", "scopeName") FROM stdin;
76dcc62da6	apps:read
76dcc62da6	apps:write
76dcc62da6	streams:read
76dcc62da6	streams:write
76dcc62da6	profile:read
76dcc62da6	profile:email
76dcc62da6	profile:delete
76dcc62da6	users:read
76dcc62da6	server:stats
76dcc62da6	users:email
76dcc62da6	server:setup
76dcc62da6	tokens:read
76dcc62da6	tokens:write
76dcc62da6	users:invite
76dcc62da6	workspace:create
76dcc62da6	workspace:update
76dcc62da6	workspace:read
76dcc62da6	workspace:delete
76dcc62da6	workspace:billing
103b2cf861	streams:read
103b2cf861	streams:write
103b2cf861	profile:read
103b2cf861	profile:email
103b2cf861	users:read
103b2cf861	server:stats
103b2cf861	workspace:create
103b2cf861	workspace:update
103b2cf861	workspace:read
103b2cf861	workspace:delete
\.


--
-- Data for Name: user_emails; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.user_emails (id, email, "primary", verified, "userId", "createdAt", "updatedAt") FROM stdin;
e0cb32df74	fuzztest@example.org	t	f	97553902db	2024-12-31 18:20:12.416+00	2024-12-31 18:20:12.416+00
\.


--
-- Data for Name: user_notification_preferences; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.user_notification_preferences ("userId", preferences) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.user_roles (name, description, "resourceTarget", "aclTableName", weight, public) FROM stdin;
server:admin	Holds supreme autocratic authority, not restricted by written laws, legislature, or customs.	server	server_acl	1000	f
server:user	Has normal access to the server.	server	server_acl	100	f
server:guest	Has limited access to the server.	server	server_acl	50	f
server:archived-user	No longer has access to the server.	server	server_acl	10	f
stream:owner	Owners have full access, including deletion rights & access control.	streams	stream_acl	1000	t
stream:contributor	Contributors can create new branches and commits, but they cannot edit stream details or manage collaborators.	streams	stream_acl	500	t
stream:reviewer	Reviewers can only view (read) the data from this stream.	streams	stream_acl	100	t
workspace:admin	Has root on the workspace	workspaces	workspace_acl	1000	t
workspace:member	A regular member of the workspace	workspaces	workspace_acl	100	t
workspace:guest	An external guest member of the workspace with limited rights	workspaces	workspace_acl	50	t
\.


--
-- Data for Name: user_server_app_tokens; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.user_server_app_tokens ("appId", "userId", "tokenId") FROM stdin;
spklwebapp	97553902db	76dcc62da6
\.


--
-- Data for Name: user_sso_sessions; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.user_sso_sessions ("userId", "providerId", "createdAt", "validUntil") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.users (id, suuid, "createdAt", name, bio, company, email, verified, avatar, profiles, "passwordDigest", ip) FROM stdin;
97553902db	c6efe652-18c1-4a31-9f61-3c45a5e2cb23	2024-12-31 18:20:12.399+00	Fuzz Test	\N	\N	fuzztest@example.org	f	\N	\N	$2b$10$M3DQYaqxyrc9.B2rHwEfLOi.y7u55eFvm20E1fiKF23FxhO0DEFpe	\N
\.


--
-- Data for Name: users_meta; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.users_meta ("userId", key, value, "createdAt", "updatedAt") FROM stdin;
97553902db	isOnboardingFinished	true	2024-12-31 18:20:13.547+00	2024-12-31 18:20:13.547+00
\.


--
-- Data for Name: webhooks_config; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.webhooks_config (id, "streamId", url, description, triggers, secret, enabled, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: webhooks_events; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.webhooks_events (id, "webhookId", status, "statusInfo", "lastUpdate", payload) FROM stdin;
\.


--
-- Data for Name: workspace_acl; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.workspace_acl ("userId", "workspaceId", role, "createdAt") FROM stdin;
\.


--
-- Data for Name: workspace_checkout_sessions; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.workspace_checkout_sessions ("workspaceId", id, url, "workspacePlan", "paymentStatus", "billingInterval", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: workspace_creation_state; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.workspace_creation_state ("workspaceId", completed, state) FROM stdin;
\.


--
-- Data for Name: workspace_domains; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.workspace_domains (id, domain, verified, "createdAt", "updatedAt", "createdByUserId", "workspaceId") FROM stdin;
\.


--
-- Data for Name: workspace_plans; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.workspace_plans ("workspaceId", name, status, "createdAt") FROM stdin;
\.


--
-- Data for Name: workspace_regions; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.workspace_regions ("workspaceId", "regionKey", "createdAt") FROM stdin;
\.


--
-- Data for Name: workspace_sso_providers; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.workspace_sso_providers ("workspaceId", "providerId") FROM stdin;
\.


--
-- Data for Name: workspace_subscriptions; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.workspace_subscriptions ("workspaceId", "createdAt", "updatedAt", "currentBillingCycleEnd", "billingInterval", "subscriptionData") FROM stdin;
\.


--
-- Data for Name: workspaces; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.workspaces (id, name, description, "createdAt", "updatedAt", logo, "domainBasedMembershipProtectionEnabled", "discoverabilityEnabled", "defaultLogoIndex", "defaultProjectRole", slug) FROM stdin;
\.


--
-- Name: knex_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: speckle
--

SELECT pg_catalog.setval('public.knex_migrations_id_seq', 124, true);


--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE SET; Schema: public; Owner: speckle
--

SELECT pg_catalog.setval('public.knex_migrations_lock_index_seq', 1, true);


--
-- Name: stream_favorites_cursor_seq; Type: SEQUENCE SET; Schema: public; Owner: speckle
--

SELECT pg_catalog.setval('public.stream_favorites_cursor_seq', 1, false);


--
-- Name: api_tokens api_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.api_tokens
    ADD CONSTRAINT api_tokens_pkey PRIMARY KEY (id);


--
-- Name: api_tokens api_tokens_tokendigest_unique; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.api_tokens
    ADD CONSTRAINT api_tokens_tokendigest_unique UNIQUE ("tokenDigest");


--
-- Name: authorization_codes authorization_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.authorization_codes
    ADD CONSTRAINT authorization_codes_pkey PRIMARY KEY (id);


--
-- Name: automation_function_runs automation_function_run_id_pk; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.automation_function_runs
    ADD CONSTRAINT automation_function_run_id_pk PRIMARY KEY (id);


--
-- Name: automations automation_id_pk; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.automations
    ADD CONSTRAINT automation_id_pk PRIMARY KEY (id);


--
-- Name: automation_revision_functions automation_revision_functions_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.automation_revision_functions
    ADD CONSTRAINT automation_revision_functions_pkey PRIMARY KEY (id);


--
-- Name: automation_revisions automation_revisions_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.automation_revisions
    ADD CONSTRAINT automation_revisions_pkey PRIMARY KEY (id);


--
-- Name: automation_run_triggers automation_run_triggers_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.automation_run_triggers
    ADD CONSTRAINT automation_run_triggers_pkey PRIMARY KEY ("automationRunId", "triggeringId");


--
-- Name: automation_runs automation_runs_primary; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.automation_runs
    ADD CONSTRAINT automation_runs_primary PRIMARY KEY (id);


--
-- Name: automation_tokens automation_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.automation_tokens
    ADD CONSTRAINT automation_tokens_pkey PRIMARY KEY ("automationId");


--
-- Name: automation_triggers automation_triggers_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.automation_triggers
    ADD CONSTRAINT automation_triggers_pkey PRIMARY KEY ("automationRevisionId", "triggerType", "triggeringId");


--
-- Name: blob_storage blob_storage_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.blob_storage
    ADD CONSTRAINT blob_storage_pkey PRIMARY KEY (id, "streamId");


--
-- Name: branch_commits branch_commits_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.branch_commits
    ADD CONSTRAINT branch_commits_pkey PRIMARY KEY ("branchId", "commitId");


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: branches branches_streamid_name_unique; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_streamid_name_unique UNIQUE ("streamId", name);


--
-- Name: comment_views comment_views_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.comment_views
    ADD CONSTRAINT comment_views_pkey PRIMARY KEY ("commentId", "userId");


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: commits commits_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.commits
    ADD CONSTRAINT commits_pkey PRIMARY KEY (id);


--
-- Name: email_verifications email_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_pkey PRIMARY KEY (id);


--
-- Name: file_uploads file_uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.file_uploads
    ADD CONSTRAINT file_uploads_pkey PRIMARY KEY (id);


--
-- Name: gendo_ai_renders gendo_ai_renders_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.gendo_ai_renders
    ADD CONSTRAINT gendo_ai_renders_pkey PRIMARY KEY (id);


--
-- Name: gendo_user_credits gendo_user_credits_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.gendo_user_credits
    ADD CONSTRAINT gendo_user_credits_pkey PRIMARY KEY ("userId");


--
-- Name: knex_migrations_lock knex_migrations_lock_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.knex_migrations_lock
    ADD CONSTRAINT knex_migrations_lock_pkey PRIMARY KEY (index);


--
-- Name: knex_migrations knex_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.knex_migrations
    ADD CONSTRAINT knex_migrations_pkey PRIMARY KEY (id);


--
-- Name: object_children_closure obj_parent_child_index; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.object_children_closure
    ADD CONSTRAINT obj_parent_child_index UNIQUE ("streamId", parent, child);


--
-- Name: object_preview object_preview_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.object_preview
    ADD CONSTRAINT object_preview_pkey PRIMARY KEY ("streamId", "objectId");


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY ("streamId", id);


--
-- Name: previews previews_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.previews
    ADD CONSTRAINT previews_pkey PRIMARY KEY (id);


--
-- Name: pwdreset_tokens pwdreset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.pwdreset_tokens
    ADD CONSTRAINT pwdreset_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: regions regions_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_pkey PRIMARY KEY (key);


--
-- Name: scheduled_tasks scheduled_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.scheduled_tasks
    ADD CONSTRAINT scheduled_tasks_pkey PRIMARY KEY ("taskName");


--
-- Name: scopes scopes_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.scopes
    ADD CONSTRAINT scopes_pkey PRIMARY KEY (name);


--
-- Name: server_access_requests server_access_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.server_access_requests
    ADD CONSTRAINT server_access_requests_pkey PRIMARY KEY (id);


--
-- Name: server_access_requests server_access_requests_requesterid_resourceid_resourcetype_uniq; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.server_access_requests
    ADD CONSTRAINT server_access_requests_requesterid_resourceid_resourcetype_uniq UNIQUE ("requesterId", "resourceId", "resourceType");


--
-- Name: server_acl server_acl_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.server_acl
    ADD CONSTRAINT server_acl_pkey PRIMARY KEY ("userId");


--
-- Name: server_apps server_apps_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.server_apps
    ADD CONSTRAINT server_apps_pkey PRIMARY KEY (id);


--
-- Name: server_invites server_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.server_invites
    ADD CONSTRAINT server_invites_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: stream_acl stream_acl_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.stream_acl
    ADD CONSTRAINT stream_acl_pkey PRIMARY KEY ("userId", "resourceId");


--
-- Name: stream_acl stream_acl_userid_resourceid_unique; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.stream_acl
    ADD CONSTRAINT stream_acl_userid_resourceid_unique UNIQUE ("userId", "resourceId");


--
-- Name: stream_commits stream_commits_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.stream_commits
    ADD CONSTRAINT stream_commits_pkey PRIMARY KEY ("streamId", "commitId");


--
-- Name: stream_favorites stream_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.stream_favorites
    ADD CONSTRAINT stream_favorites_pkey PRIMARY KEY ("userId", "streamId");


--
-- Name: streams_meta streams_meta_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.streams_meta
    ADD CONSTRAINT streams_meta_pkey PRIMARY KEY ("streamId", key);


--
-- Name: streams streams_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.streams
    ADD CONSTRAINT streams_pkey PRIMARY KEY (id);


--
-- Name: user_emails user_emails_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.user_emails
    ADD CONSTRAINT user_emails_pkey PRIMARY KEY (id);


--
-- Name: user_emails user_emails_userid_email_unique; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.user_emails
    ADD CONSTRAINT user_emails_userid_email_unique UNIQUE ("userId", email);


--
-- Name: user_notification_preferences user_notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.user_notification_preferences
    ADD CONSTRAINT user_notification_preferences_pkey PRIMARY KEY ("userId");


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (name);


--
-- Name: user_sso_sessions user_sso_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.user_sso_sessions
    ADD CONSTRAINT user_sso_sessions_pkey PRIMARY KEY ("userId", "providerId");


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users_meta users_meta_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.users_meta
    ADD CONSTRAINT users_meta_pkey PRIMARY KEY ("userId", key);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webhooks_config webhooks_config_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.webhooks_config
    ADD CONSTRAINT webhooks_config_pkey PRIMARY KEY (id);


--
-- Name: webhooks_events webhooks_events_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.webhooks_events
    ADD CONSTRAINT webhooks_events_pkey PRIMARY KEY (id);


--
-- Name: workspace_acl workspace_acl_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.workspace_acl
    ADD CONSTRAINT workspace_acl_pkey PRIMARY KEY ("userId", "workspaceId");


--
-- Name: workspace_checkout_sessions workspace_checkout_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.workspace_checkout_sessions
    ADD CONSTRAINT workspace_checkout_sessions_pkey PRIMARY KEY ("workspaceId");


--
-- Name: workspace_creation_state workspace_creation_state_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.workspace_creation_state
    ADD CONSTRAINT workspace_creation_state_pkey PRIMARY KEY ("workspaceId");


--
-- Name: workspace_domains workspace_domains_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.workspace_domains
    ADD CONSTRAINT workspace_domains_pkey PRIMARY KEY (id);


--
-- Name: workspace_domains workspace_domains_workspaceid_domain_unique; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.workspace_domains
    ADD CONSTRAINT workspace_domains_workspaceid_domain_unique UNIQUE ("workspaceId", domain);


--
-- Name: workspace_plans workspace_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.workspace_plans
    ADD CONSTRAINT workspace_plans_pkey PRIMARY KEY ("workspaceId");


--
-- Name: workspace_regions workspace_regions_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.workspace_regions
    ADD CONSTRAINT workspace_regions_pkey PRIMARY KEY ("workspaceId", "regionKey");


--
-- Name: workspace_sso_providers workspace_sso_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.workspace_sso_providers
    ADD CONSTRAINT workspace_sso_providers_pkey PRIMARY KEY ("workspaceId");


--
-- Name: workspace_subscriptions workspace_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.workspace_subscriptions
    ADD CONSTRAINT workspace_subscriptions_pkey PRIMARY KEY ("workspaceId");


--
-- Name: workspaces workspaces_pkey; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_pkey PRIMARY KEY (id);


--
-- Name: workspaces workspaces_slug_unique; Type: CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_slug_unique UNIQUE (slug);


--
-- Name: automation_function_runs_runid_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX automation_function_runs_runid_index ON public.automation_function_runs USING btree ("runId");


--
-- Name: automation_revisions_automationid_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX automation_revisions_automationid_index ON public.automation_revisions USING btree ("automationId");


--
-- Name: automation_run_triggers_triggertype_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX automation_run_triggers_triggertype_index ON public.automation_run_triggers USING btree ("triggerType");


--
-- Name: automations_projectid_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX automations_projectid_index ON public.automations USING btree ("projectId");


--
-- Name: comments_authorid_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX comments_authorid_index ON public.comments USING btree ("authorId");


--
-- Name: comments_streamid_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX comments_streamid_index ON public.comments USING btree ("streamId");


--
-- Name: email_verifications_email_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX email_verifications_email_index ON public.email_verifications USING btree (email);


--
-- Name: file_uploads_streamid_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX file_uploads_streamid_index ON public.file_uploads USING btree ("streamId");


--
-- Name: full_pcd_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX full_pcd_index ON public.object_children_closure USING btree ("streamId", parent, "minDepth");


--
-- Name: gendo_ai_renders_gendogenerationid_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX gendo_ai_renders_gendogenerationid_index ON public.gendo_ai_renders USING btree ("gendoGenerationId");


--
-- Name: object_children_closure_streamid_child_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX object_children_closure_streamid_child_index ON public.object_children_closure USING btree ("streamId", child);


--
-- Name: object_children_closure_streamid_mindepth_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX object_children_closure_streamid_mindepth_index ON public.object_children_closure USING btree ("streamId", "minDepth");


--
-- Name: object_children_closure_streamid_parent_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX object_children_closure_streamid_parent_index ON public.object_children_closure USING btree ("streamId", parent);


--
-- Name: object_preview_previewstatus_priority_lastupdate_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX object_preview_previewstatus_priority_lastupdate_index ON public.object_preview USING btree ("previewStatus", priority, "lastUpdate");


--
-- Name: objects_id_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX objects_id_index ON public.objects USING btree (id);


--
-- Name: objects_streamid_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX objects_streamid_index ON public.objects USING btree ("streamId");


--
-- Name: ratelimit_query_idx; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX ratelimit_query_idx ON public.ratelimit_actions USING btree (source, action, "timestamp");


--
-- Name: server_access_requests_resourcetype_resourceid_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX server_access_requests_resourcetype_resourceid_index ON public.server_access_requests USING btree ("resourceType", "resourceId");


--
-- Name: server_apps_scopes_appid_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX server_apps_scopes_appid_index ON public.server_apps_scopes USING btree ("appId");


--
-- Name: server_apps_scopes_scopename_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX server_apps_scopes_scopename_index ON public.server_apps_scopes USING btree ("scopeName");


--
-- Name: server_config_id_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX server_config_id_index ON public.server_config USING btree (id);


--
-- Name: server_invites_resource_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX server_invites_resource_index ON public.server_invites USING btree (resource);


--
-- Name: server_invites_target_resource_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX server_invites_target_resource_index ON public.server_invites USING btree (target, resource);


--
-- Name: server_invites_token_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX server_invites_token_index ON public.server_invites USING btree (token);


--
-- Name: stream_activity_resourceid_time_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX stream_activity_resourceid_time_index ON public.stream_activity USING btree ("resourceId", "time");


--
-- Name: stream_activity_streamid_time_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX stream_activity_streamid_time_index ON public.stream_activity USING btree ("streamId", "time");


--
-- Name: stream_activity_userid_time_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX stream_activity_userid_time_index ON public.stream_activity USING btree ("userId", "time");


--
-- Name: token_resource_access_tokenid_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX token_resource_access_tokenid_index ON public.token_resource_access USING btree ("tokenId");


--
-- Name: token_scope_combined_idx; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX token_scope_combined_idx ON public.token_scopes USING btree ("tokenId", "scopeName");


--
-- Name: token_scopes_scopename_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX token_scopes_scopename_index ON public.token_scopes USING btree ("scopeName");


--
-- Name: token_scopes_tokenid_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX token_scopes_tokenid_index ON public.token_scopes USING btree ("tokenId");


--
-- Name: user_server_app_tokens_appid_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX user_server_app_tokens_appid_index ON public.user_server_app_tokens USING btree ("appId");


--
-- Name: user_server_app_tokens_tokenid_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX user_server_app_tokens_tokenid_index ON public.user_server_app_tokens USING btree ("tokenId");


--
-- Name: user_server_app_tokens_userid_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX user_server_app_tokens_userid_index ON public.user_server_app_tokens USING btree ("userId");


--
-- Name: users_suuid_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX users_suuid_index ON public.users USING btree (suuid);


--
-- Name: webhooks_config_streamid_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX webhooks_config_streamid_index ON public.webhooks_config USING btree ("streamId");


--
-- Name: webhooks_events_status_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX webhooks_events_status_index ON public.webhooks_events USING btree (status);


--
-- Name: webhooks_events_webhookid_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX webhooks_events_webhookid_index ON public.webhooks_events USING btree ("webhookId");


--
-- Name: workspace_checkout_sessions_id_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX workspace_checkout_sessions_id_index ON public.workspace_checkout_sessions USING btree (id);


--
-- Name: workspace_domains_domain_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX workspace_domains_domain_index ON public.workspace_domains USING btree (domain);


--
-- Name: workspace_domains_workspaceid_index; Type: INDEX; Schema: public; Owner: speckle
--

CREATE INDEX workspace_domains_workspaceid_index ON public.workspace_domains USING btree ("workspaceId");


--
-- Name: api_tokens api_tokens_owner_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.api_tokens
    ADD CONSTRAINT api_tokens_owner_foreign FOREIGN KEY (owner) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: authorization_codes authorization_codes_appid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.authorization_codes
    ADD CONSTRAINT authorization_codes_appid_foreign FOREIGN KEY ("appId") REFERENCES public.server_apps(id) ON DELETE CASCADE;


--
-- Name: authorization_codes authorization_codes_userid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.authorization_codes
    ADD CONSTRAINT authorization_codes_userid_foreign FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: automation_function_runs automation_function_runs_runid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.automation_function_runs
    ADD CONSTRAINT automation_function_runs_runid_foreign FOREIGN KEY ("runId") REFERENCES public.automation_runs(id) ON DELETE CASCADE;


--
-- Name: automation_revision_functions automation_revision_functions_automationrevisionid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.automation_revision_functions
    ADD CONSTRAINT automation_revision_functions_automationrevisionid_foreign FOREIGN KEY ("automationRevisionId") REFERENCES public.automation_revisions(id) ON DELETE CASCADE;


--
-- Name: automation_revisions automation_revisions_automationid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.automation_revisions
    ADD CONSTRAINT automation_revisions_automationid_foreign FOREIGN KEY ("automationId") REFERENCES public.automations(id) ON DELETE CASCADE;


--
-- Name: automation_revisions automation_revisions_userid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.automation_revisions
    ADD CONSTRAINT automation_revisions_userid_foreign FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: automation_run_triggers automation_run_triggers_automationrunid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.automation_run_triggers
    ADD CONSTRAINT automation_run_triggers_automationrunid_foreign FOREIGN KEY ("automationRunId") REFERENCES public.automation_runs(id) ON DELETE CASCADE;


--
-- Name: automation_runs automation_runs_automationrevisionid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.automation_runs
    ADD CONSTRAINT automation_runs_automationrevisionid_foreign FOREIGN KEY ("automationRevisionId") REFERENCES public.automation_revisions(id) ON DELETE CASCADE;


--
-- Name: automation_tokens automation_tokens_automationid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.automation_tokens
    ADD CONSTRAINT automation_tokens_automationid_foreign FOREIGN KEY ("automationId") REFERENCES public.automations(id) ON DELETE CASCADE;


--
-- Name: automation_triggers automation_triggers_automationrevisionid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.automation_triggers
    ADD CONSTRAINT automation_triggers_automationrevisionid_foreign FOREIGN KEY ("automationRevisionId") REFERENCES public.automation_revisions(id) ON DELETE CASCADE;


--
-- Name: automations automations_projectid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.automations
    ADD CONSTRAINT automations_projectid_foreign FOREIGN KEY ("projectId") REFERENCES public.streams(id) ON DELETE CASCADE;


--
-- Name: automations automations_userid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.automations
    ADD CONSTRAINT automations_userid_foreign FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: branch_commits branch_commits_branchid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.branch_commits
    ADD CONSTRAINT branch_commits_branchid_foreign FOREIGN KEY ("branchId") REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: branch_commits branch_commits_commitid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.branch_commits
    ADD CONSTRAINT branch_commits_commitid_foreign FOREIGN KEY ("commitId") REFERENCES public.commits(id) ON DELETE CASCADE;


--
-- Name: branches branches_authorid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_authorid_foreign FOREIGN KEY ("authorId") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: branches branches_streamid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_streamid_foreign FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON DELETE CASCADE;


--
-- Name: comment_links comment_links_commentid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.comment_links
    ADD CONSTRAINT comment_links_commentid_foreign FOREIGN KEY ("commentId") REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: comment_views comment_views_commentid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.comment_views
    ADD CONSTRAINT comment_views_commentid_foreign FOREIGN KEY ("commentId") REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: comment_views comment_views_userid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.comment_views
    ADD CONSTRAINT comment_views_userid_foreign FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comments comments_authorid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_authorid_foreign FOREIGN KEY ("authorId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comments comments_parentcomment_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_parentcomment_foreign FOREIGN KEY ("parentComment") REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: comments comments_streamid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_streamid_foreign FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON DELETE CASCADE;


--
-- Name: commits commits_author_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.commits
    ADD CONSTRAINT commits_author_foreign FOREIGN KEY (author) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: file_uploads file_uploads_streamid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.file_uploads
    ADD CONSTRAINT file_uploads_streamid_foreign FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON DELETE CASCADE;


--
-- Name: gendo_ai_renders gendo_ai_renders_modelid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.gendo_ai_renders
    ADD CONSTRAINT gendo_ai_renders_modelid_foreign FOREIGN KEY ("modelId") REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: gendo_ai_renders gendo_ai_renders_projectid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.gendo_ai_renders
    ADD CONSTRAINT gendo_ai_renders_projectid_foreign FOREIGN KEY ("projectId") REFERENCES public.streams(id) ON DELETE CASCADE;


--
-- Name: gendo_ai_renders gendo_ai_renders_userid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.gendo_ai_renders
    ADD CONSTRAINT gendo_ai_renders_userid_foreign FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: gendo_ai_renders gendo_ai_renders_versionid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.gendo_ai_renders
    ADD CONSTRAINT gendo_ai_renders_versionid_foreign FOREIGN KEY ("versionId") REFERENCES public.commits(id) ON DELETE CASCADE;


--
-- Name: gendo_user_credits gendo_user_credits_userid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.gendo_user_credits
    ADD CONSTRAINT gendo_user_credits_userid_foreign FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: object_children_closure object_children_closure_streamid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.object_children_closure
    ADD CONSTRAINT object_children_closure_streamid_foreign FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON DELETE CASCADE;


--
-- Name: object_preview object_preview_streamid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.object_preview
    ADD CONSTRAINT object_preview_streamid_foreign FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON DELETE CASCADE;


--
-- Name: objects objects_streamid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.objects
    ADD CONSTRAINT objects_streamid_foreign FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON DELETE CASCADE;


--
-- Name: personal_api_tokens personal_api_tokens_tokenid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.personal_api_tokens
    ADD CONSTRAINT personal_api_tokens_tokenid_foreign FOREIGN KEY ("tokenId") REFERENCES public.api_tokens(id) ON DELETE CASCADE;


--
-- Name: personal_api_tokens personal_api_tokens_userid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.personal_api_tokens
    ADD CONSTRAINT personal_api_tokens_userid_foreign FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_appid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_appid_foreign FOREIGN KEY ("appId") REFERENCES public.server_apps(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_userid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_userid_foreign FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: server_access_requests server_access_requests_requesterid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.server_access_requests
    ADD CONSTRAINT server_access_requests_requesterid_foreign FOREIGN KEY ("requesterId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: server_acl server_acl_role_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.server_acl
    ADD CONSTRAINT server_acl_role_foreign FOREIGN KEY (role) REFERENCES public.user_roles(name) ON DELETE CASCADE;


--
-- Name: server_acl server_acl_userid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.server_acl
    ADD CONSTRAINT server_acl_userid_foreign FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: server_apps server_apps_authorid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.server_apps
    ADD CONSTRAINT server_apps_authorid_foreign FOREIGN KEY ("authorId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: server_apps_scopes server_apps_scopes_appid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.server_apps_scopes
    ADD CONSTRAINT server_apps_scopes_appid_foreign FOREIGN KEY ("appId") REFERENCES public.server_apps(id) ON DELETE CASCADE;


--
-- Name: server_apps_scopes server_apps_scopes_scopename_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.server_apps_scopes
    ADD CONSTRAINT server_apps_scopes_scopename_foreign FOREIGN KEY ("scopeName") REFERENCES public.scopes(name) ON DELETE CASCADE;


--
-- Name: server_invites server_invites_inviterid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.server_invites
    ADD CONSTRAINT server_invites_inviterid_foreign FOREIGN KEY ("inviterId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: stream_acl stream_acl_resourceid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.stream_acl
    ADD CONSTRAINT stream_acl_resourceid_foreign FOREIGN KEY ("resourceId") REFERENCES public.streams(id) ON DELETE CASCADE;


--
-- Name: stream_acl stream_acl_role_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.stream_acl
    ADD CONSTRAINT stream_acl_role_foreign FOREIGN KEY (role) REFERENCES public.user_roles(name) ON DELETE CASCADE;


--
-- Name: stream_acl stream_acl_userid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.stream_acl
    ADD CONSTRAINT stream_acl_userid_foreign FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: stream_commits stream_commits_commitid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.stream_commits
    ADD CONSTRAINT stream_commits_commitid_foreign FOREIGN KEY ("commitId") REFERENCES public.commits(id) ON DELETE CASCADE;


--
-- Name: stream_commits stream_commits_streamid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.stream_commits
    ADD CONSTRAINT stream_commits_streamid_foreign FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON DELETE CASCADE;


--
-- Name: stream_favorites stream_favorites_streamid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.stream_favorites
    ADD CONSTRAINT stream_favorites_streamid_foreign FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON DELETE CASCADE;


--
-- Name: stream_favorites stream_favorites_userid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.stream_favorites
    ADD CONSTRAINT stream_favorites_userid_foreign FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: streams streams_clonedfrom_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.streams
    ADD CONSTRAINT streams_clonedfrom_foreign FOREIGN KEY ("clonedFrom") REFERENCES public.streams(id);


--
-- Name: streams_meta streams_meta_streamid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.streams_meta
    ADD CONSTRAINT streams_meta_streamid_foreign FOREIGN KEY ("streamId") REFERENCES public.streams(id) ON DELETE CASCADE;


--
-- Name: streams streams_workspaceid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.streams
    ADD CONSTRAINT streams_workspaceid_foreign FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: token_resource_access token_resource_access_tokenid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.token_resource_access
    ADD CONSTRAINT token_resource_access_tokenid_foreign FOREIGN KEY ("tokenId") REFERENCES public.api_tokens(id) ON DELETE CASCADE;


--
-- Name: token_scopes token_scopes_scopename_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.token_scopes
    ADD CONSTRAINT token_scopes_scopename_foreign FOREIGN KEY ("scopeName") REFERENCES public.scopes(name) ON DELETE CASCADE;


--
-- Name: token_scopes token_scopes_tokenid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.token_scopes
    ADD CONSTRAINT token_scopes_tokenid_foreign FOREIGN KEY ("tokenId") REFERENCES public.api_tokens(id) ON DELETE CASCADE;


--
-- Name: user_emails user_emails_userid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.user_emails
    ADD CONSTRAINT user_emails_userid_foreign FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_notification_preferences user_notification_preferences_userid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.user_notification_preferences
    ADD CONSTRAINT user_notification_preferences_userid_foreign FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_server_app_tokens user_server_app_tokens_appid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.user_server_app_tokens
    ADD CONSTRAINT user_server_app_tokens_appid_foreign FOREIGN KEY ("appId") REFERENCES public.server_apps(id) ON DELETE CASCADE;


--
-- Name: user_server_app_tokens user_server_app_tokens_tokenid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.user_server_app_tokens
    ADD CONSTRAINT user_server_app_tokens_tokenid_foreign FOREIGN KEY ("tokenId") REFERENCES public.api_tokens(id) ON DELETE CASCADE;


--
-- Name: user_server_app_tokens user_server_app_tokens_userid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.user_server_app_tokens
    ADD CONSTRAINT user_server_app_tokens_userid_foreign FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_sso_sessions user_sso_sessions_providerid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.user_sso_sessions
    ADD CONSTRAINT user_sso_sessions_providerid_foreign FOREIGN KEY ("providerId") REFERENCES public.sso_providers(id) ON DELETE CASCADE;


--
-- Name: user_sso_sessions user_sso_sessions_userid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.user_sso_sessions
    ADD CONSTRAINT user_sso_sessions_userid_foreign FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users_meta users_meta_userid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.users_meta
    ADD CONSTRAINT users_meta_userid_foreign FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: webhooks_events webhooks_events_webhookid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.webhooks_events
    ADD CONSTRAINT webhooks_events_webhookid_foreign FOREIGN KEY ("webhookId") REFERENCES public.webhooks_config(id) ON DELETE CASCADE;


--
-- Name: workspace_acl workspace_acl_role_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.workspace_acl
    ADD CONSTRAINT workspace_acl_role_foreign FOREIGN KEY (role) REFERENCES public.user_roles(name) ON DELETE CASCADE;


--
-- Name: workspace_acl workspace_acl_userid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.workspace_acl
    ADD CONSTRAINT workspace_acl_userid_foreign FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: workspace_acl workspace_acl_workspaceid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.workspace_acl
    ADD CONSTRAINT workspace_acl_workspaceid_foreign FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: workspace_checkout_sessions workspace_checkout_sessions_workspaceid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.workspace_checkout_sessions
    ADD CONSTRAINT workspace_checkout_sessions_workspaceid_foreign FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: workspace_creation_state workspace_creation_state_workspaceid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.workspace_creation_state
    ADD CONSTRAINT workspace_creation_state_workspaceid_foreign FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: workspace_domains workspace_domains_createdbyuserid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.workspace_domains
    ADD CONSTRAINT workspace_domains_createdbyuserid_foreign FOREIGN KEY ("createdByUserId") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: workspace_domains workspace_domains_workspaceid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.workspace_domains
    ADD CONSTRAINT workspace_domains_workspaceid_foreign FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: workspace_plans workspace_plans_workspaceid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.workspace_plans
    ADD CONSTRAINT workspace_plans_workspaceid_foreign FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: workspace_regions workspace_regions_regionkey_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.workspace_regions
    ADD CONSTRAINT workspace_regions_regionkey_foreign FOREIGN KEY ("regionKey") REFERENCES public.regions(key) ON DELETE CASCADE;


--
-- Name: workspace_regions workspace_regions_workspaceid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.workspace_regions
    ADD CONSTRAINT workspace_regions_workspaceid_foreign FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: workspace_sso_providers workspace_sso_providers_providerid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.workspace_sso_providers
    ADD CONSTRAINT workspace_sso_providers_providerid_foreign FOREIGN KEY ("providerId") REFERENCES public.sso_providers(id) ON DELETE CASCADE;


--
-- Name: workspace_sso_providers workspace_sso_providers_workspaceid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.workspace_sso_providers
    ADD CONSTRAINT workspace_sso_providers_workspaceid_foreign FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: workspace_subscriptions workspace_subscriptions_workspaceid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: speckle
--

ALTER TABLE ONLY public.workspace_subscriptions
    ADD CONSTRAINT workspace_subscriptions_workspaceid_foreign FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

