	WITH ids as (
		SELECT (subltree("path", 2, 3))::text as obj_id
		FROM object_tree_refs
		WHERE path ~ '0_hash.*{2}'
		ORDER BY id
	)
	SELECT id, speckleType, "data" -> 'nest' -> 'orderMe'
	FROM ids
	JOIN objects ON obj_id = objects.id WITH ORDINALITY
	OFFSET 2
	LIMIT 50