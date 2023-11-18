import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import * as React from 'react';
import { Line } from "react-chartjs-2";
import Chart from 'chart.js/auto';

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



const ChartData = () => {
  const lineChartData = {
    labels: ["October", "November", "December"],
    datasets: [
      {
        data: [8137119, 9431691, 10266674],
        label: "Infected",
        borderColor: "#3333ff",
        fill: true,
        lineTension: 0.5
      },
      {
        data: [1216410, 1371390, 1477380],
        label: "Deaths",
        borderColor: "#ff3333",
        backgroundColor: "rgba(255, 0, 0, 0.5)",
        fill: true,
        lineTension: 0.5
      }
    ]
  };

  return (
    <Line
      type="line"
      width={160}
      height={60}
      options={{
        title: {
          display: true,
          text: "COVID-19 Cases of Last 6 Months",
          fontSize: 20
        },
        legend: {
          display: true, //Is the legend shown?
          position: "top" //Position of the legend.
        }
      }}
      data={lineChartData}
    />
  );
};

export default function DataPopup({onClose, delPlace, data}) {
  
  const [scroll, setScroll] = React.useState('paper');
  

  const handleClose = (val) => {
    onClose(null);
  };
  
  
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
        <DialogContent dividers={scroll === 'paper'}>
          <div>{JSON.stringify(data)}</div>
          <ChartData />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>delPlace(data.id)}>Удалить место</Button>
          <Button onClick={()=>handleClose()}>Закрыть</Button>
        </DialogActions>
      </Dialog>
 
  );
}