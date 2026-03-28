// what's left to do:
// - animations (click on node to show first ten episodes character appreared in,)
// - cleaning up labels and size of graph on screen
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
        node.episodes = eps.map(d => d.episode);
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

    const svg = d3.select("svg")
        .attr("width", width)
        .attr("height", height);

    const link = svg.selectAll("line")
        .data(graph.links)
        .enter()
        .append("line")
        .attr("stroke", "#900")
        .attr("stroke-width", d => Math.sqrt(d.weight));

    const node = svg.selectAll("circle")
        .data(graph.nodes)
        .enter()
        .append("circle")
        .attr("fill", "#09f")
        .attr("r", 5);

    const label = svg.selectAll("text")
        .data(graph.nodes)
        .enter()
        .append("text")
        .text(d => d.name)
        .attr("font-size", "10px")
        .attr("dx", 8)
        .attr("dy", 3);

    console.log("Before simulation");

    const nodeIds = new Set(nodes.map(d => String(d.id)));

    links.forEach(link => {
        if (!nodeIds.has(link.source) || !nodeIds.has(link.target)) {
            console.log("Broken link:", link);
        }
    });

    console.log("After checking links");


    const simulation = d3.forceSimulation(graph.nodes)
        .force("link",
             d3.forceLink(graph.links)
                .id(d => d.id)
                .distance(150)
        )
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(width/2, height/2));

    console.log("check1");

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

    console.log("hello?");

    console.log(graph);
    console.log(graph.nodes[0]);

}); 