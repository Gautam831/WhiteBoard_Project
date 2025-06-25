import React, { useState, useEffect } from "react";

function Settings({ canvas }) {
    const [selectedObject, setSelectedObject] = useState(null);
    const [width, setWidth] = useState("");
    const [height, setHeight] = useState("");
    const [diameter, setDiameter] = useState("");
    const [color, setColor] = useState("");

    useEffect(() => {
        if (canvas) {
            const handleSelection = (e) => {
                const obj = e.selected ? e.selected[0] : null;
                setSelectedObject(obj);
                updateFormValues(obj);

                canvas.isDrawingMode = false;
            };

            const handleCleared = () => {
                setSelectedObject(null);
                updateFormValues(null);
            };

            const handleModification = (e) => {
                const obj = e.target;
                updateFormValues(obj);
            };

            const updateFormValues = (obj) => {
                if (obj) {
                    if (obj.type === "rect") {
                        setWidth((obj.width * obj.scaleX).toFixed(0));
                        setHeight((obj.height * obj.scaleY).toFixed(0));
                        setColor(obj.fill || "#000000");
                        setDiameter("");
                    } else if (obj.type === "circle") {
                        setDiameter((obj.radius * 2 * obj.scaleX).toFixed(0));
                        setColor(obj.fill || "#000000");
                        setWidth("");
                        setHeight("");
                    } else if (obj.type === "line") {
                        setColor(obj.stroke || "#000000");
                        setWidth("");
                        setHeight("");
                        setDiameter("");
                    } else if (obj.type === "textbox") {
                        setColor(obj.fill || "#000000");
                        setWidth("");
                        setHeight("");
                        setDiameter("");
                    }
                } else {
                    setWidth("");
                    setHeight("");
                    setDiameter("");
                    setColor("");
                }
            };

            canvas.on("selection:created", handleSelection);
            canvas.on("selection:updated", handleSelection);
            canvas.on("selection:cleared", handleCleared);
            canvas.on("object:modified", handleModification);

            return () => {
                canvas.off("selection:created", handleSelection);
                canvas.off("selection:updated", handleSelection);
                canvas.off("selection:cleared", handleCleared);
                canvas.off("object:modified", handleModification);
            };
        }
    }, [canvas]);

    const updateProperty = (prop, value) => {
        if (selectedObject && canvas) {
            if (prop === "width") {
                const newWidth = parseFloat(value);
                if (!isNaN(newWidth) && newWidth > 0) {
                    selectedObject.set({
                        scaleX: newWidth / selectedObject.width,
                    });
                    setWidth(value);
                }
            } else if (prop === "height") {
                const newHeight = parseFloat(value);
                if (!isNaN(newHeight) && newHeight > 0) {
                    selectedObject.set({
                        scaleY: newHeight / selectedObject.height,
                    });
                    setHeight(value);
                }
            } else if (prop === "diameter") {
                const newDiameter = parseFloat(value);
                if (!isNaN(newDiameter) && newDiameter > 0) {
                    const newRadius = newDiameter / 2;
                    selectedObject.set({
                        radius: newRadius,
                        scaleX: 1,
                        scaleY: 1,
                    });
                    setDiameter(value);
                }
            } else if (prop === "color") {
                if (selectedObject.type === "line") {
                    selectedObject.set({ stroke: value });
                } else {
                    selectedObject.set({ fill: value });
                }
                setColor(value);
            }
            canvas.renderAll();
        }
    };

    return (
        <div className="Settings" style={{ 
            padding: '20px', 
            border: '1px solid #ccc', 
            borderRadius: '8px',
            marginTop: '20px',
            backgroundColor: '#f9f9f9'
        }}>
            {selectedObject ? (
                <div>
                    <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Object Properties</h3>
                    <p style={{ marginBottom: '15px', fontWeight: 'bold' }}>
                        Selected: {selectedObject.type}
                    </p>
                    
                    {selectedObject.type === "rect" && (
                        <div style={{ marginBottom: '15px' }}>
                            <label>
                                Width:
                                <input
                                    type="number"
                                    value={width}
                                    onChange={(e) => updateProperty("width", e.target.value)}
                                    style={{ width: '100px', marginLeft: '5px' }}
                                    min="1"
                                />
                            </label>
                            <br />
                            <label>
                                Height:
                                <input
                                    type="number"
                                    value={height}
                                    onChange={(e) => updateProperty("height", e.target.value)}
                                    style={{ width: '100px', marginLeft: '5px' }}
                                    min="1"
                                />
                            </label>
                        </div>
                    )}

                    {selectedObject.type === "circle" && (
                        <div style={{ marginBottom: '15px' }}>
                            <label>
                                Diameter:
                                <input
                                    type="number"
                                    value={diameter}
                                    onChange={(e) => updateProperty("diameter", e.target.value)}
                                    style={{ width: '100px', marginLeft: '5px' }}
                                    min="1"
                                />
                            </label>
                        </div>
                    )}

                    <div style={{ marginBottom: '10px' }}>
                        <label>
                            {selectedObject.type === "line" ? "Line Color:" : "Fill Color:"}
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => updateProperty("color", e.target.value)}
                                style={{ marginLeft: '10px' }}
                            />
                        </label>
                    </div>
                </div>
            ) : (
                <div style={{ textAlign: 'center', color: '#666' }}>
                    <p>No object selected</p>
                    <p style={{ fontSize: '14px', margin: '10px 0' }}>
                        Click on an object in the canvas to edit its properties
                    </p>
                </div>
            )}
        </div>
    );
}

export default Settings;
