import React from "react";
import ReactDOM from "react-dom";
import {
  Button,
  Map,
  Placemark,
  Polygon,
  YMaps,
  ZoomControl
} from "react-yandex-maps";
import DataPopup from "./dataPopup";
import SettingsDialog from "./settingsDialog";
import "./styles.css";

const axios = require("axios");

const server_ip = "http://51.250.46.109:8080/";

const mapState = {
  center: [37.5, 45.1],
  zoom: 10,
  controls: [],
};

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      ymaps: null,
      rects: [],
      circles: [],
      geodata: [],
      pg: [],
      p_index: 0,
      yard_id: -1,
      settignsData: {
        before: { value: 2, title: "Сколько дней в прошлое" },
        after: { value: 2, title: "Сколько дней в будущее" },
      },
      selectedDate: "2021-07-31",
      popupIsOpen: false,
      settingsIsOpen: false,
      loading: false,
      placeData: {},
      showPolygons: false,
    };
  }

  componentDidMount() {
    document.title = "Система предсказания болезней виноградников";

    this.getVineData();
    //this.getMap();
  }

  setVineData = (data) => {
    let keys = Object.keys(data);
    let geo_array = [];

    for (let i = 0; i < keys.length; i++) {
      let tmp_obj = {
        id: keys[i],
        geometry: { coordinates: [...data[keys[i]].coordinates] },
      };
      geo_array.push(tmp_obj);
    }

    this.setState({ geodata: geo_array });
  };

  getMap = () => {
    var self = this;

    axios.defaults.headers.get["Content-Type"] =
      "application/json;charset=utf-8";
    axios.defaults.headers.get["Access-Control-Allow-Origin"] = "*";

    axios.get(server_ip + "map").then((resp) => {
      self.setState({ geodata: [...resp.data] });
    });
  };

  getVineData = () => {
    var self = this;

    axios.defaults.headers.get["Content-Type"] =
      "application/json;charset=utf-8";
    axios.defaults.headers.get["Access-Control-Allow-Origin"] = "*";

    axios.get(server_ip + "vineyards").then((resp) => {

      if (resp.data) {
        self.setState({ circles: [...resp.data] });
      }
      //self.setVineData(resp.data);
    });
  };

  addPlace = (name, lat, lon) => {
    axios.defaults.headers.post["Content-Type"] =
      "application/json;charset=utf-8";
    axios.defaults.headers.post["Access-Control-Allow-Origin"] = "*";

    let self = this;

    axios.post(server_ip + "vineyards", { name, lat, lon }).then((resp) => {
      self.getVineData();
    });
  };

  getPolygonInfo = (item) => {
    var self = this;
    
  };

  getPlaceInfo = (item) => {
    var self = this;

    axios.defaults.headers.get["Content-Type"] =
      "application/json;charset=utf-8";
    axios.defaults.headers.get["Access-Control-Allow-Origin"] = "*";

    axios
      .get(
        server_ip +
          "vineyards/" +
          item.id +
          "/alerts?date=" +
          this.state.selectedDate
      )
      .then(
        (resp) => {
          console.log(resp.data);
          if (resp.data) {
            self.setState({
              placeData: {
                ...resp.data,
                name: item.name,
                lat: item.lat,
                lon: item.lon,
                id: item.id,
              },
            });
          }
        },
        (err) => {}
      );
  };

  delPlace = (id) => {
    let isDel = window.confirm("Удалить место?");
    if (isDel) {
      this.setState({ popupIsOpen: false, placeData: {} });

      axios.defaults.headers.delete["Content-Type"] =
        "application/json;charset=utf-8";
      axios.defaults.headers.delete["Access-Control-Allow-Origin"] = "*";

      let self = this;

      axios.delete(server_ip + "vineyards/" + id).then(
        (resp) => {
          self.getVineData();
        },
        (err) => alert("Не удалось удалить место")
      );
    }
  };

  setCenter = (ref) => {
    const { ymaps } = this.state;

    if (ymaps) {
      const map = ref.getMap();
      const result = ymaps.util.bounds.getCenterAndZoom(
        ref.geometry.getBounds(),
        map.container.getSize()
      );

      // Setting the optimal center and zoom level of the map.
      map.setCenter(result.center, result.zoom);
    }
  };

  resetMarkers = () => {
    this.setState({ circles: [] });
  };

  togglePolygons = () => {
    const { showPolygons } = this.state;
    this.setState({ showPolygons: !showPolygons });
  };

  selectMarker = (item, index) => {
    this.setState({ popupIsOpen: true, popupId: item.id });
    this.getPlaceInfo(item);
  };

  addMarker = (event) => {
    const coordinates = event.get("coords");

    var name = prompt("Введите название виноградника", "Виноградник");

    if (!name) return;

    this.addPlace(name, coordinates[1], coordinates[0]);
  };

  closeSettings = (data) => {
    this.setState({ settingsIsOpen: false });

    if (!data) return;

    this.setState({ settignsData: { ...data } });
  };

  //  <SearchControl/>

  render() {
    const {
      circles,
      geodata,
      filtersDesc,
      filtersShow,
      yard_id,
      loading,
      filterStr,
      filtersData,
      selectedDate,
      popupIsOpen,
      showPolygons,
      placeData,
      settingsIsOpen,
      settignsData,
    } = this.state;

    let self = this;
    console.log(selectedDate);

    return (
      <div className="App">
        <YMaps
          query={{ lang: "ru_RU", load: "util.bounds", coordorder: "longlat" }}
        >
          <Map
            defaultState={mapState}
            instanceRef={(map) => {
              if (map) {
                this.mapRef = map;
              }
            }}
            modules={["Polygon", "geoObject.addon.editor"]}
            onLoad={(ref) => (this.ymapRef = ref)}
            onClick={this.addMarker}
            style={{
              width: "98vw",
              height: "96vh",
            }}
          >
            {showPolygons &&
              geodata.length > 0 &&
              geodata.map((item, index) => (
                <Polygon
                  key={index}
                  geometry={item.geometry}
                  options={{
                    fillColor: item.id == yard_id ? "#FFFF00" : "#00FF00",
                    strokeColor: "#013210",
                    opacity: 0.5,
                    strokeWidth: 2,
                    strokeStyle: "shortdash",
                  }}
                />
              ))}

            {circles.map((item, index) => (
              <Placemark
                key={index}
                geometry={[item.lon, item.lat]}
                onClick={() => self.selectMarker(item, index)}
                properties={{
                  hintContent: item.name,
                  iconCaption: item.name,
                }}
              />
            ))}

            <Button
              options={{ maxWidth: 150 }}
              data={{
                content: showPolygons ? "Cкрыть полигоны" : "Показать полигоны",
              }}
              onClick={this.togglePolygons}
            />
            <Button
              options={{ maxWidth: 150 }}
              data={{
                content: "Настройки",
              }}
              onClick={() => this.setState({ settingsIsOpen: true })}
            />
            <ZoomControl />
          </Map>
        </YMaps>
        <div style={{ position: "absolute", right: 10, top: 10 }}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => this.setState({ selectedDate: e.target.value })}
          />
        </div>
        {loading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "#eee",
              opacity: 0.5,
              zIndex: 999,
            }}
          >
            Загрузка
          </div>
        )}
        {popupIsOpen && (
          <DataPopup
            onClose={() => this.setState({ popupIsOpen: false, placeData: {} })}
            data={placeData}
            delPlace={this.delPlace}
          />
        )}
        {settingsIsOpen && (
          <SettingsDialog
            onClose={self.closeSettings}
            settingsData={settignsData}
          />
        )}
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
