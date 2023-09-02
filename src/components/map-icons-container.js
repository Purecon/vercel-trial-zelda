import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
  Marker,
  Popup
} from 'react-leaflet';

import icons from '../data/icons';

import './map-icons-container.css';
import locations from '../data/locations';

const iconText = (location, iconType) => {
  const instructions = icons[iconType].instructions;

  if (location.name && !location.name.startsWith("Korok")){
    return location.name;
  } else if (instructions) {
    return location.name + "\n"+instructions[location.instructionType];
  }
}

const DisplayIcons = ({ activeIconTypes, locations, props, activeLocs}) => {
  const displayIcons = activeIconTypes.map((iconType) => {
    return locations[iconType].map((location) => {
      const icon = icons[iconType];
      let popupText = iconText(location, iconType);
      return (
        <Marker
          position={location.coordinates}
          className={icon.classNames}
          icon={icon.icon}
          title={location.name}
          key={location.name}
          //On click event
          onClick={(event) => handleClick(event,activeIconTypes,location,popupText,props,activeLocs)}
          //onClick={(event) => console.log("Berhasil diklik",activeIconTypes,location.name,[event.latlng.lat, event.latlng.lng],"Array of active locations: ",getActiveLoc(activeIconTypes))}
        >
          <Popup>
            <span>{popupText}</span>
          </Popup>
        </Marker>
      )
    });
  });

  return (
    <div>{displayIcons}</div>
  )
};

//source,dest lokasi dengan latitude longitude
function euclideanDistance(source,dest) {
  var a = dest[0] - source[0];
  var b = dest[1] - source[1];

  return Math.sqrt(a*a + b*b);
}

//Kelas simpul
class Simpul {
  constructor(name, location) {
    this.nama = name;
    this.lokasi = location;
    //array
    this.tetangga = [];
  }
  setTetangga(neighbour){
    this.tetangga = neighbour;
  }
}

let arr_simpul = [];
//MapIconsContainer
class MapIconsContainer extends Component {
  render() {
    const { activeIconTypes, locations } = this.props;
    var props = this.props;
    console.log("Tipe icon: ",activeIconTypes);
    //lokasi active icons
    let activeLocs = getActiveLoc(activeIconTypes);
    //Bangun graf
    arr_simpul = [];
    let counter = 0;
    activeLocs.forEach(element => {
      if(element.name===undefined)
      {
        element.name = "Korok"+counter;
        counter++;
      }
      let simpul = new Simpul(element.name,element.coordinates);
      arr_simpul = arr_simpul.concat(simpul);
    });
    //Hitung euclidean tiap simpul
    arr_simpul.forEach(element => {
      let other_simpul = {};
      arr_simpul.forEach(element2 => {
        if(element.nama !== element2.nama)
        {
          let eucRes = euclideanDistance(element.lokasi,element2.lokasi);
          //debug
          //console.log("Simpul 1:",element.nama," Simpul 2:",element2.nama," Jarak:",eucRes);
          //other_simpul = other_simpul.concat([element2.nama,eucRes]);
          other_simpul[element2.nama] = eucRes;
        }
      });
      //Debug log
      //console.log("Simpul :",element.nama,"Jarak :",other_simpul);
      let simpul_sorted = Object.keys(other_simpul).sort(function(a,b){return other_simpul[a]-other_simpul[b]})
      let simpul_tetangga = [];
      let jumlah_tetangga;
      //Get tetangga n jarak terdekat
      jumlah_tetangga = 4;
      if(activeIconTypes.length === 1){
        activeIconTypes.forEach(element => {
          if(element==="stable"){
            jumlah_tetangga = 5;
          }
        });
      }
      for(let i = 0; i<jumlah_tetangga; i++)
      {
        if (!element.tetangga.includes(simpul_sorted[i]))
        {
          simpul_tetangga = simpul_tetangga.concat(simpul_sorted[i]);
        }
      }
      element.setTetangga(simpul_tetangga);
    });

    //Tambahkan tetangga jika belum dua arah
    arr_simpul.forEach(element => {
      element.tetangga.forEach(element2 => {
        arr_simpul.forEach(element3 => {
          if (element3.nama===element2)
          {
            if(!element3.tetangga.includes(element.nama))
            {
              element3.tetangga = element3.tetangga.concat(element.nama);
            }
          }
        });
      });
    });

    //Debug log
    // arr_simpul.forEach(element => {
    //   console.log("Simpul :",element.nama,"Tetangga :",element.tetangga);
    // });
    

    return (
      <div>
        {activeIconTypes && locations &&
          <DisplayIcons { ...{ activeIconTypes, locations, props, activeLocs, arr_simpul} } />
        }
      </div>
    )
  }
};

const mapStateToProps = (state) => {
  const activeIconTypes = state.activeIconTypes;

  return {
    activeIconTypes,
    locations: state.locations
  }
};

function getActiveLoc(activeIconTypes){
  let temp_arr = [];
  activeIconTypes.forEach(element => {
    temp_arr = temp_arr.concat(locations[element]);
  });
  return temp_arr;
}

// Actions untuk mengubah lokasi untuk path
export const setTargetLoc = (newLatLngs) => {
  return {
      targets: newLatLngs,
      type: 'SET_NEW_TARGET_LOC'
  }
};

//Kelas simpul jarak
class SimpulJarak {
  constructor(parent, name, coordinates, tetangga) {
    this.parent = parent;
    this.name = name;
    this.coordinates = coordinates;
    this.tetangga = tetangga;
    //value
    this.g = 0;
    this.h = 0;
    this.f = 0;
  }
  eq(other){
    return this.name === other.name;
  }
  lessThan(other){
    return this.f < other.f;
  }
}

//fungsi A*
function astar(start,end){
  //Array simpul temp terdiri dari array semua simpul 
  var arr_simpul_temp = arr_simpul;
  //Get simpul awal
  var simpul_start;
  var simpul_end;
  arr_simpul_temp.forEach(simpul => {
    if(simpul.nama === start.name){
      simpul_start = simpul;
    }
    if(simpul.nama === end.name){
      simpul_end = simpul;
    }
  });
  //Create simpul jarak awal dan akhir, default value 0
  let start_node = new SimpulJarak("None",simpul_start.nama,simpul_start.lokasi,simpul_start.tetangga);
  let end_node = new SimpulJarak("None",simpul_end.nama,simpul_end.lokasi,simpul_end.tetangga);

  //Insialisasi open dan closed list. Open:live node, closed:expanded node
  let open_list = [];
  let closed_list = [];

  //Tambahkan start node
  open_list.push(start_node);

  //Loop sampai mendapat end
  while(open_list.length > 0){
    //Debug open list
    console.log("Open list :",JSON.parse(JSON.stringify(open_list)))
    //Debug closed list
    console.log("Closed list :",JSON.parse(JSON.stringify(closed_list)))
    //Ambil current node dengan f terkecil
    var current_node = open_list[0];
    var current_index = 0;
    open_list.forEach(item => {
      if(item.lessThan(current_node)){
        current_node = item;
      }
    });
    //Debug current node
    console.log("Current node :",current_node);
    //Pop dan masukkan ke closed list
    var deleted = open_list.splice(current_index,1);
    closed_list.push(deleted[0]);
    //Menemukan goal catat path
    if(current_node.eq(end_node)){
      let path = [];
      let current = current_node;
      while(current !== "None"){
        //Debug
        path.push(current)
        current = current.parent;
      }
      return path.reverse();
    }
    //Generate children
    var list_children = current_node.tetangga;
    var children = [];
    var selected_simpul;
    list_children.forEach(child_element => {
      arr_simpul_temp.forEach(simpul => {
        if(simpul.nama === child_element){
          selected_simpul = simpul;
        }
      });
      //Buat simpul baru
      var new_node = new SimpulJarak(current_node,selected_simpul.nama,selected_simpul.lokasi,selected_simpul.tetangga);
      //Push ke array
      children.push(new_node);
    });

    //Loop untuk setiap children
    children.forEach(child => {
      var skip = false;
      //Cek child apakah ada di closed list (sudah expanded)
      closed_list.forEach(closed_child => {
        if (child.eq(closed_child)){
          skip=true;
        }
      });
      if(!skip){
        //Kalkulasi nilai f dari nilai g dan h
        child.g = euclideanDistance(child.coordinates,start_node.coordinates);
        child.h = euclideanDistance(child.coordinates,end_node.coordinates);
        child.f = child.g + child.h;

        //Cek child apakah ada di open list (di live node) dan g lebih besar
        open_list.forEach(open_child => {
          if (child.eq(open_child) && child.g >= open_child.g){
            skip=true;
          }
        });
        if(!skip){
          //Tambahkan child ke open list(live node)
          open_list.push(child);
          open_list.sort((a,b) => (a.f > b.f) ? 1 : ((b.f > a.f) ? -1 : 0))
        }
      }
    });
  }
}

//first_click button
let first_click = true;
let start_loc, end_loc;
function handleFirstClick(location,popupText,props,activeLocs){
  if(first_click){
    popupText = "Titik mulai: \n" + popupText;
    console.log(popupText);
    //test newLatLngs
    //newLatLngs = [location.coordinates];
    start_loc = location;
  }
  else{
    popupText = "Titik selesai: \n" + popupText;
    console.log(popupText);
    //test newLatLngs
    //newLatLngs = newLatLngs.concat([location.coordinates]);
    end_loc = location;
    
    //console.log("Lokasi aktif: ",activeLocs);
    console.log("Lokasi mulai: ",start_loc);
    console.log("Lokasi selesai: ", end_loc);
    //testing euclidean
    //console.log("Euclidean dist:",euclideanDistance(start_loc.coordinates,end_loc.coordinates));
    console.log("Array simpul: ",arr_simpul);

    //test simpul
    // arr_simpul.forEach(element => {
    //   console.log("Tetangga simpul ",element.nama ," :",element.tetangga);
    // });

    //Call function A*
    let newLatLngs = [];
    let result_Astar = astar(start_loc,end_loc);
    if(result_Astar !== undefined){
      console.log("Astar result: ",result_Astar);
      result_Astar.forEach(element => {
        newLatLngs = newLatLngs.concat([element.coordinates]);
      });
    }
    //console.log("NewLatLngs",newLatLngs);
    //update state targetLoc
    //newLatLngs for line in map
    props.dispatch(setTargetLoc(newLatLngs));
  }

  //swap first click
  first_click = !first_click;
  //console.log("First click value",first_click);
}

function handleClick(event,activeIconTypes,location,popupText,props,activeLocs){
  //Log after clicked
  console.log("Berhasil diklik",activeIconTypes,location.name,[event.latlng.lat, event.latlng.lng]);
  handleFirstClick(location,popupText,props,activeLocs);
  //console.log("Berhasil diklik",activeIconTypes,location.name,[event.latlng.lat, event.latlng.lng],"Array of active locations: ",getActiveLoc(activeIconTypes))
}

export default connect(mapStateToProps)(MapIconsContainer);