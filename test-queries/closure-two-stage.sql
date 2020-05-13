WITH ids AS (
	SELECT child FROM object_children_closure
	WHERE parent = '94a0a141c211f60c5e3f859baae125e9'
	AND "minDepth" < 100 
), 
objs AS (
	SELECT 
		id, 
		speckleType,
		"data"
	FROM ids
	JOIN objects ON ids.child = objects.id
	WHERE
		(objects."data" -> 'sortValueA')::numeric >= 100
)
SELECT * FROM objs 
RIGHT JOIN (SELECT count(*) FROM objs ) c(totalCount) ON TRUE
OFFSET 120
LIMIT 1000