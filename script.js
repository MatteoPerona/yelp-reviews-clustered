function loadPlots() {
    let clusterSummaries = "cluster-summaries.csv";
    let nodeLink = "node-link-data.csv";
    let mapData = "business-locations.csv";

    summaryPlots(clusterSummaries);
    nodeLinkPlots(nodeLink);
    mapPlots(mapData);
}

let summaryPlots = function (filePath) {
    //preprocess data
    d3.csv(filePath).then(function (data) {
        data.forEach(d => {
            d.business_id = d.business_id,
                d.review_vol = +d.review_vol,
                d.x = +d.x,
                d.y = +d.y,
                d.top_words = d.top_words,
                d.cluster_n = +d.cluster_n
        });
        clusterPlot(data, 0);
    });
}

let nodeLinkPlots = function (filePath) {
    //preprocess data
    d3.csv(filePath).then(function (data) {
        data.forEach(d => {
            d.business_id = d.business_id,
                d.review_id = d.review_id,
                d.cluster_n = +d.cluster_n,
                d.source = +d.source,
                d.target = +d.target,
                d.value = +d.value,
                d.top_word = d.top_word
        });
        nodeLinkGraph(data, 0)
    });
}

let mapPlots = function (filePath) {
    d3.csv(filePath).then(function (data) {
        data.forEach(d => {
            d.business_id = d.business_id,
                d.x = +d.x,
                d.y = +d.y
        });
        mapPlot(data);
    });
}

let clusterPlot = function (data, businessIndex) {
    let businessIDs = [... new Set(d3.map(data, d => d.business_id))];

    let filtered_data = d3.filter(data, d => d.business_id === businessIDs[businessIndex]);
    filtered_data = filtered_data.sort((a, b) => d3.descending(a.review_vol, b.review_vol));

    var options = d3.select('#opts')
        .on('change', () => {
            var newData = d3.select('#opts').property('value');
            var newBusinessIndex = businessIDs.indexOf(newData)
            d3.select('#cluster_summary_plot').selectAll('*').remove();
            clusterPlot(data, newBusinessIndex);
        })
        .selectAll("option")
        .data(businessIDs)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);


    var margin = { top: 20, right: 30, bottom: 100, left: 70 },
        width = 700 - margin.left - margin.right,
        height = 700 - margin.top - margin.bottom;

    let svg = d3.select("#cluster_summary_plot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom + 50)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const scalePad = 50;

    var x = d3.scaleLinear()
        .domain([d3.min(filtered_data, d => d.x) - scalePad, d3.max(filtered_data, d => d.x) + scalePad])
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    var y = d3.scaleLinear()
        .domain([d3.min(filtered_data, d => d.y) - scalePad, d3.max(filtered_data, d => d.y) + scalePad])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

    var rScale = d3.scaleLinear()
        .domain(d3.extent(filtered_data, d => d.y))
        .range([0, 20]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);


    // Create the scatter plot circles
    var circles = svg.selectAll("circle")
        .data(filtered_data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.x))
        .attr("cy", d => x(d.y))
        .attr("r", d => rScale(d.review_vol))
        .attr("fill", d => colorScale(d.cluster_n))
        .attr('opacity', .5);

    // Define the div for the tooltip
    var tip = d3.select("#cluster_summary_plot").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
    // Add events to circles
    circles.on("mouseover", function (e, d) {
        // Reduce opacity of all other paths
        svg.selectAll("circle").style("opacity", 0.2);

        // Highlight the current path
        d3.select(this).style("opacity", 1);

        tip.style("opacity", 1)
            .html(d.top_words)
            .style("left", (e.pageX - 25) + "px")
            .style("top", (e.pageY - 75) + "px")

    })
        .on("mouseout", function (d) {
            // Restore opacity of all paths
            svg.selectAll("circle").style("opacity", .5);

            tip.style("opacity", 0)
        })

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Cluster Summary");


    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + 50)
        .text("X1 Similarity Measure");

    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "middle")
        .attr("y", -65)
        .attr("x", -height / 2)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text("X2 Similarity Measure");

    
    let unique_clusters = new Set(d3.map(data, d => d.cluster_n));

    let legendXScale = 120;
    let legendYScale = 360;
    
    svg.selectAll("somelayer")
        .data(unique_clusters)
        .enter()
        .append("rect")
        .attr("x", width - legendXScale)
        .attr("y", (d, i) => 20 * i + legendYScale - 5)
        .attr('width', 10)
        .attr('height', 10)
        .style("fill", d => colorScale(d))
    svg.selectAll("somelayer")
        .data(unique_clusters)
        .enter()
        .append("text")
        .attr("x", width - legendXScale + 15)
        .attr("y", (d, i) => 20 * i + legendYScale)
        .text(d => `Cluster ${d}`)
        .style("font-size", "15px"
        ).attr("alignment-baseline", "middle");

}




let nodeLinkGraph = function (data, businessIndex) {

    let businessIDs = [... new Set(d3.map(data, d => d.business_id))];

    let filtered_data = d3.filter(data, d => d.business_id === businessIDs[businessIndex]);
    filtered_data = filtered_data.sort((a, b) => d3.descending(a.review_vol, b.review_vol));

    var options = d3.select('#opts_graph')
        .on('change', () => {
            var newData = d3.select('#opts_graph').property('value');
            var newBusinessIndex = businessIDs.indexOf(newData)
            d3.select('#node_link_graph').selectAll('*').remove();
            nodeLinkGraph(data, newBusinessIndex);
        })
        .selectAll("option")
        .data(businessIDs)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    var margin = { top: 50, bottom: 50, left: 50, right: 50 },
        width = width = 1200 - margin.left - margin.right,
        height = 800 - margin.top - margin.bottom;

    const svg = d3.select("#node_link_graph")
        .append("svg")
        .attr("width", width - margin.right - margin.left)
        .attr("height", height - margin.top - margin.bottom)

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Review Similarity Graph");

    //create edges using "line" elements
    const link = svg.selectAll("line")
        .data(filtered_data)
        .enter()
        .append("line")
        .style("stroke", "#ccc")
        .style("stroke-width", d => d.value * 10)

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    //create nodes using "circle" elements
    let node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(filtered_data)
        .enter().append("circle")
        .attr("r", 10)
        .attr("fill", d => colorScale(d.cluster_n))
        .attr('opacity', 0.5)

    //create label using "text" elements
    const label = svg.append("g")
        .attr("class", "labels")
        .selectAll("text")
        .data(filtered_data)
        .join("text")
        .attr("class", "label")
        .text(d => d.top_word);

    //create force graph
    const force = d3.forceSimulation(filtered_data)
        .force("charge", d3.forceManyBody())
        .force("link", d3.forceLink(filtered_data).id((d) => d.source))
        .force("center", d3.forceCenter(width / 2, height / 2))

    force.on("tick", function () {
        link.attr("x1", function (d) {
            return d.source.x;
        })
            .attr("y1", function (d) {
                return d.source.y;
            })
            .attr("x2", function (d) {
                return d.target.x;
            })
            .attr("y2", function (d) {
                return d.target.y;
            });

        node.attr("cx", function (d) {
            return d.x;
        })
            .attr("cy", function (d) {
                return d.y;
            });

        label.attr("x", function (d) {
            return d.x + 3;
        })
            .attr("y", function (d) {
                return d.y + 3;
            })
            .style("font-size", "5px");
    });

    // create zoom effect
    let zoom = d3.zoom()
        .scaleExtent([0.1, 3])
        .on('zoom', function (event) {
            svg.selectAll("g")
                .attr('transform', event.transform);
            svg.selectAll("line")
                .attr('transform', event.transform);
        });
    svg.call(zoom)

}


let mapPlot = function (data) {

    var margin = { top: 50, bottom: 50, left: 50, right: 50 },
        width = width = 1200 - margin.left - margin.right,
        height = 800 - margin.top - margin.bottom;

    const svg = d3.select("#business_map")
        .append("svg")
        .attr("width", width - margin.right - margin.left)
        .attr("height", height - margin.top - margin.bottom)

    // Map and projection
    const path = d3.geoPath();
    const projection = d3.geoMercator()
        .scale(600)
        .center([-95, 30])
        .translate([width / 2, height / 2]);

    const colorScale = d3.scaleSequential()
        .domain([d3.min(data), d3.max(data)])
        .range(d3.schemeBlues[9]);

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Business Locations");

    // Load external data and boot
    Promise.all([
        d3.json("us-states.json")
    ]).then(function (loadData) {
        let topo = loadData[0]

        // Draw the map
        svg.append("g")
            .selectAll("path")
            .data(topo.features)
            .join("path")
            // draw each country
            .attr("d", d3.geoPath()
                .projection(projection)
            )
            // set the color of each country
            .attr("fill", '#709971')

        // Define the div for the tooltip
        var tip = d3.select("#business_map").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)

        var circles = svg.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", 5)
            .attr("fill", 'red')

        circles.on("mouseover", function (e, d) {
            // Reduce opacity of all other paths
            svg.selectAll("circle").style("opacity", 0.5);

            // Highlight the current path
            d3.select(this).style("opacity", 1);

            tip.style("opacity", 1)
                .html(d.business_id)
                .style("left", (e.pageX - 25) + "px")
                .style("top", (e.pageY - 75) + "px")

        })
            .on("mouseout", function (d) {
                // Restore opacity of all paths
                svg.selectAll("circle").style("opacity", 1);

                tip.style("opacity", 0)
            })
    });

}






