import { io } from "socket.io-client";
import React, { useEffect, useRef, useState } from "react";
import { Canvas, Circle, Rect, Textbox, Line, PencilBrush} from "fabric";

import "./styles.scss";
import {IconButton} from "blocksin-system";
import {CircleIcon, SquareIcon, TextIcon, EraserIcon, SlashIcon, Pencil1Icon, EyedropperIcon} from "sebikostudio-icons";
import Settings from "./settings";

const socket = io("http://localhost:4000");

function CanvasApplication(){
  const [selectedColor, setSelectedColor] = useState("#000000");
    const [hasEditPermission, setHasEditPermission] = useState(false);
    const canvasRef= useRef(null);
    const [canvas, setCanvas]= useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const isReceivingData = useRef(false);
    const lastCanvasState = useRef(null);


useEffect(() => {

  const password = prompt("Enter password to edit the canvas:");
  if (password === "YOUR_SECRET_PASSWORD") {
    setHasEditPermission(true);
  } else {
    setHasEditPermission(false);
    alert("You can view the canvas but cannot edit it.");
  };


  socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
    setIsConnected(true);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    setIsConnected(false);
  });

  if (canvasRef.current) {
    const initCanvas = new Canvas(canvasRef.current, {
      width: 1000,
      height: 600,
    });

    initCanvas.backgroundColor = "#fff";
    initCanvas.renderAll();

initCanvas.selection = hasEditPermission;
initCanvas.isDrawingMode = false;

if (!hasEditPermission) {
  initCanvas.forEachObject(obj => {
    obj.selectable = false;
    obj.evented = false;
  });
}


    const disableDrawingMode = () => {
      initCanvas.isDrawingMode = false;
    };

    const sendCanvasData = () => {
      if (isReceivingData.current) return;
      
      const json = initCanvas.toJSON();
      const jsonString = JSON.stringify(json);
      

      if (lastCanvasState.current !== jsonString) {
        lastCanvasState.current = jsonString;
        socket.emit("canvas-data", json);
      }
    };


    let sendTimeout;
    const debouncedSendCanvasData = () => {
      if (isReceivingData.current) return;
      
      clearTimeout(sendTimeout);
      sendTimeout = setTimeout(sendCanvasData, 16); 
    };

  

    const enableCanvasEvents = () => {
      initCanvas.on("selection:created", disableDrawingMode);
      initCanvas.on("selection:updated", disableDrawingMode);
      initCanvas.on("object:added", sendCanvasData);
      initCanvas.on("object:removed", sendCanvasData);
      initCanvas.on("object:modified", sendCanvasData);
      initCanvas.on("object:moving", debouncedSendCanvasData);
      initCanvas.on("object:scaling", debouncedSendCanvasData);
      initCanvas.on("object:rotating", debouncedSendCanvasData);
      initCanvas.on("object:skewing", debouncedSendCanvasData);
      initCanvas.on("text:changed", debouncedSendCanvasData);
      initCanvas.on("path:created", sendCanvasData);
      initCanvas.on("selection:cleared", sendCanvasData);
    };

    enableCanvasEvents();

    const handleWindowFocus = () => {
      console.log('Window focused, requesting latest canvas state');
      socket.emit('request-canvas-state');
    };

    const handleWindowBlur = () => {
      console.log('Window blurred');
      if (!isReceivingData.current) {
        sendCanvasData();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Tab became visible, requesting canvas state');
        setTimeout(() => {
          socket.emit('request-canvas-state');
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    socket.on("canvas-data", (json) => {
      console.log('Received canvas data:', json);
      const jsonString = JSON.stringify(json);
      
      isReceivingData.current = true;
      
      const activeObject = initCanvas.getActiveObject();
      const activeObjectId = activeObject ? activeObject.id : null;
      const isTextEditing = activeObject && activeObject.isEditing;
      
      const currentObjects = initCanvas.getObjects();
      
      if (json && json.objects) {
        initCanvas.off();
        
        initCanvas.clear();
        initCanvas.backgroundColor = json.background || "#fff";
        
        if (json.objects.length > 0) {
          initCanvas.loadFromJSON(json, () => {
            enableCanvasEvents();
            initCanvas.renderAll();
            setTimeout(() => {
              initCanvas.renderAll();
            }, 0);
            
            if (activeObjectId && !isTextEditing) {
              const objects = initCanvas.getObjects();
              const objectToSelect = objects.find(obj => obj.id === activeObjectId);
              if (objectToSelect) {
                initCanvas.setActiveObject(objectToSelect);
              }
            }
            
            lastCanvasState.current = jsonString;
            
            setTimeout(() => {
              isReceivingData.current = false;
            }, 10);
          });
        } else {
          enableCanvasEvents();
          initCanvas.renderAll();
          lastCanvasState.current = jsonString;
          setTimeout(() => {
            isReceivingData.current = false;
          }, 10);
        }
      }
    });

    socket.on('connect', () => {
      console.log('Connected, requesting canvas state');
      socket.emit('request-canvas-state');
    });

    setCanvas(initCanvas);

    return () => {
      clearTimeout(sendTimeout);
      
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      initCanvas.off("selection:created", disableDrawingMode);
      initCanvas.off("selection:updated", disableDrawingMode);
      initCanvas.off("object:added", sendCanvasData);
      initCanvas.off("object:modified", sendCanvasData);
      initCanvas.off("object:removed", sendCanvasData);
      initCanvas.off("object:moving", debouncedSendCanvasData);
      initCanvas.off("object:scaling", debouncedSendCanvasData);
      initCanvas.off("object:rotating", debouncedSendCanvasData);
      initCanvas.off("object:skewing", debouncedSendCanvasData);
      initCanvas.off("text:changed", debouncedSendCanvasData);
      initCanvas.off("path:created", sendCanvasData);
      initCanvas.off("selection:cleared", sendCanvasData);
      socket.off("canvas-data");
      socket.off("connect");
      initCanvas.dispose();
    };
  }

  return () => {
    socket.off('connect');
    socket.off('disconnect');
  };
}, []);

const toggleFreeDrawing = () => {
  if (canvas) {
    const drawing = !canvas.isDrawingMode;
    canvas.isDrawingMode = drawing;

    if (drawing) {
      
      if (!canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
      }
      
      canvas.freeDrawingBrush.color = "#000";
      canvas.freeDrawingBrush.width = 3;
    }

    canvas.renderAll();
  }
};

const drawLine = () => {
  if (!canvas) return;

  canvas.isDrawingMode = false;

  let isDrawing = false;
  let line;

  const startDrawing = (o) => {
    if (isReceivingData.current) return;
    
    isDrawing = true;
    const pointer = canvas.getPointer(o.e);
    const points = [pointer.x, pointer.y, pointer.x, pointer.y];
    line = new Line(points, {
      strokeWidth: 2,
      fill: 'black',
      stroke: 'black',
      originX: 'center',
      selectable:true,
      evented:true,
      originY: 'center',
      id: 'line_' + Date.now() + '_' + Math.random(), // Unique ID
    });
    canvas.add(line);
  };

  const draw = (o) => {
    if (!isDrawing || isReceivingData.current) return;
    const pointer = canvas.getPointer(o.e);
    line.set({ x2: pointer.x, y2: pointer.y });
    canvas.renderAll();
  };

  const stopDrawing = () => {
    isDrawing = false;
    canvas.off('mouse:down', startDrawing);
    canvas.off('mouse:move', draw);
    canvas.off('mouse:up', stopDrawing);
  };

  canvas.on('mouse:down', startDrawing);
  canvas.on('mouse:move', draw);
  canvas.on('mouse:up', stopDrawing);
};


const deleteSelected = () => {
  if (canvas && !isReceivingData.current) {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.remove(activeObject);
    }
  }
};

const addText = () => {
  if (canvas && !isReceivingData.current) {
    const textbox = new Textbox("Your Text Here", {
      left: 150,
      top: 150,
      width: 200,
      fontSize: 24,
      fill: "#333",
      lockScalingFlip: true,
      lockScalingY: false,
      lockScalingX: false,
      editable: true,
      fontFamily: "Arial",
      textAlign: "left",
      id: 'text_' + Date.now() + '_' + Math.random(), // Unique ID
    });
    canvas.add(textbox);
    canvas.setActiveObject(textbox);
  }
};

const addRectangle = () => {
  if (canvas && !isReceivingData.current) {
    const rect = new Rect({
      left: 100,
      top: 100,
      fill: "red",
      width: 60,
      height: 60,
      id: 'rect_' + Date.now() + '_' + Math.random(), // Unique ID
    });
    canvas.add(rect);
  }
};

const clearCanvas = () => {
  if (canvas && !isReceivingData.current) {
    const objects = canvas.getObjects();
    canvas.remove(...objects);

    canvas.discardActiveObject();

    canvas.backgroundColor = "#fff";

    canvas.renderAll();

    const json = canvas.toJSON();
    lastCanvasState.current = JSON.stringify(json);
    socket.emit("canvas-data", json);
  }
};


const handleColorChange = (color) => {
  setSelectedColor(color);
  if (canvas) {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      if (activeObject.type === "line") {
        activeObject.set({ stroke: color });
      } else {
        activeObject.set({ fill: color });
      }
      canvas.renderAll();
    }
  }
};

const addCircle = () => {
  if (canvas && !isReceivingData.current) {
    const circle = new Circle({
      left: 150,
      top: 150,
      radius: 50,
      fill: "yellow",
      id: 'circle_' + Date.now() + '_' + Math.random(), // Unique ID
    });
    canvas.add(circle);
  }
};

const exportPNG = () => {
  if (canvas) {
    const dataURL = canvas.toDataURL({
      format: "png",
      quality: 1.0,
    });

    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "canvas.png";
    link.click();
  }
};

return <div className="App">
  <div className="connection-status" style={{
    position: 'absolute', 
    top: '10px', 
    right: '10px', 
    padding: '5px 10px', 
    borderRadius: '5px',
    backgroundColor: isConnected ? '#4CAF50' : '#f44336',
    color: 'white',
    fontSize: '12px'
  }}>
    {isConnected ? 'Connected' : 'Disconnected'}
  </div>

  <div className="topMenu">
    <div className="Toolbar darkmode">
    <IconButton onClick={addRectangle} variant="ghost" size="medium" disabled={!hasEditPermission ||isReceivingData.current}>
      <SquareIcon />
    </IconButton>

    <IconButton onClick={addCircle} variant="ghost" size="medium" disabled={!hasEditPermission ||isReceivingData.current}>
      <CircleIcon />
    </IconButton>

    <IconButton onClick={addText} variant="ghost" size="medium" disabled={!hasEditPermission ||isReceivingData.current}>
      <TextIcon />
    </IconButton>

    <IconButton onClick={deleteSelected} variant="ghost" size="medium" disabled={!hasEditPermission ||isReceivingData.current}>
      <EraserIcon />
    </IconButton>

    <IconButton onClick={drawLine} variant="ghost" size="medium" disabled={!hasEditPermission ||isReceivingData.current}>
      <SlashIcon />
    </IconButton>

    <IconButton onClick={toggleFreeDrawing} variant="ghost" size="medium" disabled={!hasEditPermission ||isReceivingData.current}>
      <Pencil1Icon />
    </IconButton>

    <IconButton 
  onClick={clearCanvas} 
  variant="ghost" 
  size="medium" 
  disabled={isReceivingData.current}
>
  Clear
</IconButton>


    <IconButton as="label" style={{ padding: 0 }}>
  <input
    type="color"
    value={selectedColor}
    onChange={(e) => handleColorChange(e.target.value)}
    style={{ width: 32, height: 32, border: "none", background: "none", cursor: "pointer" }}
  />
</IconButton>

  </div>

  <div>
    <button className="export-btn" onClick={exportPNG}>Export PNG</button>
  </div>
  </div>

  
  
  <canvas id="canvas" ref={canvasRef}></canvas>
  
  {}
</div>
}

export default CanvasApplication;




