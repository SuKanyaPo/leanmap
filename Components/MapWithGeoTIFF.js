import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, ImageOverlay } from "react-leaflet";
import { fromUrl, fromArrayBuffer, fromBlob } from "geotiff";
import proj4 from "proj4";
import * as geokeysToProj4 from "geotiff-geokeys-to-proj4";
import axios from "axios";

const MapWithGeoTIFF = ({ url, bounds }) => {
  const mapRef = useRef(null);
  const imageRef = useRef(null);

  const [image, setImage] = useState(undefined);
  const [bounding, setBounding] = useState(undefined);

  const [imageURL, setImageURL] = useState(null);
  const [tiffData, setTiffData] = useState(null);

  useEffect(() => {
    const lerp = (a, b, t) => (1 - t) * a + t * b;

    function transform(a, b, M, roundToInt = false) {
      const round = (v) => (roundToInt ? v | 0 : v);
      return [
        round(M[0] + M[1] * a + M[2] * b),
        round(M[3] + M[4] * a + M[5] * b),
      ];
    }

    const fetchGeoTIFF = async () => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();

        const tiff = await fromArrayBuffer(arrayBuffer);
        const image = await tiff.getImage(); // by default, the first image is read.

        // Construct the WGS-84 forward and inverse affine matrices:
        const { ModelPixelScale: s, ModelTiepoint: t } = image.fileDirectory;
        let [sx, sy, sz] = s;
        let [px, py, k, gx, gy, gz] = t;
        sy = -sy; // WGS-84 tiles have a "flipped" y component

        const pixelToGPS = [gx, sx, 0, gy, 0, sy];
        console.log(`pixel to GPS transform matrix:`, pixelToGPS);

        const gpsToPixel = [-gx / sx, 1 / sx, 0, -gy / sy, 0, 1 / sy];
        console.log(`GPS to pixel transform matrix:`, gpsToPixel);

        // Convert a GPS coordinate to a pixel coordinate in our tile:
        const [gx1, gy1, gx2, gy2] = image.getBoundingBox();
        const lat = lerp(gy1, gy2, Math.random());
        const long = lerp(gx1, gx2, Math.random());
        console.log(
          `Looking up GPS coordinate (${lat.toFixed(6)},${long.toFixed(6)})`
        );

        const [x, y] = transform(long, lat, gpsToPixel, true);
        console.log(`Corresponding tile pixel coordinate: [${x}][${y}]`);

        // And as each pixel in the tile covers a geographic area, not a single
        // GPS coordinate, get the area that this pixel covers:
        const gpsBBox = [
          transform(x, y, pixelToGPS),
          transform(x + 1, y + 1, pixelToGPS),
        ];
        console.log(`Pixel covers the following GPS area:`, gpsBBox);

        // Finally, retrieve the elevation associated with this pixel's geographic area:
        const rasters = await image.readRasters();
        const { width, [0]: raster } = rasters;
        const elevation = raster[x + y * width];
        console.log(
          `The elevation at (${lat.toFixed(6)},${long.toFixed(
            6
          )}) is ${elevation}m`
        );
      } catch (error) {
        console.error("Error reading GeoTIFF:", error);
      }
    };

    fetchGeoTIFF();

    // Clean up any resources if needed
    return () => {
      // Clean up code here
    };
  }, []);

  //   useEffect(() => {
  //     const map = mapRef.current;
  //     const image = imageRef.current;

  //     if (!map || !image) return;

  //     // Load GeoTIFF
  //     fetch(url)
  //       .then(response => {
  //         console.log(response)
  //         if (!response.ok) {
  //           throw new Error('Network response was not ok');
  //         }
  //         return response.arrayBuffer();
  //       })
  //       .then(buffer => GeoTIFF.fromArrayBuffer(buffer))
  //       .then(tiff => tiff.getImage())
  //       .then(image => {
  //         // Update image dimensions

  //         const { width, height } = image;
  //         imageRef.current.width = width;
  //         imageRef.current.height = height;

  //         // Add GeoTIFF as overlay
  //         const imageBounds = [[0, 0], [height, width]];
  //         imageRef.current.bounds = imageBounds;
  //         imageRef.current.url = url; // Store GeoTIFF URL for reference
  //         image.addTo(map);
  //       })
  //       .catch(error => {
  //         console.error('Error loading GeoTIFF:', error);
  //       });
  //   }, [url]);

  return (
    <MapContainer
      ref={mapRef}
      center={[-9551282.179409388, 5571611.137992457]}
      zoom={15}
      style={{ height: "100%", width: "100%" }}
    >
      {/* <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {image != undefined && bounding != undefined ? (
        <ImageOverlay
          ref={imageRef}
          url={url} // Pass GeoTIFF URL
          bounds={bounds}
        />
      ) : null} */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {imageURL && <ImageOverlay bounds={bounding} url={imageURL} />}
    </MapContainer>
  );
};

export default MapWithGeoTIFF;
