# The Speckle Viewer

[![Twitter Follow](https://img.shields.io/twitter/follow/SpeckleSystems?style=social)](https://twitter.com/SpeckleSystems) [![Community forum users](https://img.shields.io/discourse/users?server=https%3A%2F%2Fspeckle.community&style=flat-square&logo=discourse&logoColor=white)](https://speckle.community) [![website](https://img.shields.io/badge/https://-speckle.systems-royalblue?style=flat-square)](https://speckle.systems) [![docs](https://img.shields.io/badge/docs-speckle.guide-orange?style=flat-square&logo=read-the-docs&logoColor=white)](https://speckle.guide/dev/) [![npm version](https://badge.fury.io/js/%40speckle%2Fviewer.svg)](https://badge.fury.io/js/%40speckle%2Fviewer)

## Disclaimer

We're working to stabilize the 2.0 API, and until then there will be breaking changes.

## Documentation

Comprehensive developer and user documentation can be found in our:

#### 📚 [Speckle Docs website](https://speckle.guide/dev/)

## Getting started

Note, these are WIP instructions. More details coming soon!

For development purposes, to start a webpack live reload server run:

```
npm run serve
```

You can now access the example at [http://localhost:9000/example.html](http://localhost:9000/example.html).

To build the library, you should run:

```
npm run build
```

## API

Syntax and examples for supported API methods. The examples assume a Viewer instance named `v`.

### Load/Unload an object
`v.loadObject( objectUrl )` / `v.unloadObject( objectUrl )`

Example: `v.loadObject( 'https://speckle.xyz/streams/3073b96e86/objects/e05c5834368931c9d9a4e2087b4da670' )`

### Get properties of loaded objects
`v.getObjectsProperties()`

This returns a dictionary with `{ propertyName: propertyInfo }` elements. The property information provided is:
 - `type` ( == `'string'` / `'number'` / `'boolean'`): the property type
 - `objectCount` (int): How many objects in the scene have this property
 - `allValues` (array of `objectCount` elements): The values for this property of all objects that have this property
 - `minValue` - the smallest value (using `<` operator, works also on strings)
 - `maxValue` - the largest value
 - `uniqueValues` - a dictionary of `{ uniqueValue: occurenceCount }` elements, secifying how many objects have the property set to that specific value

### Filtering and coloring
Those calls filter and color the objects loaded in the scene, and drops the previous applied filters (filtering is not additive).

Syntax: `await v.applyFilter( { filterBy, colorBy, ghostOthers } )`

The 3 optional parameters are:
 - `filterBy`: A dictionary that specify the filter. Elements are in the form `{ propertyName: propertyValueFilter }`. The propertyValueFilter can be one of:
   - A specific value: (only objects with that property value pass the filter)
   - An array of values: An object passes the filter if its value is in the array
   - A range of values, specified by `{ 'gte': value1, 'lte': value2 }` (greater than or equal, lower than or equal)
   - An exclusion list, specified by `{ 'not': excludedValuesArray }`

 - `colorBy`: A dictionary that makes all objects colored based on a property value. Two types of coloring are supported:
   - Gradient (from a numeric property): `{ 'type': 'gradient', 'property': propertyName, 'minValue': propertyMinValue, 'maxValue': propertyMaxValue, 'gradientColors': [color1, color2] }`
   - Category (for coloring each unique value differently): `{ 'type': 'category', 'property': propertyName, 'values': { value1: color1, value2: color2, ... }, 'default': colorForAnyOtherValue }`. The `values` and the `default` parameters are optional: Random colors are generated if they are ommited.

 - `ghostOthers`: A boolean (default `false`). If set to `true`, then the objects that are filtered out are actually shown with very low opacity, so that the remaining objects have a better context.


To remove all filters: `await v.applyFilter( null )`


## Community

If in trouble, the Speckle Community hangs out on [the forum](https://speckle.community). Do join and introduce yourself! We're happy to help.

## License

Unless otherwise described, the code in this repository is licensed under the Apache-2.0 License. If you have any questions, don't hesitate to get in touch with us via [email](mailto:hello@speckle.systems).
