import React, { Component } from 'react';
import { connect } from 'react-redux';
import {Polyline} from 'react-leaflet';

//var latlngs = [[70.505, -75.09],[70.505, -100]];
class PathContainer extends Component {
  render() {
    const {target} = this.props;
    //console.log("target",target);
    return (
      <div>
        <Polyline positions={target} pathOptions={{color: '#4390ba'}}/>        
      </div>
    )
  }
};

const mapStateToProps = (state) => {
    const target = state.targetLocations;
    return {
      target
    }
};

export default connect(mapStateToProps)(PathContainer);



// L.circle([50.5, 30.5], {radius: 200}).addTo(map);
// <Circle center={[70.505, -75.09]} radius={200} pathOptions={{ color: 'blue' }} />