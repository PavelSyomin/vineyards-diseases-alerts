import React from "react";
import ReactDOM from "react-dom";
import {
  Button,
  Map,
  Placemark,
  Polygon,
  YMaps,
  ZoomControl,
  ListBox,
  ListBoxItem,
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
        forward: {
          value: 7,
          title: "Период прогнозирования   ",
          min: 3,
          max: 14,
        },
        back: {
          value: 2,
          title: "Учитывать предыдущие дни",
          min: 0,
          max: 3,
        },
        threshold: {
          value: 3,
          title: "Порог предупреждения об угрозе",
          min: 2,
          max: 7,
        },
      },
      selectedDate: "2021-07-31",
      popupIsOpen: false,
      settingsIsOpen: false,
      loading: false,
      placeData: {},
      isPlace: true,
      showPolygons: false,
    };
  }

  componentDidMount() {
    document.title = "Система предсказания болезней виноградников";

    this.getVineData(this.state.selectedDate);
    this.getMap(this.state.selectedDate);
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

  getMap = (selectedDate) => {
    var self = this;

    const { settignsData } = this.state;

    axios.defaults.headers.get["Content-Type"] =
      "application/json;charset=utf-8";
    axios.defaults.headers.get["Access-Control-Allow-Origin"] = "*";

    let params =
      "?with_alerts=1&date=" +
      selectedDate +
      "&back=" +
      settignsData.back.value +
      "&forward=" +
      settignsData.forward.value +
      "&threshold=" +
      settignsData.threshold.value;

    axios.get(server_ip + "map" + params).then((resp) => {
      self.setState({ geodata: [...resp.data] });
    });
  };

  getVineData = (selectedDate) => {
    var self = this;

    const { settignsData } = this.state;

    axios.defaults.headers.get["Content-Type"] =
      "application/json;charset=utf-8";
    axios.defaults.headers.get["Access-Control-Allow-Origin"] = "*";

    let params =
      "?with_alerts=1&date=" +
      selectedDate +
      "&back=" +
      settignsData.back.value +
      "&forward=" +
      settignsData.forward.value +
      "&threshold=" +
      settignsData.threshold.value;

    axios.get(server_ip + "vineyards" + params).then((resp) => {
      if (resp.data) {
        self.setState({ circles: [...resp.data] });
      }
    });
  };

  addPlace = (name, lat, lon) => {
    axios.defaults.headers.post["Content-Type"] =
      "application/json;charset=utf-8";
    axios.defaults.headers.post["Access-Control-Allow-Origin"] = "*";

    let self = this;

    axios.post(server_ip + "vineyards", { name, lat, lon }).then((resp) => {
      self.getVineData(this.state.selectedDate);
    });
  };

  getPolygonInfo = (item) => {

    console.log(item);

    var self = this;
    this.setState({
      popupIsOpen: true,
      popupId: item.id,
      placeData: { ...item },
      isPlace: false,
    });
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
          self.getVineData(this.state.selectedDate);
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
    this.setState({
      popupIsOpen: true,
      popupId: item.id,
      placeData: { ...item },
      isPlace: true,
    });
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

  changeDate = (e) => {
    this.setState({ selectedDate: e.target.value });
    this.getVineData(e.target.value);
    this.getMap(e.target.value);
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
      isPlace,
    } = this.state;

    let self = this;
    console.log(geodata);

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
                  onClick={() => self.getPolygonInfo(item)}
                  options={{
                    fillColor: (item.alerts_data  && item.alerts_data.alerts && item.alerts_data.alerts.color) ?? "#22ee22",
                    strokeColor: "#013210",
                    opacity: 0.5,
                    strokeWidth: 2,
                    strokeStyle: "shortdash",
                  }}
                />
              ))}

            {circles.map((item, index) => (
              <Placemark
                key={index+"_circle"}
                geometry={[item.lon, item.lat]}
                onClick={() => self.selectMarker(item, index)}
                properties={{
                  hintContent: item.name,
                  iconCaption: item.name,
                }}
                options={{
                  iconColor: item.alerts_data.alerts.color ?? "#33aa33",
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
            <ListBox data={{ content: "Список мест" }}>
              {circles.map((item) => (
                <ListBoxItem
                  data={{
                    content: item.name,
                  }}
                  options={{ selectOnClick: true }}
                  onClick={() => {
                    this.mapRef.setCenter([item.lon, item.lat], 10);
                  }}
                />
              ))}
            </ListBox>
            <ZoomControl />
          </Map>
        </YMaps>
        <div style={{ position: "absolute", right: 10, top: 10 }}>
          <input type="date" value={selectedDate} onChange={self.changeDate} />
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
            isPlace={isPlace}
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
