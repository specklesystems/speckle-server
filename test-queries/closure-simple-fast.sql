-- Fast, because? 
SELECT child, "data" FROM object_children_closure
RIGHT JOIN objects ON objects.id = child
WHERE parent = '7919a52c017be262ee0daf1844c376d7'
ORDER BY id
OFFSET 0
LIMIT 20