// what's left to do:
// - we could add dragging nodes around to make graph more interactive

// Loading network data:
Promise.all([
    d3.csv("simpsonsNodes.csv"),
    d3.csv("simpsonsEdges.csv"),
    d3.csv("simpsons_ep-char.csv")
]).then(([nodesData, edgesData, episodesData]) => {
    console.log(nodesData[0]);
    const nodes = nodesData.map(d => ({
        id: String(d.Id),
        name: String(d[" char_name"]),
    }));
    const links = edgesData.map(d => ({
        source: String(d.Source),
        target: String(d.Target),
        weight: +d.Weight
    }));
    const episodesByCharacter = d3.group(
        episodesData,
        d => String(d.character_id)
    );
    nodes.forEach(node => {
        const eps = episodesByCharacter.get(node.id) || [];
        node.episodes = eps.map(d => d.episode_id);
        node.numEpisodes = node.episodes.length;
    });

// filtering out nodes, top 10% by number of connections, weight = 5 and above
const degreeMap = new Map();
links.forEach(l => {
    degreeMap.set(l.source, (degreeMap.get(l.source) || 0) + 1);
    degreeMap.set(l.target, (degreeMap.get(l.target) || 0) + 1);
});

const degrees = Array.from(degreeMap.values()).sort((a, b) => a - b);
const threshold = degrees[Math.floor(degrees.length * 0.9)];

const filteredNodes = nodes.filter(n => (degreeMap.get(n.id) || 0) >= threshold);
const filteredIds = new Set(filteredNodes.map(n => n.id));
const weightThreshold = 5; 

const filteredLinks = links.filter(l => 
    filteredIds.has(l.source) && 
    filteredIds.has(l.target) &&
    l.weight >= weightThreshold  
);

const graph = { nodes: filteredNodes, links: filteredLinks };

// drawing graph object!
const width = 800;
const height = 600;
const margin = { top: 50 };


const svg = d3.select("svg")
     .attr("width", width)
    .attr("height", height + margin.top);

// title:
svg.append("text")
        .attr("x", width / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .attr("fill", "#333")
        .text("The Simpsons Character Network");

svg.append("text")
        .attr("x", width / 2)
        .attr("y", 50)
        .attr("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .attr("font-size", "12px")
        .attr("fill", "#666")
        .text("Top 10% best connected characters; select node to see episode details" );

const g = svg.append("g")
    .attr("transform", `translate(0, ${margin.top})`);

    const link = g.selectAll("line")
        .data(graph.links)
        .enter()
        .append("line")
        .attr("stroke", "#900")
        .attr("stroke-width", d => Math.sqrt(d.weight));

    // info panel: shows episodes when a node is clicked
    const infoPanel = d3.select("#info-panel");

    function resetHighlights() {
        node.attr("fill", "#09f").attr("r", 5).attr("opacity", 1);
        link.attr("stroke", "#900").attr("opacity", 1);
    }

    const node = svg.selectAll("circle")
        .data(graph.nodes)
        .enter()
        .append("circle")
        .attr("fill", "#09f")
        .attr("r", 5)
        .style("cursor", "pointer")
        .on("click", function(event, d) {
            resetHighlights();
        
            const neighborIds = new Set();
            graph.links.forEach(l => {
                const srcId = l.source.id || l.source;
                const tgtId = l.target.id || l.target;
                if (srcId === d.id) neighborIds.add(tgtId);
                if (tgtId === d.id) neighborIds.add(srcId);
            });
        
            node
                .attr("opacity", n => (n.id === d.id || neighborIds.has(n.id)) ? 1 : 0.15)
                .attr("fill", n => {
                    if (n.id === d.id) return "#f90";
                    if (neighborIds.has(n.id)) return "#0c0";
                    return "#09f";
                })
                .attr("r", n => (n.id === d.id) ? 8 : 5);
        
            link
                .attr("opacity", l => {
                    const srcId = l.source.id || l.source;
                    const tgtId = l.target.id || l.target;
                    return (srcId === d.id || tgtId === d.id) ? 1 : 0.05;
                })
                .attr("stroke", l => {
                    const srcId = l.source.id || l.source;
                    const tgtId = l.target.id || l.target;
                    return (srcId === d.id || tgtId === d.id) ? "#f90" : "#900";
                });
        
            const first10 = d.episodes.slice(0, 10);
            infoPanel.html("");
            infoPanel.append("h2").text(d.name);
            infoPanel.append("p").text("Total episodes: " + d.numEpisodes);
            infoPanel.append("p").text("Connected to " + neighborIds.size + " character(s).");
            infoPanel.append("p").style("font-weight", "bold").text("First 10 episodes:");
        
            if (first10.length === 0) {
                infoPanel.append("p").text("No episode data available.");
            } else {
                const ul = infoPanel.append("ul");
                first10.forEach(ep => { ul.append("li").text("Episode " + ep); });
            }
        
            infoPanel.append("button")
                .text("Clear")
                .on("click", () => {
                    infoPanel.html("");
                    resetHighlights();
                });
        });

    const label = svg.selectAll("text")
        .data(graph.nodes)
        .enter()
        .append("text")
        .text(d => d.name)
        .attr("font-size", "10px")
        .attr("dx", 8)
        .attr("dy", 3)
        .style("pointer-events", "none");

    const simulation = d3.forceSimulation(graph.nodes)
        .force("link",
             d3.forceLink(graph.links)
                .id(d => d.id)
                .distance(150)
        )
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(width/2, height/2));

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        label
        .attr("x", d => d.x)
        .attr("y", d => d.y);
    });

    console.log(graph);
    console.log(graph.nodes[0]);

});