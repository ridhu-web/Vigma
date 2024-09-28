import React, { useState, useEffect, useRef, useContext } from "react";
import * as d3 from "d3";
import "./lineChart.css";
import { GlobalContext } from "../globalHighlight/GlobalContext";

const LineChart = ({ chartData }) => {
  const svgRef = useRef();
  const containerRef = useRef(); // Ref for the container

  const [active, setActive] = useState(chartData.active);
  const selectedColumn = chartData.parameter;
  const group1Data = chartData.group1Data;
  const group2Data = chartData.group2Data;
  const group1AllData = chartData.group1AllData;
  const group2AllData = chartData.group2AllData;
  const group1Label = chartData.group1Label;
  const group2Label = chartData.group2Label;
  const selectedFooting1 = chartData.group1Footing;
  const selectedFooting2 = chartData.group2Footing;
  const group1Cycle = chartData.group1GaitCycle;
  const group2Cycle = chartData.group2GaitCycle;
  const spreadOption = chartData.spreadOption;

  const [dimensions, setDimensions] = useState({ width: 450, height: 300 }); // State for dimensions

  const { globalArray, setGlobalArray } = useContext(GlobalContext);
  const selectedKeysRefG1 = useRef(globalArray);
  const { globalArray2, setGlobalArray2 } = useContext(GlobalContext);
  const selectedKeysRefG2 = useRef(globalArray2);

  // Sync the ref with the current state
  useEffect(() => {
    selectedKeysRefG1.current = globalArray;
  }, [globalArray]);

  useEffect(() => {
    selectedKeysRefG2.current = globalArray2;
  }, [globalArray2]);

  const handleLineClickG1 = (key, visibleLine) => {
    setGlobalArray((prevKeys) => {
      const newKeys = prevKeys.includes(key)
        ? prevKeys.filter((k) => k !== key)
        : [...prevKeys, key];
      visibleLine.attr(
        "class",
        newKeys.includes(key) ? "line-highlight" : "line-normal"
      );
      return newKeys;
    });
  };

  const handleLineClickG2 = (key, visibleLine) => {
    setGlobalArray2((prevKeys) => {
      const newKeys = prevKeys.includes(key)
        ? prevKeys.filter((k) => k !== key)
        : [...prevKeys, key];
      visibleLine.attr(
        "class",
        newKeys.includes(key) ? "line-highlight-2" : "line-normal-2"
      );
      return newKeys;
    });
  };

  // Active groups
  const [activeGroups, setActiveGroups] = useState([true, true]);

  // Map selectedColumn from ['Foot', 'Shank', 'Thigh', 'Trunk', 'Hip', 'Anterior-Posterior', 'MedioLateral', 'Vertical', 'Spatiotemporal'] -> ['foot', 'shank', 'thigh', 'trunk', 'hipx', 'AP', 'ML', 'VT', 'STP']
  const dict = {
    foot: "Foot",
    shank: "Shank",
    thigh: "Thigh",
    trunk: "Trunk",
    hipx: "Hip Position",
    AP: "Anterior-Posterior",
    ML: "MedioLateral",
    VT: "Vertical",
    STP: "Spatiotemporal",
  };

  useEffect(() => {
    // Synchronize active state with chartData.active
    setActive(chartData.active);
  }, [chartData.active]); // Only re-run the effect if chartData.active changes

  useEffect(() => {
    // Resize observer for the container
    const observeTarget = containerRef.current;
    const resizeObserver = new ResizeObserver((entries) => {
      let { width, height } = entries[0].contentRect;
      if (width > 10 && height > 10) {
        // Use whatever minimum you deem appropriate
        setDimensions({ width: width, height: height });
      }
    });

    if (observeTarget) {
      resizeObserver.observe(observeTarget);
    }

    // Cleanup for the observer
    return () => {
      if (observeTarget) {
        resizeObserver.unobserve(observeTarget);
      }
    };
  }, []);

  // useEffect(() => {
  //   // Tooltip setup
  //   setSelectedKeysG1([]);
  //   setSelectedKeysG2([]);
  // }, [chartData]);

  useEffect(() => {
    if (!active) return;
    d3.select(svgRef.current).selectAll("*").remove();

    // set the dimensions and margins of the graph
    const dynamicMargin = {
      top: dimensions.height * 0.1,
      right: dimensions.width * 0.05,
      bottom: dimensions.height * 0.15,
      left: dimensions.width * 0.1,
    };
    const dynamicWidth =
      dimensions.width - dynamicMargin.left - dynamicMargin.right;
    const dynamicHeight =
      dimensions.height - dynamicMargin.top - dynamicMargin.bottom;

    // append the svg object to the body of the page
    const svg = d3
      .select(svgRef.current)
      .attr("width", dynamicWidth + dynamicMargin.left + dynamicMargin.right)
      .attr("height", dynamicHeight + dynamicMargin.top + dynamicMargin.bottom)
      .append("g")
      .attr(
        "transform",
        `translate(${dynamicMargin.left},${dynamicMargin.top})`
      );

    // Add X axis --> it is a date format
    var x = d3.scaleLinear().domain([0, 100]).range([0, dynamicWidth]);
    svg
      .append("g")
      .attr("transform", "translate(0," + dynamicHeight + ")")
      .style("font-family", "Roboto, sans-serif")
      .style("font-size", "12px")
      .call(d3.axisBottom(x));

    // Find min and max values
    const group1Min = d3.min(group1Data, (d) => d.l);
    const group1Max = d3.max(group1Data, (d) => d.u);

    const group1AllMin = d3.min(
      Object.values(group1AllData).flat(),
      (d) => d.col
    );
    const group1AllMax = d3.max(
      Object.values(group1AllData).flat(),
      (d) => d.col
    );

    let group2Min, group2Max, group2AllMin, group2AllMax;
    group2Min = group2AllMin = Infinity;
    group2Max = group2AllMax = -Infinity;

    if (chartData.groupExploration) {
      group2Min = d3.min(group2Data, (d) => d.l);
      group2Max = d3.max(group2Data, (d) => d.u);

      group2AllMin = d3.min(Object.values(group2AllData).flat(), (d) => d.col);
      group2AllMax = d3.max(Object.values(group2AllData).flat(), (d) => d.col);
    }

    // Calculate overall min and max
    const overallMin = Math.min(group1Min, group2Min);
    const overallMax = Math.max(group1Max, group2Max);

    const overallAllDataMin = Math.min(group1AllMin, group2AllMin) - 0.005;
    const overallAllDataMax = Math.max(group1AllMax, group2AllMax) + 0.005;

    // Add Y axis
    var y = d3
      .scaleLinear()
      .domain([overallMin, overallMax])
      .range([dimensions.height - dynamicMargin.top - dynamicMargin.bottom, 0]);

    y = d3
      .scaleLinear()
      .domain([overallAllDataMin, overallAllDataMax])
      .range([dimensions.height - dynamicMargin.top - dynamicMargin.bottom, 0]);

    // Add X grid lines
    svg
      .append("g")
      .attr("class", "grid")
      .attr(
        "transform",
        "translate(0," +
          dimensions.height -
          dynamicMargin.top -
          dynamicMargin.bottom +
          ")"
      )
      .call(
        d3
          .axisBottom(x)
          .tickSize(
            dimensions.height - dynamicMargin.top - dynamicMargin.bottom
          )
          .tickFormat("")
        // .tickValues(x.ticks().filter(function(d) { return d < 50; }))
      );

    // Add Y grid lines
    svg
      .append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(y)
          .tickSize(
            -dimensions.width + dynamicMargin.right + dynamicMargin.left
          )
          .tickFormat("")
          .ticks(7)
        // .tickValues(y.ticks().filter(function(d) { return d <10; }))
      );

    const isNarrowScreen = dynamicWidth < 405;
    let yAxis = d3.axisLeft(y).ticks(7);
    if (isNarrowScreen) {
      const customTickValues = [
        y.ticks(7)[0],
        y.ticks(7)[1],
        y.ticks(7)[2],
        y.ticks(7)[y.ticks(7).length - 3],
        y.ticks(7)[y.ticks(7).length - 2],
        y.ticks(7)[y.ticks(7).length - 1],
      ];
      yAxis.tickValues(customTickValues);
    }

    // console.log(y.domain())

    // Apply the y-axis to the SVG
    svg
      .append("g")
      .style("font-family", "Roboto, sans-serif")
      .style("font-size", "12px")
      .call(yAxis);

    // Add the line
    // #fc8d62, #66c2a5

    if (activeGroups[0]) {
      svg
        .append("path")
        .datum(group1Data)
        .attr("fill", "none")
        .attr("stroke", "#fc8d62")
        // .attr("class", "line group1")
        .attr(
          "d",
          d3
            .line()
            .x(function (d) {
              return x(d.time);
            })
            .y(function (d) {
              return y(d.m);
            })
        )
        .attr("stroke-width", 3);

      if (spreadOption === "Spread" || spreadOption === "Default") {
        Object.entries(group1AllData).forEach(([key, array]) => {
          if (selectedKeysRefG1.current.includes(key)) {
            const visibleLine = svg
              .append("path")
              .datum(array)
              .attr("fill", "none")
              .attr("stroke", "#fc8d62")
              .attr("stroke-dasharray", "10")
              .attr("opacity", 1)
              .attr(
                "d",
                d3
                  .line()
                  .x((d) => x(d.time))
                  .y((d) => y(d.col))
              );
            visibleLine.attr("class", "line-highlight");
          }
        });
      }

      if (spreadOption === "Spread") {
        // Show confidence interval
        svg
          .append("path")
          .datum(group1Data)
          .attr("fill", "#fc8d62")
          .attr("stroke", "#fc8d62")
          .attr("opacity", 0.5)
          // .attr("class", "line group1")
          .attr(
            "d",
            d3
              .area()
              .x(function (d) {
                return x(d.time);
              })
              .y0(function (d) {
                return y(d.l);
              })
              .y1(function (d) {
                return y(d.u);
              })
          );
      } else if (spreadOption === "All data") {
        // Add all lines
        Object.entries(group1AllData).forEach(([key, array]) => {
          const visibleLine = svg
            .append("path")
            .datum(array)
            .attr("fill", "none")
            .attr("stroke", "#fc8d62")
            .attr("stroke-dasharray", "10")
            .attr("opacity", 0.5)
            .attr(
              "d",
              d3
                .line()
                .x((d) => x(d.time))
                .y((d) => y(d.col))
            );

          // Then, append the transparent, wider "hit area" path
          svg
            .append("path")
            .datum(array)
            .attr("fill", "none")
            .attr("stroke", "transparent") // Invisible stroke
            .attr("stroke-width", 5) // Adjust the width to increase the hit area size
            .attr(
              "d",
              d3
                .line()
                .x((d) => x(d.time))
                .y((d) => y(d.col))
            )
            .on("mouseover", function (event, d) {
              visibleLine.attr("class", "line-highlight");

              const [mouseX, mouseY] = d3.pointer(event);
              const tooltipText = `${key}`;

              // Append tooltip container
              const tooltip = svg
                .append("g")
                .attr("class", "tooltip")
                .style("pointer-events", "none")
                .style("opacity", 0);

              // Append tooltip text
              const textElement = tooltip
                .append("text")
                .attr("x", mouseX + 15)
                .attr("y", mouseY - 15)
                .attr("fill", "black")
                .text(tooltipText);

              // Get the width of the text element
              const textWidth = textElement.node().getBBox().width;

              // Append tooltip background
              tooltip
                .append("rect")
                .attr("x", mouseX + 10)
                .attr("y", mouseY - 28)
                .attr("width", textWidth + 10) // Add some padding
                .attr("height", 18) // Add some padding
                .attr("rx", 4)
                .attr("ry", 4)
                .attr("fill", "white")
                .attr("stroke", "black")
                .attr("stroke-width", 0.5)
                .style("opacity", 0.7);

              // Move text to be on top of the rectangle
              textElement.raise();

              tooltip.style("opacity", 1);
            })
            .on("mouseout", function (d) {
              const isKeySelected = selectedKeysRefG1.current.includes(key);
              visibleLine.attr(
                "class",
                isKeySelected ? "line-highlight" : "line-normal"
              );

              // Remove tooltip
              svg.selectAll(".tooltip").remove();
            })
            .on("click", () => handleLineClickG1(key, visibleLine));

          if (selectedKeysRefG1.current.includes(key)) {
            visibleLine.attr("class", "line-highlight");
          }
        });
      }
    }

    // Add title
    svg
      .append("text")
      .attr("x", dynamicWidth / 2)
      .attr("y", -dynamicMargin.top / 3)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-family", "Roboto, sans-serif")
      .style("font-weight", "bold")
      .attr("opacity", 0.8)
      // .style("text-decoration", "underline")
      .text(dict[`${selectedColumn}`]);

    // Add x-axis label
    svg
      .append("text")
      .attr(
        "transform",
        `translate(${dynamicWidth / 2}, ${
          dimensions.height - dynamicMargin.bottom / 1.25
        })`
      )
      .style("text-anchor", "middle")
      .style("font-family", "Roboto, sans-serif")
      .attr("opacity", 0.7)
      .text("Gait Cycle (%)");

    // Add y-axis label
    let txt = svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -dynamicMargin.left / 1.1)
      .attr("x", -dimensions.height / 2.5)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-family", "Roboto, sans-serif")
      // change opacity of the text
      .style("opacity", 0.7);
    if (
      selectedColumn === "AP" ||
      selectedColumn === "ML" ||
      selectedColumn === "VT"
    ) {
      txt.text("Force (N)");
    } else {
      txt.text("Angle (°)");
    }

    if (activeGroups[1] && chartData.groupExploration) {
      svg
        .append("path")
        .datum(group2Data)
        .attr("fill", "none")
        .attr("stroke", "#66c2a5") //green line
        .attr("stroke-width", 1.5)
        // .attr("class", "line group2")
        .attr(
          "d",
          d3
            .line()
            .x(function (d) {
              return x(d.time);
            })
            .y(function (d) {
              return y(d.m);
            })
        )
        .attr("stroke-width", 3);

      if (spreadOption === "Spread" || spreadOption === "Default") {
        // add group2AllDataSample if Global filter. Only if spread option is Spread or Default
        Object.entries(group2AllData).forEach(([key, array]) => {
          if (selectedKeysRefG2.current.includes(key)) {
            const visibleLine = svg
              .append("path")
              .datum(array)
              .attr("fill", "none")
              .attr("stroke", "#66c2a5")
              .attr("stroke-dasharray", "10")
              .attr("opacity", 1)
              // .attr("class", "line group1")
              .attr(
                "d",
                d3
                  .line()
                  .x((d) => x(d.time))
                  .y((d) => y(d.col))
              );
            visibleLine.attr("class", "line-highlight-2");
          }
        });
      }
      if (spreadOption === "Spread") {
        svg
          .append("path")
          .datum(group2Data)
          .attr("fill", "#66c2a5") //green spread
          .attr("stroke", "#66c2a5")
          .attr("opacity", 0.3)
          // .attr("class", "line group2")
          .attr(
            "d",
            d3
              .area()
              .x(function (d) {
                return x(d.time);
              })
              .y0(function (d) {
                return y(d.l);
              })
              .y1(function (d) {
                return y(d.u);
              })
          );
      } else if (spreadOption === "All data") {
        // Add all lines
        Object.entries(group2AllData).forEach(([key, array]) => {
          const visibleLine = svg
            .append("path")
            .datum(array)
            .attr("fill", "none")
            .attr("stroke", "#66c2a5")
            .attr("stroke-dasharray", "10") // Dashed lines
            .attr("opacity", 0.5) // Lower opacity
            // .attr("class", "line group2")
            .attr(
              "d",
              d3
                .line()
                .x((d) => x(d.time))
                .y((d) => y(d.col))
            );

          // Then, append the transparent, wider "hit area" path
          svg
            .append("path")
            .datum(array)
            .attr("fill", "none")
            .attr("stroke", "transparent") // Invisible stroke
            .attr("stroke-width", 5) // Adjust the width to increase the hit area size
            // .attr("class", "line group2")
            .attr(
              "d",
              d3
                .line()
                .x((d) => x(d.time))
                .y((d) => y(d.col))
            )
            .on("mouseover", function (event, d) {
              visibleLine.attr("class", "line-highlight-2");
              const [mouseX, mouseY] = d3.pointer(event);
              const tooltipText = `${key}`;

              // Append tooltip container
              const tooltip = svg
                .append("g")
                .attr("class", "tooltip")
                .style("pointer-events", "none")
                .style("opacity", 0);

              // Append tooltip text
              const textElement = tooltip
                .append("text")
                .attr("x", mouseX + 15)
                .attr("y", mouseY - 15)
                .attr("fill", "black")
                .text(tooltipText);

              // Get the width of the text element
              const textWidth = textElement.node().getBBox().width;

              // Append tooltip background
              tooltip
                .append("rect")
                .attr("x", mouseX + 10)
                .attr("y", mouseY - 28)
                .attr("width", textWidth + 10) // Add some padding
                .attr("height", 18) // Add some padding
                .attr("rx", 4)
                .attr("ry", 4)
                .attr("fill", "white")
                .attr("stroke", "black")
                .attr("stroke-width", 0.5)
                .style("opacity", 0.7);

              // Move text to be on top of the rectangle
              textElement.raise();

              tooltip.style("opacity", 1);
            })
            .on("mouseout", function (d) {
              const isKeySelected = selectedKeysRefG2.current.includes(key);
              visibleLine.attr(
                "class",
                isKeySelected ? "line-highlight-2" : "line-normal-2"
              );

              // Remove tooltip
              svg.selectAll(".tooltip").remove();
            })
            .on("click", () => handleLineClickG2(key, visibleLine));

          if (selectedKeysRefG2.current.includes(key)) {
            visibleLine.attr("class", "line-highlight-2");
          }
        });
      }
    }

    if (spreadOption === "Spread" || spreadOption === "Default") {
      // Circles for highlighting points
      const circle1 = svg
        .append("circle")
        .attr("r", 5)
        .attr("fill", "#fc8d62")
        .style("opacity", 0);

      // Initialize text for highlighting points, keep them hidden initially
      const text1 = svg
        .append("text")
        .attr("fill", "#d95f02") // Match the first line color or choose a visible color
        .style("opacity", 0)
        .attr("text-anchor", "middle"); // Center the text on its x position

      let circle2 = svg;
      let text2;

      if (chartData.groupExploration) {
        circle2 = svg
          .append("circle")
          .attr("r", 5)
          .attr("fill", "#66c2a5") // Change to match your line color
          .style("opacity", 0);

        text2 = svg
          .append("text")
          .attr("fill", "#1b9e77") // Match the second line color or choose a visible color
          .style("opacity", 0)
          .attr("text-anchor", "middle"); // Center the text on its x position
      }

      // Tooltip and mouse tracking logic
      const mouseG = svg.append("g").attr("class", "mouse-over-effects");

      mouseG
        .append("rect")
        .attr("width", dynamicWidth)
        .attr("height", dynamicHeight)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .on("mousemove", (event) => {
          const mouseX = d3.pointer(event)[0];
          const x0 = x.invert(mouseX);
          const bisectDate = d3.bisector((d) => d.time).left;
          const i1 = bisectDate(group1Data, x0, 1);
          const d1 = group1Data[Math.max(0, i1 - 1)];

          let d2, i2;
          if (chartData.groupExploration) {
            i2 = bisectDate(group2Data, x0, 1);
            d2 = group2Data[Math.max(0, i2 - 1)];
          }

          if (d1 && activeGroups[0]) {
            const y1 = y(d1.m);
            circle1.attr("cx", x(d1.time)).attr("cy", y1).style("opacity", 1);
          }

          if (d2 && activeGroups[1] && chartData.groupExploration) {
            const y2 = y(d2.m);
            circle2.attr("cx", x(d2.time)).attr("cy", y2).style("opacity", 1);
          }

          // Define offsets and height adjustments
          const lineSpacing = 20; // Space between lines of text
          const textHeight = 3 * lineSpacing; // Adjust based on number of lines
          const offset = 27; // Adjust based on spacing from circle

          // Dynamically adjust text positions to prevent overlap
          let textY1 = y(d1.m) - offset - textHeight; // Default above the circle

          let textY2;
          if (chartData.groupExploration) {
            textY2 = y(d2.m) + offset; // Default below the circle
          }

          if (d1 && d2 && Math.abs(textY1 - textY2) < 2 * offset) {
            // Adjust positions if too close

            if (y(d1.m) < y(d2.m)) {
              textY1 = y(d1.m) - offset - textHeight;
              textY2 = y(d2.m) + offset;
            } else {
              textY1 = y(d1.m) + offset;
              textY2 = y(d2.m) - offset - textHeight;
            }
          }

          if (d1 && activeGroups[0]) {
            text1
              .attr("x", x(d1.time))
              .attr("y", textY1)
              .style("opacity", 1)
              .style("font-family", "Roboto, sans-serif")
              .style("font-size", "16px");
            text1.selectAll("*").remove(); // Clear previous texts
            text1
              .append("tspan")
              .attr("x", x(d1.time))
              .attr("y", textY1)
              .text(`U: ${Number(d1.u).toFixed(2)}`);
            text1
              .append("tspan")
              .attr("x", x(d1.time))
              .attr("y", textY1 + lineSpacing)
              .text(`M: ${Number(d1.m).toFixed(2)}`);
            text1
              .append("tspan")
              .attr("x", x(d1.time))
              .attr("y", textY1 + 2 * lineSpacing)
              .text(`L: ${Number(d1.l).toFixed(2)}`);
          }

          if (d2 && activeGroups[1] && chartData.groupExploration) {
            text2
              .attr("x", x(d2.time))
              .attr("y", textY2)
              .style("opacity", 1)
              .style("font-family", "Roboto, sans-serif")
              .style("font-size", "16px");
            text2.selectAll("*").remove(); // Clear previous texts
            text2
              .append("tspan")
              .attr("x", x(d2.time))
              .attr("y", textY2)
              .text(`U: ${Number(d2.u).toFixed(2)}`);
            text2
              .append("tspan")
              .attr("x", x(d2.time))
              .attr("y", textY2 + lineSpacing)
              .text(`M: ${Number(d2.m).toFixed(2)}`);
            text2
              .append("tspan")
              .attr("x", x(d2.time))
              .attr("y", textY2 + 2 * lineSpacing)
              .text(`L: ${Number(d2.l).toFixed(2)}`);
          }
        })
        .on("mouseout", () => {
          circle1.style("opacity", 0);
          if (chartData.groupExploration) circle2.style("opacity", 0);
          text1.style("opacity", 0);
          if (chartData.groupExploration) text2.style("opacity", 0);
        });
    }
    // Legends setup
    const legendX = dynamicMargin.left; // Adjust this value as needed, to position legends from the right side
    const legendYStart = dynamicMargin.top / 6; // Start position for the first legend, adjust as needed
    const legendSpacing = 20; // Space between each legend item

    // `${group1Label} ${selectedFooting1} ${group1Cycle !== "NA" ? "Limb " + group1Cycle + " Cycle" : ""}`

    const legendData = [
      {
        color: "#fc8d62",
        text: `${group1Label} [${
          selectedFooting1 !== "NA" ? " Limb: " + selectedFooting1 + "," : ""
        } Cycle: ${group1Cycle} ]`,
        x: legendX,
        y: legendYStart,
      },
    ];

    if (chartData.groupExploration) {
      legendData.push({
        color: "#66c2a5",
        text: `${group2Label} [${
          selectedFooting2 !== "NA" ? " Limb: " + selectedFooting2 + "," : ""
        } Cycle: ${group2Cycle} ]`,
        x: legendX,
        y: legendYStart + legendSpacing,
      });
    }

    // Legends drawing code (remains the same)
    const legend = svg
      .selectAll(".legend")
      .data(legendData)
      .enter()
      .append("g")
      .attr("class", "legend")
      .style("font-family", "Roboto, sans-serif")
      .attr("id", (_, i) => `legend-${i}`);

    legend
      .append("rect")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("width", 18)
      .attr("height", 18)
      .attr("rx", 3)
      .attr("ry", 3)
      .style("fill", (d) => d.color)
      .style("opacity", (d) => {
        // Determine initial opacity based on active groups
        const groupClass = d.text.includes(group1Label) ? "group1" : "group2";
        return groupClass === "group1"
          ? activeGroups[0]
            ? 1
            : 0.5
          : activeGroups[1]
          ? 1
          : 0.5;
      })
      .on("click", function (event, d) {
        const groupClass = d.text.includes(group1Label) ? "group1" : "group2";

        // const isVisible =
        //   svg.selectAll(`.line.${groupClass}`).style("opacity") == 1;

        if (groupClass === "group1") {
          setActiveGroups([!activeGroups[0], activeGroups[1]]);
        } else {
          setActiveGroups([activeGroups[0], !activeGroups[1]]);
        }
      });

    legend
      .append("text")
      .attr("x", (d) => d.x + 22) // Position text slightly right of the rectangle
      .attr("y", (d) => d.y + 15) // Center text vertically with the rectangle
      .style("text-anchor", "start")
      .text((d) => d.text);
  }, [
    chartData,
    dimensions,
    active,
    activeGroups,
    selectedKeysRefG1.current,
    selectedKeysRefG2.current,
    globalArray,
    globalArray2,
  ]);

  // console.log(active, "active");

  return (
    // If active, display the SVG container and its content
    <div
      ref={containerRef}
      style={{ width: "100%", height: "95%", display: "block" }}
    >
      {active ? (
        <>
          <svg ref={svgRef} style={{ width: "100%", height: "100%" }}></svg>
        </>
      ) : (
        <div className="no-data"></div>
      )}
    </div>
  );
};

export default LineChart;
