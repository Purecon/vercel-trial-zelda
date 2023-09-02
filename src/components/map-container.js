import React, { Component } from 'react';

import {
  Map,
  TileLayer
} from 'react-leaflet';

import MapIconsContainer from './map-icons-container';
import PathContainer from './path';

import './map-container.css';

const maxBounds = [
  [0, -176.59],
  [85.455, 38]
];

const position = [70.505, -75.09];

export default class MapContainer extends Component {
  // For debugging points add this to <Map>
  // `onClick={(event) => console.log(event.latlng)}`
  render() {
    return (
      <Map
        center={position}
        maxBounds={maxBounds}
        zoom={4}
        //onClick={(event) => console.log(event.latlng)}
        //Log saat peta diklik di mana pun
        //onClick={(event) => console.log("Klik di peta: ",[event.latlng.lat, event.latlng.lng])}
       >
        <TileLayer
          minZoom={2}
          maxZoom={6}
          url='/images/tiles/{z}/{x}/{y}.png'
        />

        <MapIconsContainer />
        <PathContainer />
      </Map>
    )
  }
}