import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

const roganDark = {
  dark: true,
  colors: {
    background: '#121212',
    surface: '#1E1E1E',
    'surface-variant': '#2D2D2D',
    primary: '#E91E63',
    'primary-darken-1': '#C2185B',
    secondary: '#9C27B0',
    'secondary-darken-1': '#7B1FA2',
    accent: '#FF4081',
    error: '#CF6679',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FF9800',
  },
};

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'roganDark',
    themes: {
      roganDark,
    },
  },
  icons: {
    defaultSet: 'mdi',
  },
  defaults: {
    VBtn: {
      color: 'primary',
      variant: 'flat',
    },
    VCard: {
      color: 'surface',
    },
    VTextField: {
      variant: 'solo-filled',
      color: 'primary',
    },
  },
});
