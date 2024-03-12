import React, { useState } from 'react';
import axios from "axios";
import * as L from "leaflet";
import "./App.css";
import logo from '/Users/s-trecmacair4/Desktop/leafmap/geoTiff/src/img/logo.png'; // Assuming you have a logo image
import MapContent from "./Components/MapContent";
import DraggabkeMarker from "./Components/DraggabkeMarker";
import DrawableMap from "./Components/DrawableMap";
import PolygonDrawing from "./Components/PolygonDrawing";
import MapWithGeoTIFF from "./Components/MapWithGeoTIFF";
import { MapContainer, TileLayer } from "react-leaflet"; //Marker, Popup,
import "leaflet/dist/leaflet.css";
import GeoTiffLayer from "./Components/GeoTiffLayer";
var service = "http://localhost:5000";

function App() {
  const [tiffUrl1, setTiffUrl1] = useState(null);

  const handleFileUpload = async (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const formData = new FormData();
      formData.append("file", file);

       // ตัวเลือกสำหรับการบีบอัดและลดขนาดไฟล์
       const options = {
        quality: 0.5, // คุณภาพภาพไฟล์
        maxWidth: 800, // ความกว้างสูงสุด
        maxHeight: 600, // ความสูงสูงสุด
      };
  
      try {
        const response = await axios.post(`${service}/upload`, formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });
        const { data } = response;
        if (data && data.path) {
          return data.path; // ส่งคืน path ของไฟล์
        }
      } catch (error) {
        console.log("Error uploading file:", error);
      }
    } else {
      console.log("No file selected");
    }
  };
  
  const submit = async (event) => {
    event.preventDefault(); // ป้องกันการโหลดหน้าเว็บเมื่อคลิก Submit
    
    try {
      const path = await handleFileUpload(event); // เก็บ path ของไฟล์ที่อัปโหลดสำเร็จ
      if (path) {
        setTiffUrl1(`/files/${path}`); // เตรียม path ของไฟล์ให้ตรงกับ GeoTiffLayer
      }
    } catch (error) {
      console.log("Error handling file upload:", error);
    }
  };
  

  const center = [39.8282, -98.5795];
  const zoom = 3;
  const options = {
    resolution: 1200,
    opacity: 1
  };

  return (
    <div className="App">
      <img src={logo} height="60px" width="100px" alt="Logo" />
      <p>
        <ul className="menu">
          <li><a href="#">Home</a></li>
          <li><a href="#">map server</a></li>
          <li><a href="#">contact</a></li>
        </ul>
      </p>

      <div style={{ height: "600px" }}>
        <MapContainer center={[51.505, -0.09]} zoom={13} scrollWheelZoom={false} style={{width:"100%",height:"100vh"}}>
          <div>
            <div className='submit'>
              <input type="file" onChange={handleFileUpload} />
              <button onClick={submit}>Submit</button>
            </div>
          </div>

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <GeoTiffLayer url={tiffUrl1} options={options} />
        </MapContainer>
      </div>
    </div>
  );
}

export default App;
