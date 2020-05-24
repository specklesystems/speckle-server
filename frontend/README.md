# The Speckle Frontend Apps

This is a vue MPA. It consists of two separate apps: 
- the setup app
- the main frontend app

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

In dev mode, the two separate apps will be available from `localhost:8080/app` for the main frontend, and from `localhost:8080/setup`. 

After building, the server, in production mode, switches between the two based on wether the setup is complete.


### Compiles and minifies for production
```
npm run build
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
