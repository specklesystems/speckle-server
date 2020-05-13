WITH ids AS (
        SELECT DISTINCT unnest( string_to_array( ltree2text( subltree("path", 1, 2) ), '.') ) as obj_id
        FROM object_tree_refs
        WHERE parent = '0_hash'
      ),
      objs AS (
        SELECT obj_id as id, speckleType, "data"
        FROM ids
        JOIN objects ON ids.obj_id = objects.id
        -- WHERE objects."data" @> '{"text": "This is object 1"}'
        ORDER BY jsonb_path_query(data, '$.nest.orderMe' ) DESC
      ),
      childrenCount AS (SELECT count(*) FROM ids),
      resultCount AS (SELECT count(*) FROM objs)
      SELECT * from objs
      RIGHT JOIN (SELECT count(*) FROM objs) d(totalCount) ON TRUE
      OFFSET 100
      LIMIT 200