import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import * as React from "react";
import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";

const minDistance = 0;

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const getDM = (cur_date, skipYear = true) => {
  cur_date = cur_date.split("T")[0];
  cur_date = cur_date.split("-").reverse();
  if (skipYear) {
    cur_date.pop();
  }
  return cur_date.join("-");
};

const ChartData = ({ labels, title, color, values }) => {
  console.log(labels);

  const lineChartData = {
    labels: [...labels],
    datasets: [
      {
        data: values,
        label: title,
        borderColor: color,
        fill: true,
        lineTension: 0.5,
      },
    ],
  };

  return (
    <Line
      type="line"
      width={160}
      height={40}
      options={{
        legend: {
          display: true, //Is the legend shown?
          position: "top", //Position of the legend.
        },
      }}
      data={lineChartData}
    />
  );
};

export default function DataPopup({ onClose, delPlace, data }) {
  const [scroll, setScroll] = React.useState("paper");
  const [temper, setTemper] = React.useState([]);
  const [humid, setHumid] = React.useState([]);
  const [labels, setLabels] = React.useState([]);

  React.useEffect(() => {
    

    if (!data.alerts_data || !data.alerts_data.weather) return;

    let dt = [];
    let t_data = [];
    let h_data = [];
    const { weather } = data.alerts_data;

    for (let i = 0; i < weather.length; i++) {
      let cur_date = weather[i].dt;
      dt.push(getDM(cur_date));
      t_data[i] = weather[i].t;
      h_data[i] = weather[i].h;
    }

    setLabels(dt);
    setTemper(t_data);
    setHumid(h_data);
  }, [data]);

  const handleClose = (val) => {
    onClose(null);
  };

  console.log(data.alerts_data);

  return (
    <Dialog
      open={true}
      onClose={handleClose}
      scroll={scroll}
      aria-labelledby="scroll-dialog-title"
      aria-describedby="scroll-dialog-description"
      fullWidth={true}
      maxWidth={"lg"}
    >
      <DialogTitle id="scroll-dialog-title">Данные по болезням</DialogTitle>
      <DialogContent dividers={scroll === "paper"}>
        <div>
          {data.alerts_data &&
            data.alerts_data.alerts &&
            data.alerts_data.alerts.diseases &&
            data.alerts_data.alerts.diseases.length > 0 &&
            data.alerts_data.alerts.diseases.map(function (item) {
              return (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    marginBottom: 10,
                    fontSize: 18,
                  }}
                >
                  <div style={{ backgroundColor: item.type }}>
                    {item.name + ": " ?? ""}
                  </div>

                  {item.dt &&
                    item.dt.map((dItem, dIndex) => (
                      <div style={{ marginLeft: 5 }}>
                        {(dIndex > 0 ? ", " : "") + getDM(dItem, false)}
                      </div>
                    ))}
                </div>
              );
            })}
          {!data.alerts_data.alerts ||
          !data.alerts_data.alerts.diseases ||
            (data.alerts_data.alerts.diseases.length == 0 && (
              <div style={{ fontSize: 20 }}>Нет болезней</div>
            ))}
        </div>

        {labels.length > 0 && (
          <ChartData
            labels={labels}
            color="#ff3333"
            title="Температура"
            values={temper}
          />
        )}
        {labels.length > 0 && (
          <ChartData
            labels={labels}
            color="#3333ff"
            title="Влажность"
            values={humid}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            delPlace(data.id);
          }}
        >
          Удалить место
        </Button>
        <Button onClick={() => handleClose()}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
}
