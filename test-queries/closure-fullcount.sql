with objs as (
	SELECT 
-- 		child as id,
		id,
		serial_id, -- just for reference
		"data"
	FROM object_children_closure
	JOIN objects ON objects.id = child
	WHERE parent = '7919a52c017be262ee0daf1844c376d7'
	AND "minDepth" < 1000
-- 	AND (objects."data" -> 'sortValueA')::numeric <= 700
-- 	AND (objects."data" -> 'sortValueA')::numeric > 100
	ORDER BY id
)
SELECT * FROM objs
RIGHT JOIN (SELECT count(*) FROM objs ) c(total_count) ON TRUE
OFFSET 100
LIMIT 200