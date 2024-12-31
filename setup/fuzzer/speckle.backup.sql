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
3fb61f0d69	6bff2a82-30db-4d5e-b4a6-78dbb07f0b2b	2024-12-31 17:15:25.885+00	Fuzz Test	\N	\N	fuzztest@example.org	f	\N	\N	$2b$10$n9TiIOXO8PagZ8azbKyGk.fa6u2iju7mgEtDwyiBnRRZGaNLlMUQS	\N
\.


--
-- Data for Name: api_tokens; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.api_tokens (id, "tokenDigest", owner, name, "lastChars", revoked, lifespan, "createdAt", "lastUsed") FROM stdin;
314504c3d0	$2b$10$xOYgfOmq1XHXO0dPCctlk.l38qxEsyZZk4q6YstaGJFdK4RBVk5QK	3fb61f0d69	all	8b1a70	f	3154000000000	2024-12-31 17:16:19.315306+00	2024-12-31 17:16:19.315306+00
d018e9f40e	$2b$10$NNwurjMss/m8/8HV7vROIetVRWPaKgN57iPv0j92HztsritKnZU4W	3fb61f0d69	Speckle Web Manager-token	54da62	f	3154000000000	2024-12-31 17:15:26.482142+00	2024-12-31 17:17:23.802+00
\.


--
-- Data for Name: server_apps; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.server_apps (id, secret, name, description, "termsAndConditionsLink", logo, public, "trustByDefault", "authorId", "createdAt", "redirectUrl") FROM stdin;
spklexcel	spklexcel	Speckle Connector For Excel	The Speckle Connector For Excel. For more info, check the docs here: https://speckle.guide/user/excel.	\N	\N	t	t	\N	2024-12-31 17:13:26.847617+00	https://speckle-excel.netlify.app
spklwebapp	spklwebapp	Speckle Web Manager	The Speckle Web Manager is your one-stop place to manage and coordinate your data.	\N	\N	t	t	\N	2024-12-31 17:13:26.846065+00	http://127.0.0.1:3000
spklautoma	spklautoma	Speckle Automate	Our automation platform	\N	\N	t	t	\N	2024-12-31 17:13:26.848538+00	undefined/authn/callback
explorer	explorer	Speckle Explorer	GraphiQL Playground with authentication.	\N	\N	t	t	\N	2024-12-31 17:13:26.846596+00	http://127.0.0.1:3000/explorer
sdm	sdm	Speckle Desktop Manager	Manages local installations of Speckle connectors, kits and everything else.	\N	\N	t	t	\N	2024-12-31 17:13:26.847991+00	speckle://account
sca	sca	Speckle Connector	A Speckle Desktop Connectors.	\N	\N	t	t	\N	2024-12-31 17:13:26.846334+00	http://localhost:29363
spklpwerbi	spklpwerbi	Speckle Connector For PowerBI	The Speckle Connector For Excel. For more info check the docs here: https://speckle.guide/user/powerbi.html.	\N	\N	t	t	\N	2024-12-31 17:13:26.847174+00	https://oauth.powerbi.com/views/oauthredirect.html
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
47d8fd9d36	Fuzz's First Project	Welcome to Speckle! This is your sample project, designed by Beijia Gu - feel free to do whatever you want with it!	t	\N	2024-12-31 17:15:26.845+00	2024-12-31 17:15:26.872+00	f	t	\N	\N
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
c4f249efcd	47d8fd9d36	3fb61f0d69	main	default branch	2024-12-31 17:15:26.855+00	2024-12-31 17:15:26.855+00
3c4ce908af	47d8fd9d36	3fb61f0d69	fuzzy	\N	2024-12-31 17:17:23.699+00	2024-12-31 17:17:23.699+00
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
6ff3e4d864195cabc2dd	fuzztest@example.org	2024-12-31 17:15:25.924+00
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
1	000-core.js	1	2024-12-31 17:13:23.07+00
2	2020-05-29-apps.js	1	2024-12-31 17:13:23.168+00
3	20201222100048_add_sourceapp_to_commits.js	1	2024-12-31 17:13:23.177+00
4	20201222101522_add_totalchildrencount_to_commits.js	1	2024-12-31 17:13:23.18+00
5	20201223120532_add_commit_parents_simplification.js	1	2024-12-31 17:13:23.184+00
6	20201230111428_add_scopes_public_field.js	1	2024-12-31 17:13:23.185+00
7	20210225130308_add_roles_public_field.js	1	2024-12-31 17:13:23.19+00
8	20210303185834_invites.js	1	2024-12-31 17:13:23.207+00
9	20210304111614_pwdreset.js	1	2024-12-31 17:13:23.213+00
10	20210314101154_add_invitefield_to_serverinfo.js	1	2024-12-31 17:13:23.216+00
11	20210322190000_add_streamid_to_objects.js	1	2024-12-31 17:13:23.303+00
12	20210426200000-previews.js	1	2024-12-31 17:13:23.311+00
13	20210603160000_optional_user_references.js	1	2024-12-31 17:13:23.315+00
14	20210616173000_stream_activity.js	1	2024-12-31 17:13:23.322+00
15	20210701180000-webhooks.js	1	2024-12-31 17:13:23.333+00
16	20210915130000-fileuploads.js	1	2024-12-31 17:13:23.338+00
17	20211119105730_de_duplicate_users.js	1	2024-12-31 17:13:23.34+00
18	20220118181256-email-verifications.js	1	2024-12-31 17:13:23.345+00
19	20220222173000_comments.js	1	2024-12-31 17:13:23.364+00
20	20220315140000_ratelimit.js	1	2024-12-31 17:13:23.369+00
21	20220318121405_add_stream_favorites.js	1	2024-12-31 17:13:23.375+00
22	20220412150558_stream-public-comments.js	1	2024-12-31 17:13:23.376+00
23	202206030936_add_asset_storage.js	1	2024-12-31 17:13:23.381+00
24	202206231429_add_file_hash_to_blobs.js	1	2024-12-31 17:13:23.382+00
25	20220629110918_server_invites_rework.js	1	2024-12-31 17:13:23.398+00
26	20220707135553_make_users_email_not_nullable.js	1	2024-12-31 17:13:23.406+00
27	20220722092821_add_invite_token_field.js	1	2024-12-31 17:13:23.41+00
28	20220722110643_fix_comments_delete_cascade.js	1	2024-12-31 17:13:23.419+00
29	20220727091536_blobs-id-length-removal.js	1	2024-12-31 17:13:23.421+00
30	20220803104832_ts_test.js	1	2024-12-31 17:13:23.422+00
31	20220819091523_add_stream_discoverable_field.js	1	2024-12-31 17:13:23.423+00
32	20220823100915_migrate_streams_to_lower_precision_timestamps.js	1	2024-12-31 17:13:23.447+00
33	20220825082631_drop_email_verifications_used_col.js	1	2024-12-31 17:13:23.457+00
34	20220825123323_usernotificationpreferences.js	1	2024-12-31 17:13:23.461+00
35	20220829102231_add_server_access_requests_table.js	1	2024-12-31 17:13:23.468+00
36	20220921084935_fix_branch_nullability.js	1	2024-12-31 17:13:23.472+00
37	20220929141717_scheduled_tasks.js	1	2024-12-31 17:13:23.475+00
38	20221104104921_webhooks_drop_stream_fk.js	1	2024-12-31 17:13:23.476+00
39	20221122133014_add_user_onboarding_data.js	1	2024-12-31 17:13:23.477+00
40	20221213124322_migrate_more_table_precisions.js	1	2024-12-31 17:13:23.508+00
41	20230316091225_create_users_meta_table.js	1	2024-12-31 17:13:23.516+00
42	20230316132827_remove_user_is_onboarding_complete_col.js	1	2024-12-31 17:13:23.518+00
43	20230330082209_stricter_file_uploads_schema.js	1	2024-12-31 17:13:23.534+00
44	20230517122919_clean_up_invalid_stream_invites.js	1	2024-12-31 17:13:23.537+00
45	20230713094611_create_streams_meta_table.js	1	2024-12-31 17:13:23.541+00
46	20230727150957_serverGuestMode.js	1	2024-12-31 17:13:23.542+00
47	20230818075729_add_invite_server_role_support.js	1	2024-12-31 17:13:23.543+00
48	20230905162038_automations.js	1	2024-12-31 17:13:23.551+00
49	20230907131636_migrate_invites_to_lower_precision_timestamps.js	1	2024-12-31 17:13:23.56+00
50	20230912114629_automations_tables_normalization.js	1	2024-12-31 17:13:23.583+00
51	20230914071540_make_function_run_results_nullable.js	1	2024-12-31 17:13:23.586+00
52	20230919080704_add_webhook_config_timestamps.js	1	2024-12-31 17:13:23.587+00
53	20230920130032_fix_project_delete_cascade.js	1	2024-12-31 17:13:23.595+00
54	20231025100054_automation_function_name_and_logo.js	1	2024-12-31 17:13:23.596+00
55	20240109101048_create_token_resource_access_table.js	1	2024-12-31 17:13:23.601+00
56	20240304143445_rename_tables.js	1	2024-12-31 17:13:23.605+00
57	20240305120620_automate.js	1	2024-12-31 17:13:23.635+00
58	20240321092858_triggers.js	1	2024-12-31 17:13:23.656+00
59	20240404075414_revision_active.js	1	2024-12-31 17:13:23.658+00
60	20240404173455_automation_token.js	1	2024-12-31 17:13:23.674+00
61	20240507075055_add_function_run_timestamps.js	1	2024-12-31 17:13:23.676+00
62	20240507140149_add_encryption_support.js	1	2024-12-31 17:13:23.685+00
63	20240522130000_gendo.js	1	2024-12-31 17:13:23.697+00
64	20240523192300_add_is_test_automation_column.js	1	2024-12-31 17:13:23.699+00
65	20240620105859_drop_beta_tables.js	1	2024-12-31 17:13:23.714+00
66	20240621174016_workspaces.js	1	2024-12-31 17:13:23.739+00
67	20240628112300_dropCreatorId.js	1	2024-12-31 17:13:23.742+00
68	20240703084247_user-emails.js	1	2024-12-31 17:13:23.759+00
69	20240710154658_user_emails_backfill.js	1	2024-12-31 17:13:23.765+00
70	20240716094858_generalized_invite_record_resources.js	1	2024-12-31 17:13:23.778+00
71	20240716134617_migrate_to_resources_array.js	1	2024-12-31 17:13:23.802+00
72	20240801000000_logos.js	1	2024-12-31 17:13:23.808+00
73	20240802212846_cascadeDeleteWorkspaceProjects.js	1	2024-12-31 17:13:23.818+00
74	20240806160740_workspace_domains.js	1	2024-12-31 17:13:23.842+00
75	20240807174901_add_column_domainBasedMembershipProtection.js	1	2024-12-31 17:13:23.845+00
76	20240808091944_add_workspace_discovery_flag.js	1	2024-12-31 17:13:23.848+00
77	20240808140602_add_invite_updated_at.js	1	2024-12-31 17:13:23.852+00
78	20240813125251_workspaceAclWithTimestamps.js	1	2024-12-31 17:13:23.857+00
79	20240820131619_fallbackWorkspaceLogo.js	1	2024-12-31 17:13:23.864+00
80	20240910163614_add_column_defaultProjectRole.js	1	2024-12-31 17:13:23.869+00
81	20240912134548_add_workspace_slug.js	1	2024-12-31 17:13:23.889+00
82	20240926112407_copy_workspace_slug.js	1	2024-12-31 17:13:23.892+00
83	20240930141322_workspace_sso.js	1	2024-12-31 17:13:23.911+00
84	20241014092507_workspace_sso_expiration.js	1	2024-12-31 17:13:23.913+00
85	20241018132400_workspace_checkout.js	1	2024-12-31 17:13:23.955+00
86	20241031081827_create_regions_table.js	1	2024-12-31 17:13:23.964+00
87	20241101055531_project_region.js	1	2024-12-31 17:13:23.972+00
88	20241102055157_project_region_nofk.js	1	2024-12-31 17:13:23.978+00
89	20241105070219_create_workspace_regions_table.js	1	2024-12-31 17:13:23.996+00
90	20241105144301_cascade_delete_workspace_plans.js	1	2024-12-31 17:13:24.005+00
91	20241120063859_cascade_delete_checkout_session.js	1	2024-12-31 17:13:24.016+00
92	20241120140402_gendo_credits.js	1	2024-12-31 17:13:24.028+00
93	20241126084242_workspace_plan_rename.js	1	2024-12-31 17:13:24.041+00
94	20241126142602_workspace_plan_date.js	1	2024-12-31 17:13:24.045+00
95	20241128153315_workspace_creation_state.js	1	2024-12-31 17:13:24.063+00
96	20241202183039_workspace_start_trial.js	1	2024-12-31 17:13:24.07+00
97	20241203212110_cascade_delete_automations.js	1	2024-12-31 17:13:24.097+00
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
314504c3d0	3fb61f0d69
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
b9eeee1b67	$2b$10$V9el87hGEUU43t/7R45qlegPxj8J6hfVKfjWwC4ueUwDGqNgInet.	spklwebapp	3fb61f0d69	2024-12-31 17:15:26.550566+00	15770000000
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
workspace:admin	Has root on the workspace	workspaces	workspace_acl	1000	t
workspace:member	A regular member of the workspace	workspaces	workspace_acl	100	t
workspace:guest	An external guest member of the workspace with limited rights	workspaces	workspace_acl	50	t
\.


--
-- Data for Name: server_acl; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.server_acl ("userId", role) FROM stdin;
3fb61f0d69	server:admin
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
explorer	server:setup
explorer	tokens:read
explorer	tokens:write
explorer	users:invite
explorer	workspace:create
explorer	workspace:update
explorer	workspace:read
explorer	workspace:delete
explorer	workspace:billing
sca	streams:read
sca	streams:write
sca	profile:read
sca	profile:email
sca	users:read
sca	users:invite
spklpwerbi	streams:read
spklpwerbi	profile:read
spklpwerbi	profile:email
spklpwerbi	users:read
spklpwerbi	users:invite
spklexcel	streams:read
spklexcel	streams:write
spklexcel	profile:read
spklexcel	profile:email
spklexcel	users:read
spklexcel	users:invite
spklautoma	profile:email
spklautoma	profile:read
spklautoma	users:read
spklautoma	tokens:write
spklautoma	streams:read
spklautoma	streams:write
sdm	streams:read
sdm	streams:write
sdm	profile:read
sdm	profile:email
sdm	users:read
sdm	users:invite
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
3fb61f0d69	47d8fd9d36	stream:owner
\.


--
-- Data for Name: stream_activity; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.stream_activity ("streamId", "time", "resourceType", "resourceId", "actionType", "userId", info, message) FROM stdin;
\N	2024-12-31 17:15:26.189971+00	user	3fb61f0d69	user_create	3fb61f0d69	{"user": {"id": "3fb61f0d69", "ip": null, "bio": null, "name": "Fuzz Test", "email": "fuzztest@example.org", "suuid": "6bff2a82-30db-4d5e-b4a6-78dbb07f0b2b", "avatar": null, "company": null, "profiles": null, "verified": false, "createdAt": "2024-12-31T17:15:25.885Z", "passwordDigest": "$2b$10$n9TiIOXO8PagZ8azbKyGk.fa6u2iju7mgEtDwyiBnRRZGaNLlMUQS"}}	User created
47d8fd9d36	2024-12-31 17:15:26.86193+00	stream	47d8fd9d36	stream_create	3fb61f0d69	{"input": {"id": "47d8fd9d36", "name": "Shiny Edifice", "isPublic": true, "createdAt": "2024-12-31T17:15:26.845Z", "regionKey": null, "updatedAt": "2024-12-31T17:15:26.845Z", "clonedFrom": null, "description": "", "workspaceId": null, "isDiscoverable": true, "allowPublicComments": false}}	Stream Shiny Edifice created
47d8fd9d36	2024-12-31 17:17:23.701158+00	branch	3c4ce908af	branch_create	3fb61f0d69	{"branch": {"id": "3c4ce908af", "name": "fuzzy", "authorId": "3fb61f0d69", "streamId": "47d8fd9d36", "createdAt": "2024-12-31T17:17:23.699Z", "updatedAt": "2024-12-31T17:17:23.699Z", "description": null}}	Branch created: fuzzy (3c4ce908af)
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
d018e9f40e	apps:read
d018e9f40e	apps:write
d018e9f40e	streams:read
d018e9f40e	streams:write
d018e9f40e	profile:read
d018e9f40e	profile:email
d018e9f40e	profile:delete
d018e9f40e	users:read
d018e9f40e	server:stats
d018e9f40e	users:email
d018e9f40e	server:setup
d018e9f40e	tokens:read
d018e9f40e	tokens:write
d018e9f40e	users:invite
d018e9f40e	workspace:create
d018e9f40e	workspace:update
d018e9f40e	workspace:read
d018e9f40e	workspace:delete
d018e9f40e	workspace:billing
314504c3d0	streams:read
314504c3d0	streams:write
314504c3d0	profile:read
314504c3d0	profile:email
314504c3d0	users:read
314504c3d0	server:stats
314504c3d0	workspace:create
314504c3d0	workspace:update
314504c3d0	workspace:read
314504c3d0	workspace:delete
\.


--
-- Data for Name: user_emails; Type: TABLE DATA; Schema: public; Owner: speckle
--

COPY public.user_emails (id, email, "primary", verified, "userId", "createdAt", "updatedAt") FROM stdin;
fe2c9e7e8a	fuzztest@example.org	t	f	3fb61f0d69	2024-12-31 17:15:25.903+00	2024-12-31 17:15:25.903+00
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
spklwebapp	3fb61f0d69	d018e9f40e
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
3fb61f0d69	isOnboardingFinished	true	2024-12-31 17:15:26.963+00	2024-12-31 17:15:26.964+00
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

