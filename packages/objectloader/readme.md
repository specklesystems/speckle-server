# The Speckle Object Loader

[![Twitter Follow](https://img.shields.io/twitter/follow/SpeckleSystems?style=social)](https://twitter.com/SpeckleSystems) [![Community forum users](https://img.shields.io/discourse/users?server=https%3A%2F%2Fspeckle.community&style=flat-square&logo=discourse&logoColor=white)](https://speckle.community) [![website](https://img.shields.io/badge/https://-speckle.systems-royalblue?style=flat-square)](https://speckle.systems) [![docs](https://img.shields.io/badge/docs-speckle.guide-orange?style=flat-square&logo=read-the-docs&logoColor=white)](https://speckle.guide/dev/)

## Documentation

Comprehensive developer and user documentation can be found in our:

#### 📚 [Speckle Docs website](https://speckle.guide/dev/)

## Getting started

This is a small utility class that helps you stream an object and all its sub-components from the Speckle Server API. It is inteded to be used in contexts where you want to "download" the whole object, or iteratively traverse its whole tree.

Here's a sample way on how to use it, pfilfered from the [3d viewer package](../viewer):

```js


async load( { serverUrl, token, streamId, objectId } ) {

  const loader = new ObjectLoader( { serverUrl, token, streamId, objectId } )

  let total = null
  let count = 0

  for await ( let obj of loader.getObjectIterator() ) {

    if( !total ) total = obj.totalChildrenCount

    console.log( obj, `Progress: ${count++}/${total}` )

  }

}

```

## Community

If in trouble, the Speckle Community hangs out on [the forum](https://speckle.community). Do join and introduce yourself! We're happy to help.

## License

Unless otherwise described, the code in this repository is licensed under the Apache-2.0 License. If you have any questions, don't hesitate to get in touch with us via [email](mailto:hello@speckle.systems).
