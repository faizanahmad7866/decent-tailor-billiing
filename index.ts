import { registerRootComponent } from 'expo';

// First, before any screen renders: caps how far the phone's font-size
// setting can enlarge text, so no word spills out of a bar or button.
import './src/layout/fontScale';
import App from './App';

registerRootComponent(App);
