// To make the migration parser happy, we add the customary up and down of knex. 
// They're ignored. A better way would be to conventionally exclude these types of files.
up = async knex => {}
down = async knex => {}

let hashTriggerGenerator = ( tableName, hostField, hashByField ) => `
CREATE OR REPLACE FUNCTION ${tableName}_hash_${hostField}_update_tg() RETURNS trigger AS $$
BEGIN
    IF ( tg_op = 'INSERT' OR tg_op = 'UPDATE') AND (( NEW.${hostField} = '') IS NOT FALSE) THEN
        NEW.${hostField} = md5( ${ hashByField ? "NEW." + hashByField : "NEW" }::text );
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ${tableName}_hash_${hostField}_update 
BEFORE INSERT OR UPDATE ON ${tableName} 
FOR EACH ROW EXECUTE PROCEDURE ${tableName}_hash_${hostField}_update_tg();
`

// ref: https://blog.andyet.com/2016/02/23/generating-shortids-in-postgres/
let shortIdTriggerGenerator = ( tableName, hostField ) => `
CREATE OR REPLACE FUNCTION ${tableName}_shortid_update() RETURNS trigger AS $$

DECLARE
  key TEXT;
  qry TEXT;
  found TEXT;

BEGIN
qry := 'SELECT ${hostField} FROM ' || quote_ident(TG_TABLE_NAME) || ' WHERE ${hostField}=';

LOOP

    -- Generate our string bytes and re-encode as a base64 string.
    key := encode(gen_random_bytes(6), 'base64');

    -- Base64 encoding contains 2 URL unsafe characters by default.
    -- The URL-safe version has these replacements.
    key := replace(key, '/', '_'); -- url safe replacement
    key := replace(key, '+', '-'); -- url safe replacement

    -- Concat the generated key (safely quoted) with the generated query
    -- and run it.
    -- SELECT id FROM "test" WHERE id='blahblah' INTO found
    -- Now "found" will be the duplicated id or NULL.
    EXECUTE qry || quote_literal(key) INTO found;

    -- Check to see if found is NULL.
    -- If we checked to see if found = NULL it would always be FALSE
    -- because (NULL = NULL) is always FALSE.
    IF found IS NULL THEN
      -- If we didn't find a collision then leave the LOOP.
      EXIT;
    END IF;

    -- We haven't EXITed yet, so return to the top of the LOOP
    -- and try again.
  END LOOP;

  -- NEW and OLD are available in TRIGGER PROCEDURES.
  -- NEW is the mutated row that will actually be INSERTed.
  -- We're replacing id, regardless of what it was before
  -- with our key variable.
  NEW.${hostField} = key;

  -- The RECORD returned here is what will actually be INSERTed,
  -- or what the next trigger will get if there is one.
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER ${tableName}_shortid_update
BEFORE INSERT ON ${tableName} 
FOR EACH ROW EXECUTE PROCEDURE ${tableName}_shortid_update();
`

module.exports = { hashTriggerGenerator, shortIdTriggerGenerator, up, down }