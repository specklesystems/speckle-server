module.exports = JSON.parse( `[
{
  "name": "depth five",
  "id": "99b77f596443d2a2cf59124dbc6a4a8f",
  "speckle_type": ""
}, {
  "name": "depth four",
  "@detach": {
    "speckle_type": "reference",
    "referencedId": "99b77f596443d2a2cf59124dbc6a4a8f"
  },
  "id": "c2cdd8d01c219703926f7282db700e14",
  "speckle_type": "",
  "__tree": [
    "c2cdd8d01c219703926f7282db700e14.99b77f596443d2a2cf59124dbc6a4a8f"
  ],
  "__closure": {
    "99b77f596443d2a2cf59124dbc6a4a8f": 1
  }
}, {
  "name": "depth three",
  "@detach": {
    "speckle_type": "reference",
    "referencedId": "c2cdd8d01c219703926f7282db700e14"
  },
  "id": "78af2314eed937c7338fccc4224393c0",
  "speckle_type": "",
  "__tree": [
    "78af2314eed937c7338fccc4224393c0.c2cdd8d01c219703926f7282db700e14",
    "78af2314eed937c7338fccc4224393c0.c2cdd8d01c219703926f7282db700e14.99b77f596443d2a2cf59124dbc6a4a8f"
  ],
  "__closure": {
    "c2cdd8d01c219703926f7282db700e14": 1,
    "99b77f596443d2a2cf59124dbc6a4a8f": 2
  }
}, {
  "name": "depth two",
  "@detach": {
    "speckle_type": "reference",
    "referencedId": "78af2314eed937c7338fccc4224393c0"
  },
  "@joker": [
    {
      "speckle_type": "reference",
      "referencedId": "99b77f596443d2a2cf59124dbc6a4a8f"
    }
  ],
  "id": "254cb2d7094eca3c809cdac2ffc4010b",
  "speckle_type": "",
  "__tree": [
    "254cb2d7094eca3c809cdac2ffc4010b.78af2314eed937c7338fccc4224393c0",
    "254cb2d7094eca3c809cdac2ffc4010b.78af2314eed937c7338fccc4224393c0.c2cdd8d01c219703926f7282db700e14",
    "254cb2d7094eca3c809cdac2ffc4010b.78af2314eed937c7338fccc4224393c0.c2cdd8d01c219703926f7282db700e14.99b77f596443d2a2cf59124dbc6a4a8f",
    "254cb2d7094eca3c809cdac2ffc4010b.99b77f596443d2a2cf59124dbc6a4a8f"
  ],
  "__closure": {
    "78af2314eed937c7338fccc4224393c0": 1,
    "c2cdd8d01c219703926f7282db700e14": 2,
    "99b77f596443d2a2cf59124dbc6a4a8f": 1
  }
}, {
  "name": "depth one",
  "@detach": {
    "speckle_type": "reference",
    "referencedId": "254cb2d7094eca3c809cdac2ffc4010b"
  },
  "@joker": {
    "speckle_type": "reference",
    "referencedId": "99b77f596443d2a2cf59124dbc6a4a8f"
  },
  "id": "d2b9e647cb345673ff2b35ccab45ffc2",
  "speckle_type": "",
  "__tree": [
    "d2b9e647cb345673ff2b35ccab45ffc2.254cb2d7094eca3c809cdac2ffc4010b",
    "d2b9e647cb345673ff2b35ccab45ffc2.254cb2d7094eca3c809cdac2ffc4010b.78af2314eed937c7338fccc4224393c0",
    "d2b9e647cb345673ff2b35ccab45ffc2.254cb2d7094eca3c809cdac2ffc4010b.78af2314eed937c7338fccc4224393c0.c2cdd8d01c219703926f7282db700e14",
    "d2b9e647cb345673ff2b35ccab45ffc2.254cb2d7094eca3c809cdac2ffc4010b.78af2314eed937c7338fccc4224393c0.c2cdd8d01c219703926f7282db700e14.99b77f596443d2a2cf59124dbc6a4a8f",
    "d2b9e647cb345673ff2b35ccab45ffc2.254cb2d7094eca3c809cdac2ffc4010b.99b77f596443d2a2cf59124dbc6a4a8f",
    "d2b9e647cb345673ff2b35ccab45ffc2.99b77f596443d2a2cf59124dbc6a4a8f"
  ],
  "__closure": {
    "254cb2d7094eca3c809cdac2ffc4010b": 1,
    "78af2314eed937c7338fccc4224393c0": 2,
    "c2cdd8d01c219703926f7282db700e14": 3,
    "99b77f596443d2a2cf59124dbc6a4a8f": 1
  }
} ]` )