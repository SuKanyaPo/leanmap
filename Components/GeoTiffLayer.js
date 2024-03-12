import { useEffect, useRef } from "react";
import proj4 from "proj4";
import { useLeafletContext } from "@react-leaflet/core";
import { useMap } from "react-leaflet";
import parseGeoraster from "georaster";
import GeoRasterLayer from "georaster-layer-for-leaflet";

window.proj4 = proj4;

const GeotiffLayer = ({ url, options }) => {
  const geoTiffLayerRef = useRef();
  const context = useLeafletContext();
  const map = useMap();

  useEffect(() => {
    const container = context.layerContainer || context.map;
  
    let isMounted = true; // Add a flag to track component unmounting
  
    fetch(url)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => {
        parseGeoraster(arrayBuffer).then((georaster) => {
          if (!isMounted) return; // Skip if component is unmounted
          console.log("georaster:", georaster);
          options.georaster = georaster;
          const layer = new GeoRasterLayer(options);
          geoTiffLayerRef.current = layer;
          container.addLayer(layer);
          map.fitBounds(layer.getBounds());
        });
      });
  
    return () => {
      isMounted = false; // Mark component as unmounted
      if (geoTiffLayerRef.current) {
        container.removeLayer(geoTiffLayerRef.current);
      }
    };
  }, [context, url, map, options]);
  

  return null;
};

export default GeotiffLayer;
