import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";

import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import ListItemText from "@mui/material/ListItemText";
import Select from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";

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

export default function SettingsDialog({ onClose, settingsData }) {
  const [scroll, setScroll] = React.useState("paper");
  const [data, setData] = React.useState([]);

  const handleClose = (val) => {
    if (val === true) {
      onClose({ ...data });
    } else onClose(null);
  };

  React.useEffect(() => {
    let tmp_data = {};

    let sKeys = Object.keys(settingsData);

    for (let i = 0; i < sKeys.length; i++) {
      tmp_data[sKeys[i]] = settingsData[sKeys[i]];
    }
    setData(tmp_data);
  }, [settingsData]);

  return (
    <Dialog
      open={true}
      onClose={handleClose}
      scroll={scroll}
      aria-labelledby="scroll-dialog-title"
      aria-describedby="scroll-dialog-description"
      fullWidth={true}
      maxWidth={"md"}
    >
      <DialogTitle id="scroll-dialog-title">Настройки</DialogTitle>
      <DialogContent dividers={scroll === "paper"}>
        {Object.keys(data).map(function (item, index) {
          return (
            <div style={{ marginBottom: 5, display: 'flex', flexDirection: 'row' }}>
              <div style={{ minWidth: 240 }}>{data[item].title}</div>
              <input
                style={{ marginRight: 10, width:40 }}
                type="number"
                min={data[item].min}
                max={data[item].max}
                value={data[item].value}
                onChange={(e) => {
                  let tmpData = { ...data };
                  tmpData[item].value = e.target.value;
                  setData(tmpData);
                }}
              />
              <div>min: {data[item].min}, max: {data[item].max}</div>
            </div>
          );
        })}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => handleClose(false)}>ОТМЕНА</Button>
        <Button onClick={() => handleClose(true)}>СОХРАНИТЬ</Button>
      </DialogActions>
    </Dialog>
  );
}
