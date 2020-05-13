WITH ids AS(
	SELECT unnest( string_to_array( ltree2text( subltree("path", 1, 3) ), '.') ) as obj_id
	FROM object_tree_refs
	WHERE parent = '0_hash'
)
SELECT obj_id, speckleType, "data"
FROM ids
JOIN objects ON ids.obj_id = objects.id
OFFSET 0
LIMIT 100