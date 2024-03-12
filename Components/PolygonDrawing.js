import React, { useState, useRef } from "react";

import L from "leaflet";
import { MapContainer, TileLayer, FeatureGroup, useMap } from "react-leaflet";
import { EditControl, Polygon } from "react-leaflet-draw";
import * as turf from "@turf/turf";

import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { toBePartiallyChecked } from "@testing-library/jest-dom/matchers";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png",
});

const DrawablePolygonMap = () => {
  const map = new Map();
  const editTimerRef = useRef(null);
  const deleteTimerRef = useRef(null);
  const polygonArray = [];
  const [polygonArrayForShow, setPolygonArrayForShow] = useState([]);
  const [tempStringArray, setTempStringArray] = useState([]);
  const [tempPolygonForTurf, setTempPolygonForTurf] = useState([]);

  const handleCreation = (e) => {
    const layer = e.layer;
    console.log(layer._leaflet_id);
    if (layer instanceof L.Polygon) {
      const latLngs = layer.getLatLngs().map((latLng) => latLng);
      const tempArray = JSON.stringify(latLngs);
      const parsedArray = JSON.parse(tempArray)[0].map((obj) => [
        obj.lng,
        obj.lat,
      ]);
      parsedArray.push(parsedArray[0]);
      const drawnPolygonCoords = turf.polygon([parsedArray]);
      let isIntersecting = false;
      if (polygonArray.length > 0) {
        polygonArray.map((polygon) => {
          const existingPolygonCoords = turf.polygon([polygon]);
          if (
            turf.booleanIntersects(existingPolygonCoords, drawnPolygonCoords) &&
            isIntersecting === false
          ) {
            isIntersecting = true;
            layer.setStyle({
              color: "red", // Change to your desired color
              fillColor: "lightpink", // Change to your desired fill color
            });
            tempStringArray.push(layer._leaflet_id);
            polygonArray.push(parsedArray);

            // e.layer.remove();
          }
        });
        if (isIntersecting === false) {
          console.log("chekc")
          tempStringArray.push(layer._leaflet_id);
          polygonArray.push(parsedArray);
        }
      } else {
        tempStringArray.push(layer._leaflet_id);
        polygonArray.push(parsedArray);
      }
      setPolygonArrayForShow((previous) => [...previous, parsedArray]);
    }
    console.log(polygonArray);
  };

  const handleEdit = (e) => {
    const layers = e.layers;

    clearTimeout(editTimerRef.current);
    editTimerRef.current = setTimeout(() => {
      console.log(tempStringArray, polygonArray);
      const keys = Object.keys(layers._layers);
      keys.forEach((key) => {
        const parsedKey = parseInt(key);
        const index = tempStringArray.findIndex((object) => {
          return object === parsedKey;
        });
        tempStringArray.splice(index, 1);
        polygonArray.splice(index, 1);
        // console.log(layers._layers[parsedKey]);
        if (layers._layers[parsedKey] instanceof L.Polygon) {
          const latLngs = layers._layers[parsedKey]
            .getLatLngs()
            .map((latLng) => latLng);
          const tempArray = JSON.stringify(latLngs);
          const parsedArray = JSON.parse(tempArray)[0].map((obj) => [
            obj.lng,
            obj.lat,
          ]);
          parsedArray.push(parsedArray[0]);
          const drawnPolygonCoords = turf.polygon([parsedArray]);
          let isIntersecting = false;
          if (polygonArray.length > 0) {
            polygonArray.map((polygon) => {
              const existingPolygonCoords = turf.polygon([polygon]);
              if (
                turf.booleanIntersects(
                  existingPolygonCoords,
                  drawnPolygonCoords
                ) &&
                existingPolygonCoords !== drawnPolygonCoords &&
                isIntersecting === false
              ) {
                console.log(existingPolygonCoords);
                isIntersecting = true;
                layers._layers[parsedKey].setStyle({
                  color: "red", // Change to your desired color
                  fillColor: "lightpink", // Change to your desired fill color
                });

                tempStringArray.push(parsedKey);
                polygonArray.push(parsedArray);
              }
            });
            if (isIntersecting === false) {
              layers._layers[parsedKey].setStyle({
                color: "green", // Change to your desired color
                fillColor: "lightgreen", // Change to your desired fill color
              });
              tempStringArray.push(parsedKey);
              polygonArray.push(parsedArray);
            }
          } else {
            tempStringArray.push(parsedKey);
            polygonArray.push(parsedArray);
          }
        }
      });
      console.log(tempStringArray, polygonArray);
    }, 100); // Adjust the debounce delay as needed (e.g., 100ms)
    return () => clearTimeout(editTimerRef.current);
  };

  const handleDelete = (e) => {
    const layers = e.layers;
    clearTimeout(deleteTimerRef.current);
    deleteTimerRef.current = setTimeout(() => {
      layers.eachLayer((layer) => {
        if (layer instanceof L.Polygon) {
          const latLngs = layer.getLatLngs().map((latLng) => latLng);
          const tempArray = JSON.stringify(latLngs);
          const index = tempStringArray.findIndex((object) => {
            return object === layer._leaflet_id;
          });
          tempStringArray.splice(index, 1);
          polygonArray.splice(index, 1);
        }
      });
    }, 100); // Adjust the debounce delay as needed (e.g., 100ms)
    return () => clearTimeout(deleteTimerRef.current);
  };

  return (
    <div>
      <h1>polygonArray = {polygonArrayForShow}</h1>
      <MapContainer
        center={[13.101029105523143, 100.92994760607247]}
        zoom={17}
        keyboard={true}
        style={{ width: "100%", height: "100vh" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          // "http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}"
          // "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FeatureGroup>
          <EditControl
            position="topright"
            onCreated={handleCreation}
            onEdited={handleEdit}
            onDeleted={handleDelete}
            draw={{
              polyline: false,
              polygon: {
                allowIntersection: false,
                showArea: true,
                showLength: true,
                metric: ["km", "m"],
                shapeOptions: {
                  color: "green", // Change the color to your desired color
                  fillColor: "lightgreen", // Change the fill color to your desired color
                  fillOpacity: 0.6, // Adjust the fill opacity if needed
                },
              },
              rectangle: false,
              circle: false,
              marker: false,
              circlemarker: false,
            }}
            edit={{
              delete: true,
              edit: true,
            }}
          />
        </FeatureGroup>
      </MapContainer>
    </div>
  );
};

export default DrawablePolygonMap;
