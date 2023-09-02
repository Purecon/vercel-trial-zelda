import React from 'react';
import './index.css';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import {
  ControlPanel,
  reducer
} from './components/control-panel';

import MapContainer from './components/map-container';

import locationData from './data/locations';

const initialState = {
  activeIconTypes: [],
  locations: locationData,
  targetLocations: []
};

let store = createStore(reducer, initialState);

render (
  <Provider store={store}>
    <div>
      <ControlPanel store={store} />
      <MapContainer />
    </div>
  </Provider>,
  document.getElementById('map-container')
 );