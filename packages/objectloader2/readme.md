# objectloader2 for the Speckle viewer

This is an updated object loader for the Speckle viewer rewritten in Typescript.

The main aim for the objectloader is:

- download Speckle objects as JSON
- cache in IndexedDB so the same objects aren't downloaded twice
- give data to the viewer, as returned by the `getObjectIterator` generator, as soon as possible
- do the above as concurrently as a browser allows
