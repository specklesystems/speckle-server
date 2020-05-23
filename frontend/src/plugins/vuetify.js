import Vue from 'vue';
import Vuetify from 'vuetify/lib';

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    themes: {
      light: {
        primary: '#262E37',
        secondary: '#0A66FF',
        accent: '#0A66FF',
        error: '#FF5252',
        info: '#0A66FF',
        success: '#0A66FF',
        warning: '#FFC107'
      },
    },
  },
});
