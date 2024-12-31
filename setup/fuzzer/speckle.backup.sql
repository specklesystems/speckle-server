--
-- PostgreSQL database dump
--

-- Dumped from database version 14.5
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
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.users (id, suuid, "createdAt", name, bio, company, email, verified, avatar, profiles, "passwordDigest", ip) FROM stdin;
bd195995fe	541d6d57-7726-444f-a5ab-baea78144b9d	2024-12-31 15:25:51.318+00	Fuzz Test	\N	\N	fuzztest@example.org	f	\N	\N	$2b$10$EjlFakaD7KampuN3Zhf1lO5rCHK7dOizlmMDyT4Cw6JwAs7jouW.2	\N
\.


--
-- Data for Name: api_tokens; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.api_tokens (id, "tokenDigest", owner, name, "lastChars", revoked, lifespan, "createdAt", "lastUsed") FROM stdin;
d725857cc3	$2b$10$ZkJ9R8//SXclnt/3ZFQNG.c5qRJYjwM/6EbwVRSCU37PVpTa/Nt.G	bd195995fe	all	b58a5a	f	3154000000000	2024-12-31 15:26:43.130443+00	2024-12-31 15:26:43.130443+00
6d4a0f4aea	$2b$10$kcT4aItS5Hcas9ty8vPoKOodNiyCmxKSRcHAlxufR0dDzrn3wRrhG	bd195995fe	Speckle Web Manager-token	bb52ff	f	3154000000000	2024-12-31 15:25:51.924544+00	2024-12-31 15:26:43.227+00
\.


--
-- Data for Name: server_apps; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.server_apps (id, secret, name, description, "termsAndConditionsLink", logo, public, "trustByDefault", "authorId", "createdAt", "redirectUrl") FROM stdin;
spklexcel	spklexcel	Speckle Connector For Excel	The Speckle Connector For Excel. For more info, check the docs here: https://speckle.guide/user/excel.	\N	\N	t	t	\N	2024-12-31 15:20:24.17486+00	https://speckle-excel.netlify.app
explorer	explorer	Speckle Explorer	GraphiQL Playground with authentication.	\N	\N	t	t	\N	2024-12-31 15:20:24.173284+00	http://127.0.0.1:3000/explorer
sca	sca	Speckle Connector	A Speckle Desktop Connectors.	\N	\N	t	t	\N	2024-12-31 15:20:24.174077+00	http://localhost:29363
spklwebapp	spklwebapp	Speckle Web Manager	The Speckle Web Manager is your one-stop place to manage and coordinate your data.	\N	\N	t	t	\N	2024-12-31 15:20:24.173144+00	http://127.0.0.1:3000
sdm	sdm	Speckle Desktop Manager	Manages local installations of Speckle connectors, kits and everything else.	\N	\N	t	t	\N	2024-12-31 15:20:24.174147+00	speckle://account
spklpwerbi	spklpwerbi	Speckle Connector For PowerBI	The Speckle Connector For Excel. For more info check the docs here: https://speckle.guide/user/powerbi.html.	\N	\N	t	t	\N	2024-12-31 15:20:24.175225+00	https://oauth.powerbi.com/views/oauthredirect.html
spklautoma	spklautoma	Speckle Automate	Our automation platform	\N	\N	t	t	\N	2024-12-31 15:20:24.175615+00	undefined/authn/callback
\.


--
-- Data for Name: authorization_codes; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.authorization_codes (id, "appId", "userId", challenge, "createdAt", lifespan) FROM stdin;
\.


--
-- Data for Name: workspaces; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.workspaces (id, name, description, "createdAt", "updatedAt", logo, "domainBasedMembershipProtectionEnabled", "discoverabilityEnabled", "defaultLogoIndex", "defaultProjectRole", slug) FROM stdin;
\.


--
-- Data for Name: streams; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.streams (id, name, description, "isPublic", "clonedFrom", "createdAt", "updatedAt", "allowPublicComments", "isDiscoverable", "workspaceId", "regionKey") FROM stdin;
bddc34ce4b	Fuzz's First Project	Welcome to Speckle! This is your sample project, designed by Beijia Gu - feel free to do whatever you want with it!	t	\N	2024-12-31 15:25:52.271+00	2024-12-31 15:25:52.289+00	f	t	\N	\N
\.


--
-- Data for Name: automations; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.automations (id, name, "projectId", enabled, "createdAt", "updatedAt", "executionEngineAutomationId", "userId", "isTestAutomation") FROM stdin;
\.


--
-- Data for Name: automation_revisions; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.automation_revisions (id, "automationId", "createdAt", active, "userId", "publicKey") FROM stdin;
\.


--
-- Data for Name: automation_runs; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.automation_runs (id, "automationRevisionId", "createdAt", "updatedAt", status, "executionEngineRunId") FROM stdin;
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
-- Data for Name: automation_run_triggers; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.automation_run_triggers ("automationRunId", "triggeringId", "triggerType") FROM stdin;
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
-- Data for Name: blob_storage; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.blob_storage (id, "streamId", "userId", "objectKey", "fileName", "fileType", "fileSize", "uploadStatus", "uploadError", "createdAt", "fileHash") FROM stdin;
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.branches (id, "streamId", "authorId", name, description, "createdAt", "updatedAt") FROM stdin;
cc21a58628	bddc34ce4b	bd195995fe	main	default branch	2024-12-31 15:25:52.277+00	2024-12-31 15:25:52.277+00
833dcf6df1	bddc34ce4b	bd195995fe	fuzzy	\N	2024-12-31 15:26:00.401+00	2024-12-31 15:26:00.401+00
\.


--
-- Data for Name: commits; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.commits (id, "referencedObject", author, message, "createdAt", "sourceApplication", "totalChildrenCount", parents) FROM stdin;
\.


--
-- Data for Name: branch_commits; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.branch_commits ("branchId", "commitId") FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.comments (id, "streamId", "authorId", "createdAt", "updatedAt", text, screenshot, data, archived, "parentComment") FROM stdin;
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
-- Data for Name: email_verifications; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.email_verifications (id, email, "createdAt") FROM stdin;
608666d4fd018d334500	fuzztest@example.org	2024-12-31 15:25:51.356+00
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
1	000-core.js	1	2024-12-31 15:20:17.258+00
2	2020-05-29-apps.js	1	2024-12-31 15:20:17.33+00
3	20201222100048_add_sourceapp_to_commits.js	1	2024-12-31 15:20:17.332+00
4	20201222101522_add_totalchildrencount_to_commits.js	1	2024-12-31 15:20:17.335+00
5	20201223120532_add_commit_parents_simplification.js	1	2024-12-31 15:20:17.34+00
6	20201230111428_add_scopes_public_field.js	1	2024-12-31 15:20:17.342+00
7	20210225130308_add_roles_public_field.js	1	2024-12-31 15:20:17.344+00
8	20210303185834_invites.js	1	2024-12-31 15:20:17.356+00
9	20210304111614_pwdreset.js	1	2024-12-31 15:20:17.365+00
10	20210314101154_add_invitefield_to_serverinfo.js	1	2024-12-31 15:20:17.37+00
11	20210322190000_add_streamid_to_objects.js	1	2024-12-31 15:20:17.433+00
12	20210426200000-previews.js	1	2024-12-31 15:20:17.458+00
13	20210603160000_optional_user_references.js	1	2024-12-31 15:20:17.471+00
14	20210616173000_stream_activity.js	1	2024-12-31 15:20:17.486+00
15	20210701180000-webhooks.js	1	2024-12-31 15:20:17.518+00
16	20210915130000-fileuploads.js	1	2024-12-31 15:20:17.53+00
17	20211119105730_de_duplicate_users.js	1	2024-12-31 15:20:17.541+00
18	20220118181256-email-verifications.js	1	2024-12-31 15:20:17.554+00
19	20220222173000_comments.js	1	2024-12-31 15:20:17.593+00
20	20220315140000_ratelimit.js	1	2024-12-31 15:20:17.611+00
21	20220318121405_add_stream_favorites.js	1	2024-12-31 15:20:17.637+00
22	20220412150558_stream-public-comments.js	1	2024-12-31 15:20:17.64+00
23	202206030936_add_asset_storage.js	1	2024-12-31 15:20:17.649+00
24	202206231429_add_file_hash_to_blobs.js	1	2024-12-31 15:20:17.657+00
25	20220629110918_server_invites_rework.js	1	2024-12-31 15:20:17.678+00
26	20220707135553_make_users_email_not_nullable.js	1	2024-12-31 15:20:17.688+00
27	20220722092821_add_invite_token_field.js	1	2024-12-31 15:20:17.697+00
28	20220722110643_fix_comments_delete_cascade.js	1	2024-12-31 15:20:17.706+00
29	20220727091536_blobs-id-length-removal.js	1	2024-12-31 15:20:17.708+00
30	20220803104832_ts_test.js	1	2024-12-31 15:20:17.709+00
31	20220819091523_add_stream_discoverable_field.js	1	2024-12-31 15:20:17.712+00
32	20220823100915_migrate_streams_to_lower_precision_timestamps.js	1	2024-12-31 15:20:17.741+00
33	20220825082631_drop_email_verifications_used_col.js	1	2024-12-31 15:20:17.769+00
34	20220825123323_usernotificationpreferences.js	1	2024-12-31 15:20:17.78+00
35	20220829102231_add_server_access_requests_table.js	1	2024-12-31 15:20:17.792+00
36	20220921084935_fix_branch_nullability.js	1	2024-12-31 15:20:17.797+00
37	20220929141717_scheduled_tasks.js	1	2024-12-31 15:20:17.801+00
38	20221104104921_webhooks_drop_stream_fk.js	1	2024-12-31 15:20:17.803+00
39	20221122133014_add_user_onboarding_data.js	1	2024-12-31 15:20:17.805+00
40	20221213124322_migrate_more_table_precisions.js	1	2024-12-31 15:20:17.849+00
41	20230316091225_create_users_meta_table.js	1	2024-12-31 15:20:17.856+00
42	20230316132827_remove_user_is_onboarding_complete_col.js	1	2024-12-31 15:20:17.858+00
43	20230330082209_stricter_file_uploads_schema.js	1	2024-12-31 15:20:17.909+00
44	20230517122919_clean_up_invalid_stream_invites.js	1	2024-12-31 15:20:17.915+00
45	20230713094611_create_streams_meta_table.js	1	2024-12-31 15:20:17.935+00
46	20230727150957_serverGuestMode.js	1	2024-12-31 15:20:17.94+00
47	20230818075729_add_invite_server_role_support.js	1	2024-12-31 15:20:17.943+00
48	20230905162038_automations.js	1	2024-12-31 15:20:17.966+00
49	20230907131636_migrate_invites_to_lower_precision_timestamps.js	1	2024-12-31 15:20:17.986+00
50	20230912114629_automations_tables_normalization.js	1	2024-12-31 15:20:18.023+00
51	20230914071540_make_function_run_results_nullable.js	1	2024-12-31 15:20:18.028+00
52	20230919080704_add_webhook_config_timestamps.js	1	2024-12-31 15:20:18.031+00
53	20230920130032_fix_project_delete_cascade.js	1	2024-12-31 15:20:18.051+00
54	20231025100054_automation_function_name_and_logo.js	1	2024-12-31 15:20:18.056+00
55	20240109101048_create_token_resource_access_table.js	1	2024-12-31 15:20:18.073+00
56	20240304143445_rename_tables.js	1	2024-12-31 15:20:18.078+00
57	20240305120620_automate.js	1	2024-12-31 15:20:18.125+00
58	20240321092858_triggers.js	1	2024-12-31 15:20:18.161+00
59	20240404075414_revision_active.js	1	2024-12-31 15:20:18.166+00
60	20240404173455_automation_token.js	1	2024-12-31 15:20:18.2+00
61	20240507075055_add_function_run_timestamps.js	1	2024-12-31 15:20:18.21+00
62	20240507140149_add_encryption_support.js	1	2024-12-31 15:20:18.216+00
63	20240522130000_gendo.js	1	2024-12-31 15:20:18.229+00
64	20240523192300_add_is_test_automation_column.js	1	2024-12-31 15:20:18.232+00
65	20240620105859_drop_beta_tables.js	1	2024-12-31 15:20:18.242+00
66	20240621174016_workspaces.js	1	2024-12-31 15:20:18.262+00
67	20240628112300_dropCreatorId.js	1	2024-12-31 15:20:18.264+00
68	20240703084247_user-emails.js	1	2024-12-31 15:20:18.276+00
69	20240710154658_user_emails_backfill.js	1	2024-12-31 15:20:18.28+00
70	20240716094858_generalized_invite_record_resources.js	1	2024-12-31 15:20:18.283+00
71	20240716134617_migrate_to_resources_array.js	1	2024-12-31 15:20:18.295+00
72	20240801000000_logos.js	1	2024-12-31 15:20:18.297+00
73	20240802212846_cascadeDeleteWorkspaceProjects.js	1	2024-12-31 15:20:18.31+00
74	20240806160740_workspace_domains.js	1	2024-12-31 15:20:18.334+00
75	20240807174901_add_column_domainBasedMembershipProtection.js	1	2024-12-31 15:20:18.337+00
76	20240808091944_add_workspace_discovery_flag.js	1	2024-12-31 15:20:18.34+00
77	20240808140602_add_invite_updated_at.js	1	2024-12-31 15:20:18.346+00
78	20240813125251_workspaceAclWithTimestamps.js	1	2024-12-31 15:20:18.349+00
79	20240820131619_fallbackWorkspaceLogo.js	1	2024-12-31 15:20:18.351+00
80	20240910163614_add_column_defaultProjectRole.js	1	2024-12-31 15:20:18.354+00
81	20240912134548_add_workspace_slug.js	1	2024-12-31 15:20:18.366+00
82	20240926112407_copy_workspace_slug.js	1	2024-12-31 15:20:18.37+00
83	20240930141322_workspace_sso.js	1	2024-12-31 15:20:18.399+00
84	20241014092507_workspace_sso_expiration.js	1	2024-12-31 15:20:18.402+00
85	20241018132400_workspace_checkout.js	1	2024-12-31 15:20:18.436+00
86	20241031081827_create_regions_table.js	1	2024-12-31 15:20:18.442+00
87	20241101055531_project_region.js	1	2024-12-31 15:20:18.446+00
88	20241102055157_project_region_nofk.js	1	2024-12-31 15:20:18.449+00
89	20241105070219_create_workspace_regions_table.js	1	2024-12-31 15:20:18.462+00
90	20241105144301_cascade_delete_workspace_plans.js	1	2024-12-31 15:20:18.468+00
91	20241120063859_cascade_delete_checkout_session.js	1	2024-12-31 15:20:18.475+00
92	20241120140402_gendo_credits.js	1	2024-12-31 15:20:18.481+00
93	20241126084242_workspace_plan_rename.js	1	2024-12-31 15:20:18.484+00
94	20241126142602_workspace_plan_date.js	1	2024-12-31 15:20:18.485+00
95	20241128153315_workspace_creation_state.js	1	2024-12-31 15:20:18.491+00
96	20241202183039_workspace_start_trial.js	1	2024-12-31 15:20:18.493+00
97	20241203212110_cascade_delete_automations.js	1	2024-12-31 15:20:18.508+00
98	20241230115552_object_size.js	1	2024-12-31 15:20:18.51+00
99	20241230141235_object_size_backfill.js	1	2024-12-31 15:20:18.513+00
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

COPY public.objects (id, "speckleType", "totalChildrenCount", "totalChildrenCountByDepth", "createdAt", data, "streamId", "sizeBytes") FROM stdin;
\.


--
-- Data for Name: personal_api_tokens; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.personal_api_tokens ("tokenId", "userId") FROM stdin;
d725857cc3	bd195995fe
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
ce9fc7efef	$2b$10$pAAsDpjNndfRi4fs0uvCh.p5k.WVPXWfZklUgwbBtBIm6PFU0bFrS	spklwebapp	bd195995fe	2024-12-31 15:25:51.990884+00	15770000000
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
workspace:guest	An external guest member of the workspace with limited rights	workspaces	workspace_acl	50	t
workspace:admin	Has root on the workspace	workspaces	workspace_acl	1000	t
workspace:member	A regular member of the workspace	workspaces	workspace_acl	100	t
\.


--
-- Data for Name: server_acl; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.server_acl ("userId", role) FROM stdin;
bd195995fe	server:admin
\.


--
-- Data for Name: server_apps_scopes; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.server_apps_scopes ("appId", "scopeName") FROM stdin;
spklwebapp	apps:read
spklwebapp	apps:write
spklwebapp	streams:read
spklwebapp	streams:write
spklwebapp	profile:read
spklwebapp	profile:email
spklwebapp	profile:delete
spklwebapp	users:read
spklwebapp	server:stats
spklwebapp	users:email
spklwebapp	server:setup
spklwebapp	tokens:read
spklwebapp	tokens:write
spklwebapp	users:invite
spklwebapp	workspace:create
spklwebapp	workspace:update
spklwebapp	workspace:read
spklwebapp	workspace:delete
spklwebapp	workspace:billing
explorer	apps:read
explorer	apps:write
explorer	streams:read
explorer	streams:write
explorer	profile:read
explorer	profile:email
explorer	profile:delete
explorer	users:read
explorer	server:stats
explorer	users:email
sdm	streams:read
explorer	server:setup
sdm	streams:write
explorer	tokens:read
sdm	profile:read
explorer	tokens:write
sdm	profile:email
explorer	users:invite
sdm	users:read
sca	streams:read
explorer	workspace:create
sca	streams:write
sca	profile:read
sca	profile:email
explorer	workspace:update
sca	users:read
explorer	workspace:read
sca	users:invite
explorer	workspace:delete
explorer	workspace:billing
sdm	users:invite
spklexcel	streams:read
spklexcel	streams:write
spklexcel	profile:read
spklexcel	profile:email
spklexcel	users:read
spklexcel	users:invite
spklpwerbi	streams:read
spklpwerbi	profile:read
spklpwerbi	profile:email
spklpwerbi	users:read
spklpwerbi	users:invite
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
bd195995fe	bddc34ce4b	stream:owner
\.


--
-- Data for Name: stream_activity; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.stream_activity ("streamId", "time", "resourceType", "resourceId", "actionType", "userId", info, message) FROM stdin;
\N	2024-12-31 15:25:51.702927+00	user	bd195995fe	user_create	bd195995fe	{"user": {"id": "bd195995fe", "ip": null, "bio": null, "name": "Fuzz Test", "email": "fuzztest@example.org", "suuid": "541d6d57-7726-444f-a5ab-baea78144b9d", "avatar": null, "company": null, "profiles": null, "verified": false, "createdAt": "2024-12-31T15:25:51.318Z", "passwordDigest": "$2b$10$EjlFakaD7KampuN3Zhf1lO5rCHK7dOizlmMDyT4Cw6JwAs7jouW.2"}}	User created
bddc34ce4b	2024-12-31 15:25:52.2804+00	stream	bddc34ce4b	stream_create	bd195995fe	{"input": {"id": "bddc34ce4b", "name": "Rectangular Edifice", "isPublic": true, "createdAt": "2024-12-31T15:25:52.271Z", "regionKey": null, "updatedAt": "2024-12-31T15:25:52.271Z", "clonedFrom": null, "description": "", "workspaceId": null, "isDiscoverable": true, "allowPublicComments": false}}	Stream Rectangular Edifice created
bddc34ce4b	2024-12-31 15:26:00.404984+00	branch	833dcf6df1	branch_create	bd195995fe	{"branch": {"id": "833dcf6df1", "name": "fuzzy", "authorId": "bd195995fe", "streamId": "bddc34ce4b", "createdAt": "2024-12-31T15:26:00.401Z", "updatedAt": "2024-12-31T15:26:00.401Z", "description": null}}	Branch created: fuzzy (833dcf6df1)
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
6d4a0f4aea	apps:read
6d4a0f4aea	apps:write
6d4a0f4aea	streams:read
6d4a0f4aea	streams:write
6d4a0f4aea	profile:read
6d4a0f4aea	profile:email
6d4a0f4aea	profile:delete
6d4a0f4aea	users:read
6d4a0f4aea	server:stats
6d4a0f4aea	users:email
6d4a0f4aea	server:setup
6d4a0f4aea	tokens:read
6d4a0f4aea	tokens:write
6d4a0f4aea	users:invite
6d4a0f4aea	workspace:create
6d4a0f4aea	workspace:update
6d4a0f4aea	workspace:read
6d4a0f4aea	workspace:delete
6d4a0f4aea	workspace:billing
d725857cc3	streams:read
d725857cc3	streams:write
d725857cc3	profile:read
d725857cc3	profile:email
d725857cc3	users:read
d725857cc3	server:stats
d725857cc3	workspace:create
d725857cc3	workspace:update
d725857cc3	workspace:read
d725857cc3	workspace:delete
\.


--
-- Data for Name: user_emails; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.user_emails (id, email, "primary", verified, "userId", "createdAt", "updatedAt") FROM stdin;
c6c27a75d3	fuzztest@example.org	t	f	bd195995fe	2024-12-31 15:25:51.332+00	2024-12-31 15:25:51.332+00
\.


--
-- Data for Name: user_notification_preferences; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.user_notification_preferences ("userId", preferences) FROM stdin;
\.


--
-- Data for Name: user_server_app_tokens; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.user_server_app_tokens ("appId", "userId", "tokenId") FROM stdin;
spklwebapp	bd195995fe	6d4a0f4aea
\.


--
-- Data for Name: user_sso_sessions; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.user_sso_sessions ("userId", "providerId", "createdAt", "validUntil") FROM stdin;
\.


--
-- Data for Name: users_meta; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.users_meta ("userId", key, value, "createdAt", "updatedAt") FROM stdin;
bd195995fe	isOnboardingFinished	true	2024-12-31 15:25:52.382+00	2024-12-31 15:25:52.382+00
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
-- Name: knex_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: speckle
--

SELECT pg_catalog.setval('public.knex_migrations_id_seq', 99, true);


--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE SET; Schema: public; Owner: speckle
--

SELECT pg_catalog.setval('public.knex_migrations_lock_index_seq', 1, true);


--
-- Name: stream_favorites_cursor_seq; Type: SEQUENCE SET; Schema: public; Owner: speckle
--

SELECT pg_catalog.setval('public.stream_favorites_cursor_seq', 1, false);


--
-- PostgreSQL database dump complete
--

