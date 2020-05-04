-- SLOW, because? 
-- because we were ordering it by the serial_id!
-- sorting by the id (on which we actually do the join) is 10x faster. 
-- nice, to say the least. 
SELECT child as id, "data" FROM object_children_closure
RIGHT JOIN objects ON objects.id = child
WHERE parent = '509cb0c19594b731214d3ffed2c011df'
-- minDepth is a way to limit asking for objects up to a specific nested depth. 
-- this is useful, for example, when we want to get a stream's top level objects only. 
-- AND "minDepth" < 1000
-- better pagination routine:
-- instead of using offset, we use the last item we "saw" as where clause (last seen id)
-- this assumes that we are ordering results by their id. 
-- if we would be ordering them by something else, this clause would need to change. 
-- AND id > '5a29a1e000d94d8b9f4c6dd767235903'
-- AND (objects."data" -> 'sortValueA')::numeric <= 700
ORDER BY id
-- ORDER BY serial_id 
OFFSET 0
LIMIT 200