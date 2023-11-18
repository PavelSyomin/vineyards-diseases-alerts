import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';

import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';

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




function MinimumDistanceSlider(props) {
	
	
  
  //const [value2, setValue2] = React.useState([props.default_start.start, props.default_start.end]);

  const handleChange2 = (event, newValue, activeThumb) => {
    if (!Array.isArray(newValue)) {
      return;
    }

    if (newValue[1] - newValue[0] < minDistance) {
      if (activeThumb === 0) {
        const clamped = Math.min(newValue[0], 100 - minDistance);
        props.setValue2([clamped, clamped + minDistance]);
      } else {
        const clamped = Math.max(newValue[1], minDistance);
        props.setValue2([clamped - minDistance, clamped]);
      }
    } else {
      props.setValue2(newValue);
    }
  };

  return (
    <Box sx={{ width: 800 }}>
	  <Typography style={{marginBottom:30}}>
	  {props.label} 
      </Typography>
      <Slider
	    getAriaLabel={() => 'Minimum distance shift'}
		value={props.value2}
		 valueLabelDisplay="on"
        onChange={handleChange2}
        valueLabelDisplay="on"
		min={props.min}
		max={props.max}
		step={props.step}
        disableSwap
      />
    </Box>
  );
}



const names_src = [
  'Oliver Hansen',
  'Van Henry',
  'April Tucker',
  'Ralph Hubbard',
  'Omar Alexander',
  'Carlos Abbott',
  'Miriam Wagner',
  'Bradley Wilkerson',
  'Virginia Andrews',
  'Kelly Snyder',
];

function MultipleSelectCheckmarks(props) {
	
	const [names, setNames ] = React.useState([...props.options]);
	
  
  const handleChange = (event) => {
    const {
      target: { value },
    } = event;
	
	
    props.setPersonName(value);
      
  };
  
  
  function showData(selected)
  {
	  let tmp_arr = names.filter(e=>selected.indexOf(e.id)>=0)
	  tmp_arr = tmp_arr.map(e=>e.label);
	  
	  return tmp_arr.join(', ');
  }

  return (
    <div>
      <FormControl sx={{ m: 1, width: 800 }}>
        <InputLabel id="demo-multiple-checkbox-label">{props.label}</InputLabel>
        <Select
          labelId="demo-multiple-checkbox-label"
          id="demo-multiple-checkbox"
          multiple
          value={props.personName}
          onChange={handleChange}
          input={<OutlinedInput label="Tag" />}
          renderValue={(selected) => showData(selected)}
          MenuProps={MenuProps}
        >
          {names.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              <Checkbox checked={props.personName.indexOf(item.id) > -1} />
              <ListItemText primary={item.label} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}


export default function FilterDialog({onClose, filtersDesc, filtersData}) {
  
  const [scroll, setScroll] = React.useState('paper');
  const [ data, setData ] = React.useState([]);
  

  const handleClose = (val) => {
    //setOpen(false);
	
	if (val == true)
	{
		let tmp_val = [];
		for (let i=0;i<data.length;i++)
			tmp_val[i] = {name:filtersDesc[i].name,value:[...data[i]]}
			
		onClose(tmp_val);
	}
	else
		onClose(null);
  };
  
   React.useEffect(() => {
	   
	  console.log(filtersData);
    
	let tmp_data = [];
	
	for (let i=0;i<filtersDesc.length;i++)
	{
		if (filtersDesc[i].type == "range")
			tmp_data[i] = [filtersDesc[i].default_start.start,filtersDesc[i].default_start.end];
		if (filtersDesc[i].type == "select")
			tmp_data[i] = [...filtersDesc[i].default];
	}
	
	if (filtersData.length>0)
		for (let i=0;i<filtersData.length;i++)
			tmp_data[i] = [...filtersData[i].value];
		
	
	setData(tmp_data);
	
  }, []);

  const descriptionElementRef = React.useRef(null);
  
  function setTmpData(val,index) {
	  
	  let tmp_data = [...data];
	  tmp_data[index] = [...val];
	  setData(tmp_data);
  }
  
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
        <DialogTitle id="scroll-dialog-title">Фильтры</DialogTitle>
        <DialogContent dividers={scroll === 'paper'}>
		{filtersDesc.map(function(item,index){ 
		if (item.type == "range")
			return(
			<MinimumDistanceSlider {...item} value2={data[index]} setValue2={(e)=>setTmpData(e,index)}/>
			)
		
			return(
			<MultipleSelectCheckmarks {...item} personName={data[index]} setPersonName={(e)=>setTmpData(e,index)} />
			)
		
		})}
		
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>handleClose(false)}>ОТМЕНА</Button>
          <Button onClick={()=>handleClose(true)}>ОК</Button>
        </DialogActions>
      </Dialog>
 
  );
}