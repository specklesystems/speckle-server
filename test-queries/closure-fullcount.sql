with objs as (
	SELECT 
		id,
		"data"
	FROM object_children_closure
	JOIN objects ON objects.id = child
	WHERE parent = '89b42e4109f32b20763243d4313e81b5'
-- 	AND "minDepth" < 1000
	AND (jsonb_path_query("data", '$.sortValueA.test.value'))::numeric <= 10
-- 	AND (objects."data" -> 'sortValueA')::numeric > 100
	ORDER BY id
)
SELECT * FROM objs
RIGHT JOIN (SELECT count(*) FROM objs ) c(total_count) ON TRUE
OFFSET 0
LIMIT 200


-- with "objs" as (select *) select * from "objs" RIGHT JOIN ( SELECT count(*) FROM "objs" ) c(total_count) ON TRUE limit 50
